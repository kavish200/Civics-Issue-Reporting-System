import React from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../theme';

interface SkeletonItemProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  spacing?: number;
  showAvatar?: boolean;
}

/**
 * SkeletonItem: Single animated skeleton element
 */
export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  height = 16,
  width = '100%',
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width: width as any,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * SkeletonListItem: Simulates a list row with avatar, title, and subtitle
 */
export const SkeletonListItem: React.FC<{ showAvatar?: boolean }> = ({
  showAvatar = true,
}) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.listItem, { marginBottom: spacing.md }]}>
      {showAvatar && <SkeletonItem height={48} width={48} borderRadius={24} />}
      <View style={[styles.content, { marginLeft: showAvatar ? spacing.md : 0 }]}>
        <SkeletonItem height={16} width="70%" borderRadius={4} />
        <SkeletonItem height={12} width="90%" borderRadius={4} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
};

/**
 * SkeletonList: Multiple skeleton list items
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  spacing: spacingGap = 12,
  showAvatar = true,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          style={{
            marginBottom: idx < count - 1 ? spacingGap : 0,
          }}
        >
          <SkeletonListItem showAvatar={showAvatar} />
        </View>
      ))}
    </View>
  );
};

/**
 * SkeletonCard: Skeleton for card-like content
 */
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  const { spacing, colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.md,
          backgroundColor: colors.surface,
          marginBottom: spacing.md,
        },
      ]}
    >
      <SkeletonItem height={20} width="60%" borderRadius={4} />
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonItem
          key={idx}
          height={14}
          width={idx === lines - 1 ? '70%' : '100%'}
          borderRadius={4}
          style={{ marginTop: spacing.sm }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  card: {
    borderRadius: 12,
    gap: 8,
  },
});
