import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useReportStore } from '../reportStore';
import { spacing, colors, typography } from '../../../theme';
import { Button, ScreenContainer, TextField, LocationPickerMap } from '../../../components';

interface LocationStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function LocationStep({ onNext, onBack }: LocationStepProps) {
  const { latitude, longitude, accuracy, address, setLocation } = useReportStore();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressText, setAddressText] = useState(address || '');
  const [accuracyWarning, setAccuracyWarning] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    checkLocationPermission();
    if (latitude !== null && longitude !== null) {
      setLocationPermissionGranted(true);
      if (accuracy && accuracy > 50) {
        setAccuracyWarning(true);
      }
    }
  }, []);

  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocationPermissionGranted(granted);
        return granted;
      } else {
        const { status } = await Location.getForegroundPermissionsAsync();
        const granted = status === 'granted';
        setLocationPermissionGranted(granted);
        return granted;
      }
    } catch (err) {
      console.error('Error checking location permission:', err);
      return false;
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message:
              'This app needs access to your location to pinpoint where you are reporting the issue.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermissionGranted(true);
          await getCurrentLocation();
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermissionGranted(true);
          await getCurrentLocation();
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to report this issue.',
            [
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  }
                },
              },
              { text: 'Cancel' },
            ]
          );
        }
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng, accuracy: acc } = location.coords;

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverseGeocode.length > 0) {
          const geo = reverseGeocode[0];
          const formattedAddress = [
            geo.street,
            geo.city,
            geo.region,
            geo.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
          setAddressText(formattedAddress);
          setLocation(lat, lng, formattedAddress, acc);
        } else {
          setLocation(lat, lng, null, acc);
        }
      } catch (geoError) {
        console.log('Geocoding failed, using coordinates only:', geoError);
        setLocation(lat, lng, null, acc);
      }

      if (acc !== null && acc > 50) {
        setAccuracyWarning(true);
      } else {
        setAccuracyWarning(false);
      }

      setIsLoadingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please try again or enable location services.',
        [{ text: 'OK' }]
      );
      setIsLoadingLocation(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation(lat, lng, addressText || null, accuracy);
    setMapKey((prev) => prev + 1);
  };

  const handleAddressEdit = (text: string) => {
    setAddressText(text);
  };

  const handleAddressSave = () => {
    if (latitude !== null && longitude !== null) {
      setLocation(latitude, longitude, addressText, accuracy);
      setEditingAddress(false);
    }
  };

  const handleContinue = () => {
    if (latitude === null || longitude === null) {
      Alert.alert('Location Required', 'Please select a location to continue.');
      return;
    }
    onNext();
  };

  if (!locationPermissionGranted) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.permissionContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="map-marker" size={64} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Enable Location Services</Text>
            <Text style={styles.permissionText}>
              For the best accuracy, move to an open area away from tall buildings. We'll use your current location to pinpoint the issue.
            </Text>
            <Button
              label="Enable Location"
              onPress={requestLocationPermission}
              style={styles.permissionButton}
            />
            <Button
              label="Back"
              variant="secondary"
              onPress={onBack}
              style={styles.permissionButton}
            />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (latitude === null || longitude === null) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="loading"
            size={48}
            color={colors.primary}
            style={{ opacity: 0.6 }}
          />
          <Text style={styles.loadingText}>Getting your location...</Text>
          <Text style={styles.loadingSubtext}>
            Please wait and ensure you're in an open area for better accuracy
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Location</Text>
          <Text style={styles.subtitle}>
            Drag the marker to adjust the exact location, or use your current position
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <LocationPickerMap
            key={mapKey}
            latitude={latitude}
            longitude={longitude}
            accuracy={accuracy || undefined}
            onLocationChange={handleLocationChange}
          />
        </View>

        {accuracy !== null && (
          <View
            style={[
              styles.accuracyBox,
              accuracy > 50 ? styles.accuracyWarning : styles.accuracyGood,
            ]}
          >
            <MaterialCommunityIcons
              name={accuracy > 50 ? 'alert-circle' : 'check-circle'}
              size={20}
              color={accuracy > 50 ? colors.warning : colors.success}
            />
            <View style={styles.accuracyContent}>
              <Text
                style={[
                  styles.accuracyTitle,
                  { color: accuracy > 50 ? colors.warning : colors.success },
                ]}
              >
                {accuracy > 50 ? 'Low Accuracy' : 'Good Accuracy'}
              </Text>
              <Text style={styles.accuracyText}>
                ±{Math.round(accuracy)} meters
                {accuracy > 50 && '\n\nMove to open sky for better accuracy'}
              </Text>
            </View>
          </View>
        )}

        {editingAddress ? (
          <View style={styles.addressEditContainer}>
            <TextField
              label="Address"
              placeholder="Enter or edit the address"
              value={addressText}
              onChangeText={handleAddressEdit}
              multiline
              numberOfLines={2}
            />
            <View style={styles.addressButtonContainer}>
              <Button label="Save" onPress={handleAddressSave} size="small" />
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setEditingAddress(false)}
                size="small"
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addressBox}
            onPress={() => setEditingAddress(true)}
          >
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.primary} />
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Address</Text>
              <Text style={styles.addressValue}>
                {addressText || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
              </Text>
            </View>
            <MaterialCommunityIcons name="pencil" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <Button
          label="Refresh Location"
          variant="secondary"
          onPress={getCurrentLocation}
          style={styles.refreshButton}
          loading={isLoadingLocation}
        />

        <View style={styles.buttonContainer}>
          <Button
            label="Back"
            variant="secondary"
            onPress={onBack}
            style={styles.button}
          />
          <Button
            label="Continue"
            onPress={handleContinue}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  mapContainer: {
    height: 300,
    borderRadius: spacing.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: colors.border,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    ...typography.heading2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
  },
  loadingSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  accuracyBox: {
    flexDirection: 'row',
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  accuracyGood: {
    backgroundColor: colors.successLight,
  },
  accuracyWarning: {
    backgroundColor: colors.warningLight,
  },
  accuracyContent: {
    flex: 1,
  },
  accuracyTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  accuracyText: {
    ...typography.caption,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  addressValue: {
    ...typography.body,
    color: colors.text,
  },
  addressEditContainer: {
    marginBottom: spacing.lg,
  },
  addressButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  refreshButton: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});