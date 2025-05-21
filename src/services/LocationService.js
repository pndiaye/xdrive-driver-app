import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Clé pour stocker la dernière position connue
const LAST_POSITION_KEY = 'driver_last_position';

// Fonction pour demander les permissions de localisation
export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
};

// Fonction pour obtenir la position actuelle
export const getCurrentPosition = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Permission de localisation non accordée');
  }
  
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  
  // Stocker la position localement
  await savePosition(location.coords);
  
  return location;
};

// Fonction pour démarrer le suivi de position
export const startLocationTracking = async (onLocationUpdate) => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Permission de localisation non accordée');
  }
  
  // Récupérer la dernière position connue
  try {
    const savedPosition = await getSavedPosition();
    if (savedPosition && onLocationUpdate) {
      onLocationUpdate(savedPosition);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la position sauvegardée:', error);
  }
  
  // Démarrer le suivi de position en temps réel
  const locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 100, // Mettre à jour tous les 100 mètres
      timeInterval: 60000, // Ou toutes les 60 secondes
    },
    (location) => {
      // Stocker la nouvelle position
      savePosition(location.coords);
      
      // Notifier le callback si fourni
      if (onLocationUpdate) {
        onLocationUpdate(location.coords);
      }
      
      // Optionnel : envoyer la position au serveur
      sendPositionToServer(location.coords);
    }
  );
  
  // Retourner l'abonnement pour pouvoir l'arrêter plus tard
  return locationSubscription;
};

// Sauvegarder la position dans le stockage local
const savePosition = async (coords) => {
  try {
    await AsyncStorage.setItem(LAST_POSITION_KEY, JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la position:', error);
  }
};

// Récupérer la dernière position sauvegardée
export const getSavedPosition = async () => {
  try {
    const positionJson = await AsyncStorage.getItem(LAST_POSITION_KEY);
    if (positionJson) {
      return JSON.parse(positionJson);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la position:', error);
    return null;
  }
};

// Envoyer la position au serveur (à implémenter plus tard)
const sendPositionToServer = async (coords) => {
  // Simulation pour l'instant
  console.log('Position envoyée au serveur:', coords);
  // Dans une application réelle, vous feriez un appel API ici
};