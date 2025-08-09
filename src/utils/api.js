import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'https://nice-transfert-server-pnwireframe.replit.app'; // À remplacer par l'URL de votre serveur

/**
 * Effectue une requête API avec authentification
 * @param {string} endpoint - Point d'API
 * @param {string} method - Méthode HTTP
 * @param {object} data - Données à envoyer
 * @returns {Promise<object>} - Réponse de l'API
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      method,
      headers
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${SERVER_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur réseau');
    }
    
    // Certains endpoints peuvent ne pas renvoyer de JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

/**
 * Récupère les courses disponibles
 * @returns {Promise<Array>} - Liste des courses disponibles
 */
export const getAvailableRides = async () => {
  return apiRequest('/api/driver/available-rides');
};

/**
 * Récupère les détails d'une course
 * @param {string} rideId - ID de la course
 * @returns {Promise<object>} - Détails de la course
 */
export const getRideDetails = async (rideId) => {
  return apiRequest(`/api/ride/${rideId}`);
};

/**
 * Récupère l'historique des courses du chauffeur
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Promise<object>} - Liste paginée des courses
 */
export const getDriverRideHistory = async (page = 1, limit = 10) => {
  return apiRequest(`/api/driver/ride-history?page=${page}&limit=${limit}`);
};

/**
 * Met à jour le statut d'une course
 * @param {string} rideId - ID de la course
 * @param {string} status - Nouveau statut (en_route, arrivé, terminé)
 * @returns {Promise<object>} - Détails mis à jour
 */
export const updateRideStatus = async (rideId, status) => {
  return apiRequest(`/api/ride/${rideId}/status`, 'PUT', { status });
};

/**
 * Envoie un événement de course
 * @param {string} rideId - ID de la course
 * @param {string} eventType - Type d'événement
 * @param {object} eventData - Données d'événement
 * @returns {Promise<object>} - Réponse du serveur
 */
export const logRideEvent = async (rideId, eventType, eventData = {}) => {
  return apiRequest('/api/ride/event', 'POST', {
    rideId,
    eventType,
    ...eventData
  });
};

/**
 * Récupère les statistiques du chauffeur
 * @param {string} period - Période (jour, semaine, mois, année)
 * @returns {Promise<object>} - Statistiques
 */
export const getDriverStats = async (period = 'semaine') => {
  return apiRequest(`/api/driver/stats?period=${period}`);
};

/**
 * Connexion du chauffeur
 */
export const loginDriver = async (email, password) => {
  // Vous devrez importer getSavedPushToken si vous voulez l'utiliser
  // import { getSavedPushToken } from '../services/NotificationService';
  // const pushToken = await getSavedPushToken();
  
  return apiRequest('/api/driver/login', 'POST', { 
    email, 
    password
    // deviceToken: pushToken // Décommentez si vous voulez le token push
  });
};

/**
 * Mise à jour de la disponibilité
 */
export const updateAvailability = async (isAvailable) => {
  return apiRequest('/api/driver/availability', 'PUT', { available: isAvailable });
};

/**
 * Mise à jour de la position du chauffeur
 */
export const updateDriverLocation = async (latitude, longitude, isAvailable = null) => {
  const locationData = {
    latitude,
    longitude,
    timestamp: new Date().toISOString(),
  };
  
  // Ajouter la disponibilité si fournie
  if (isAvailable !== null) {
    locationData.isAvailable = isAvailable;
  }
  
  return apiRequest('/api/driver/location', 'POST', locationData);
};

/**
 * Accepter une course
 */
export const acceptRide = async (rideId) => {
  return apiRequest('/api/ride/accept', 'POST', { rideId });
};

/**
 * Refuser une course
 */
export const declineRide = async (rideId, reason = '') => {
  return apiRequest('/api/ride/decline', 'POST', { rideId, reason });
};


/**
 * Récupérer le bon de commande
 */
export const getBonCommande = async (rideId) => {
  return apiRequest(`/api/ride/bon-commande/${rideId}`, 'GET');
};

/**
 * Profil du chauffeur
 */
export const getDriverProfile = async () => {
  return apiRequest('/api/driver/profile', 'GET');
};

export const updateDriverProfile = async (profileData) => {
  return apiRequest('/api/driver/profile', 'PUT', profileData);
};

/**
 * Enregistrer le token push
 */
export const registerPushToken = async (token) => {
  return apiRequest('/api/driver/register-push-token', 'POST', { pushToken: token });
};

/**
 * Récupérer le statut de disponibilité
 */
export const getAvailabilityStatus = async () => {
  return apiRequest('/api/driver/availability', 'GET');
};

/**
 * Télécharger un fichier
 */
export const downloadFile = async (fileUrl) => {
  const token = await AsyncStorage.getItem('userToken');
  
  const response = await fetch(fileUrl, {
    method: 'GET',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  
  return await response.blob();
};