import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ScreenContainer';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { useAuthStore } from '../src/features/auth/store';
import { useTheme } from '../src/theme';

export default function AdminNoticeScreen() {
  const { colors, spacing, typography, radii, isDark } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleReturn = async () => {
    try {
      await logout();
    } catch {
      // Ignore if not logged in
    }
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer scrollable>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : colors.primaryLight,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Ionicons name="desktop-outline" size={54} color={colors.primary} />
        </View>

        <Text
          style={[
            typography.titleLarge,
            { color: colors.text, textAlign: 'center', marginBottom: spacing.sm, fontWeight: '700' },
          ]}
        >
          Web Admin Portal Required
        </Text>

        <Text
          style={[
            typography.bodyMedium,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: spacing.xl,
            },
          ]}
        >
          Administrator accounts are configured for system governance and city dispatch via the Web Administration Dashboard.
        </Text>

        <Card style={[styles.infoCard, { marginBottom: spacing.xl, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[typography.labelMedium, { color: colors.text, fontWeight: '600' }]}>
                Field Officer Access
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Field officers should sign in using their officer credentials (e.g. officer1@gmail.com).
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color={colors.success} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[typography.labelMedium, { color: colors.text, fontWeight: '600' }]}>
                Citizen Access
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Citizens can register or sign in to report civic problems and track resolution progress.
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title="Return to Sign In"
          icon="arrow-back"
          onPress={handleReturn}
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});

