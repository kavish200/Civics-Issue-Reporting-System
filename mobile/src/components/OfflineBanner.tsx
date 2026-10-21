import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useNetworkState } from '../features/complaints/offlineHooks';

export function OfflineBanner() {
  const { colors, spacing, typography } = useTheme();
  const { data: networkState } = useNetworkState();

  if (networkState?.isConnected && networkState?.isInternetReachable) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.textInverse} />
      <Text style={[styles.text, typography.labelSmall, { color: colors.textInverse, marginLeft: spacing.sm }]}>
        You're offline. Changes will be saved as drafts.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    flex: 1,
  },
});
