import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useAssignedIssues } from '../../src/features/officer/hooks';
import { LeafletMapView } from '../../src/features/map/LeafletMapView';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Issue } from '../../src/features/complaints/types';

export default function AssignedMapScreen() {
  const { colors, radii } = useTheme();
  const router = useRouter();
  const { data, isLoading } = useAssignedIssues();

  const issues: Issue[] = Array.isArray(data?.issues) ? data.issues : [];
  const markers = issues.filter((issue) => {
    const [longitude, latitude] = issue.location?.coordinates ?? [];
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  });

  const handleMarkerPress = (id: string) => {
    router.push(`/(officer)/issues/${id}`);
  };

  if (isLoading) {
    return (
      <ScreenContainer headerTitle="Task Map" headerSubtitle="Locating Assigned Issues...">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      headerTitle="Task Map"
      headerSubtitle={`${markers.length} assigned task${markers.length === 1 ? '' : 's'} on field map`}
    >
      <View
        style={[
          styles.mapWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
          },
        ]}
      >
        <LeafletMapView
          markers={markers}
          onMarkerPress={handleMarkerPress}
          showCluster={true}
          showLegend={true}
          showRecenterButton={true}
          height={540}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 4,
  },
});
