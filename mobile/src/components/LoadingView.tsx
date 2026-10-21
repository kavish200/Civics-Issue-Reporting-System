import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface LoadingViewProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Loading...',
  fullScreen = true,
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? colors.background : 'transparent' },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={[
            typography.bodyMedium,
            { color: colors.textSecondary, marginTop: spacing.md },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
});
