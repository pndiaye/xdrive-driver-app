import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'https://nice-transfert-server-pnwireframe.replit.app';

// Configuration
const AUTH_CONFIG = {
  TOKEN_KEY: 'userToken',
  DRIVER_DATA_KEY: 'driverData',
  AUTO_LOGOUT_DELAY: 24 * 60 * 60 * 1000 // 24 heures
};

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.',
  AUTH_ERROR: 'Session expirée. Veuillez vous reconnecter.',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  SERVER_ERROR: 'Erreur du serveur. Veuillez réessayer plus tard.',
};

const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6
};

/**
 * Effectue une requête API avec gestion d'erreur
 * @param {string} endpoint - Point d'API
 * @param {object} options - Options de la requête
 * @returns {Promise<object>} - Réponse de l'API
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${SERVER_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 10000,
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    throw error;
  }
};

/**
 * Valide les données de connexion
 * @param {string} email - Email du chauffeur
 * @param {string} password - Mot de passe du chauffeur
 * @returns {object} - Résultat de la validation
 */
const validateLoginData = (email, password) => {
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push('L\'email est requis');
  } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
    errors.push('Format d\'email invalide');
  }

  if (!password || password.length === 0) {
    errors.push('Le mot de passe est requis');
  } else if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Le mot de passe doit contenir au moins ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Connecte le chauffeur
 * @param {string} email - Email du chauffeur
 * @param {string} password - Mot de passe du chauffeur
 * @returns {Promise<object>} - Données du chauffeur et token
 */
export const loginDriver = async (email, password) => {
  try {
    // Validation côté client
    const validation = validateLoginData(email, password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    console.log('Tentative de connexion pour:', email);

    const data = await apiRequest('/api/driver/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password
      })
    });
    
    console.log('=== DEBUG LOGIN RESPONSE ===');
    console.log('Réponse complète:', data);
    console.log('Token reçu:', data.token ? 'Oui' : 'Non');
    console.log('Token type:', typeof data.token);
    console.log('Token longueur:', data.token ? data.token.length : 0);
    console.log('Token commence par:', data.token ? data.token.substring(0, 20) + '...' : 'null');
    
    // Vérifier que le token est bien formé (doit avoir 3 parties séparées par des points)
    if (data.token) {
      const tokenParts = data.token.split('.');
      console.log('Nombre de parties du token:', tokenParts.length);
      console.log('Format JWT valide:', tokenParts.length === 3);
      
      if (tokenParts.length !== 3) {
        console.error('Token malformé reçu du serveur');
        throw new Error('Token JWT malformé reçu du serveur');
      }
    } else {
      throw new Error('Aucun token reçu du serveur');
    }
    console.log('============================');
    
    console.log('Connexion réussie, sauvegarde des données...');
    
    // Sauvegarder les données du chauffeur localement
    await AsyncStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
    await AsyncStorage.setItem('driverId', data.driver.id.toString());
    await AsyncStorage.setItem(AUTH_CONFIG.DRIVER_DATA_KEY, JSON.stringify(data.driver));
    
    // Initialiser le statut de disponibilité
    await AsyncStorage.setItem('driverAvailable', 'false');
    await AsyncStorage.setItem('isTracking', 'false');
    
    // Sauvegarder l'heure de connexion pour la gestion de session
    await AsyncStorage.setItem('loginTime', Date.now().toString());
    
    console.log('Données sauvegardées avec succès');
    
    return data;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    
    // Messages d'erreur personnalisés
    if (error.message.includes('401') || error.message.includes('incorrect')) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    } else if (error.message.includes('Network') || error.message.includes('connexion')) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    throw error;
  }
};

/**
 * Déconnecte le chauffeur
 * @returns {Promise<boolean>} - Succès de l'opération
 */
export const logoutDriver = async () => {
  try {
    console.log('Déconnexion du chauffeur...');
    
    // Nettoyer l'AsyncStorage
    await AsyncStorage.multiRemove([
      AUTH_CONFIG.TOKEN_KEY, 
      'driverId', 
      AUTH_CONFIG.DRIVER_DATA_KEY, 
      'driverAvailable', 
      'isTracking',
      'pushToken',
      'loginTime'
    ]);
    
    console.log('Déconnexion réussie');
    
    return true;
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    return false;
  }
};

