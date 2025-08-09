// Configuration de l'application chauffeur

// URL de votre serveur - MISE À JOUR avec votre URL Replit
export const API_CONFIG = {
  BASE_URL: 'https://nice-transfert-server-pnwireframe.replit.app',
  TIMEOUT: 10000, // 10 secondes
  RETRY_ATTEMPTS: 3
};

// Configuration de la localisation
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 30000, // 30 secondes
  MIN_DISTANCE: 50, // 50 mètres minimum pour une mise à jour
  ACCURACY: 'high', // 'high' ou 'balanced'
  BACKGROUND_UPDATES: false // Mise à jour en arrière-plan (si autorisé)
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  SOUND_ENABLED: true,
  VIBRATION_ENABLED: true,
  BADGE_ENABLED: true,
  CATEGORIES: {
    NEW_RIDE: 'new_ride',
    RIDE_UPDATE: 'ride_update',
    SYSTEM: 'system'
  }
};

// Configuration de l'authentification
export const AUTH_CONFIG = {
  TOKEN_KEY: 'userToken',
  DRIVER_DATA_KEY: 'driverData',
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes avant expiration
  AUTO_LOGOUT_DELAY: 24 * 60 * 60 * 1000 // 24 heures
};

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.',
  AUTH_ERROR: 'Session expirée. Veuillez vous reconnecter.',
  LOCATION_PERMISSION_DENIED: 'Permission de localisation refusée. Cette fonctionnalité est nécessaire pour recevoir des courses.',
  NOTIFICATION_PERMISSION_DENIED: 'Permission de notification refusée. Vous ne recevrez pas d\'alertes pour les nouvelles courses.',
  SERVER_ERROR: 'Erreur du serveur. Veuillez réessayer plus tard.',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  RIDE_UNAVAILABLE: 'Cette course n\'est plus disponible.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.'
};

// Statuts des courses
export const RIDE_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Traductions des statuts
export const RIDE_STATUS_LABELS = {
  [RIDE_STATUSES.PENDING]: 'En attente',
  [RIDE_STATUSES.ACCEPTED]: 'Acceptée',
  [RIDE_STATUSES.EN_ROUTE]: 'En route',
  [RIDE_STATUSES.ARRIVED]: 'Arrivé',
  [RIDE_STATUSES.COMPLETED]: 'Terminée',
  [RIDE_STATUSES.CANCELLED]: 'Annulée'
};

// Couleurs des statuts
export const RIDE_STATUS_COLORS = {
  [RIDE_STATUSES.PENDING]: '#f59e0b',
  [RIDE_STATUSES.ACCEPTED]: '#3b82f6',
  [RIDE_STATUSES.EN_ROUTE]: '#8b5cf6',
  [RIDE_STATUSES.ARRIVED]: '#10b981',
  [RIDE_STATUSES.COMPLETED]: '#059669',
  [RIDE_STATUSES.CANCELLED]: '#ef4444'
};

// Configuration des couleurs de l'application
export const COLORS = {
  PRIMARY: '#2563eb',
  PRIMARY_DARK: '#1d4ed8',
  PRIMARY_LIGHT: '#93c5fd',
  SUCCESS: '#059669',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  BACKGROUND: '#f5f5f5',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_LIGHT: '#f3f4f6',
  GRAY: '#6b7280',
  GRAY_DARK: '#374151',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280'
};

// Configuration des tailles
export const SIZES = {
  FONT_SMALL: 12,
  FONT_MEDIUM: 14,
  FONT_LARGE: 16,
  FONT_XL: 18,
  FONT_XXL: 24,
  BORDER_RADIUS: 10,
  BORDER_RADIUS_LARGE: 15,
  PADDING_SMALL: 8,
  PADDING_MEDIUM: 15,
  PADDING_LARGE: 20,
  MARGIN_SMALL: 5,
  MARGIN_MEDIUM: 10,
  MARGIN_LARGE: 15
};

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  MIN_PASSWORD_LENGTH: 6
};

// Configuration des intervalles de rafraîchissement
export const REFRESH_INTERVALS = {
  AVAILABLE_RIDES: 30000, // 30 secondes
  DRIVER_STATS: 60000, // 1 minute
  RIDE_DETAILS: 10000 // 10 secondes
};

// Configuration de la carte
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MARKER_COLORS: {
    PICKUP: '#2563eb',
    DROPOFF: '#f59e0b',
    DRIVER: '#059669'
  }
};

// Types de véhicules
export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  SUV: 'suv',
  VAN: 'van',
  LUXURY: 'luxury'
};

// Configuration des notifications push
export const PUSH_NOTIFICATION_CONFIG = {
  CATEGORIES: [
    {
      identifier: 'new_ride',
      actions: [
        {
          identifier: 'accept',
          title: 'Accepter',
          options: { foreground: true }
        },
        {
          identifier: 'decline',
          title: 'Refuser',
          options: { foreground: false }
        }
      ]
    }
  ]
};

// Configuration de debug
export const DEBUG_CONFIG = {
  ENABLE_LOGS: __DEV__, // Activer les logs en développement seulement
  LOG_API_REQUESTS: __DEV__,
  LOG_LOCATION_UPDATES: __DEV__,
  MOCK_LOCATION: false // Pour tester sans vraie localisation
};

export default {
  API_CONFIG,
  LOCATION_CONFIG,
  NOTIFICATION_CONFIG,
  AUTH_CONFIG,
  ERROR_MESSAGES,
  RIDE_STATUSES,
  RIDE_STATUS_LABELS,
  RIDE_STATUS_COLORS,
  COLORS,
  SIZES,
  VALIDATION,
  REFRESH_INTERVALS,
  MAP_CONFIG,
  VEHICLE_TYPES,
  PUSH_NOTIFICATION_CONFIG,
  DEBUG_CONFIG
};