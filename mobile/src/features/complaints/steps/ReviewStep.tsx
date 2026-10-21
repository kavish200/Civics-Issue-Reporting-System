import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryMeta } from '../../../constants';
import { useReportStore } from '../reportStore';
import { spacing, colors, typography } from '../../../theme';
import { Button, ScreenContainer } from '../../../components';
import { apiClient } from '../../../api/client';

interface ReviewStepProps {
  onBack: () => void;
  onSubmitSuccess: (data: {
    trackingId: string;
    duplicateCandidate: boolean;
    issueId: string;
  }) => void;
}

export default function ReviewStep({ onBack, onSubmitSuccess }: ReviewStepProps) {
  const {
    category,
    photoUri,
    latitude,
    longitude,
    address,
    accuracy,
    description,
    clientId,
    setClientId,
    isSubmiting,
    setIsSubmiting,
    reset
  } = useReportStore();

  const [uploadProgress, setUploadProgress] = useState(0);

  const categoryMeta = getCategoryMeta(category || '');

  const handleSubmit = async () => {
    if (!category || !photoUri || !latitude || !longitude || !description) {
      Alert.alert('Error', 'Please complete all required fields before submitting.');
      return;
    }

    try {
      setIsSubmiting(true);

      // Generate clientId if not already set
      if (!clientId) {
        setClientId();
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('address', address || '');
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('clientId', clientId);

      // Append image file
      const imageExt = photoUri.split('.').pop() || 'jpg';
      formData.append('image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `issue-${Date.now()}.jpg`,
      } as any);

      // Submit to backend
      const response = await apiClient.post('/issues/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded / (progressEvent.total || 1)) * 100
          );
          setUploadProgress(progress);
        },
      });

      const { issue, duplicateCandidate } = response.data;

      // Reset form state
      reset();

      // Show success screen
      onSubmitSuccess({
        trackingId: issue.trackingId,
        duplicateCandidate,
        issueId: issue._id,
      });
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit report. Please try again.';
      Alert.alert('Submission Error', errorMessage, [
        {
          text: 'Retry',
          onPress: () => setIsSubmiting(false),
        },
        {
          text: 'Cancel',
          onPress: () => {
            setIsSubmiting(false);
            onBack();
          },
        },
      ]);
    }
  };

  if (isSubmiting) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {uploadProgress}% Uploading your report...
            </Text>
          </View>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Your Report</Text>
          <Text style={styles.subtitle}>
            Please review all information before submitting
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.sectionContent}>
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons
                name={(categoryMeta.icon as any) || 'alert-circle'}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.categoryName}>{categoryMeta.label}</Text>
            </View>
          </View>
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : null}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={colors.primary}
              />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Address</Text>
                <Text style={styles.locationValue}>
                  {address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
                </Text>
              </View>
            </View>
            {accuracy !== null && (
              <View style={styles.accuracyInfo}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={16}
                  color={accuracy > 50 ? colors.warning : colors.success}
                />
                <Text
                  style={[
                    styles.accuracyValue,
                    {
                      color: accuracy > 50 ? colors.warning : colors.success,
                    },
                  ]}
                >
                  Accuracy: ±{Math.round(accuracy)}m
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Back"
            variant="secondary"
            onPress={onBack}
            style={styles.button}
          />
          <Button
            label="Submit Report"
            onPress={handleSubmit}
            style={styles.button}
            icon="check"
          />
        </View>

        <Text style={styles.disclaimer}>
          By submitting, you confirm that the information is accurate and
          complete to the best of your knowledge.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

interface SuccessScreenProps {
  trackingId: string;
  duplicateCandidate: boolean;
  issueId: string;
  onNewReport: () => void;
  onViewIssue: (issueId: string) => void;
}

export function SuccessScreen({
  trackingId,
  duplicateCandidate,
  issueId,
  onNewReport,
  onViewIssue,
}: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTrackingId = async () => {
    await Share.share({
      message: `Issue Tracking ID: ${trackingId}`,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.successContent}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color={colors.success}
            />
          </View>

          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for helping improve our community
          </Text>

          <View style={styles.trackingBox}>
            <Text style={styles.trackingLabel}>Your Tracking ID</Text>
            <View style={styles.trackingIdContainer}>
              <Text style={styles.trackingId}>{trackingId}</Text>
              <Button
                label="Copy"
                size="small"
                variant="secondary"
                onPress={handleCopyTrackingId}
                icon={copied ? 'check' : 'content-copy'}
                style={styles.copyButton}
              />
            </View>
            <Text style={styles.trackingInfo}>
              Use this ID to track the status of your report
            </Text>
          </View>

          {duplicateCandidate && (
            <View style={styles.duplicateWarning}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.info}
              />
              <View style={styles.duplicateContent}>
                <Text style={styles.duplicateTitle}>
                  Similar Reports Detected
                </Text>
                <Text style={styles.duplicateText}>
                  Similar reports exist nearby. Your report has been sent for
                  review to avoid duplicates and optimize resource allocation.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.successActions}>
            <Button
              label="View Report"
              onPress={() => onViewIssue(issueId)}
              style={styles.actionButton}
              icon="eye"
            />
            <Button
              label="Submit Another Report"
              variant="secondary"
              onPress={onNewReport}
              style={styles.actionButton}
              icon="plus"
            />
          </View>

          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          <View style={styles.nextSteps}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Under Review</Text>
                <Text style={styles.stepDescription}>
                  Your report will be reviewed by our team
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Assignment</Text>
                <Text style={styles.stepDescription}>
                  It will be assigned to the appropriate department
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Resolution</Text>
                <Text style={styles.stepDescription}>
                  The issue will be addressed and you'll be notified
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: spacing.md,
    backgroundColor: colors.backgroundAlt,
  },
  locationInfo: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  locationValue: {
    ...typography.body,
    color: colors.text,
  },
  accuracyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accuracyValue: {
    ...typography.caption,
  },
  descriptionBox: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 1.6,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    color: colors.text,
  },
  // Success screen styles
  successContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.heading2,
    color: colors.success,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  trackingBox: {
    width: '100%',
    backgroundColor: colors.successLight,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  trackingLabel: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  trackingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  trackingId: {
    ...typography.heading3,
    color: colors.success,
    flex: 1,
    fontFamily: 'monospace',
  },
  copyButton: {
    paddingHorizontal: spacing.md,
  },
  trackingInfo: {
    ...typography.caption,
    color: colors.success,
  },
  duplicateWarning: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  duplicateContent: {
    flex: 1,
  },
  duplicateTitle: {
    ...typography.bodyBold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  duplicateText: {
    ...typography.caption,
    color: colors.info,
  },
  successActions: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
  nextStepsTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  nextSteps: {
    width: '100%',
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});