import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/theme';
import { useAssignedIssues } from '../../src/features/officer/hooks';
import { LeafletMapView } from '../../src/features/map/LeafletMapView';
import { ScreenContainer } from '../../src/components/ScreenContainer';

export default function AssignedMapScreen() {
  const { colors } = useTheme();
  const { data, isLoading } = useAssignedIssues();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const issues = data?.issues ?? [];
  const markers = issues.map((issue: any) => ({
    id: issue._id,
    lat: issue.location?.coordinates?.[1],
    lng: issue.location?.coordinates?.[0],
    title: issue.trackingId,
    description: issue.category,
    color: getMarkerColor(issue.status),
  }));

  const handleMarkerPress = (id: string) => {
    setSelectedId(id);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LeafletMapView
        markers={markers}
        onMarkerPress={handleMarkerPress}
        selectedMarkerId={selectedId}
      />
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
  },
});
