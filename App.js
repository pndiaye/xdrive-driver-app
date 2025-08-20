import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

// Écrans
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import { getCurrentDriver, isLoggedIn } from './src/services/AuthService';
import { startLocationTracking } from './src/services/LocationService';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/NotificationService';


const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigationRef = useRef(null);
  const notificationListenersRef = useRef(null);

  // Gérer la connexion réussie
    const setupNotifications = async () => {
    try {
      // Enregistrer pour les notifications push
      await registerForPushNotifications();
      
      // Configurer les écouteurs de notification
      console.log("Configuration des notification listeners...");
      const listeners = setupNotificationListeners(
        // Quand une notification est reçue pendant que l'app est ouverte
        (notification) => {
          console.log('Notification reçue:', notification);
          
          const data = notification.request.content.data;
          
          if (data.type === 'new_ride') {
            Alert.alert(
              'Nouvelle course disponible!',
              `${data.pickup_address} - ${data.price}€`,
              [
                {
                  text: 'Ignorer',
                  style: 'cancel'
                },
                {
                  text: 'Voir détails',
                  onPress: () => {
                    if (navigationRef.current) {
                      navigationRef.current.navigate('RideDetail', { 
                        rideId: data.rideId 
                      });
                    }
                  }
                }
              ]
            );
          }
        },
        // Quand l'utilisateur appuie sur une notification
        (response) => {
          const data = response.notification.request.content.data;
          console.log('Réponse de notification:', data);
          
          if (data.type === 'new_ride' && data.rideId) {
            // Naviguer vers l'écran de détail de la course
            if (navigationRef.current) {
              navigationRef.current.navigate('RideDetail', { 
                rideId: data.rideId 
              });
            }
          }
        }
      );
      
      // Sauvegarder les listeners avec fonction de nettoyage
      notificationListenersRef.current = listeners;
      
    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
    }
  };

    // Gérer la connexion réussie
  const handleLoginSuccess = async (token, driverData) => {
    try {
      setUserToken(token);
      setIsAuthenticated(true);
      
      // Démarrer le suivi de localisation
      if (driverData.id) {
        await startLocationTracking(driverData.id.toString());
      }
      
      // Configurer les notifications
      await setupNotifications();
    } catch (error) {
      console.error('Erreur lors de la configuration post-connexion:', error);
    }
  };


  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const loggedIn = await isLoggedIn();
        
        if (loggedIn) {
          const token = await AsyncStorage.getItem('userToken');
          const driverData = await getCurrentDriver();
          
          if (token && driverData) {
            setUserToken(token);
            setIsAuthenticated(true);
            
            // Démarrer le suivi de localisation pour les chauffeurs connectés
            const driverId = await AsyncStorage.getItem('driverId');
            if (driverId) {
              await startLocationTracking(driverId);
              await setupNotifications();
            }
          } else {
            // Token ou données invalides, déconnecter
            await handleLogout();
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);
  

  useEffect(() => {
    // Configurer les notifications
    const setupNotifications = async () => {
      // Enregistrer pour les notifications push
      await registerForPushNotifications();
      
      // Configurer les écouteurs de notification
      console.log("Configuration des ecouteurs de notification...");
      notificationListenersRef.current = setupNotificationListeners(
        // Quand une notification est reçue pendant que l'app est ouverte
        (notification) => {
          console.log('Notification reçue:', notification);
          // Vous pourriez afficher une alerte ou mettre à jour l'UI
        },
        // Quand l'utilisateur appuie sur une notification
        (response) => {
          const data = response.notification.request.content.data;
          console.log('Réponse de notification:', data);
          
          // Si c'est une notification de nouvelle course, naviguer vers l'écran des courses disponibles
          if (data.type === 'new_ride') {
            // Naviguer vers l'écran approprié
            if (navigationRef.current && data.rideId) {
              // Si l'utilisateur est connecté, naviguer vers l'écran des courses disponibles
              const state = navigationRef.current.getRootState();
              const routes = state.routes;
              
              if (routes.length > 0 && routes[0].name !== 'Login') {
                navigationRef.current.navigate('Home');
              }
            }
          }
        }
      );
    };
        
    // Nettoyage
    return () => {
      if (notificationListenersRef.current) {
        notificationListenersRef.current.receivedSubscription.remove();
        notificationListenersRef.current.responseSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Erreur lors de la restauration du token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Mettre tous les écrans disponibles ici, mais contrôler leur visibilité via condition */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ animationTypeForReplace: userToken ? 'pop' : 'push' }}
          // Ne pas afficher si l'utilisateur est connecté
          initialParams={{ isLoggedIn: !userToken }}
          onLoginSuccess={handleLoginSuccess}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          // Ne pas afficher si l'utilisateur n'est pas connecté
          initialParams={{ isLoggedIn: !!userToken }}
        />
        <Stack.Screen name="RideDetail" component={RideDetailScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});