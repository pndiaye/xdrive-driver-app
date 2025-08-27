import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getCurrentDriver, logoutDriver } from '../services/AuthService';
import { getDriverAvailability, isTrackingActive, startLocationTracking, stopLocationTracking, toggleDriverAvailability } from '../services/LocationService';
import { getDriverStats } from '../utils/api';

const ProfileScreen = ({ navigation }) => {
  const [driver, setDriver] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Récupérer les données du chauffeur
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        // Charger les données du chauffeur
        const driverData = await getCurrentDriver();
        setDriver(driverData);
        
        // Vérifier l'état de disponibilité
        const availability = await getDriverAvailability();
        setIsAvailable(availability);
        
        // Vérifier si le suivi est actif
        const tracking = await isTrackingActive();
        setIsTracking(tracking);
      } catch (error) {
        console.error('Erreur lors du chargement des données du chauffeur:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDriverData();
  }, []);
  
  // Charger les statistiques
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const driverStats = await getDriverStats();
        setStats(driverStats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  // Gérer le changement de disponibilité
  const handleAvailabilityToggle = async (value) => {
    try {
      await toggleDriverAvailability(value);
      setIsAvailable(value);
    } catch (error) {
      console.error('Erreur lors du changement de disponibilité:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre statut');
    }
  };
  
  // Gérer le changement de suivi de localisation
  const handleTrackingToggle = async (value) => {
    try {
      if (value) {
        const driverId = await AsyncStorage.getItem('driverId');
        if (!driverId) {
          throw new Error('ID du chauffeur non disponible');
        }
        await startLocationTracking(driverId);
      } else {
        await stopLocationTracking();
      }
      setIsTracking(value);
    } catch (error) {
      console.error('Erreur lors du changement de suivi:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le suivi de localisation');
    }
  };
  
  // Déconnexion
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              // Arrêter le suivi de localisation
              await stopLocationTracking();
              
              // Déconnecter le chauffeur
              await logoutDriver();
              
              // Naviguer vers l'écran de connexion
              navigation.replace('Login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de vous déconnecter');
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement de votre profil...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Profil du chauffeur */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {driver?.photo_url ? (
              <Image 
                source={{ uri: driver.photo_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={styles.driverName}>
            {driver?.name || 'Chauffeur'}
          </Text>
          <Text style={styles.driverEmail}>
            {driver?.email || 'email@exemple.com'}
          </Text>
          
          {driver?.vehicle && (
            <View style={styles.vehicleInfo}>
              <Ionicons name="car" size={16} color="#2563eb" />
              <Text style={styles.vehicleText}>
                {`${driver.vehicle.make} ${driver.vehicle.model} - ${driver.vehicle.license_plate}`}
              </Text>
            </View>
          )}
        </View>
        
        {/* Paramètres du chauffeur */}
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="location" size={20} color="#2563eb" />
              <Text style={styles.settingLabel}>Disponible pour des courses</Text>
            </View>
            <Switch
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={isAvailable ? '#2563eb' : '#f5f5f5'}
              onValueChange={handleAvailabilityToggle}
              value={isAvailable}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="navigate" size={20} color="#2563eb" />
              <Text style={styles.settingLabel}>Activer le suivi de localisation</Text>
            </View>
            <Switch
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={isTracking ? '#2563eb' : '#f5f5f5'}
              onValueChange={handleTrackingToggle}
              value={isTracking}
            />
          </View>
        </View>
        
        {/* Statistiques du chauffeur */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mes Statistiques</Text>
          
          {statsLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats?.total_rides || 0}
                </Text>
                <Text style={styles.statLabel}>Courses effectuées</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats?.acceptance_rate ? `${stats.acceptance_rate}%` : '0%'}
                </Text>
                <Text style={styles.statLabel}>Taux d'acceptation</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats?.total_earnings ? `${stats.total_earnings.toFixed(2)} €` : '0.00 €'}
                </Text>
                <Text style={styles.statLabel}>Gains totaux</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('RideHistory')}
          >
            <Ionicons name="time-outline" size={24} color="#2563eb" />
            <Text style={styles.actionButtonText}>Historique des courses</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="card-outline" size={24} color="#2563eb" />
            <Text style={styles.actionButtonText}>Mes paiements</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#2563eb" />
            <Text style={styles.actionButtonText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#2563eb" />
            <Text style={styles.actionButtonText}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  driverEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  vehicleText: {
    marginLeft: 5,
    color: '#2563eb',
    fontSize: 14,
  },
  settingsSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  statsSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 15,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutButtonText: {
    marginLeft: 5,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;