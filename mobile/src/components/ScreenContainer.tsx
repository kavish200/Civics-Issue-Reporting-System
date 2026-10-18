import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../theme';
import { LoadingView } from './LoadingView';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionTitle?: string;
  onEmptyAction?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
  refreshControl?: React.ReactElement;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  loading = false,
  loadingMessage,
  error = null,
  onRetry,
  empty = false,
  emptyTitle = 'No data found',
  emptyMessage,
  emptyActionTitle,
  onEmptyAction,
  headerTitle,
  headerSubtitle,
  headerRight,
  showBack = false,
  onBackPress,
  refreshControl,
  style,
  contentContainerStyle,
}) => {
  const { colors, spacing, typography } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const renderHeader = () => {
    if (!headerTitle && !showBack && !headerRight) return null;

    return (
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { marginRight: spacing.sm }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer}>
            {headerTitle && (
              <Text
                style={[
                  typography.titleMedium,
                  { color: colors.text, fontWeight: '800', letterSpacing: -0.3 },
                ]}
                numberOfLines={1}
              >
                {headerTitle}
              </Text>
            )}
            {headerSubtitle && (
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
                numberOfLines={1}
              >
                {headerSubtitle}
              </Text>
            )}
          </View>
        </View>

        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingView message={loadingMessage} fullScreen />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={onRetry} />;
    }

    if (empty) {
      return (
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          actionTitle={emptyActionTitle}
          onAction={onEmptyAction}
        />
      );
    }

    if (scrollable) {
      return (
        <ScrollView
          style={[styles.content, style]}
          contentContainerStyle={[
            styles.scrollContent,
            { padding: spacing.md },
            contentContainerStyle,
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View
        style={[
          styles.content,
          { padding: spacing.md },
          style,
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {isOffline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.danger }]}>
          <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
          <Text style={[styles.offlineText, typography.labelSmall]}>
            You are currently offline. Changes will be saved locally.
          </Text>
        </View>
      )}

      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineText: {
    color: '#FFFFFF',
    marginLeft: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
