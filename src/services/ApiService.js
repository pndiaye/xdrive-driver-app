import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedPosition } from './LocationService';
import { getSavedPushToken } from './NotificationService';

// URL de base de l'API
const API_BASE_URL = 'https://nice-transfert-server-pnwireframe.replit.app/'; // À remplacer par votre URL réelle

// Fonction pour récupérer le token d'authentification
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// Fonction générique pour les requêtes API
const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Vérifier si la réponse est un JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    // Traiter la réponse
    if (!response.ok) {
      // Pour les erreurs, tenter de récupérer le message d'erreur
      const errorData = isJson ? await response.json() : await response.text();
      throw new Error(
        isJson && errorData.message 
          ? errorData.message 
          : `Erreur ${response.status}: ${response.statusText}`
      );
    }
    
    // Retourner la réponse parsée ou le texte brut
    return isJson ? await response.json() : await response.text();
  } catch (error) {
    console.error(`Erreur API (${endpoint}):`, error);
    throw error;
  }
};

// Fonctions d'API

// Connexion du chauffeur
export const loginDriver = async (email, password) => {
  // Obtenir le token de notification
  const pushToken = await getSavedPushToken();
  
  return fetchWithAuth('/api/driver/login', {
    method: 'POST',
    body: JSON.stringify({ 
      email, 
      password,
      deviceToken: pushToken
    }),
  });
};

// Mise à jour de la disponibilité
export const updateAvailability = async (isAvailable) => {
  return fetchWithAuth('/api/driver/availability', {
    method: 'PUT',
    body: JSON.stringify({ available: isAvailable }),
  });
};

// Mise à jour de la position
export const updateDriverLocation = async () => {
  const position = await getSavedPosition();
  if (!position) {
    throw new Error('Position non disponible');
  }
  
  return fetchWithAuth('/api/driver/update-location', {
    method: 'POST',
    body: JSON.stringify({
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: new Date().toISOString(),
    }),
  });
};

// Récupérer les courses disponibles
export const getPendingRides = async () => {
  return fetchWithAuth('/api/driver/pending-rides', {
    method: 'GET',
  });
};

// Accepter une course
export const acceptRide = async (rideId) => {
  return fetchWithAuth(`/api/driver/accept-ride/${rideId}`, {
    method: 'POST',
  });
};

// Mettre à jour le statut d'une course
export const updateRideStatus = async (rideId, status) => {
  return fetchWithAuth(`/api/driver/ride-status/${rideId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

// Télécharger un fichier (comme un bon de commande)
export const downloadFile = async (fileUrl) => {
  const token = await getAuthToken();
  
  const response = await fetch(fileUrl, {
    method: 'GET',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  
  // Retourner le blob
  return await response.blob();
};