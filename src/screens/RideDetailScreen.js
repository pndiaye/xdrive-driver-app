import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS, SIZES } from '../constants';
import { acceptRide } from '../services/ApiService';
import { openFile, savePDFFromBlob, shareFile } from '../services/FileService';




const RideDetailScreen = ({ navigation, route }) => {
  const { ride } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('pending');
  // Dans votre composant RideDetailScreen, ajoutez:
const [bonCommandeUri, setBonCommandeUri] = useState(null);
  
  // Fonction pour accepter une course
const handleAcceptRide = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await acceptRide(ride.id);
      
      // Mettre à jour le statut
      setCurrentStatus('assigned');
      
      // Télécharger le bon de commande s'il est disponible
      if (response.bonCommande) {
        try {
          // Télécharger le fichier
          const blob = await downloadFile(response.bonCommande);
          
          // Sauvegarder localement
          const filename = `bon_commande_${ride.id}.pdf`;
          const fileUri = await savePDFFromBlob(blob, filename);
          
          // Mettre à jour l'état
          setBonCommandeUri(fileUri);
          
          Alert.alert(
            'Bon de commande',
            'Le bon de commande a été téléchargé avec succès.',
            [{ text: 'OK' }]
          );
        } catch (fileError) {
          console.error('Erreur lors du téléchargement du bon de commande:', fileError);
          Alert.alert(
            'Erreur',
            'Impossible de télécharger le bon de commande. La course a quand même été acceptée.'
          );
        }
      }
      
      Alert.alert(
        'Course acceptée',
        'Vous avez accepté cette course avec succès!'
      );
    } catch (error) {
      setError('Impossible d\'accepter cette course. Veuillez réessayer.');
      console.error('Erreur lors de l\'acceptation de la course:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour voir le bon de commande
  const handleViewBonCommande = async () => {
    if (bonCommandeUri) {
      try {
        await openFile(bonCommandeUri);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le bon de commande');
      }
    } else {
      Alert.alert('Information', 'Le bon de commande n\'est pas encore disponible');
    }
  };
  
  // Fonction pour partager le bon de commande
  const handleShareBonCommande = async () => {
    if (bonCommandeUri) {
      try {
        await shareFile(bonCommandeUri);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de partager le bon de commande');
      }
    } else {
      Alert.alert('Information', 'Le bon de commande n\'est pas encore disponible');
    }
  };
  
  // Ajouter des boutons pour voir et partager le bon de commande
  // Dans la partie JSX, après les boutons d'action:
  {currentStatus !== 'pending' && (
    <View style={styles.bonCommandeContainer}>
      <Text style={styles.bonCommandeTitle}>Bon de commande</Text>
      <View style={styles.bonCommandeButtons}>
        <TouchableOpacity
          style={styles.bonCommandeButton}
          onPress={handleViewBonCommande}
          disabled={!bonCommandeUri}
        >
          <Text style={styles.bonCommandeButtonText}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bonCommandeButton}
          onPress={handleShareBonCommande}
          disabled={!bonCommandeUri}
        >
          <Text style={styles.bonCommandeButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}

  const handleUpdateStatus = (status) => {
    setIsLoading(true);
    
    // Simuler le temps de traitement
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStatus(status);
      
      if (status === 'terminé') {
        Alert.alert(
          'Course terminée',
          'La course a été marquée comme terminée.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert(
          'Statut mis à jour',
          `Le statut de la course est maintenant: ${status}`,
          [{ text: 'OK' }]
        );
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la course</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Heure:</Text>
            <Text style={styles.infoValue}>{ride.pickupTime}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Départ:</Text>
            <Text style={styles.infoValue}>{ride.pickupLocation}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Arrivée:</Text>
            <Text style={styles.infoValue}>{ride.dropoffLocation}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{ride.distance} km</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Durée:</Text>
            <Text style={styles.infoValue}>{ride.duration} min</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prix:</Text>
            <Text style={styles.infoValue}>{ride.price}€</Text>
          </View>
        </View>
        
        {/* Mode de paiement */}
        <View style={[
          styles.paymentCard,
          ride.paymentMethod === 'cash' ? styles.cashPaymentCard : styles.cardPaymentCard
        ]}>
          <Text style={styles.cardTitle}>Paiement</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentText}>
              Mode de paiement: {ride.paymentMethod === 'cash' ? 'Espèces' : 'Carte bancaire'}
            </Text>
            {ride.paymentMethod === 'cash' && (
              <Text style={styles.paymentWarning}>
                Vous devrez collecter {ride.price}€ à la fin de la course.
              </Text>
            )}
          </View>
        </View>
        
        {currentStatus === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, isLoading && styles.buttonDisabled]}
            onPress={handleAcceptRide}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Accepter cette course</Text>
            )}
          </TouchableOpacity>
        )}
        
        {currentStatus === 'assigned' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.enRouteButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleUpdateStatus('en_route')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Je suis en route</Text>
            )}
          </TouchableOpacity>
        )}
        
        {currentStatus === 'en_route' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.arrivedButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleUpdateStatus('arrivé')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Je suis arrivé</Text>
            )}
          </TouchableOpacity>
        )}
        
        {currentStatus === 'arrivé' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startRideButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleUpdateStatus('en_cours')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Démarrer la course</Text>
            )}
          </TouchableOpacity>
        )}
        
        {currentStatus === 'en_cours' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleUpdateStatus('terminé')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Terminer la course</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Option supplémentaire pour les paiements en espèces */}
        {currentStatus === 'terminé' && ride.paymentMethod === 'cash' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cashCollectedButton, isLoading && styles.buttonDisabled]}
            onPress={() => {
              Alert.alert(
                'Paiement encaissé',
                `Confirmez-vous avoir encaissé ${ride.price}€ ?`,
                [
                  { text: 'Non', style: 'cancel' },
                  { 
                    text: 'Oui', 
                    onPress: () => {
                      Alert.alert('Succès', 'Paiement enregistré avec succès');
                      navigation.navigate('Home');
                    }
                  }
                ]
              );
            }}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Confirmer encaissement de {ride.price}€</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  backButton: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
  },
  paymentCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  cardPaymentCard: {
    backgroundColor: '#e1f5fe',
    borderLeftColor: '#2196f3',
  },
  cashPaymentCard: {
        backgroundColor: '#fff3cd',
        borderLeftColor: '#ffc107',
    },
    paymentMethod: {
    flexDirection: 'column',
    },
    paymentText: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    marginBottom: 5,
    },
    paymentWarning: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: '#856404',
    marginTop: 5,
    },
    actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    },
    buttonDisabled: {
    opacity: 0.6,
    },
    buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
    },
    acceptButton: {
    backgroundColor: COLORS.primary,
    },
    enRouteButton: {
    backgroundColor: '#3498db',
    },
    arrivedButton: {
    backgroundColor: '#9b59b6',
    },
    startRideButton: {
    backgroundColor: '#f39c12',
    },
    completeButton: {
    backgroundColor: COLORS.accent,
    },
    cashCollectedButton: {
    backgroundColor: '#27ae60',
    },
    bonCommandeContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
      },
      bonCommandeTitle: {
        fontSize: SIZES.medium,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      bonCommandeButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      bonCommandeButton: {
        backgroundColor: '#4b5563',
        padding: 10,
        borderRadius: 4,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
      },
      bonCommandeButtonText: {
        color: 'white',
        fontWeight: 'bold',
      },
    });
 
    export default RideDetailScreen;