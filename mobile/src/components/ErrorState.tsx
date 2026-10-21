import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.dangerLight,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
      </View>

      <Text
        style={[
          typography.titleSmall,
          { color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.lg,
          },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <Button
          title="Try Again"
          icon="reload"
          onPress={onRetry}
          variant="outline"
          size="md"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
