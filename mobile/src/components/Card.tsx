import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'low' | 'medium';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 'low',
}) => {
  const { colors, radii, spacing, isDark } = useTheme();

  const getElevationStyle = (): ViewStyle => {
    if (elevation === 'none') {
      return {
        borderWidth: 1,
        borderColor: colors.border,
      };
    }

    if (Platform.OS === 'android') {
      return {
        elevation: elevation === 'medium' ? 4 : 2,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
      };
    }

    return {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: elevation === 'medium' ? 4 : 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: elevation === 'medium' ? 8 : 4,
      borderWidth: isDark ? 1 : 0.5,
      borderColor: colors.border,
    };
  };

  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...getElevationStyle(),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
};
