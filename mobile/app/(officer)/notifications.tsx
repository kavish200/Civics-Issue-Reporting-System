import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '../../src/features/notifications/hooks';
import { NotificationItem } from '../../src/features/notifications/types';
import { useTheme } from '../../src/theme';

export default function OfficerNotificationsScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.read) {
      await markReadMutation.mutateAsync(item._id);
    }
    if (item.issue?._id) {
      router.push(`/(officer)/issues/${item.issue._id}`);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const dateFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Card
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.itemCard,
          {
            marginBottom: spacing.sm,
            backgroundColor: item.read ? colors.surface : colors.primaryLight,
            borderColor: item.read ? colors.border : colors.primary,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: item.read ? colors.background : colors.surface,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Ionicons
              name={item.type === 'assignment' ? 'briefcase' : 'notifications'}
              size={20}
              color={item.read ? colors.textSecondary : colors.primary}
            />
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  typography.labelMedium,
                  { color: colors.text, flex: 1 },
                  !item.read && { fontWeight: '700' },
                ]}
              >
                {item.type === 'assignment'
                  ? 'New Task Assignment'
                  : 'Municipal Update'}
              </Text>
              {!item.read && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary, borderRadius: radii.full },
                  ]}
                />
              )}
            </View>

            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textSecondary, marginVertical: 2 },
              ]}
            >
              {item.message}
            </Text>

            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
              {dateFormatted}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer
      headerTitle="Field Officer Alerts"
      headerSubtitle={unreadCount > 0 ? `${unreadCount} unread assignments` : 'Up to date'}
      headerRight={
        unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[typography.labelSmall, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : null
      }
      loading={isLoading && !isRefetching}
      onRetry={refetch}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { padding: spacing.xl }]}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
            <Text
              style={[
                typography.titleSmall,
                { color: colors.text, marginTop: spacing.md, textAlign: 'center' },
              ]}
            >
              No Alerts
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
              ]}
            >
              You will receive alerts here when the municipal administrator assigns new complaints
              to you.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
});
