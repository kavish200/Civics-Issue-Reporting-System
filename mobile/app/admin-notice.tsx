import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { Button } from '../src/components/Button';
import { useAuthStore } from '../src/features/auth/store';
import { useTheme } from '../src/theme';

export default function AdminNoticeScreen() {
  const { colors, spacing, typography } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.primaryLight,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Ionicons name="desktop-outline" size={54} color={colors.primary} />
        </View>

        <Text
          style={[
            typography.titleMedium,
            { color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
          ]}
        >
          Web Admin Portal Required
        </Text>

        <Text
          style={[
            typography.bodyLarge,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: spacing.xxl,
            },
          ]}
        >
          This mobile application is intended specifically for citizens and field officers.
          Administrative privileges, dispatch management, and system governance must be accessed
          through the Civics Web Administration Dashboard.
        </Text>

        <Button
          title="Sign Out to Return"
          icon="log-out-outline"
          onPress={handleLogout}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
