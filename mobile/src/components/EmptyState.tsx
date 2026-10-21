import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'file-tray-outline',
  actionTitle,
  onAction,
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.primaryLight,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.titleSmall,
          { color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
        ]}
      >
        {title}
      </Text>

      {message && (
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
      )}

      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
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