/**
 * Vérifie si le chauffeur est connecté et si le token est valide
 * @returns {Promise<boolean>} - True si connecté et token valide
 */
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const driverId = await AsyncStorage.getItem('driverId');
    const loginTime = await AsyncStorage.getItem('loginTime');
    
    if (!token || !driverId) {
      return false;
    }
    
    // Vérifier si la session n'est pas expirée (déconnexion automatique après 24h)
    if (loginTime) {
      const sessionAge = Date.now() - parseInt(loginTime);
      if (sessionAge > AUTH_CONFIG.AUTO_LOGOUT_DELAY) {
        console.log('Session expirée, déconnexion automatique');
        await logoutDriver();
        return false;
      }
    }
    
    // Vérifier la validité du token en essayant de récupérer le profil
    try {
      await apiRequest('/api/driver/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      // Token invalide ou expiré
      console.log('Token invalide ou expiré:', error.message);
      await logoutDriver();
      return false;
    }
  } catch (error) {
    console.error('Erreur de vérification de connexion:', error);
    return false;
  }
};

/**
 * Récupère les données du chauffeur connecté depuis le serveur
 * @returns {Promise<object|null>} - Données du chauffeur ou null
 */
export const getCurrentDriver = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    if (!token) {
      return null;
    }
    
    const data = await apiRequest('/api/driver/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Mettre à jour les données stockées localement
    await AsyncStorage.setItem(AUTH_CONFIG.DRIVER_DATA_KEY, JSON.stringify(data.driver));
    
    return data.driver;
  } catch (error) {
    console.error('Erreur lors de la récupération des données du chauffeur:', error);
    
    // Si erreur d'authentification, déconnecter
    if (error.message.includes('401') || error.message.includes('Token')) {
      await logoutDriver();
    }
    
    return null;
  }
};

/**
 * Met à jour le profil du chauffeur
 * @param {object} driverData - Nouvelles données du chauffeur
 * @returns {Promise<object>} - Données mises à jour
 */
export const updateDriverProfile = async (driverData) => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTH_ERROR);
    }
    
    const data = await apiRequest('/api/driver/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(driverData)
    });
    
    // Mettre à jour les données stockées localement
    await AsyncStorage.setItem(AUTH_CONFIG.DRIVER_DATA_KEY, JSON.stringify(data.driver));
    
    return data.driver;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};

/**
 * Rafraîchit le token si nécessaire
 * @returns {Promise<boolean>} - True si le token est valide ou rafraîchi
 */
export const refreshTokenIfNeeded = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    if (!token) {
      return false;
    }
    
    // Tenter une requête simple pour vérifier la validité du token
    await apiRequest('/api/driver/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return true;
  } catch (error) {
    // Token expiré ou invalide
    console.log('Token nécessite un rafraîchissement ou est invalide');
    await logoutDriver();
    return false;
  }
};

/**
 * Obtient le token d'authentification actuel
 * @returns {Promise<string|null>} - Token d'authentification ou null
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Vérifie si une reconnexion automatique est possible
 * @returns {Promise<boolean>} - True si la reconnexion est possible
 */
export const canAutoLogin = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const loginTime = await AsyncStorage.getItem('loginTime');
    
    if (!token || !loginTime) {
      return false;
    }
    
    // Vérifier l'âge de la session
    const sessionAge = Date.now() - parseInt(loginTime);
    return sessionAge < AUTH_CONFIG.AUTO_LOGOUT_DELAY;
  } catch (error) {
    console.error('Erreur lors de la vérification de reconnexion automatique:', error);
    return false;
  }
};

/**
 * Fonction de debug pour afficher les informations de token
 * @returns {Promise<object>} - Informations de debug
 */
export const debugTokenInfo = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const driverId = await AsyncStorage.getItem('driverId');
    const loginTime = await AsyncStorage.getItem('loginTime');
    
    const debugInfo = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'null',
      tokenParts: token ? token.split('.').length : 0,
      driverId: driverId,
      loginTime: loginTime ? new Date(parseInt(loginTime)).toLocaleString() : 'null',
      sessionAge: loginTime ? Math.round((Date.now() - parseInt(loginTime)) / 1000 / 60) + ' minutes' : 'null'
    };
    
    console.log('=== DEBUG TOKEN INFO ===');
    console.log(debugInfo);
    console.log('========================');
    
    return debugInfo;
  } catch (error) {
    console.error('Erreur lors du debug du token:', error);
    return null;
  }
};