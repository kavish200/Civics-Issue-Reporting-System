import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './hooks';
import { LoadingView } from '../../components/LoadingView';

interface RouteProtectionProps {
  children: React.ReactNode;
  allowedRoles: ('citizen' | 'officer' | 'admin')[];
}

/**
 * Protects a route by checking user role.
 * If user is not authenticated or doesn't have the required role, redirects to login.
 */
export function RouteProtection({ children, allowedRoles }: RouteProtectionProps) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();

  const allowedRolesString = useMemo(() => allowedRoles.join(','), [allowedRoles]);

  const handleNavigation = useCallback(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      if (user.role === 'admin') {
        router.replace('/admin-notice');
      } else if (user.role === 'officer') {
        router.replace('/(officer)');
      } else {
        router.replace('/(citizen)');
      }
    }
  }, [isInitialized, isAuthenticated, user, allowedRoles, router]);

  React.useEffect(() => {
    handleNavigation();
  }, [isInitialized, isAuthenticated, user?.id, allowedRolesString, handleNavigation]);

  if (!isInitialized) {
    return <LoadingView message="Loading..." fullScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
