import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks';
import { useAuthStore } from '../../src/features/auth/store';
import { ScreenContainer, Button } from '../../src/components';

export default function OfficerProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons name="person" size={40} color={colors.textInverse} />
        </View>

        <Text style={[styles.name, typography.titleMedium, { color: colors.text, marginTop: spacing.md }]}>
          {user?.name || 'Officer'}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[typography.labelSmall, { color: colors.primary }]}>
            Officer
          </Text>
        </View>
      </View>

      <View style={[styles.infoSection, { marginTop: spacing.lg }]}>
        <InfoItem
          icon="briefcase-outline"
          label="Role"
          value="Officer"
          colors={colors}
          typography={typography}
        />
        <InfoItem
          icon="mail-outline"
          label="Email"
          value={user?.email || '-'}
          colors={colors}
          typography={typography}
        />
        <InfoItem
          icon="phone-outline"
          label="Phone"
          value={(user as any)?.phone || 'Not set'}
          colors={colors}
          typography={typography}
        />
      </View>

      <View style={[styles.actionSection, { marginTop: spacing.xl }]}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outlined"
          size="lg"
          fullWidth
          icon="log-out-outline"
        />
      </View>
    </ScreenContainer>
  );
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
  colors: any;
  typography: any;
}

function InfoItem({ icon, label, value, colors, typography }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
        <Text style={[styles.infoLabel, typography.labelSmall, { color: colors.textSecondary, marginLeft: 12 }]}>
          {label}
        </Text>
      </View>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    textAlign: 'center',
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  infoSection: {
    marginHorizontal: 0,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    flex: 1,
  },
  actionSection: {
    marginHorizontal: 0,
  },
});
