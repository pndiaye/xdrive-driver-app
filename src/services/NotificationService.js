// src/services/NotificationService.js
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getSavedPushToken, setSavedPushToken } from './PushTokenStorage';

// Configurer le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Demander les permissions
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    alert('Les notifications push nécessitent un appareil physique');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// Obtenir + enregistrer le token (et l’envoyer au serveur)
export const registerForPushNotifications = async () => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // ⚠️ Remplace par ton vrai projectId Expo
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '148107ae-6aa5-4c92-9320-b848b079814c',
    });

    const expoPushToken = token.data;
    console.log('EXPO_PUSH_TOKEN=', expoPushToken);

    // Sauvegarde locale via module dédié (pas d’import circulaire)
    await setSavedPushToken(expoPushToken);

    // ❗️Appel API retardé pour casser le cycle:
    // on importe ApiService *à l’intérieur* de la fonction.
    try {
      const { registerPushToken } = await import('./ApiService');
      await registerPushToken(expoPushToken);
    } catch (err) {
      console.warn('Impossible d’enregistrer le token côté serveur immédiatement:', err?.message);
    }

    return expoPushToken;
  } catch (error) {
    console.error("Erreur d'enregistrement pour les notifications push:", error);
    return null;
  }
};

// Récupérer le token stocké
export { getSavedPushToken };

// Écouteurs
export const setupNotificationListeners = (onNotificationReceived, onNotificationResponse) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationResponse?.(response);
  });

  return { receivedSubscription, responseSubscription };
};

// Notification locale (test)
export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
};
