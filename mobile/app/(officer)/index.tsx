import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
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
import { API_URL } from '../../src/api/client';

const CATEGORY_ICONS: Record<string, string> = {
  road_damage: 'alert-circle',
  garbage: 'trash',
  streetlight: 'bulb',
  water: 'water',
  drainage: 'rainy',
};

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  road_damage: { bg: '#FEF3C7', icon: '#D97706' },
  garbage: { bg: '#E0F2FE', icon: '#0284C7' },
  streetlight: { bg: '#FEF9C3', icon: '#CA8A04' },
  water: { bg: '#DBEAFE', icon: '#2563EB' },
  drainage: { bg: '#EDE9FE', icon: '#7C3AED' },
};

const CATEGORY_LABELS: Record<string, string> = {
  road_damage: 'Road & Potholes',
  garbage: 'Garbage & Waste',
  streetlight: 'Street Lighting',
  water: 'Water Supply',
  drainage: 'Sewage & Drainage',
};

function getImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

function formatRelativeDate(date?: string): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function AssignedComplaintsScreen() {
  const { colors, spacing, typography, radii, isDark } = useTheme();
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

  const statuses = [
    { label: 'All Tasks', value: undefined },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
  ];

  const renderComplaint = useCallback(
    ({ item }: any) => {
      const imgUrl = getImageUrl(item.image);
      const catColor = CATEGORY_COLORS[item.category] || { bg: '#E0F2FE', icon: colors.primary };
      const address = item.address || item.location?.address;

      return (
        <TouchableOpacity
          accessibilityLabel={`View assigned issue ${item.trackingId}`}
          accessibilityRole="button"
          activeOpacity={0.8}
          style={[
            styles.complaintCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => handleComplaintPress(item._id)}
        >
          {imgUrl ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: imgUrl }}
                style={[
                  styles.thumbnail,
                  {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              style={[
                styles.categoryIconCircle,
                {
                  backgroundColor: isDark ? `${catColor.icon}22` : catColor.bg,
                },
              ]}
            >
              <Ionicons
                name={(CATEGORY_ICONS[item.category] as any) || 'alert-circle'}
                size={26}
                color={catColor.icon}
              />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.trackingPill,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primaryLight,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Text style={[typography.labelSmall, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
                  {item.trackingId}
                </Text>
              </View>

              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <Text style={[styles.date, typography.caption, { color: colors.textSecondary }]}>
                  {formatRelativeDate(item.createdAt)}
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.titleSmall,
                { color: colors.text, marginTop: 4, marginBottom: 2, fontWeight: '700', fontSize: 15 },
              ]}
              numberOfLines={1}
            >
              {CATEGORY_LABELS[item.category] || item.category}
            </Text>

            <Text
              style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: 6, lineHeight: 17 }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            {address && (
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={12} color={colors.primary} />
                <Text
                  style={[typography.caption, { color: colors.textSecondary, marginLeft: 4, flex: 1 }]}
                  numberOfLines={1}
                >
                  {address}
                </Text>
              </View>
            )}

            <View style={styles.badgesRow}>
              <StatusBadge status={item.status} size="sm" />
              <PriorityBadge priority={item.priority} priorityScore={item.priorityScore} size="sm" />
            </View>
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleComplaintPress, isDark, radii, typography]
  );

  return (
    <ScreenContainer
      headerTitle="Assigned Tasks"
      headerSubtitle="Field Officer Dispatch & Resolution"
    >
      <View style={{ marginBottom: spacing.md, marginTop: 2 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {statuses.map((s) => {
            const isSelected = selectedStatus === s.value;
            return (
              <TouchableOpacity
                key={s.label}
                activeOpacity={0.75}
                onPress={() => setSelectedStatus(s.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : colors.border,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.labelSmall,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 12,
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <SkeletonList count={4} spacing={12} showAvatar={true} />
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.14)' : colors.primaryLight }]}>
            <Ionicons name="checkmark-done-circle" size={44} color={colors.primary} />
          </View>
          <Text style={[typography.titleMedium, { color: colors.text, marginTop: spacing.md, fontWeight: '700' }]}>
            No Assigned Tasks
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280, lineHeight: 18 },
            ]}
          >
            {selectedStatus
              ? `No complaints currently marked as "${selectedStatus}".`
              : 'All dispatched complaints are completed, or no tasks have been assigned yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderComplaint}
          keyExtractor={(item, index) => item?._id || item?.id || String(index)}
          contentContainerStyle={styles.listContainer}
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
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
  },
  listContainer: {
    paddingBottom: 28,
  },
  complaintCard: {
    padding: 13,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chevronContainer: {
    marginLeft: 6,
    paddingRight: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

