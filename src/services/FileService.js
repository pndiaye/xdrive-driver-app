import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Enregistrer un PDF à partir d'un blob
export const savePDFFromBlob = async (blob, filename) => {
  try {
    // Convertir le blob en base64
    const reader = new FileReader();
    const promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64Data = await promise;
    const base64Content = base64Data.split(',')[1];
    
    // Créer le chemin du fichier
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Écrire le fichier
    await FileSystem.writeAsStringAsync(fileUri, base64Content, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du PDF:', error);
    throw error;
  }
};

// Partager un fichier
export const shareFile = async (fileUri, mimeType = 'application/pdf') => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      alert('Le partage n\'est pas disponible sur cet appareil');
      return;
    }
    
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: 'Partager le document',
    });
  } catch (error) {
    console.error('Erreur lors du partage du fichier:', error);
    throw error;
  }
};

// Ouvrir un fichier
export const openFile = async (fileUri, mimeType = 'application/pdf') => {
  try {
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(fileUri);
    } else {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mimeType,
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du fichier:', error);
    throw error;
  }
};