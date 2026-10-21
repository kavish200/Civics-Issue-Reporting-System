import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useAssignedIssues } from '../../src/features/officer/hooks';
import { LeafletMapView } from '../../src/features/map/LeafletMapView';
import { ScreenContainer } from '../../src/components/ScreenContainer';

export default function AssignedMapScreen() {
  const { colors, spacing, typography, radii, isDark } = useTheme();
  const router = useRouter();
  const { data, isLoading } = useAssignedIssues();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const issues = data?.issues ?? [];
  const markers = issues.map((issue: any) => ({
    id: issue._id,
    lat: issue.location?.coordinates?.[1],
    lng: issue.location?.coordinates?.[0],
    title: issue.trackingId,
    description: `${issue.category?.replace('_', ' ')} (${issue.status})`,
    color: getMarkerColor(issue.status),
  }));

  const handleMarkerPress = (id: string) => {
    setSelectedId(id);
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
          selectedMarkerId={selectedId}
          showCluster={true}
          showLegend={true}
          showRecenterButton={true}
          height={540}
        />
      </View>
    </ScreenContainer>
  );
}

function getMarkerColor(status: string): string {
  switch (status) {
    case 'Assigned':
      return '#3B82F6';
    case 'In Progress':
      return '#F59E0B';
    case 'Resolved':
      return '#10B981';
    default:
      return '#6B7280';
  }
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

