import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ERROR_MESSAGES, LOCATION_CONFIG } from '../config/config';
import { apiRequest } from '../utils/api';

// Clés pour stocker les données de localisation
const LAST_POSITION_KEY = 'driver_last_position';
const TRACKING_STATUS_KEY = 'isTracking';
const AVAILABILITY_KEY = 'driverAvailable';

// Variables globales pour la gestion du suivi
let locationSubscription = null;
let driverId = null;
let trackingActive = false; // Variable locale pour éviter le conflit

// Ajouter cette fonction au début de LocationService.js :
const sendLocationToServer = async (locationData) => {
  try {
    // Option 1 : Utiliser api.js
    const { updateDriverLocation } = await import('../utils/api');
    return await updateDriverLocation(
      locationData.latitude, 
      locationData.longitude, 
      locationData.isAvailable
    );
    
    // Option 2 : Utiliser ApiService.js (si vous préférez)
    // const { updateDriverLocation } = await import('../services/ApiService');
    // return await updateDriverLocation();
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la position:', error);
    throw error;
  }
};

/**
 * Demande les permissions de localisation (premier plan et arrière-plan)
 * @returns {Promise<boolean>} - True si les permissions sont accordées
 */
export const requestLocationPermission = async () => {
  try {
    // Permission de premier plan
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission de localisation de premier plan refusée');
      return false;
    }
    
    // Permission d'arrière-plan (optionnelle)
    if (LOCATION_CONFIG.BACKGROUND_UPDATES) {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Permission de localisation en arrière-plan refusée');
        // Ne pas bloquer l'application pour cette permission
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permissions:', error);
    return false;
  }
};

/**
 * Alias pour la compatibilité avec l'ancien nom de fonction
 */
export const requestLocationPermissions = requestLocationPermission;

/**
 * Obtient la position actuelle du chauffeur
 * @returns {Promise<object>} - Position actuelle avec coordonnées et métadonnées
 */
export const getCurrentPosition = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: LOCATION_CONFIG.ACCURACY === 'high' ? Location.Accuracy.High : Location.Accuracy.Balanced,
    });
    
    const positionData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date().toISOString(),
    };
    
    // Stocker la position localement
    await savePosition(positionData);
    
    console.log('Position actuelle obtenue:', positionData);
    
    return {
      coords: positionData,
      timestamp: location.timestamp
    };
  } catch (error) {
    console.error('Erreur lors de l\'obtention de la position actuelle:', error);
    throw error;
  }
};

/**
 * Démarre le suivi de localisation du chauffeur
 * @param {string} driverIdParam - ID du chauffeur
 * @param {function} onLocationUpdate - Callback optionnel pour les mises à jour
 * @returns {Promise<boolean>} - True si le suivi a démarré avec succès
 */
export const startLocationTracking = async (driverIdParam, onLocationUpdate = null) => {
  try {
    driverId = driverIdParam;
    
    console.log('Démarrage du suivi de localisation pour le chauffeur:', driverId);
    
    // Vérifier les permissions
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
    }
    
    // Arrêter tout suivi existant
    //await stopLocationTracking();
    
    // Récupérer et envoyer la dernière position connue
    try {
      const savedPosition = await getSavedPosition();
      if (savedPosition && onLocationUpdate) {
        onLocationUpdate(savedPosition);
      }
      
      // Envoyer la position sauvegardée au serveur si elle est récente (moins de 5 minutes)
      if (savedPosition) {
        const positionAge = Date.now() - new Date(savedPosition.timestamp).getTime();
        if (positionAge < 5 * 60 * 1000) { // 5 minutes
          await sendPositionToServer(savedPosition);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération de la position sauvegardée:', error);
    }
    
    // Obtenir et envoyer la position actuelle
    try {
      const currentLocation = await getCurrentPosition();
      await sendPositionToServer(currentLocation.coords);
      
      if (onLocationUpdate) {
        onLocationUpdate(currentLocation.coords);
      }
    } catch (error) {
      console.warn('Impossible d\'obtenir la position actuelle:', error);
    }
    
    // Configurer les options de suivi
    const watchOptions = {
      accuracy: LOCATION_CONFIG.ACCURACY === 'high' ? Location.Accuracy.High : Location.Accuracy.Balanced,
      distanceInterval: LOCATION_CONFIG.MIN_DISTANCE,
      timeInterval: LOCATION_CONFIG.UPDATE_INTERVAL
    };
    
    // Démarrer le suivi de position en temps réel
    locationSubscription = await Location.watchPositionAsync(
      watchOptions,
      async (location) => {
        const positionData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        
        try {
          // Stocker la nouvelle position localement
          await savePosition(positionData);
          
          // Notifier le callback si fourni
          if (onLocationUpdate) {
            onLocationUpdate(positionData);
          }
          
          // Envoyer la position au serveur
          await sendPositionToServer(positionData);
          
        } catch (error) {
          console.error('Erreur lors du traitement de la mise à jour de position:', error);
        }
      }
    );
    
    // Marquer le suivi comme actif
    trackingActive = true;
    await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'true');
    
    console.log('Suivi de localisation démarré avec succès');
    
    return true;
  } catch (error) {
    console.error('Erreur lors du démarrage du suivi de localisation:', error);
    trackingActive = false;
    await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'false');
    return false;
  }
};

