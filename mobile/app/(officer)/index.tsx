import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAssignedIssues } from '../../src/features/officer/hooks';
import {
  StatusBadge,
  PriorityBadge,
  ScreenContainer,
  SkeletonList,
} from '../../src/components';

const CATEGORY_ICONS: Record<string, string> = {
  road_damage: 'alert-circle-outline',
  garbage: 'trash-outline',
  streetlight: 'bulb-outline',
  water: 'water-outline',
  drainage: 'rainy-outline',
};

export default function AssignedComplaintsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const { data, isLoading, isRefetching, refetch } = useAssignedIssues(selectedStatus);
  const issues = data?.issues ?? [];

  const handleComplaintPress = useCallback(
    (issueId: string) => {
      router.push(`/(officer)/issues/${issueId}`);
    },
    [router]
  );

  const renderComplaint = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        accessibilityLabel={`View assigned issue ${item.trackingId}`}
        accessibilityRole="button"
        style={[styles.complaintCard, { backgroundColor: colors.surface }]}
        onPress={() => handleComplaintPress(item._id)}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Ionicons
              name={(CATEGORY_ICONS[item.category] as any) || 'help-circle-outline'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.category, typography.labelSmall, { color: colors.textSecondary }]}>
              {item.category}
            </Text>
            <Text style={[styles.id, typography.labelSmall, { color: colors.primary }]}>
              {item.trackingId}
            </Text>
          </View>

          <Text style={[styles.description, typography.bodyMedium, { color: colors.text }]}>
            {item.description}
          </Text>

          <View style={styles.badgesRow}>
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} priorityScore={item.priorityScore} />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors, handleComplaintPress, typography]
  );

  const renderFilter = useCallback(() => {
    const statuses = ['Assigned', 'In Progress', 'Resolved'];
    return (
      <View style={[styles.filterContainer, { paddingHorizontal: spacing.md }]}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedStatus === status ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedStatus(selectedStatus === status ? undefined : status)}
          >
            <Text
              style={[
                typography.labelSmall,
                {
                  color: selectedStatus === status ? colors.textInverse : colors.text,
                },
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [colors, selectedStatus, spacing, typography]);

  return (
    <ScreenContainer>
      {renderFilter()}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <SkeletonList count={5} spacing={12} showAvatar={true} />
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          <Text style={[styles.emptyText, typography.bodyMedium, { color: colors.textSecondary }]}>
            All complaints resolved!
          </Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderComplaint}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: spacing.md }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              title="Pull to refresh"
            />
          }
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  listContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  complaintCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    marginLeft: 6,
    marginRight: 8,
    flex: 1,
  },
  id: {
    textAlign: 'right',
  },
  description: {
    marginBottom: 8,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
  },
});
