import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '../../src/features/notifications/hooks';
import { ScreenContainer, Button, SkeletonList } from '../../src/components';

export default function NotificationsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const { data: notifData, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications = useMemo(() => notifData?.notifications ?? [], [notifData?.notifications]);
  const unreadCount = useMemo(() => notifData?.unreadCount ?? 0, [notifData?.unreadCount]);

  const handleNotificationPress = useCallback(
    async (notificationId: string, issueId: string) => {
      try {
        await markReadMutation.mutateAsync(notificationId);
        router.push(`/(citizen)/issues/${issueId}`);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [markReadMutation, router]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllReadMutation.mutateAsync();
      refetch();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [markAllReadMutation, refetch]);

  const renderNotification = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.read ? colors.surface : colors.primaryLight,
            borderLeftColor: item.read ? colors.border : colors.primary,
          },
        ]}
        onPress={() => handleNotificationPress(item._id, item.issue?._id)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={item.read ? colors.textSecondary : colors.primary}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              typography.labelSmall,
              {
                color: item.read ? colors.textSecondary : colors.text,
                fontWeight: item.read ? '400' : '600',
              },
            ]}
          >
            {item.title || item.type}
          </Text>
          <Text
            style={[
              styles.message,
              typography.bodySmall,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {item.message}
          </Text>
          {item.issue && (
            <Text
              style={[
                styles.issueId,
                typography.labelSmall,
                { color: colors.primary, marginTop: spacing.xs },
              ]}
            >
              {item.issue.trackingId}
            </Text>
          )}
          <Text
            style={[
              styles.timestamp,
              typography.labelSmall,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {formatRelativeDate(item.createdAt)}
          </Text>
        </View>

        {!item.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    ),
    [colors, spacing, typography, handleNotificationPress]
  );

  return (
    <ScreenContainer>
      {unreadCount > 0 && (
        <View style={[styles.headerRow, { paddingHorizontal: spacing.md, marginBottom: spacing.md }]}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <Button
            title="Mark all read"
            onPress={handleMarkAllRead}
            variant="outlined"
            size="sm"
            loading={markAllReadMutation.isPending}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <SkeletonList count={5} itemHeight={80} spacing={12} showAvatar={true} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
          <Text
            style={[
              styles.emptyText,
              typography.bodyMedium,
              { color: colors.textSecondary, marginTop: spacing.md },
            ]}
          >
            No notifications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: spacing.md }]}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </ScreenContainer>
  );
}

function formatRelativeDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    lineHeight: 18,
  },
  message: {
    lineHeight: 18,
  },
  issueId: {
    lineHeight: 16,
  },
  timestamp: {
    lineHeight: 16,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
