import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { LeafletMapView } from '../../src/features/map/LeafletMapView';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { useNetworkState } from '../../src/features/complaints/offlineHooks';
import { apiClient } from '../../src/api';

const DEFAULT_LATITUDE = 22.7196;
const DEFAULT_LONGITUDE = 75.8577;
const DEFAULT_RADIUS = 2000;

interface NearbyIssue {
  _id: string;
  trackingId: string;
  description: string;
  category: string;
  status: string;
  location: {
    coordinates: [number, number];
  };
  distance?: number;
}

export default function CitizenMapScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: networkState } = useNetworkState();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const userLoc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(userLoc);
          setMapCenter(userLoc);
        }
      } catch (err) {
        console.error('Error requesting location permission:', err);
      }
    })();
  }, []);

  // Fetch nearby issues
  const { data: nearbyIssues = [], isLoading, refetch } = useQuery({
    queryKey: ['nearbyIssues', mapCenter.latitude, mapCenter.longitude],
    queryFn: async () => {
      if (!networkState?.isConnected) {
        return [];
      }
      try {
        const response = await apiClient.get('/issues/nearby', {
          params: {
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            radius: DEFAULT_RADIUS,
          },
        });
        return response.data.issues || [];
      } catch (err) {
        console.error('Error fetching nearby issues:', err);
        return [];
      }
    },
    enabled: !!networkState?.isConnected,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (locationPermission === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(userLoc);
        setMapCenter(userLoc);
      }
      await refetch();
    } catch (err) {
      console.error('Error refreshing location:', err);
    } finally {
      setRefreshing(false);
    }
  }, [locationPermission, refetch]);

  const handleMarkerPress = useCallback(
    (id: string) => {
      router.push(`/(citizen)/issues/${id}`);
    },
    [router]
  );

  const isLocationDenied = locationPermission !== 'granted' && locationPermission !== null;

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={false}
      >
        {isLocationDenied && (
          <View style={[styles.banner, { backgroundColor: colors.warningLight, marginBottom: spacing.md }]}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text
              style={[
                styles.bannerText,
                typography.labelSmall,
                { color: colors.warning, marginLeft: spacing.sm },
              ]}
            >
              Location permission denied. Showing default map view.
            </Text>
          </View>
        )}

        <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  typography.bodyMedium,
                  { color: colors.textSecondary, marginTop: spacing.md },
                ]}
              >
                Loading nearby issues...
              </Text>
            </View>
          ) : (
            <LeafletMapView
              initialLatitude={mapCenter.latitude}
              initialLongitude={mapCenter.longitude}
              zoom={13}
              markers={nearbyIssues}
              onMarkerPress={handleMarkerPress}
              showCluster={true}
              showLegend={true}
              showRecenterButton={locationPermission === 'granted'}
              userLatitude={userLocation?.latitude}
              userLongitude={userLocation?.longitude}
              height={500}
            />
          )}
        </View>

        <View style={[styles.infoContainer, { marginTop: spacing.lg, paddingHorizontal: spacing.md }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
              Nearby Issues
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: colors.primary,
                  fontWeight: '600',
                },
              ]}
            >
              {nearbyIssues.length}
            </Text>
          </View>

          {nearbyIssues.length === 0 && !isLoading && (
            <View style={[styles.emptyState, { marginTop: spacing.lg }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: colors.textSecondary,
                    marginTop: spacing.md,
                    textAlign: 'center',
                  },
                ]}
              >
                No issues within {DEFAULT_RADIUS}m of your location
              </Text>
            </View>
          )}

          <View style={[styles.legendContainer, { marginTop: spacing.lg }]}>
            <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              Issue Categories
            </Text>
            <View style={styles.legendGrid}>
              {[
                { category: 'road_damage', label: 'Road Damage', color: '#dc2626' },
                { category: 'garbage', label: 'Garbage', color: '#84cc16' },
                { category: 'streetlight', label: 'Streetlight', color: '#eab308' },
                { category: 'water', label: 'Water', color: '#0ea5e9' },
                { category: 'drainage', label: 'Drainage', color: '#8b5cf6' },
              ].map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColorDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={[typography.labelSmall, { color: colors.text, flex: 1 }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerText: {
    flex: 1,
    marginLeft: 8,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    height: 500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  infoContainer: {
    paddingBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  legendContainer: {
    paddingTop: 16,
  },
  legendGrid: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
