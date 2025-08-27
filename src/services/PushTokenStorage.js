// src/services/PushTokenStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_TOKEN_KEY = 'expo_push_token';

export async function setSavedPushToken(token) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
  } catch (e) {
    console.error('Erreur lors de la sauvegarde du token push:', e);
  }
}

export async function getSavedPushToken() {
  try {
    return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
  } catch (e) {
    console.error('Erreur lors de la récupération du token push:', e);
    return null;
  }
}

export async function clearSavedPushToken() {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
  } catch (e) {
    console.error('Erreur lors du nettoyage du token push:', e);
  }
}
