import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { loginDriver } from '../services/AuthService';

const LoginScreen = ({ navigation, route, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Valeurs par défaut pour les tests (à retirer en production)
  useEffect(() => {
    // Pré-remplir avec des valeurs de test
    setEmail('admin@xdrive.com');
    setPassword('admin123');
  }, []);

  
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs');
      return;
    }
    
    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Veuillez entrer un email valide');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Tentative de connexion pour:', email);
      
      const userData = await loginDriver(email, password);
      
      console.log('Connexion réussie pour:', userData.driver.name);
      
      // Notifier le composant parent de la connexion réussie
      if (onLoginSuccess) {
        onLoginSuccess(userData.token, userData.driver);
      }
      
      // Afficher un message de succès
      Alert.alert(
        'Connexion réussie',
        `Bienvenue ${userData.driver.name}!`,
        [{ text: 'OK' }]
      );
      navigation.replace('Home');
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      let errorMsg = 'Erreur de connexion. Veuillez réessayer.';
      
      if (error.message.includes('401') || error.message.includes('incorrect')) {
        errorMsg = 'Email ou mot de passe incorrect';
      } else if (error.message.includes('Network') || error.message.includes('connexion')) {
        errorMsg = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      Alert.alert('Erreur de connexion', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      'Contactez votre administrateur pour réinitialiser votre mot de passe.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>🚗</Text>
        </View>
        <Text style={styles.title}>XDrive Chauffeur</Text>
        <Text style={styles.subtitle}>Connexion à votre espace chauffeur</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errorMessage ? styles.inputError : null]}
          placeholder="votre@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text.toLowerCase().trim());
            if (errorMessage) setErrorMessage('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={[styles.input, errorMessage ? styles.inputError : null]}
          placeholder="Votre mot de passe"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errorMessage) setErrorMessage('');
          }}
          secureTextEntry
          editable={!isLoading}
        />
        
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loginButtonText}>Connexion...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={handleForgotPassword}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Application Chauffeur • v1.0.0
        </Text>
        <Text style={styles.footerSubText}>
          Serveur: nice-transfert-server-pnwireframe.replit.app
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoText: {
    fontSize: 48,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
  footerSubText: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
});

export default LoginScreen;