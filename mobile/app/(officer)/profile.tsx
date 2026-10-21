import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks';
import { useAuthStore } from '../../src/features/auth/store';
import { ScreenContainer, Card, Button } from '../../src/components';

export default function OfficerProfileScreen() {
  const { colors, spacing, typography, radii, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          queryClient.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initial = user?.name ? user.name.trim()[0].toUpperCase() : 'O';

  return (
    <ScreenContainer
      scrollable
      headerTitle="Officer Profile"
      headerSubtitle="Field Operations & Credentials"
    >
      <Card style={{ marginBottom: spacing.md, alignItems: 'center', padding: spacing.lg }}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: colors.primary, marginBottom: spacing.sm },
          ]}
        >
          <Text style={[typography.titleLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
            {initial}
          </Text>
        </View>

        <Text style={[typography.titleMedium, { color: colors.text, fontWeight: '700' }]}>
          {user?.name || 'Field Officer'}
        </Text>
        <Text
          numberOfLines={1}
          style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 2 }]}
        >
          {user?.email}
        </Text>

        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : colors.primaryLight,
              borderRadius: radii.full,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Text style={[typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
            FIELD OFFICER
          </Text>
        </View>
      </Card>

      <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm, fontWeight: '700' }]}>
          Assignment Details
        </Text>

        <InfoRow
          icon="briefcase-outline"
          label="Designation"
          value="Municipal Field Officer"
          colors={colors}
          typography={typography}
        />
        <InfoRow
          icon="mail-outline"
          label="Official Email"
          value={user?.email || '-'}
          colors={colors}
          typography={typography}
        />
        <InfoRow
          icon="business-outline"
          label="Department"
          value="Public Grievance & Civil Works"
          colors={colors}
          typography={typography}
        />
        <InfoRow
          icon="shield-checkmark-outline"
          label="Status"
          value="Active on Duty"
          valueColor={colors.success}
          colors={colors}
          typography={typography}
          isLast
        />
      </Card>

      <Card style={{ marginBottom: spacing.xl, padding: spacing.md }}>
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.xs, fontWeight: '700' }]}>
          Field Guidelines
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 19 }]}>
          Please update complaints to "In Progress" as soon as work begins on site. When resolving an issue, upload clear photographic evidence to facilitate citizen confirmation.
        </Text>
      </Card>

      <Button
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleLogout}
        variant="outline"
        size="lg"
        fullWidth
        style={{ marginBottom: spacing.xxl }}
      />
    </ScreenContainer>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
  typography: any;
  isLast?: boolean;
}

function InfoRow({ icon, label, value, valueColor, colors, typography, isLast }: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 10 }]}>
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          typography.bodyMedium,
          styles.infoValue,
          { color: valueColor || colors.text, fontWeight: '500' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
});

