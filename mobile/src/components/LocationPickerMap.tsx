import React, { useRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';

// Leaflet HTML as a string
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    #map { height: 100vh; width: 100%; }
    .leaflet-container {
      background: #fff;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    const map = L.map('map').setView([22.7196, 75.8577], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = L.marker([22.7196, 75.8577], { draggable: true }).addTo(map);
    let accuracyCircle = null;

    marker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'marker-moved',
          latitude: pos.lat,
          longitude: pos.lng
        }));
      }
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'marker-moved',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      }
    });

    function handleRNMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'set-position') {
          marker.setLatLng([data.latitude, data.longitude]);
          map.setView([data.latitude, data.longitude], 16);
        } else if (data.type === 'set-accuracy') {
          if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
          }
          if (data.accuracy) {
            accuracyCircle = L.circle([data.latitude, data.longitude], {
              radius: data.accuracy,
              color: '#0066ff',
              fillColor: '#0066ff',
              fillOpacity: 0.15
            }).addTo(map);
          }
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleRNMessage);
    document.addEventListener('message', handleRNMessage);

    window.onload = function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    };
  </script>
</body>
</html>
`;

export interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  onMapReady?: () => void;
}

export function LocationPickerMap({
  latitude,
  longitude,
  accuracy,
  onLocationChange,
  onMapReady,
}: LocationPickerMapProps) {
  const webViewRef = useRef<WebView | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to pinpoint where you are reporting the issue.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionGranted(true);
          return true;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setPermissionGranted(true);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker-moved') {
        onLocationChange(data.latitude, data.longitude);
      } else if (data.type === 'ready') {
        setIsReady(true);
        onMapReady?.();

        if (latitude !== null && longitude !== null) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'set-position',
              latitude,
              longitude,
            })
          );
        }

        if (accuracy && latitude !== null && longitude !== null) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'set-accuracy',
              latitude,
              longitude,
              accuracy,
            })
          );
        }
      }
    } catch (e) {
      console.error('Error processing message from WebView:', e);
    }
  };

  useEffect(() => {
    if (isReady && webViewRef.current && latitude !== null && longitude !== null) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'set-position',
          latitude: latitude || 0,
          longitude: longitude || 0,
        })
      );
    }
  }, [isReady, latitude, longitude]);

  useEffect(() => {
    if (isReady && webViewRef.current && accuracy && latitude !== null && longitude !== null) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'set-accuracy',
          latitude,
          longitude,
          accuracy,
        })
      );
    }
  }, [isReady, accuracy, latitude, longitude]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        style={styles.map}
      />
      {!isReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066ff" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
}

export default LocationPickerMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});