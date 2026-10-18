import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useIssueDetail, useConfirmIssue } from '../../../src/features/complaints/hooks';
import { StatusBadge, PriorityBadge, ScreenContainer, Button } from '../../../src/components';

export default function ComplaintDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: issueData, isLoading, error } = useIssueDetail(id!);
  const confirmMutation = useConfirmIssue();

  const issue: any = (issueData as any)?.issue || issueData;

  const handleConfirm = async (confirmed: boolean) => {
    try {
      await confirmMutation.mutateAsync({
        id: id!,
        confirmed,
        rating: confirmed ? rating : undefined,
        feedback: confirmed ? feedback : undefined,
      });
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Confirmation failed:', err);
    }
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

  if (error || !issue) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorText, typography.bodyMedium, { color: colors.danger }]}>
            Failed to load complaint
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const latestRejectionRemark =
    issue.status === 'Rejected'
      ? issue.statusHistory?.find((h: any) => h.status === 'Rejected')?.remark
      : null;

  return (
    <ScreenContainer scrollable showBack onBackPress={() => router.back()}>
      <View style={[styles.headerSection, { backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.trackingId, typography.labelSmall, { color: colors.textSecondary }]}>
            {issue.trackingId}
          </Text>
          <StatusBadge status={issue.status} />
        </View>
        <Text style={[styles.description, typography.bodyMedium, { color: colors.text, marginTop: spacing.sm }]}>
          {issue.description}
        </Text>
        <View style={[styles.badgesRow, { marginTop: spacing.sm }]}>
          <PriorityBadge priority={issue.priority} priorityScore={issue.priorityScore} />
        </View>
      </View>

      <View style={[styles.infoSection, { backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
        <InfoRow
          label="Address"
          value={issue.location?.address || 'Not provided'}
          colors={colors}
          typography={typography}
        />
        {issue.assignedTo && (
          <InfoRow
            label="Assigned to"
            value={issue.assignedTo.name}
            colors={colors}
            typography={typography}
          />
        )}
      </View>

      {issue.statusHistory && issue.statusHistory.length > 0 && (
        <View style={[styles.timelineSection, { marginBottom: spacing.lg }]}>
          <Text style={[styles.sectionTitle, typography.labelMedium, { color: colors.text }]}>
            Status History
          </Text>
          {issue.statusHistory.map((entry: any, index: number) => (
            <View key={index} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.primary, borderColor: colors.surface },
                ]}
              />
              {index < issue.statusHistory.length - 1 && (
                <View
                  style={[styles.timelineLine, { backgroundColor: colors.border }]}
                />
              )}
              <View style={[styles.timelineContent, { marginLeft: spacing.md }]}>
                <Text style={[typography.labelSmall, { color: colors.text }]}>
                  {entry.status}
                </Text>
                {entry.remark && (
                  <Text style={[styles.remark, typography.bodySmall, { color: colors.textSecondary }]}>
                    {entry.remark}
                  </Text>
                )}
                <Text style={[styles.timestamp, typography.labelSmall, { color: colors.textSecondary }]}>
                  {formatDate(entry.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {issue.status === 'Rejected' && latestRejectionRemark && (
        <View style={[styles.rejectionSection, { backgroundColor: colors.dangerLight, marginBottom: spacing.lg }]}>
          <Ionicons name="close-circle" size={20} color={colors.danger} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[typography.labelSmall, { color: colors.danger }]}>
              Rejection Reason
            </Text>
            <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.xs }]}>
              {latestRejectionRemark}
            </Text>
          </View>
        </View>
      )}

      {issue.status === 'Resolved' && issue.citizenConfirmed === null && (
        <View style={[styles.actionSection, { marginBottom: spacing.lg }]}>
          <Button
            title="Confirm Fixed"
            onPress={() => setShowConfirmModal(true)}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginBottom: spacing.sm }}
          />
          <Button
            title="Not Fixed, Reopen"
            onPress={() => handleConfirm(false)}
            variant="outlined"
            size="lg"
            fullWidth
            loading={confirmMutation.isPending}
          />
        </View>
      )}

      {issue.citizenConfirmed && (
        <View
          style={[
            styles.confirmationSection,
            { backgroundColor: colors.successLight, marginBottom: spacing.lg },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={[typography.labelSmall, { color: colors.success }]}>
              You confirmed this issue as fixed
            </Text>
            {issue.rating && (
              <Text style={[typography.bodySmall, { color: colors.success, marginTop: spacing.xs }]}>
                Rating: {issue.rating}/5
              </Text>
            )}
            {issue.feedback && (
              <Text style={[typography.bodySmall, { color: colors.success, marginTop: spacing.xs }]}>
                {issue.feedback}
              </Text>
            )}
          </View>
        </View>
      )}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, typography.titleMedium, { color: colors.text }]}>
              Confirm Resolution
            </Text>

            <View style={[styles.ratingContainer, { marginTop: spacing.md }]}>
              <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                How satisfied are you?
              </Text>
              <View style={[styles.stars, { marginTop: spacing.sm }]}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color={colors.primary}
                      style={{ marginRight: 8 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[
                styles.feedbackInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Optional feedback..."
              placeholderTextColor={colors.textSecondary}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
            />

            <View style={[styles.modalActions, { marginTop: spacing.lg }]}>
              <Button
                title="Cancel"
                onPress={() => setShowConfirmModal(false)}
                variant="outlined"
                size="md"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Confirm"
                onPress={() => handleConfirm(true)}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                loading={confirmMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  colors: any;
  typography: any;
}

function InfoRow({ label, value, colors, typography }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.text, marginTop: 4 }]}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
  },
  headerSection: {
    borderRadius: 12,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingId: {
    flex: 1,
  },
  description: {
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  timelineSection: {
    marginHorizontal: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 12,
    width: 2,
    height: 30,
  },
  timelineContent: {
    flex: 1,
  },
  remark: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    marginTop: 4,
  },
  rejectionSection: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionSection: {
    marginHorizontal: 0,
  },
  confirmationSection: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
  },
  modalTitle: {
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  feedbackInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
  },
});
