import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Écrans
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/NotificationService';


const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  const navigationRef = useRef(null);
  const notificationListenersRef = useRef(null);

  useEffect(() => {
    // Configurer les notifications
    const setupNotifications = async () => {
      // Enregistrer pour les notifications push
      await registerForPushNotifications();
      
      // Configurer les écouteurs de notification
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
    
    setupNotifications();
    
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
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          // Ne pas afficher si l'utilisateur n'est pas connecté
          initialParams={{ isLoggedIn: !!userToken }}
        />
        <Stack.Screen name="RideDetail" component={RideDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
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