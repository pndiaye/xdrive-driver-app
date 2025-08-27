// src/services/ApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedPosition } from './LocationService';
import { getSavedPushToken } from './PushTokenStorage'; // <-- plus depuis NotificationService

// URL de base de l'API
const API_BASE_URL = 'https://nice-transfert-server-pnwireframe.replit.app';

// Token d’auth
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// Wrapper fetch
const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      throw new Error(isJson && errorData.message ? errorData.message : `Erreur ${response.status}: ${response.statusText}`);
    }

    return isJson ? await response.json() : await response.text();
  } catch (error) {
    console.error(`Erreur API (${endpoint}):`, error);
    throw error;
  }
};

// ---- API functions ----

// Login: inclut le device push token si disponible
export const loginDriver = async (email, password) => {
  const pushToken = await getSavedPushToken();
  return fetchWithAuth('/api/driver/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceToken: pushToken }),
  });
};

export const updateAvailability = async (isAvailable) =>
  fetchWithAuth('/api/driver/availability', {
    method: 'PUT',
    body: JSON.stringify({ available: isAvailable }),
  });

export const updateDriverLocation = async () => {
  const position = await getSavedPosition();
  if (!position) throw new Error('Position non disponible');

  return fetchWithAuth('/api/driver/location', {
    method: 'POST',
    body: JSON.stringify({
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: new Date().toISOString(),
    }),
  });
};

export const acceptRide = async (rideId) =>
  fetchWithAuth('/api/ride/accept', {
    method: 'POST',
    body: JSON.stringify({ rideId }),
  });

export const updateRideStatus = async (rideId, status) =>
  fetchWithAuth(`/api/ride/${rideId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const downloadFile = async (fileUrl) => {
  const token = await getAuthToken();
  const response = await fetch(fileUrl, {
    method: 'GET',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  return response.blob();
};

export const declineRide = async (rideId, reason = '') =>
  fetchWithAuth('/api/ride/decline', {
    method: 'POST',
    body: JSON.stringify({ rideId, reason }),
  });

export const getRideDetails = async (rideId) =>
  fetchWithAuth(`/api/ride/${rideId}`, { method: 'GET' });

export const logRideEvent = async (rideId, eventType, eventData = {}) =>
  fetchWithAuth('/api/ride/event', {
    method: 'POST',
    body: JSON.stringify({ rideId, eventType, ...eventData }),
  });

export const getBonCommande = async (rideId) =>
  fetchWithAuth(`/api/ride/bon-commande/${rideId}`, { method: 'GET' });

export const getRideHistory = async (page = 1, limit = 10) =>
  fetchWithAuth(`/api/driver/ride-history?page=${page}&limit=${limit}`, {
    method: 'GET',
  });

export const getDriverStats = async (period = 'semaine') =>
  fetchWithAuth(`/api/driver/stats?period=${period}`, { method: 'GET' });

export const getDriverProfile = async () =>
  fetchWithAuth('/api/driver/profile', { method: 'GET' });

export const updateDriverProfile = async (profileData) =>
  fetchWithAuth('/api/driver/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

// Enregistrement du token push côté serveur
export const registerPushToken = async (token) =>
  fetchWithAuth('/api/driver/register-push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken: token }), // Paramètre serveur: "pushToken"
  });

export const getAvailabilityStatus = async () =>
  fetchWithAuth('/api/driver/availability', { method: 'GET' });

export const getAvailableRides = async () =>
  fetchWithAuth('/api/driver/available-rides', { method: 'GET' });

export const getPendingRides = getAvailableRides;
