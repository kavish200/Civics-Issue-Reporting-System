import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/features/auth/store';
import { useDrafts } from '../../src/features/complaints/hooks';
import { useTheme } from '../../src/theme';

export default function CitizenProfileScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { drafts, retryDraft, deleteDraft, isRetrying, refreshDrafts } = useDrafts();

  const handleLogout = () => {
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

  const handleRetryDraft = async (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;
    const ok = await retryDraft(draft);
    if (ok) {
      Alert.alert('Draft Submitted', 'Your offline complaint was successfully submitted.');
    } else {
      Alert.alert(
        'Submission Failed',
        'Could not reach the server. Please check your network connection and try again.',
      );
    }
  };

  return (
    <ScreenContainer
      scrollable
      headerTitle="Citizen Profile"
      headerSubtitle="Account & Settings"
    >
      <Card style={{ marginBottom: spacing.md, alignItems: 'center', padding: spacing.lg }}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: colors.primary, marginBottom: spacing.sm },
          ]}
        >
          <Text style={[typography.titleLarge, { color: '#FFFFFF' }]}>
            {user?.name ? user.name[0].toUpperCase() : 'C'}
          </Text>
        </View>

        <Text style={[typography.titleMedium, { color: colors.text }]}>
          {user?.name || 'Citizen User'}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>

        <View
          style={[
            styles.roleBadge,
            { backgroundColor: colors.primaryLight, borderRadius: radii.full, marginTop: spacing.sm },
          ]}
        >
          <Text style={[typography.labelSmall, { color: colors.primary }]}>
            REGISTERED CITIZEN
          </Text>
        </View>
      </Card>

      <View style={{ marginBottom: spacing.md }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[typography.labelMedium, { color: colors.text }]}>
            Local Drafts ({drafts.length})
          </Text>
          {drafts.length > 0 && (
            <TouchableOpacity onPress={refreshDrafts}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {drafts.length === 0 ? (
          <Card style={{ padding: spacing.md }}>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              No unsaved drafts. All your complaint submissions are synchronized with the server.
            </Text>
          </Card>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.draftRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.labelMedium, { color: colors.text }]}>
                    {draft.category.toUpperCase().replace('_', ' ')}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[typography.bodySmall, { color: colors.textSecondary, marginVertical: 2 }]}
                  >
                    {draft.description}
                  </Text>
                  {draft.lastAttemptError && (
                    <Text style={[typography.bodySmall, { color: colors.danger }]}>
                      {draft.lastAttemptError}
                    </Text>
                  )}
                </View>

                <View style={styles.draftActions}>
                  <Button
                    title="Retry"
                    size="sm"
                    loading={isRetrying}
                    onPress={() => handleRetryDraft(draft.id)}
                    style={{ marginRight: 6 }}
                  />
                  <TouchableOpacity
                    onPress={() => deleteDraft(draft.id)}
                    style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <Card style={{ marginBottom: spacing.xl, padding: spacing.md }}>
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.xs }]}>
          About Project
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 18 }]}>
          Crowdsourced Civic Issue Reporting and Resolution System.
          Empowering citizens and municipal governance.
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

const styles = StyleSheet.create({
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
  },
});
