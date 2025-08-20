// src/screens/RegisterScreen.js
import { memo, useRef, useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const Label = memo(({ children }) => (
  <Text style={{ fontWeight: "600", marginBottom: 6 }}>{children}</Text>
));

const Section = memo(({ title, children }) => (
  <View style={{ marginTop: 18 }}>
    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>{title}</Text>
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#EFEFEF",
      }}
    >
      {children}
    </View>
  </View>
));

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // ===== Profil =====
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // ===== Permis =====
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState(""); // YYYY-MM-DD

  // ===== Véhicule =====
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [seats, setSeats] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");

  // ===== Assurance =====
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState(""); // YYYY-MM-DD

  // Stable refs for focus chaining
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const licenseNumberRef = useRef(null);
  const licenseExpiryRef = useRef(null);
  const vehicleMakeRef = useRef(null);
  const vehicleModelRef = useRef(null);
  const vehicleYearRef = useRef(null);
  const vehicleColorRef = useRef(null);
  const plateNumberRef = useRef(null);
  const seatsRef = useRef(null);
  const vehicleClassRef = useRef(null);
  const insuranceCompanyRef = useRef(null);
  const insurancePolicyRef = useRef(null);
  const insuranceExpiryRef = useRef(null);

  const keyboardOffset = (Platform.OS === "ios" ? insets.top : 0) + 12;

  const inputStyle = {
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
  };

  const fieldIsEmpty = (v) => !v || String(v).trim().length === 0;

  const onSubmit = async () => {
    const errors = [];
    if (fieldIsEmpty(fullName)) errors.push("Nom complet");
    if (fieldIsEmpty(email)) errors.push("Email");
    if (fieldIsEmpty(phone)) errors.push("Téléphone");
    if (fieldIsEmpty(password)) errors.push("Mot de passe");
    if (fieldIsEmpty(licenseNumber)) errors.push("Numéro de permis");
    if (fieldIsEmpty(licenseExpiry)) errors.push("Expiration du permis");
    if (fieldIsEmpty(vehicleMake)) errors.push("Marque du véhicule");
    if (fieldIsEmpty(vehicleModel)) errors.push("Modèle du véhicule");
    if (fieldIsEmpty(vehicleYear)) errors.push("Année du véhicule");
    if (fieldIsEmpty(plateNumber)) errors.push("Immatriculation");
    if (fieldIsEmpty(insuranceCompany)) errors.push("Compagnie d'assurance");
    if (fieldIsEmpty(insurancePolicy)) errors.push("Numéro de police");
    if (fieldIsEmpty(insuranceExpiry)) errors.push("Expiration de l'assurance");

    if (errors.length) {
      Alert.alert("Champs manquants", `Veuillez renseigner : ${errors.join(", ")}`);
      return;
    }

    const payload = {
      name: fullName,
      email,
      password,
      phone,
      vehicle: {
        make: vehicleMake,
        model: vehicleModel,
        year: vehicleYear ? Number(vehicleYear) : undefined,
        color: vehicleColor,
        license_plate: plateNumber,
        seats: seats ? Number(seats) : undefined,
        class: vehicleClass,
      },
      documents: {
        license: { number: licenseNumber, expiry: licenseExpiry },
        insurance: { company: insuranceCompany, policy: insurancePolicy, expiry: insuranceExpiry },
      },
    };

    try {
      const res = await fetch(
        "https://nice-transfert-server-pnwireframe.replit.app/api/driver/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

      Keyboard.dismiss();
      Alert.alert("Succès", json?.message || "Compte créé avec succès.");
      navigation?.navigate?.("Login");
    } catch (e) {
      Alert.alert("Erreur", String(e?.message || "Erreur interne du client"));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          }}
          // keep keyboard visible while tapping/focusing/typing
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 8 }}>
            Créer votre compte
          </Text>
          <Text style={{ color: "#666", marginBottom: 18 }}>
            Renseignez votre profil, votre véhicule et votre assurance pour commencer à conduire.
          </Text>

          {/* ===== Profil ===== */}
          <Section title="Profil">
            <View style={{ marginBottom: 12 }}>
              <Label>Nom complet</Label>
              <TextInput
                placeholder="Ex. Papa Ndiaye"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={fullName}
                onChangeText={setFullName}
                onSubmitEditing={() => emailRef.current?.focus()}
                style={inputStyle}
                importantForAutofill="yes"
                textContentType="name"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Email</Label>
              <TextInput
                ref={emailRef}
                placeholder="vous@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => phoneRef.current?.focus()}
                style={inputStyle}
                importantForAutofill="yes"
                textContentType="emailAddress"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Téléphone</Label>
              <TextInput
                ref={phoneRef}
                placeholder="+33 6 12 34 56 78"
                keyboardType="phone-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                value={phone}
                onChangeText={setPhone}
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={inputStyle}
                importantForAutofill="yes"
                textContentType="telephoneNumber"
              />
            </View>

            <View style={{ marginBottom: 4 }}>
              <Label>Mot de passe</Label>
              <TextInput
                ref={passwordRef}
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="next"
                blurOnSubmit={false}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => licenseNumberRef.current?.focus()}
                style={inputStyle}
                importantForAutofill="yes"
                textContentType="newPassword"
              />
            </View>
          </Section>

          {/* ===== Permis de conduire ===== */}
          <Section title="Permis de conduire">
            <View style={{ marginBottom: 12 }}>
              <Label>Numéro de permis</Label>
              <TextInput
                ref={licenseNumberRef}
                placeholder="Ex. 123456789"
                autoCapitalize="characters"
                returnKeyType="next"
                blurOnSubmit={false}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                onSubmitEditing={() => licenseExpiryRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 4 }}>
              <Label>Expiration du permis (YYYY-MM-DD)</Label>
              <TextInput
                ref={licenseExpiryRef}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
                blurOnSubmit={false}
                value={licenseExpiry}
                onChangeText={setLicenseExpiry}
                onSubmitEditing={() => vehicleMakeRef.current?.focus()}
                style={inputStyle}
              />
            </View>
          </Section>

          {/* ===== Véhicule ===== */}
          <Section title="Véhicule">
            <View style={{ marginBottom: 12 }}>
              <Label>Marque</Label>
              <TextInput
                ref={vehicleMakeRef}
                placeholder="Ex. Toyota"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={vehicleMake}
                onChangeText={setVehicleMake}
                onSubmitEditing={() => vehicleModelRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Modèle</Label>
              <TextInput
                ref={vehicleModelRef}
                placeholder="Ex. Corolla"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                onSubmitEditing={() => vehicleYearRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Année</Label>
              <TextInput
                ref={vehicleYearRef}
                placeholder="Ex. 2019"
                keyboardType="number-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                value={vehicleYear}
                onChangeText={setVehicleYear}
                onSubmitEditing={() => vehicleColorRef.current?.focus()}
                style={inputStyle}
                maxLength={4}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Couleur</Label>
              <TextInput
                ref={vehicleColorRef}
                placeholder="Ex. Noir"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={vehicleColor}
                onChangeText={setVehicleColor}
                onSubmitEditing={() => plateNumberRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Immatriculation</Label>
              <TextInput
                ref={plateNumberRef}
                placeholder="Ex. AB-123-CD"
                autoCapitalize="characters"
                returnKeyType="next"
                blurOnSubmit={false}
                value={plateNumber}
                onChangeText={setPlateNumber}
                onSubmitEditing={() => seatsRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Nombre de places</Label>
              <TextInput
                ref={seatsRef}
                placeholder="Ex. 5"
                keyboardType="number-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                value={seats}
                onChangeText={setSeats}
                onSubmitEditing={() => vehicleClassRef.current?.focus()}
                style={inputStyle}
                maxLength={2}
              />
            </View>

            <View style={{ marginBottom: 4 }}>
              <Label>Catégorie (ex. Standard, Van, Berline)</Label>
              <TextInput
                ref={vehicleClassRef}
                placeholder="Ex. Standard"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={vehicleClass}
                onChangeText={setVehicleClass}
                onSubmitEditing={() => insuranceCompanyRef.current?.focus()}
                style={inputStyle}
              />
            </View>
          </Section>

          {/* ===== Assurance ===== */}
          <Section title="Assurance">
            <View style={{ marginBottom: 12 }}>
              <Label>Compagnie</Label>
              <TextInput
                ref={insuranceCompanyRef}
                placeholder="Ex. AXA"
                autoCapitalize="words"
                returnKeyType="next"
                blurOnSubmit={false}
                value={insuranceCompany}
                onChangeText={setInsuranceCompany}
                onSubmitEditing={() => insurancePolicyRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Label>Numéro de police / contrat</Label>
              <TextInput
                ref={insurancePolicyRef}
                placeholder="Ex. POL-123456"
                autoCapitalize="characters"
                returnKeyType="next"
                blurOnSubmit={false}
                value={insurancePolicy}
                onChangeText={setInsurancePolicy}
                onSubmitEditing={() => insuranceExpiryRef.current?.focus()}
                style={inputStyle}
              />
            </View>

            <View style={{ marginBottom: 4 }}>
              <Label>Expiration de l'assurance (YYYY-MM-DD)</Label>
              <TextInput
                ref={insuranceExpiryRef}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                blurOnSubmit={false}
                value={insuranceExpiry}
                onChangeText={setInsuranceExpiry}
                onSubmitEditing={onSubmit}
                style={inputStyle}
              />
            </View>
          </Section>

          {/* ===== Boutons ===== */}
          <Pressable
            onPress={onSubmit}
            style={{
              marginTop: 16,
              backgroundColor: "#111",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Créer le compte
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={{ alignItems: "center", paddingVertical: 12 }}
          >
            <Text style={{ color: "#111" }}>Déjà inscrit ? Se connecter</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
