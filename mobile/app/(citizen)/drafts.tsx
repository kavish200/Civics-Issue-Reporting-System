import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { SkeletonList } from '../../src/components/SkeletonLoader';
import { useDrafts, useDeleteDraft } from '../../src/features/complaints/offlineHooks';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Button } from '../../src/components/Button';

export default function DraftsScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();
  const { drafts = [], isLoading, retryDraft } = useDrafts();
  const deleteMutation = useDeleteDraft();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleEdit = useCallback(
    (draftId: string) => {
      router.push({
        pathname: '/(citizen)/report',
        params: { draftId },
      });
    },
    [router]
  );

  const handleSendDraft = useCallback(
    async (item: any) => {
      setSubmittingId(item.id);
      try {
        const ok = await retryDraft(item);
        if (ok) {
          Alert.alert('Draft Submitted', 'Your complaint has been successfully registered!');
        } else {
          Alert.alert('Submission Failed', 'Could not reach server. Please check your internet connection.');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to submit draft.');
      } finally {
        setSubmittingId(null);
      }
    },
    [retryDraft]
  );

  const handleDelete = useCallback(
    (draftId: string) => {
      Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(draftId);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]);
    },
    [deleteMutation]
  );

  const renderDraft = useCallback(
    ({ item }: any) => {
      const isSubmitting = submittingId === item.id;
      return (
        <View
          style={[
            styles.draftCard,
            {
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight, borderRadius: radii.sm }]}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  {item.category?.toUpperCase() || 'CIVIC ISSUE'}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Text style={[typography.bodyMedium, { color: colors.text, marginVertical: spacing.xs, fontWeight: '600' }]}>
              {item.description}
            </Text>

            {item.address && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            )}

            {item.lastAttemptError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderRadius: radii.sm }]}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger, marginLeft: 6, flex: 1 }]}>
                  {item.lastAttemptError}
                </Text>
              </View>
            )}

            {/* Action buttons on card */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                onPress={() => handleSendDraft(item)}
                disabled={isSubmitting}
                style={[styles.submitActionBtn, { backgroundColor: colors.primary, borderRadius: radii.md }]}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[typography.labelSmall, { color: '#FFFFFF', fontWeight: '700' }]}>
                      Submit Now
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleEdit(item.id)}
                  style={[styles.iconButton, { backgroundColor: colors.primaryLight, borderRadius: radii.md }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={[styles.iconButton, { backgroundColor: colors.dangerLight, borderRadius: radii.md }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [colors, handleDelete, handleEdit, handleSendDraft, radii, spacing, submittingId, typography]
  );

  return (
    <ScreenContainer
      headerTitle="Offline Drafts"
      headerSubtitle="Complaints stored on device"
      showBack
      onBackPress={() => router.back()}
    >
      {isLoading ? (
        <View style={styles.centerContainer}>
          <SkeletonList count={3} itemHeight={110} spacing={12} showAvatar={false} />
        </View>
      ) : drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight, borderRadius: 40 }]}>
            <Ionicons name="cloud-done-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[typography.titleMedium, { color: colors.text, marginTop: spacing.md }]}>
            No Pending Drafts
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 },
            ]}
          >
            All your civic complaints are synced with the server.
          </Text>

          <Button
            title="Create New Complaint"
            icon="add"
            variant="primary"
            size="md"
            onPress={() => router.push('/(citizen)/report')}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 24,
  },
  draftCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginVertical: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  submitActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
