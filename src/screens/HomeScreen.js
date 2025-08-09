import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, SIZES } from '../constants';
import { getPendingRides } from '../services/ApiService';
import { requestLocationPermission, startLocationTracking, toggleDriverAvailability } from '../services/LocationService';




// Données factices pour les courses
const dummyRides = [
  {
    id: '1',
    pickupLocation: '123 Rue de Paris, Nice',
    dropoffLocation: "Aéroport de Nice Côte d'Azur",
    pickupTime: '14:30',
    price: '35.00',
    distance: '7.5',
    duration: '20',
    paymentMethod: 'card', // Paiement par carte
  },
  {
    id: '2',
    pickupLocation: 'Gare de Cannes',
    dropoffLocation: 'Hôtel Martinez, Cannes',
    pickupTime: '15:45',
    price: '22.50',
    distance: '3.2',
    duration: '12',
    paymentMethod: 'cash', // Paiement en espèces
  },
];

const HomeScreen = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [pendingRides, setPendingRides] = useState([]);

  // Dans votre composant HomeScreen, ajoutez :
const locationSubscriptionRef = useRef(null);

// Ajouter un effet pour rafraîchir périodiquement les courses
useEffect(() => {
    let refreshInterval;
    
    if (isAvailable) {
      // Charger les courses immédiatement
      fetchPendingRides();
      
      // Puis configurer un intervalle pour les rafraîchir (toutes les 30 secondes)
     /* refreshInterval = setInterval(() => {
        fetchPendingRides();
      }, 30000);*/
    }
    
    // Nettoyage
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAvailable]);
  
  // Mettre à jour la fonction fetchPendingRides pour utiliser le service API
  const fetchPendingRides = async () => {
    try {
      setRefreshing(true);
      const response = await getPendingRides();
      console.log('Courses pendantes:', response);
      setPendingRides(response || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des courses:', error);
      // Facultatif: afficher une alerte ou un message d'erreur
    } finally {
      setRefreshing(false);
    }
  };

// Démarrer le suivi de position lorsque l'utilisateur est disponible
useEffect(() => {
  let isMounted = true;
  
  const setupLocationTracking = async () => {
    try {
      if (isAvailable) {
        // Vérifier si les permissions sont accordées
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission requise',
            'Pour recevoir des courses, nous avons besoin de votre position.',
            [
              { text: 'Plus tard', style: 'cancel' },
              { text: 'Paramètres', onPress: () => Linking.openSettings() }
            ]
          );
          setIsAvailable(false);
          return;
        }

       const savedDriverId = await AsyncStorage.getItem('driverId');
        if (!savedDriverId) {
          console.warn('ID du chauffeur manquant');
          return;
        }
        
        // Démarrer le suivi de position
         const success = await startLocationTracking(
          savedDriverId,
          (position) => {
            if (isMounted) {
              console.log('Position mise à jour:', position);
            }
          }
        );
        if (!success && isMounted) {
          Alert.alert('Erreur', 'Impossible de démarrer le suivi de position.');
          setIsAvailable(false);
        }
      }  else {
        // Utiliser la fonction stopLocationTracking du service
        const { stopLocationTracking } = await import('../services/LocationService');
        await stopLocationTracking();
      }
    } catch (error) {
      console.error('Erreur lors du suivi de position:', error);
      Alert.alert('Erreur', 'Impossible de suivre votre position. Veuillez réessayer.');
      if (isMounted) {
        setIsAvailable(false);
      }
    }
  };
  
  setupLocationTracking();
  
  // Nettoyage lorsque le composant est démonté
  return () => {
    isMounted = false;
   import('../services/LocationService').then(({ stopLocationTracking }) => {
      stopLocationTracking().catch(console.error);
    });
  };
}, [isAvailable]);

  useEffect(() => {
    // Charger les informations de l'utilisateur depuis le stockage local
    const loadUserInfo = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          setUserName(parsedUserInfo.name);
          setIsAvailable(parsedUserInfo.isAvailable || false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations utilisateur:', error);
      }
    };
    
    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      // Supprimer les informations d'authentification
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      
      // Naviguer vers l'écran de connexion
      navigation.replace('Login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleRefresh = () => {
    fetchPendingRides();
  };

  const handleAvailabilityChange = async (value) => {
    
    if (value) {
      console.log('Activation de la disponibilité');
      // Si on active la disponibilité, vérifier les permissions
      const hasPermission = await requestLocationPermission();
      console.log('Disponibilité active :', hasPermission, 'Demande de permission de disponibilité');
      if (!hasPermission) {
        
        Alert.alert(
          'Permission requise',
          'Pour recevoir des courses, nous avons besoin de votre position.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
    }
    
    setIsAvailable(value);
    
    try {
      // Met à jour le statut dans AsyncStorage + envoie la dispo + position
    await toggleDriverAvailability(value);
      // Mettre à jour le statut dans le stockage local
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        parsedUserInfo.isAvailable = value;
        await AsyncStorage.setItem('userInfo', JSON.stringify(parsedUserInfo));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.rideCard} 
      onPress={() => navigation.navigate('RideDetail', { ride: item })}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.ridePrice}>{item.price}€</Text>
        <View style={styles.rideInfo}>
          <Text style={styles.rideTime}>{item.pickup_time}</Text>
          <View 
            style={[
              styles.paymentBadge, 
              item.payment_method === 'cash' ? styles.cashBadge : styles.cardBadge
            ]}
          >
            <Text style={styles.paymentBadgeText}>
              {item.payment_method === 'cash' ? 'Espèces' : 'Carte'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rideLocations}>
        <Text style={styles.locationText} numberOfLines={1}>Départ: {item.pickup_address}</Text>
        <Text style={styles.locationText} numberOfLines={1}>Arrivée: {item.dropoff_address}</Text>
      </View>
      
      <View style={styles.rideFooter}>
        <Text style={styles.rideDetail}>{item.estimated_distance} km</Text>
        <Text style={styles.rideDetail}>{Math.floor(item.estimated_duration / 3600)}h{" "}
              {Math.floor((item.estimated_duration % 3600) / 60)}m</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
          <Text style={styles.headerSubtitle}>Bonjour, {userName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {/* Statut de disponibilité */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statut</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              {isAvailable ? 'Disponible' : 'Indisponible'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityChange}
              trackColor={{ false: '#767577', true: '#a3c7ff' }}
              thumbColor={isAvailable ? COLORS.primary : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          </View>
        </View>
        
        {/* Liste des courses */}
        <Text style={styles.sectionTitle}>Courses disponibles</Text>
        
        {isAvailable ? (
          <FlatList
            data={pendingRides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            style={styles.ridesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        ) : (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>
              Passez en mode "Disponible" pour voir les courses.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: COLORS.text,
  },
  messageCard: {
    backgroundColor: '#e6effd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  messageText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  ridesList: {
    flex: 1,
  },
  rideCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ridePrice: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rideInfo: {
    alignItems: 'flex-end',
  },
  rideTime: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: 5,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardBadge: {
    backgroundColor: '#e1f5fe',
  },
  cashBadge: {
    backgroundColor: '#e8f5e9',
  },
  paymentBadgeText: {
    fontSize: SIZES.xs,
    fontWeight: '500',
  },
  rideLocations: {
    marginBottom: 10,
  },
  locationText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginBottom: 5,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideDetail: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
});

export default HomeScreen;