import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView
} from "react-native";
import * as Location from "expo-location";
import LottieView from "lottie-react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
declare const process: any;

const { width } = Dimensions.get("window");

export default function ReportLocationScreen({ navigation, route }: any) {
  const { reportData } = route.params || {};
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [region, setRegion] = useState({
    latitude: 28.6139, // Default: Delhi
    longitude: 77.2090,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [mapKey, setMapKey] = useState(0); // Force map re-render

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        Alert.alert("Permission Denied", "Enable location services to continue.");
        return;
      }

      let pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locData = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };

      setLocation(locData);
      setRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Force map re-render with new location
      setMapKey(prev => prev + 1);
      setIsLoading(false);
      
      Alert.alert(
        "Location Found! 📍", 
        "Your location has been successfully detected and marked on the map.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      Alert.alert("Error", "Unable to get location. Try again.");
    }
  };

  const handleMapPress = (event: any) => {
    if (isManualMode) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const manualLocation = {
        latitude,
        longitude,
        accuracy: 10, // Manual selection has better accuracy
        isManual: true,
      };
      setLocation(manualLocation);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMapKey(prev => prev + 1);
    }
  };

  const enableManualMode = () => {
    setIsManualMode(true);
    setLocation(null); // Clear previous location
    Alert.alert(
      "Pin Location Mode 📍",
      "Tap anywhere on the map to mark the issue location. This is useful when you're reporting from home.",
      [{ text: "Got it!" }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Step Progress Pills */}
      <View style={styles.stepsBar}>
        <View style={styles.stepPillWrapper}>
          <View style={styles.stepPill}> 
            <Text style={styles.stepText}>1. General Information</Text>
          </View>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepPillWrapper}>
          <View style={[styles.stepPill, styles.stepPillActive]}> 
            <Text style={[styles.stepText, styles.stepTextActive]}>2. Place and Location</Text>
          </View>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepPillWrapper}>
          <View style={styles.stepPill}> 
            <Text style={styles.stepText}>3. Preview Report Information</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View style={styles.card}>
        <Text style={styles.heading}>Share Your Location</Text>
        <Text style={styles.subText}>Help us identify the exact location of the issue</Text>

        {/* Lottie Animation */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={{ uri: "https://lottie.host/2b2f0645-9c27-4a64-b5a4-702f2e989fd0/XWHw26cHu3.lottie" }}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {location ? "Location Successfully Found!" : "Get Current Location"}
          </Text>
          <Text style={styles.description}>
            {location
              ? "Your location has been successfully detected and will be included in your report."
              : "Click the button below to automatically detect your current location."}
          </Text>
        </View>

        {/* Get Location Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btn, (isLoading || isManualMode) && { opacity: 0.7 }]}
            onPress={getCurrentLocation}
            disabled={isLoading || isManualMode}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Getting Location...</Text>
              </>
            ) : (
              <Text style={styles.btnText}>📍 Get My Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* OR Divider */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* Manual Pin Location Section */}
        <View style={styles.buttonContainer}>
          <Text style={styles.manualTitle}>
            {isManualMode ? "Tap on Map to Pin Location" : "Pin Location Manually"}
          </Text>
          <Text style={styles.manualDescription}>
            {isManualMode 
              ? "Tap anywhere on the map below to mark where the issue is located"
              : "If you're at home or away from the issue, you can manually select the location on the map"}
          </Text>
          <TouchableOpacity
            style={[styles.btnSecondary, isManualMode && styles.btnSecondaryActive]}
            onPress={enableManualMode}
          >
            <Text style={[styles.btnSecondaryText, isManualMode && styles.btnSecondaryTextActive]}>
              {isManualMode ? "📍 Tap Map to Select Location" : "📌 Pin Location on Map"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              region={location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              } : region}
              mapType="standard"
              onPress={handleMapPress}
            >
              {(location ? [location] : []).map((loc, i) => (
                <Marker
                  key={`loc-${i}`}
                  coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                  title={loc.isManual ? "📍 Issue Location" : "📍 Your Current Location"}
                  description={loc.isManual 
                    ? "Manually selected location" 
                    : `Accuracy: ±${Math.round((loc as any).accuracy || 50)}m`}
                  pinColor={loc.isManual ? "#10B981" : "#3B82F6"}
                />
              ))}
            </MapView>
            {isManualMode && !location && (
              <View style={styles.manualHint}>
                <Text style={styles.manualHintText}>
                  👆 Tap on the map to select the issue location
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.mapInfo}>
            {location 
              ? (location.isManual 
                  ? "📍 Issue location pinned on map" 
                  : "📍 Your location is marked on the map")
              : isManualMode
              ? "🗺️ Tap anywhere on the map to mark the issue location"
              : "🗺️ Use 'Get My Location' or 'Pin Location on Map' to mark position"}
          </Text>
        </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !location && { backgroundColor: "#ccc" }]}
          disabled={!location}
          onPress={() => {
            const completeReportData = {
              ...reportData,
              location: location,
              coordinates: location ? `${location.latitude}, ${location.longitude}` : '',
              address: location ? `Location: ${location.latitude}, ${location.longitude}` : '',
            };
            console.log('🔍 ReportLocationScreen - completeReportData:', JSON.stringify(completeReportData, null, 2));
            navigation.navigate('ReportPreview', { reportData: completeReportData });
          }}
        >
          <Text style={styles.nextText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  stepsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    marginBottom: 8,
  },
  stepPillWrapper: {
    flexShrink: 1,
    zIndex: 1,
  },
  stepPill: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  stepPillActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    elevation: 4,
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#ffffff',
  },
  stepConnector: {
    flex: 1,
    height: 4,
    marginHorizontal: 10,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    zIndex: 0,
  },
  card: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  lottieContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#111827",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  mapSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    width: "100%",
    height: 320,
    borderRadius: 16,
  },
  mapInfo: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  orText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#111827",
  },
  manualDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  btnSecondary: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  btnSecondaryActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  btnSecondaryText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 16,
  },
  btnSecondaryTextActive: {
    color: "#10B981",
  },
  manualHint: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  manualHintText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  backBtn: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  nextBtn: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  backText: {
    color: "#475569",
    fontWeight: "600",
  },
  nextText: {
    color: "#fff",
    fontWeight: "600",
  },
});