import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useIssueDetail } from '../../../src/features/complaints/hooks';
import { useUpdateProgress } from '../../../src/features/officer/hooks';
import { StatusBadge, PriorityBadge, ScreenContainer, Button } from '../../../src/components';

export default function OfficerComplaintDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [remark, setRemark] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: issueData, isLoading, error } = useIssueDetail(id!);
  const updateMutation = useUpdateProgress();

  const issue: any = (issueData as any)?.issue || issueData;

  const getNextStatus = (): 'In Progress' | 'Resolved' | null => {
    if (issue?.status === 'Assigned') return 'In Progress';
    if (issue?.status === 'In Progress') return 'Resolved';
    return null;
  };

  const nextStatus = getNextStatus();
  const canUpdate = nextStatus !== null;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const compressedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800, height: 600 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setSelectedImage({
        uri: compressedImage.uri,
        type: 'image/jpeg',
        name: 'progress-image.jpg',
      });
    }
  };

  const handleCameraImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const compressedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800, height: 600 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setSelectedImage({
        uri: compressedImage.uri,
        type: 'image/jpeg',
        name: 'progress-image.jpg',
      });
    }
  };

  const handleSubmitProgress = async () => {
    if (!nextStatus || !remark.trim()) {
      Alert.alert('Error', 'Please enter a remark before updating');
      return;
    }

    setServerError(null);

    try {
      await updateMutation.mutateAsync({
        id: id!,
        status: nextStatus,
        remark: remark.trim(),
        image: selectedImage || undefined,
      });

      Alert.alert('Success', `Status updated to ${nextStatus}`);
      setRemark('');
      setSelectedImage(null);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update progress. Please try again.';
      setServerError(errorMsg);
    }
  };

  const handleOpenMaps = () => {
    if (!issue?.location?.coordinates) return;

    const [longitude, latitude] = issue.location.coordinates;
    const url = `http://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
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

  return (
    <ScreenContainer scrollable showBack onBackPress={() => router.back()}>
      {serverError && (
        <View
          style={[
            styles.serverErrorBanner,
            {
              backgroundColor: colors.dangerLight,
              borderColor: colors.danger,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[styles.errorBannerText, typography.bodySmall, { color: colors.danger }]}>
            {serverError}
          </Text>
        </View>
      )}

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
        <TouchableOpacity
          style={[styles.mapsButton, { borderColor: colors.primary }]}
          onPress={handleOpenMaps}
        >
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={[styles.mapsButtonText, typography.labelSmall, { color: colors.primary }]}>
            Open in Maps
          </Text>
        </TouchableOpacity>
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

      {canUpdate && (
        <View
          style={[
            styles.progressSection,
            { backgroundColor: colors.surface, marginBottom: spacing.lg },
          ]}
        >
          <Text style={[styles.sectionTitle, typography.labelMedium, { color: colors.text }]}>
            Update to {nextStatus}
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.labelSmall, { color: colors.text }]}>Remark</Text>
            <TextInput
              style={[
                styles.remarkInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Describe the progress or resolution..."
              placeholderTextColor={colors.textSecondary}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={[styles.imageSection, { marginTop: spacing.md }]}>
            <Text style={[typography.labelSmall, { color: colors.text, marginBottom: spacing.sm }]}>
              Progress Photo (Optional)
            </Text>
            {selectedImage && (
              <View
                style={[
                  styles.imagePreview,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: colors.border },
                  ]}
                />
                <TouchableOpacity onPress={() => setSelectedImage(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.imageButtonsRow}>
              <Button
                title="Camera"
                onPress={handleCameraImage}
                variant="outlined"
                size="sm"
                icon="camera"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Gallery"
                onPress={handlePickImage}
                variant="outlined"
                size="sm"
                icon="image"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <View style={[styles.actionButtons, { marginTop: spacing.lg }]}>
            <Button
              title={`Update to ${nextStatus}`}
              onPress={handleSubmitProgress}
              variant="primary"
              size="lg"
              fullWidth
              loading={updateMutation.isPending}
            />
          </View>
        </View>
      )}
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
  serverErrorBanner: {
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorBannerText: {
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 12,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  mapsButtonText: {
    marginLeft: 8,
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
  progressSection: {
    borderRadius: 12,
    padding: 16,
  },
  remarkInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginTop: 16,
  },
  imagePreview: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtons: {
    marginBottom: 20,
  },
});
