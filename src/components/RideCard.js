import { Ionicons } from '@expo/vector-icons';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const RideCard = ({ ride, onPress }) => {
  // Formater l'adresse
  const formatAddress = (address) => {
    if (!address) return 'Adresse non disponible';
    
    // Limiter la longueur pour éviter un débordement
    if (address.length > 40) {
      return address.substring(0, 40) + '...';
    }
    
    return address;
  };
  
  // Calculer la distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en km
    
    return distance.toFixed(1);
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  // Calculer la distance si les coordonnées sont disponibles
  const distance = ride.driver_lat && ride.driver_lng && ride.pickup_lat && ride.pickup_lng
    ? calculateDistance(
        parseFloat(ride.driver_lat),
        parseFloat(ride.driver_lng),
        parseFloat(ride.pickup_lat),
        parseFloat(ride.pickup_lng)
      )
    : null;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Indicateur de type de course */}
      <View style={styles.typeIndicator}>
        <Ionicons 
          name={ride.is_urgent ? "flash" : "car"}
          size={16} 
          color="#fff" 
        />
      </View>
      
      {/* Contenu principal */}
      <View style={styles.cardContent}>
        {/* En-tête avec adresse et temps */}
        <View style={styles.cardHeader}>
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={16} color="#2563eb" />
            <Text style={styles.addressText} numberOfLines={1}>
              {formatAddress(ride.pickup_address)}
            </Text>
          </View>
          
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.timeText}>{ride.pickup_time}</Text>
          </View>
        </View>
        
        {/* Destination si disponible */}
        {ride.dropoff_address && (
          <View style={styles.destinationContainer}>
            <Ionicons name="navigate" size={14} color="#059669" />
            <Text style={styles.destinationText} numberOfLines={1}>
              {formatAddress(ride.dropoff_address)}
            </Text>
          </View>
        )}
        
        {/* Informations complémentaires */}
        <View style={styles.infoContainer}>
          {/* Prix */}
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {ride.price ? `${ride.price} €` : 'Prix non défini'}
            </Text>
          </View>
          
          {/* Distance si disponible */}
          {distance && (
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={14} color="#666" />
              <Text style={styles.infoText}>{distance} km</Text>
            </View>
          )}
          
          {/* Durée estimée si disponible */}
          {ride.estimated_duration && (
            <View style={styles.infoItem}>
              <Ionicons name="timer-outline" size={14} color="#666" />
              <Text style={styles.infoText}>{ride.estimated_duration}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onPress}
        >
          <Text style={styles.actionButtonText}>Détails</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  typeIndicator: {
    width: 3,
    backgroundColor: '#2563eb', // Bleu pour régulier, peut être modifié selon le type
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  timeText: {
    marginLeft: 3,
    fontSize: 12,
    color: '#666',
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#059669',
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 3,
  },
  infoText: {
    marginLeft: 3,
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    width: 80,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    marginRight: 3,
  },
});

export default RideCard;