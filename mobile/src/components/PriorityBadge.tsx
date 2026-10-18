import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPriorityMeta } from '../constants';
import { useTheme } from '../theme';

interface PriorityBadgeProps {
  priority: string;
  priorityScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = false,
}) => {
  const { radii, spacing, typography, isDark } = useTheme();
  const meta = getPriorityMeta(priority);

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 3,
          paddingHorizontal: spacing.xs + 3,
          iconSize: 12,
          textStyle: typography.labelSmall,
        };
      case 'lg':
        return {
          paddingVertical: spacing.xs + 3,
          paddingHorizontal: spacing.md,
          iconSize: 16,
          textStyle: typography.labelLarge,
        };
      case 'md':
      default:
        return {
          paddingVertical: 3,
          paddingHorizontal: spacing.sm + 2,
          iconSize: 13,
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
      {showIcon && (
        <Ionicons
          name="flag"
          size={dim.iconSize}
          color={meta.colour}
          style={{ marginRight: spacing.xs }}
        />
      )}
      <Text style={[dim.textStyle, { color: meta.colour, fontWeight: '700' }]}>
        {meta.label} Priority
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
});
