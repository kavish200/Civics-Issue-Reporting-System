import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusMeta } from '../constants';
import { useTheme } from '../theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const { radii, spacing, typography, isDark } = useTheme();
  const meta = getStatusMeta(status);

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 3,
          paddingHorizontal: spacing.xs + 3,
          dotSize: 6,
          textStyle: typography.labelSmall,
        };
      case 'lg':
        return {
          paddingVertical: spacing.xs + 3,
          paddingHorizontal: spacing.md,
          dotSize: 8,
          textStyle: typography.labelLarge,
        };
      case 'md':
      default:
        return {
          paddingVertical: 3,
          paddingHorizontal: spacing.sm + 2,
          dotSize: 6,
          textStyle: typography.labelSmall,
        };
    }
  };

  const dim = getDimensions();
  const bgColor = isDark ? `${meta.colour}22` : meta.backgroundColour;
  const borderColor = isDark ? `${meta.colour}44` : 'transparent';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isDark ? 1 : 0,
          borderRadius: radii.full,
          paddingVertical: dim.paddingVertical,
          paddingHorizontal: dim.paddingHorizontal,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: dim.dotSize,
            height: dim.dotSize,
            borderRadius: dim.dotSize / 2,
            backgroundColor: meta.colour,
            marginRight: spacing.xs,
          },
        ]}
      />
      <Text style={[dim.textStyle, { color: meta.colour, fontWeight: '700' }]}>
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {},
});
