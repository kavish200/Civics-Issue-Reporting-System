import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outlined' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'large';

interface ButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: any;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors, radii, spacing, typography } = useTheme();
  const buttonText = title || label || '';
  const isSmall = size === 'sm' || size === 'small';
  const isLarge = size === 'lg' || size === 'large';
  const isOutline = variant === 'outline' || variant === 'outlined';

  const getContainerStyle = (): ViewStyle => {
    const isInteractiveDisabled = disabled || loading;

    let bg = colors.primary;
    let border = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = isInteractiveDisabled ? colors.textMuted : colors.primary;
        break;
      case 'secondary':
        bg = isInteractiveDisabled ? colors.border : colors.primaryLight;
        break;
      case 'outline':
      case 'outlined':
        bg = 'transparent';
        border = isInteractiveDisabled ? colors.border : colors.primary;
        borderWidth = 1.5;
        break;
      case 'danger':
        bg = isInteractiveDisabled ? colors.textMuted : colors.danger;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
    }

    let paddingVertical = spacing.sm + 4;
    let paddingHorizontal = spacing.md;
    if (isSmall) {
      paddingVertical = spacing.xs + 2;
      paddingHorizontal = spacing.sm + 2;
    } else if (isLarge) {
      paddingVertical = spacing.md;
      paddingHorizontal = spacing.lg;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.6 : 1,
      alignSelf: fullWidth ? 'stretch' : 'auto',
    };
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    if (isOutline || variant === 'secondary' || variant === 'ghost') {
      return colors.primary;
    }
    return '#FFFFFF';
  };

  const textColor = getTextColor();
  const iconSize = isSmall ? 16 : isLarge ? 22 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginRight: spacing.xs + 2 }}
            />
          )}
          <Text
            style={[
              typography.labelLarge,
              isSmall && typography.labelMedium,
              isLarge && typography.titleSmall,
              { color: textColor },
              textStyle,
            ]}
          >
            {buttonText}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={textColor}
              style={{ marginLeft: spacing.xs + 2 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
