import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useRegister } from '../../src/features/auth/hooks';
import { useTheme } from '../../src/theme';

export default function RegisterScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const registerMutation = useRegister();

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage(null);

    try {
      await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMessage('Account registered successfully! Please sign in.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <ScreenContainer scrollable showBack onBackPress={() => router.back()}>
      <View style={[styles.headerContainer, { marginTop: spacing.md, marginBottom: spacing.lg }]}>
        <Text
          style={[
            typography.titleLarge,
            { color: colors.text, textAlign: 'center' },
          ]}
        >
          Create Citizen Account
        </Text>
        <Text
          style={[
            typography.bodyMedium,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
          ]}
        >
          Join the civic community to report issues and track resolutions
        </Text>
      </View>

      <Card style={styles.formCard}>
        {errorMessage && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.dangerLight, marginBottom: spacing.md },
            ]}
          >
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={[styles.bannerText, typography.bodySmall, { color: colors.danger }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {successMessage && (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.successLight, marginBottom: spacing.md },
            ]}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.bannerText, typography.bodySmall, { color: colors.success }]}>
              {successMessage}
            </Text>
          </View>
        )}

        <TextField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rahul Sharma"
          icon="person-outline"
        />

        <TextField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="rahul@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
          autoCapitalize="none"
          icon="lock-closed-outline"
        />

        <TextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          secureTextEntry
          autoCapitalize="none"
          icon="shield-outline"
        />

        <Button
          title="Register as Citizen"
          onPress={handleRegister}
          loading={registerMutation.isPending}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <View style={[styles.footerContainer, { marginTop: spacing.lg, marginBottom: spacing.xl }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={[typography.labelMedium, { color: colors.primary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
  },
  formCard: {
    padding: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  bannerText: {
    marginLeft: 8,
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
