import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { LeafletMapView } from '../../src/features/map/LeafletMapView';
import { useCreateIssue } from '../../src/features/complaints/hooks';
import { saveDraft, getDrafts, deleteDraft } from '../../src/utils/storage';
import { useTheme } from '../../src/theme';
import { CATEGORIES, IssueCategory } from '../../src/constants';

export default function ReportIssueScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ draftId?: string }>();

  const [category, setCategory] = useState<IssueCategory>('road_damage');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number>(22.7196);
  const [longitude, setLongitude] = useState<number>(75.8577);
  const [address, setAddress] = useState<string>('Current Location');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [successTrackingId, setSuccessTrackingId] = useState<string | null>(null);
  const [isDuplicateCandidate, setIsDuplicateCandidate] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  const createIssueMutation = useCreateIssue();

  // Load existing draft if draftId param is present
  useEffect(() => {
    if (params.draftId) {
      loadDraft(params.draftId);
    } else {
      fetchCurrentLocation();
    }
  }, [params.draftId]);

  const loadDraft = async (draftId: string) => {
    try {
      const drafts = await getDrafts();
      const draft = drafts.find((d) => d.id === draftId);
      if (draft) {
        setCategory((draft.category as IssueCategory) || 'road_damage');
        setDescription(draft.description || '');
        if (draft.latitude) setLatitude(draft.latitude);
        if (draft.longitude) setLongitude(draft.longitude);
        if (draft.address) setAddress(draft.address);
        if (draft.imageFileName) setImageUri(draft.imageFileName);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  };

  const fetchCurrentLocation = async () => {
    setIsLocating(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Permission to access location was denied. Using map coordinates.');
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverse && reverse.length > 0) {
          const r = reverse[0];
          const parts = [r.name, r.street, r.district || r.subregion, r.city].filter(Boolean);
          if (parts.length > 0) {
            setAddress(parts.join(', '));
          }
        }
      } catch {}
    } catch {
      setGpsError('Unable to acquire precise GPS lock. You can adjust on map.');
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndSetImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Image Error', 'Failed to select image from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndSetImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const processAndSetImage = async (uri: string) => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(manipulated.uri);
    } catch {
      setImageUri(uri);
    }
  };

  const handleSaveDraft = async () => {
    if (!description.trim()) {
      Alert.alert('Empty Draft', 'Please enter a description before saving to drafts.');
      return;
    }

    setIsSavingDraft(true);
    try {
      const draftId = params.draftId || `draft-${Date.now()}`;
      await saveDraft({
        id: draftId,
        clientId: `client-${Date.now()}`,
        category,
        description: description.trim(),
        latitude,
        longitude,
        address,
        imageFileName: imageUri || undefined,
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      Alert.alert('Draft Saved', 'Your complaint draft has been saved locally.', [
        { text: 'View Drafts', onPress: () => router.push('/(citizen)/drafts') },
        { text: 'OK', onPress: () => router.replace('/(citizen)') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a brief description of the civic issue.');
      return;
    }

    try {
      const result = await createIssueMutation.mutateAsync({
        category,
        description: description.trim(),
        latitude,
        longitude,
        address,
        imageUri: imageUri || undefined,
      });

      // If this was saved from an existing draft, remove it from drafts now
      if (params.draftId) {
        await deleteDraft(params.draftId);
      }

      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });

      setSuccessTrackingId(result.issue.trackingId);
      setIsDuplicateCandidate(result.duplicateCandidate);
    } catch (err: any) {
      console.warn('Complaint submit error:', err?.message || err);

      // Save to drafts on error so user never loses their data!
      try {
        const draftId = params.draftId || `draft-${Date.now()}`;
        await saveDraft({
          id: draftId,
          clientId: `client-${Date.now()}`,
          category,
          description: description.trim(),
          latitude,
          longitude,
          address,
          imageFileName: imageUri || undefined,
          createdAt: new Date().toISOString(),
          lastAttemptError: err?.response?.data?.message || err?.message || 'Connection failed',
        });
        queryClient.invalidateQueries({ queryKey: ['drafts'] });
      } catch (saveErr) {
        console.error('Failed to auto-save draft:', saveErr);
      }

      Alert.alert(
        'Saved to Local Drafts',
        `Unable to reach server (${err?.response?.data?.message || 'Network offline'}). Your report has been safely saved to Local Drafts.`,
        [
          {
            text: 'View Drafts',
            onPress: () => router.push('/(citizen)/drafts'),
          },
          {
            text: 'OK',
            onPress: () => router.replace('/(citizen)'),
          },
        ],
      );
    }
  };

  return (
    <ScreenContainer
      scrollable
      headerTitle="Report Civic Issue"
      headerSubtitle="Public Grievance Redressal"
      showBack
      onBackPress={() => router.back()}
    >
      {/* Category Selection Card */}
      <Card style={[styles.sectionCard, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
            Category
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.value)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radii.md,
                    marginRight: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    typography.labelSmall,
                    { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>

      {/* Description Card */}
      <Card style={[styles.sectionCard, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
            Issue Details
          </Text>
        </View>

        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue, landmarks, severity, or hazards..."
          multiline
          numberOfLines={3}
          style={{ marginTop: spacing.xs }}
        />
      </Card>

      {/* Photo Evidence Card */}
      <Card style={[styles.sectionCard, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
          <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
            Photo Evidence
          </Text>
        </View>

        {imageUri ? (
          <View style={[styles.imagePreviewWrapper, { borderRadius: radii.md }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.imageOverlayBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.imageOverlayText}>Photo attached</Text>
            </View>
            <TouchableOpacity
              onPress={() => setImageUri(null)}
              style={[styles.removeImageBtn, { backgroundColor: colors.danger }]}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={[
                styles.photoButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  borderRadius: radii.md,
                  marginRight: spacing.sm,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.photoIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="camera" size={20} color={colors.primary} />
              </View>
              <Text style={[typography.labelSmall, { color: colors.text, marginTop: 6, fontWeight: '600' }]}>
                Take Photo
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickImage}
              style={[
                styles.photoButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.photoIconCircle, { backgroundColor: colors.surface }]}>
                <Ionicons name="images" size={20} color={colors.primary} />
              </View>
              <Text style={[typography.labelSmall, { color: colors.text, marginTop: 6, fontWeight: '600' }]}>
                Gallery
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Upload File</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Location Card */}
      <Card style={[styles.sectionCard, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
        <View style={styles.locationHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
              Location
            </Text>
          </View>

          <TouchableOpacity
            onPress={fetchCurrentLocation}
            style={[styles.recenterButton, { backgroundColor: colors.primaryLight, borderRadius: radii.full }]}
            disabled={isLocating}
            activeOpacity={0.7}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="locate" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            )}
            <Text style={[typography.labelSmall, { color: colors.primary, fontWeight: '600' }]}>
              {isLocating ? 'Locating...' : 'Current GPS'}
            </Text>
          </TouchableOpacity>
        </View>

        {gpsError && (
          <View style={[styles.warningBox, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
            <Text style={[typography.caption, { color: colors.warning, marginLeft: 6, flex: 1 }]}>
              {gpsError}
            </Text>
          </View>
        )}

        <View style={[styles.mapContainer, { borderRadius: radii.md }]}>
          <LeafletMapView
            selectable
            initialLatitude={latitude}
            initialLongitude={longitude}
            selectedLatitude={latitude}
            selectedLongitude={longitude}
            onLocationSelect={(loc) => {
              setLatitude(loc.latitude);
              setLongitude(loc.longitude);
            }}
            height={200}
          />
        </View>

        <View style={[styles.addressBox, { backgroundColor: colors.background, borderRadius: radii.sm }]}>
          <Ionicons name="location-sharp" size={16} color={colors.danger} />
          <Text style={[typography.caption, { color: colors.text, marginLeft: 6, flex: 1 }]}>
            {address} ({latitude.toFixed(4)}, {longitude.toFixed(4)})
          </Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
        <Button
          title="Submit Complaint"
          icon="send"
          onPress={handleSubmit}
          loading={createIssueMutation.isPending}
          variant="primary"
          size="lg"
          fullWidth
          style={{ shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
        />

        <Button
          title="Save as Offline Draft"
          icon="bookmark-outline"
          onPress={handleSaveDraft}
          loading={isSavingDraft}
          variant="outline"
          size="md"
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Success Modal */}
      <Modal visible={Boolean(successTrackingId)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card style={[styles.modalCard, { borderRadius: radii.xl }]}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={54} color={colors.success} />
            </View>

            <Text style={[typography.titleMedium, { color: colors.text, textAlign: 'center', marginTop: spacing.md }]}>
              Complaint Submitted!
            </Text>

            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
              ]}
            >
              Your civic report has been logged and assigned to the municipal department for resolution.
            </Text>

            <View style={[styles.trackingIdBox, { backgroundColor: colors.background, borderRadius: radii.md }]}>
              <Text style={[typography.caption, { color: colors.textSecondary, letterSpacing: 0.8 }]}>
                TRACKING NUMBER
              </Text>
              <Text style={[typography.titleMedium, { color: colors.primary, marginTop: 4, fontWeight: '800' }]}>
                {successTrackingId}
              </Text>
            </View>

            {isDuplicateCandidate && (
              <View style={[styles.duplicateModalBanner, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={[typography.caption, { color: colors.warning, marginLeft: 6, flex: 1 }]}>
                  Similar reports exist nearby. This has been grouped for municipal inspection.
                </Text>
              </View>
            )}

            <Button
              title="View in My Complaints"
              onPress={() => {
                setSuccessTrackingId(null);
                router.replace('/(citizen)');
              }}
              variant="primary"
              size="md"
              fullWidth
            />
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  photoButtonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrapper: {
    position: 'relative',
    height: 190,
    width: '100%',
    overflow: 'hidden',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recenterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  mapContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingIdBox: {
    width: '100%',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  duplicateModalBanner: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
});
