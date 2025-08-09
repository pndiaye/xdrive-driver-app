import { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    vehicle: { make: '', model: '', year: '', color: '', license_plate: '' },
    documents: {
      driver_license: { number: '', expiry_date: '' },
      insurance: { number: '', expiry_date: '' },
      vehicle_registration: { number: '', expiry_date: '' }
    }
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value, parent, subparent) => {
    if (parent && subparent) {
      setForm(f => ({
        ...f,
        [parent]: { ...f[parent], [subparent]: { ...f[parent][subparent], [field]: value } }
      }));
    } else if (parent) {
      setForm(f => ({ ...f, [parent]: { ...f[parent], [field]: value } }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://<YOUR_API_URL>/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Succès', data.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la création du compte');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le compte');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Nom</Text>
      <TextInput value={form.name} onChangeText={v => handleChange('name', v)} />
      <Text>Email</Text>
      <TextInput value={form.email} onChangeText={v => handleChange('email', v)} autoCapitalize="none" />
      <Text>Mot de passe</Text>
      <TextInput value={form.password} onChangeText={v => handleChange('password', v)} secureTextEntry />
      <Text>Téléphone</Text>
      <TextInput value={form.phone} onChangeText={v => handleChange('phone', v)} />

      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Véhicule</Text>
      <Text>Marque</Text>
      <TextInput value={form.vehicle.make} onChangeText={v => handleChange('make', v, 'vehicle')} />
      <Text>Modèle</Text>
      <TextInput value={form.vehicle.model} onChangeText={v => handleChange('model', v, 'vehicle')} />
      <Text>Année</Text>
      <TextInput value={form.vehicle.year} onChangeText={v => handleChange('year', v, 'vehicle')} keyboardType="numeric" />
      <Text>Couleur</Text>
      <TextInput value={form.vehicle.color} onChangeText={v => handleChange('color', v, 'vehicle')} />
      <Text>Immatriculation</Text>
      <TextInput value={form.vehicle.license_plate} onChangeText={v => handleChange('license_plate', v, 'vehicle')} />

      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Permis de conduire</Text>
      <Text>Numéro</Text>
      <TextInput value={form.documents.driver_license.number} onChangeText={v => handleChange('number', v, 'documents', 'driver_license')} />
      <Text>Date d'expiration</Text>
      <TextInput value={form.documents.driver_license.expiry_date} onChangeText={v => handleChange('expiry_date', v, 'documents', 'driver_license')} placeholder="YYYY-MM-DD" />

      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Assurance</Text>
      <Text>Numéro</Text>
      <TextInput value={form.documents.insurance.number} onChangeText={v => handleChange('number', v, 'documents', 'insurance')} />
      <Text>Date d'expiration</Text>
      <TextInput value={form.documents.insurance.expiry_date} onChangeText={v => handleChange('expiry_date', v, 'documents', 'insurance')} placeholder="YYYY-MM-DD" />

      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Carte grise</Text>
      <Text>Numéro</Text>
      <TextInput value={form.documents.vehicle_registration.number} onChangeText={v => handleChange('number', v, 'documents', 'vehicle_registration')} />
      <Text>Date d'expiration</Text>
      <TextInput value={form.documents.vehicle_registration.expiry_date} onChangeText={v => handleChange('expiry_date', v, 'documents', 'vehicle_registration')} placeholder="YYYY-MM-DD" />

      <Button title={loading ? "Création..." : "Créer le compte"} onPress={handleRegister} disabled={loading} />
      <Button title="Déjà inscrit ? Se connecter" onPress={() => navigation.navigate('Login')} />
    </ScrollView>
  );
}