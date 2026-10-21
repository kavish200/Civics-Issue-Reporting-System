import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pickImageFromGallery, takePhotoWithCamera, compressAndResizeImage } from '../imageHelpers';
import { useReportStore } from '../reportStore';
import { spacing, colors, typography } from '../../../theme';
import { Button, ScreenContainer } from '../../../components';

interface PhotoStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function PhotoStep({ onNext, onBack }: PhotoStepProps) {
  const { photoUri, setPhoto } = useReportStore();
  const [isCompressing, setIsCompressing] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const uri = await takePhotoWithCamera();
      if (uri) {
        setIsCompressing(true);
        const compressedUri = await compressAndResizeImage(uri);
        setPhoto(compressedUri);
        setIsCompressing(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setIsCompressing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const uri = await pickImageFromGallery();
      if (uri) {
        setIsCompressing(true);
        const compressedUri = await compressAndResizeImage(uri);
        setPhoto(compressedUri);
        setIsCompressing(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
      setIsCompressing(false);
    }
  };

  const handleRetake = () => {
    setPhoto('');
  };

  if (isCompressing) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <View style={styles.loader}>
            <MaterialCommunityIcons name="loading" size={48} color={colors.primary} />
            <Text style={styles.loadingText}>Compressing image...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (photoUri) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Photo Preview</Text>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <Text style={styles.infoText}>
            This photo will be attached to your report to help officers understand the issue better.
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              label="Retake Photo"
              variant="secondary"
              onPress={handleRetake}
              style={styles.button}
            />
            <Button
              label="Continue"
              onPress={onNext}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add a Photo</Text>
          <Text style={styles.subtitle}>Show the issue to help officers locate and resolve it faster</Text>
        </View>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="camera" size={40} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Take a Photo</Text>
              <Text style={styles.optionDescription}>Use your camera to capture the issue</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={handlePickFromGallery}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="image" size={40} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionDescription}>Select an existing photo</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={colors.info} />
          <Text style={styles.infoBoxText}>
            Photos are automatically optimized for quick upload (max 1280px, 0.7 quality)
          </Text>
        </View>

        <Button
          label="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.backButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
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
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.border,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  optionContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    borderRadius: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoBoxText: {
    ...typography.caption,
    color: colors.info,
    flex: 1,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.lg,
  },
});