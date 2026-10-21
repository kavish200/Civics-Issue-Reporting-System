import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useIssueDetail } from '../../../src/features/complaints/hooks';
import { useUpdateProgress } from '../../../src/features/officer/hooks';
import { StatusBadge, PriorityBadge, ScreenContainer, Card, Button } from '../../../src/components';
import { API_URL } from '../../../src/api/client';

function getImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

export default function OfficerComplaintDetailScreen() {
  const { colors, spacing, typography, radii, isDark } = useTheme();
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
      Alert.alert('Remark Required', 'Please enter a brief remark before updating status.');
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

      Alert.alert('Status Updated', `Task status has been updated to "${nextStatus}".`);
      setRemark('');
      setSelectedImage(null);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update progress. Please verify network connection and try again.';
      setServerError(errorMsg);
    }
  };

  const handleOpenMaps = () => {
    if (!issue?.location?.coordinates) return;

    const [longitude, latitude] = issue.location.coordinates;
    const url = `http://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open external maps application.');
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer showBack onBackPress={() => router.back()}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !issue) {
    return (
      <ScreenContainer showBack onBackPress={() => router.back()}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorText, typography.bodyMedium, { color: colors.danger, marginTop: 12 }]}>
            Failed to load complaint details.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const citizenImgUrl = getImageUrl(issue.image);

  return (
    <ScreenContainer
      scrollable
      showBack
      onBackPress={() => router.back()}
      headerTitle="Task Details"
      headerSubtitle={issue.trackingId || 'Complaint Dispatch'}
    >
      {serverError && (
        <View
          style={[
            styles.serverErrorBanner,
            {
              backgroundColor: colors.dangerLight,
              borderColor: colors.danger,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[styles.errorBannerText, typography.bodySmall, { color: colors.danger }]}>
            {serverError}
          </Text>
        </View>
      )}

      {/* Main Task Overview Card */}
      <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.trackingPill,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primaryLight,
                borderRadius: radii.sm,
              },
            ]}
          >
            <Text style={[typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
              {issue.trackingId}
            </Text>
          </View>
          <StatusBadge status={issue.status} />
        </View>

        <Text
          style={[
            typography.titleMedium,
            { color: colors.text, marginTop: spacing.sm, fontWeight: '700' },
          ]}
        >
          {issue.category?.replace('_', ' ').toUpperCase()}
        </Text>

        <Text
          style={[
            typography.bodyMedium,
            { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 21 },
          ]}
        >
          {issue.description}
        </Text>

        <View style={[styles.badgesRow, { marginTop: spacing.md }]}>
          <PriorityBadge priority={issue.priority} priorityScore={issue.priorityScore} />
        </View>
      </Card>

      {/* Citizen's Uploaded Issue Photo */}
      {citizenImgUrl && (
        <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
          <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm, fontWeight: '700' }]}>
            Citizen Attached Photo
          </Text>
          <Image
            source={{ uri: citizenImgUrl }}
            style={[
              styles.citizenPhoto,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: radii.md,
              },
            ]}
            resizeMode="cover"
          />
        </Card>
      )}

      {/* Location & Navigation Card */}
      <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.xs, fontWeight: '700' }]}>
          Location Information
        </Text>

        <View style={styles.addressContainer}>
          <Ionicons name="location-sharp" size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text, marginLeft: 8, flex: 1, lineHeight: 20 },
            ]}
          >
            {issue.location?.address || issue.address || 'Address not specified'}
          </Text>
        </View>

        {issue.location?.coordinates && (
          <TouchableOpacity
            style={[
              styles.mapsButton,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
            onPress={handleOpenMaps}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={[styles.mapsButtonText, typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
              Open in Maps Navigation
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Status History Timeline Card */}
      {issue.statusHistory && issue.statusHistory.length > 0 && (
        <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
          <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.md, fontWeight: '700' }]}>
            Status History Timeline
          </Text>
          {issue.statusHistory.map((entry: any, index: number) => {
            const isLast = index === issue.statusHistory.length - 1;
            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[styles.timelineLine, { backgroundColor: colors.border }]}
                    />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[typography.labelSmall, { color: colors.text, fontWeight: '700' }]}>
                      {entry.status}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {formatDate(entry.createdAt)}
                    </Text>
                  </View>
                  {entry.remark ? (
                    <Text style={[styles.remark, typography.bodySmall, { color: colors.textSecondary }]}>
                      "{entry.remark}"
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Progress Update Form Card */}
      {canUpdate && (
        <Card style={{ marginBottom: spacing.xl, padding: spacing.md }}>
          <View style={styles.nextStatusHeader}>
            <Text style={[typography.titleSmall, { color: colors.text, fontWeight: '700' }]}>
              Update Progress
            </Text>
            <View style={[styles.targetBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
                Next: {nextStatus}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.labelSmall, { color: colors.text, fontWeight: '600' }]}>
              Progress Remark
            </Text>
            <TextInput
              style={[
                styles.remarkInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={`Describe action taken to move to "${nextStatus}"...`}
              placeholderTextColor={colors.textSecondary}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.imageSection, { marginTop: spacing.md }]}>
            <Text style={[typography.labelSmall, { color: colors.text, marginBottom: spacing.xs, fontWeight: '600' }]}>
              On-Site Photo Evidence (Optional)
            </Text>

            {selectedImage && (
              <View
                style={[
                  styles.imagePreviewContainer,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.imagePreviewThumb}
                  resizeMode="cover"
                />
                <View style={styles.imagePreviewMeta}>
                  <Text style={[typography.labelSmall, { color: colors.text }]} numberOfLines={1}>
                    Photo attached
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Ready for submission
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={[styles.removeImageBtn, { backgroundColor: colors.dangerLight }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.imageButtonsRow}>
              <Button
                title="Camera"
                onPress={handleCameraImage}
                variant="outline"
                size="sm"
                icon="camera"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Gallery"
                onPress={handlePickImage}
                variant="outline"
                size="sm"
                icon="image"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <Button
            title={`Submit & Mark as "${nextStatus}"`}
            onPress={handleSubmitProgress}
            variant="primary"
            size="lg"
            fullWidth
            loading={updateMutation.isPending}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      )}
    </ScreenContainer>
  );
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    textAlign: 'center',
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  citizenPhoto: {
    width: '100%',
    height: 200,
    borderWidth: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  mapsButtonText: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remark: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  nextStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  remarkInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  imageSection: {
    marginTop: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  imagePreviewThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  imagePreviewMeta: {
    flex: 1,
    marginLeft: 10,
  },
  removeImageBtn: {
    padding: 8,
    borderRadius: 8,
  },
  imageButtonsRow: {
    flexDirection: 'row',
  },
});

