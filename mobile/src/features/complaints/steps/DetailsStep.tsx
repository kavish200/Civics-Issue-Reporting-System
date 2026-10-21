import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReportStore } from '../reportStore';
import { spacing, colors, typography } from '../../../theme';
import { Button, ScreenContainer, TextField } from '../../../components';

interface DetailsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function DetailsStep({ onNext, onBack }: DetailsStepProps) {
  const { description, setDescription } = useReportStore();
  const [charCount, setCharCount] = useState(description?.length || 0);
  const MIN_LENGTH = 10;
  const MAX_LENGTH = 500;

  const handleDescriptionChange = (text: string) => {
    if (text.length <= MAX_LENGTH) {
      setDescription(text);
      setCharCount(text.length);
    }
  };

  const isValid = charCount >= MIN_LENGTH;

  const handleContinue = () => {
    if (!isValid) {
      return;
    }
    onNext();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Details</Text>
          <Text style={styles.subtitle}>
            Describe the issue clearly so officers can understand and locate it quickly
          </Text>
        </View>

        <TextField
          label="Description"
          placeholder="What's the problem? Include any relevant details..."
          value={description || ''}
          onChangeText={handleDescriptionChange}
          multiline
          numberOfLines={6}
          maxLength={MAX_LENGTH}
        />

        <View style={styles.counterContainer}>
          <Text
            style={[
              styles.counter,
              {
                color:
                  charCount < MIN_LENGTH
                    ? colors.warning
                    : charCount > MAX_LENGTH * 0.9
                    ? colors.info
                    : colors.textSecondary,
              },
            ]}
          >
            {charCount}/{MAX_LENGTH}
          </Text>
          {charCount < MIN_LENGTH && (
            <View style={styles.requirementBox}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={colors.warning}
              />
              <Text style={styles.requirementText}>
                Minimum {MIN_LENGTH} characters required
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Tips for a good description:</Text>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>Be specific about the location and problem</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>Mention any hazards or safety concerns</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>Include nearby landmarks if helpful</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label="Back"
            variant="secondary"
            onPress={onBack}
            style={styles.button}
          />
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            style={styles.button}
          />
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
  counterContainer: {
    marginBottom: spacing.lg,
  },
  counter: {
    ...typography.caption,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  requirementBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementText: {
    ...typography.caption,
    color: colors.warning,
  },
  tipsBox: {
    backgroundColor: colors.infoLight,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    ...typography.bodyBold,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.caption,
    color: colors.info,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});