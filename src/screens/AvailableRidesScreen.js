import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import RideCard from '../components/RideCard';
import StatusToggle from '../components/StatusToggle';
import { getDriverAvailability, toggleDriverAvailability } from '../services/LocationService';
import { getAvailableRides } from '../utils/api';

const AvailableRidesScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Charger les courses disponibles
  const loadRides = useCallback(async () => {
    setIsLoading(true);
    try {
      const availableRides = await getAvailableRides();
      setRides(availableRides);
    } catch (error) {
      console.error('Erreur lors du chargement des courses:', error);
      Alert.alert('Erreur', 'Impossible de charger les courses disponibles');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  // Charger le statut de disponibilité du chauffeur
  const loadAvailabilityStatus = useCallback(async () => {
    try {
      const status = await getDriverAvailability();
      setIsAvailable(status);
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error);
    }
  }, []);
  
  useEffect(() => {
    // Charger les données initiales
    loadAvailabilityStatus();
    loadRides();
    
    // Rafraîchir la liste quand l'écran devient actif
    const unsubscribe = navigation.addListener('focus', () => {
      loadRides();
    });
    
    return unsubscribe;
  }, [navigation, loadRides, loadAvailabilityStatus]);
  
  // Gérer le changement de disponibilité
  const handleAvailabilityToggle = async (value) => {
    try {
      await toggleDriverAvailability(value);
      setIsAvailable(value);
      
      if (value) {
        Alert.alert('Statut mis à jour', 'Vous êtes maintenant disponible pour recevoir des courses.');
      } else {
        Alert.alert('Statut mis à jour', 'Vous n\'êtes plus disponible pour recevoir des courses.');
      }
      
    } catch (error) {
      console.error('Erreur lors du changement de disponibilité:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre statut');
    }
  };
  
  // Rafraîchir la liste
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [loadRides]);
  
  // Naviguer vers l'écran de détail d'une course
  const handleRidePress = (ride) => {
    navigation.navigate('RideDetail', { rideId: ride.id });
  };
  
  // Naviguer vers l'écran de profil
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Courses Disponibles</Text>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
        
        {/* Statut de disponibilité */}
        <StatusToggle 
          isAvailable={isAvailable} 
          onToggle={handleAvailabilityToggle} 
        />
        
        {/* Liste des courses */}
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RideCard 
              ride={item} 
              onPress={() => handleRidePress(item)} 
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={50} color="#aaa" />
              <Text style={styles.emptyText}>
                {isLoading
                  ? 'Chargement des courses...'
                  : 'Aucune course disponible pour le moment'}
              </Text>
              <Text style={styles.emptySubText}>
                {isAvailable
                  ? 'Tirez vers le bas pour rafraîchir'
                  : 'Veuillez vous mettre en disponible pour recevoir des courses'}
              </Text>
            </View>
          }
          contentContainerStyle={
            rides.length === 0 ? { flex: 1 } : styles.listContent
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 5,
  },
  listContent: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default AvailableRidesScreen;