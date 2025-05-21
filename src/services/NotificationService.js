import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Clé pour stocker le token de notification
const NOTIFICATION_TOKEN_KEY = 'expo_push_token';

// Configurer le comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Fonction pour demander les permissions de notification
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
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  return true;
};

// Fonction pour obtenir le token de notification
export const registerForPushNotifications = async () => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }
    
    // Obtenir le token Expo
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "148107ae-6aa5-4c92-9320-b848b079814c", // À remplacer par votre ID de projet Expo
    });

    console.log("EXPO_PUSH_TOKEN=", token.data);
    
    // Sauvegarder le token localement
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token.data);
    
    // Renvoyer le token
    return token.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement pour les notifications push:', error);
    return null;
  }
};

// Fonction pour récupérer le token stocké
export const getSavedPushToken = async () => {
  try {
    return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur lors de la récupération du token de notification:', error);
    return null;
  }
};

// Fonction pour configurer les écouteurs de notification
export const setupNotificationListeners = (onNotificationReceived, onNotificationResponse) => {
  // Écouteur pour les notifications reçues pendant que l'app est au premier plan
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );
  
  // Écouteur pour les réponses aux notifications (lorsqu'un utilisateur appuie dessus)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );
  
  // Renvoyer les abonnements pour pouvoir les supprimer plus tard
  return {
    receivedSubscription,
    responseSubscription,
  };
};

// Fonction pour envoyer une notification locale (pour tester)
export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immédiatement
  });
};