/**
 * Arrête le suivi de localisation
 * @returns {Promise<void>}
 */
export const stopLocationTracking = async () => {
  try {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
      console.log('Abonnement de localisation supprimé');
    }
    
    trackingActive = false;
    await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'false');
    
    console.log('Suivi de localisation arrêté');
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du suivi de localisation:', error);
  }
};

/**
 * Basculer l'état de disponibilité du chauffeur
 * @param {boolean} available - Nouvel état de disponibilité
 * @returns {Promise<boolean>} - Succès de l'opération
 */
export const toggleDriverAvailability = async (available) => {
  try {
    console.log('Changement de disponibilité du chauffeur:', available);
    
    await AsyncStorage.setItem(AVAILABILITY_KEY, available ? 'true' : 'false');
    
    // Obtenir la position actuelle et l'envoyer avec le nouveau statut
    try {
      const currentLocation = await getCurrentPosition();
      await sendPositionToServer(currentLocation.coords, available);
    } catch (locationError) {
      console.warn('Impossible d\'obtenir la position pour la mise à jour de disponibilité:', locationError.message);
      
      // Envoyer quand même le changement de statut sans position
      await sendAvailabilityToServer(available);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du changement de disponibilité:', error);
    return false;
  }
};

/**
 * Vérifie si le suivi de localisation est actif
 * @returns {Promise<boolean>}
 */
export const isTrackingActive = async () => {
  try {
    const trackingStatus = await AsyncStorage.getItem(TRACKING_STATUS_KEY);
    return trackingStatus === 'true' && locationSubscription !== null && trackingActive;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de suivi:', error);
    return false;
  }
};

/**
 * Obtient le statut de disponibilité actuel du chauffeur
 * @returns {Promise<boolean>}
 */
export const getDriverAvailability = async () => {
  try {
    const availability = await AsyncStorage.getItem(AVAILABILITY_KEY);
    return availability === 'true';
  } catch (error) {
    console.error('Erreur lors de la récupération de la disponibilité:', error);
    return false;
  }
};

/**
 * Sauvegarde la position dans le stockage local
 * @param {object} positionData - Données de position à sauvegarder
 */
const savePosition = async (positionData) => {
  try {
    await AsyncStorage.setItem(LAST_POSITION_KEY, JSON.stringify(positionData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la position:', error);
  }
};

/**
 * Récupère la dernière position sauvegardée
 * @returns {Promise<object|null>} - Dernière position ou null
 */
export const getSavedPosition = async () => {
  try {
    const positionJson = await AsyncStorage.getItem(LAST_POSITION_KEY);
    if (positionJson) {
      return JSON.parse(positionJson);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la position sauvegardée:', error);
    return null;
  }
};

/**
 * Envoie la position au serveur avec authentification
 * @param {object} coords - Coordonnées à envoyer
 * @param {boolean} isAvailable - Statut de disponibilité (optionnel)
 */
const sendPositionToServer = async (coords, isAvailable = null) => {
  try {
    if (!driverId) {
      console.warn('Driver ID manquant pour l\'envoi de position');
      return;
    }
    
    // Récupérer le statut de disponibilité actuel si non fourni
    const availability = isAvailable !== null ? isAvailable : await getDriverAvailability();
    
    const locationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      isAvailable: availability
    };
    
    await apiRequest('/api/driver/location', 'POST', locationData);
    
    console.log('Position envoyée au serveur avec succès:', {
      lat: coords.latitude.toFixed(6),
      lng: coords.longitude.toFixed(6),
      available: availability
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la position au serveur:', error);
    // Ne pas lancer d'erreur car ce n'est pas critique pour l'application
  }
};

/**
 * Envoie uniquement le statut de disponibilité au serveur
 * @param {boolean} isAvailable - Statut de disponibilité
 */
const sendAvailabilityToServer = async (isAvailable) => {
  try {
    if (!driverId) {
      console.warn('Driver ID manquant pour l\'envoi de disponibilité');
      return;
    }
    
    await apiRequest('/api/driver/location', 'POST', {
      latitude: null,
      longitude: null,
      isAvailable: isAvailable
    });
    
    console.log('Statut de disponibilité envoyé au serveur:', isAvailable);
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du statut de disponibilité:', error);
  }
};

/**
 * Obtient la position actuelle (alias pour compatibilité)
 * @returns {Promise<object>}
 */
export const getCurrentLocation = getCurrentPosition;