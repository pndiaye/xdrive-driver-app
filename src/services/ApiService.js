import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedPosition } from './LocationService';
import { getSavedPushToken } from './NotificationService';

// URL de base de l'API
const API_BASE_URL = 'https://nice-transfert-server-pnwireframe.replit.app'; // À remplacer par votre URL réelle

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
  
  return fetchWithAuth('/api/driver/location', {
    method: 'POST',
    body: JSON.stringify({
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: new Date().toISOString(),
    }),
  });
};



// Accepter une course
export const acceptRide = async (rideId) => {
  return fetchWithAuth('/api/ride/accept', {
    method: 'POST',
    body: JSON.stringify({ rideId }),
  });
};

// Mettre à jour le statut d'une course
export const updateRideStatus = async (rideId, status) => {
  return fetchWithAuth(`/api/ride/${rideId}/status`, {
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

// Refuser une course
export const declineRide = async (rideId, reason = '') => {
  return fetchWithAuth('/api/ride/decline', {
    method: 'POST',
    body: JSON.stringify({ rideId, reason }),
  });
};

// Récupérer les détails d'une course
export const getRideDetails = async (rideId) => {
  return fetchWithAuth(`/api/ride/${rideId}`, {
    method: 'GET',
  });
};

// Enregistrer un événement de course
export const logRideEvent = async (rideId, eventType, eventData = {}) => {
  return fetchWithAuth('/api/ride/event', {
    method: 'POST',
    body: JSON.stringify({
      rideId,
      eventType,
      ...eventData
    }),
  });
};

// Récupérer le bon de commande
export const getBonCommande = async (rideId) => {
  return fetchWithAuth(`/api/ride/bon-commande/${rideId}`, {
    method: 'GET',
  });
};

// Historique des courses
export const getRideHistory = async (page = 1, limit = 10) => {
  return fetchWithAuth(`/api/driver/ride-history?page=${page}&limit=${limit}`, {
    method: 'GET',
  });
};

// Statistiques du chauffeur
export const getDriverStats = async (period = 'semaine') => {
  return fetchWithAuth(`/api/driver/stats?period=${period}`, {
    method: 'GET',
  });
};

// Profil du chauffeur
export const getDriverProfile = async () => {
  return fetchWithAuth('/api/driver/profile', {
    method: 'GET',
  });
};

export const updateDriverProfile = async (profileData) => {
  return fetchWithAuth('/api/driver/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// Enregistrer le token push - CORRIGER LE NOM DU PARAMÈTRE
export const registerPushToken = async (token) => {
  console.log('Enregistrement du token push...');
  return fetchWithAuth('/api/driver/register-push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken: token }), // ⚠️ Paramètre serveur : "pushToken"
  });
};

// Récupérer le statut de disponibilité
export const getAvailabilityStatus = async () => {
  return fetchWithAuth('/api/driver/availability', {
    method: 'GET',
  });
};

// Renommer cette fonction (optionnel) :
export const getAvailableRides = async () => {
  return fetchWithAuth('/api/driver/available-rides', {
    method: 'GET',
  });
};

// Et garder getPendingRides comme alias :
export const getPendingRides = getAvailableRides;