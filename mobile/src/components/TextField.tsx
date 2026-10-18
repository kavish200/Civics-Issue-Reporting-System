import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  maxLength,
  style,
}) => {
  const { colors, radii, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecured = secureTextEntry && !isPasswordVisible;

  const getBorderColor = (): string => {
    if (error) return colors.danger;
    if (isFocused) return colors.borderFocus;
    return colors.border;
  };

  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label && (
        <Text
          style={[
            typography.labelMedium,
            { color: colors.text, marginBottom: spacing.xs },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: editable ? colors.surface : colors.background,
            borderColor: getBorderColor(),
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? spacing.sm : spacing.sm + 2,
            minHeight: multiline ? (numberOfLines || 3) * 24 : 48,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textMuted}
            style={{ marginRight: spacing.sm }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecured}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            typography.bodyLarge,
            {
              color: colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.danger, marginTop: spacing.xs },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
