import { Ionicons } from '@expo/vector-icons';
import {
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

const StatusToggle = ({ isAvailable, onToggle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statusContent}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isAvailable ? '#059669' : '#f59e0b' }
        ]}>
          <Ionicons 
            name={isAvailable ? "radio" : "moon"}
            size={16} 
            color="#fff" 
          />
        </View>
        
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {isAvailable ? 'Disponible' : 'Non disponible'}
          </Text>
          <Text style={styles.statusDescription}>
            {isAvailable 
              ? 'Vous pouvez recevoir des demandes de courses' 
              : 'Vous ne recevez pas de demandes de courses'
            }
          </Text>
        </View>
      </View>
      
      <Switch
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={isAvailable ? '#2563eb' : '#f5f5f5'}
        onValueChange={onToggle}
        value={isAvailable}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 13,
    color: '#666',
  },
});

export default StatusToggle;