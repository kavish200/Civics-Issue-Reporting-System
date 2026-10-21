import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useLogin } from '../../src/features/auth/hooks';
import { useTheme } from '../../src/theme';

export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setErrorMessage(null);

    try {
      const response = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (response.user.role === 'officer') {
        router.replace('/(officer)');
      } else {
        router.replace('/(citizen)');
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 403) {
        router.push('/admin-notice');
        return;
      }
      const msg =
        error.response?.data?.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={[styles.headerContainer, { marginTop: spacing.xl, marginBottom: spacing.xl }]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
        </View>

        <Text
          style={[
            typography.titleLarge,
            { color: colors.text, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Civics Portal
        </Text>
        <Text
          style={[
            typography.bodyMedium,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
          ]}
        >
          Community Civic Grievance & Resolution System
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Text
          style={[
            typography.titleSmall,
            { color: colors.text, marginBottom: spacing.md },
          ]}
        >
          Sign In
        </Text>

        {errorMessage && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.dangerLight, marginBottom: spacing.md },
            ]}
          >
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={[styles.errorText, typography.bodySmall, { color: colors.danger }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        <TextField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="citizen@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          autoCapitalize="none"
          icon="lock-closed-outline"
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loginMutation.isPending}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <View style={[styles.footerContainer, { marginTop: spacing.xl }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={[typography.labelMedium, { color: colors.primary }]}>
            Register Here
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
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  formCard: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
