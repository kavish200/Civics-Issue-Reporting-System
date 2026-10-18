import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { apiClient } from '../api';
import { savePushToken, getPushToken } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
      // In local development or bare workflow without EAS, skip push token registration
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await savePushToken(token);

    try {
      await apiClient.post('/users/push-token', { token });
    } catch (err) {
      console.warn('Failed to save push token to server:', err);
    }

    return token;
  } catch (err) {
    console.warn('Notification setup notice:', err);
    return null;
  }
}

export function useNotificationListener(onNotificationReceived?: (notification: any) => void) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      onNotificationReceived?.(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const issueId = response.notification.request.content.data?.issueId;
      if (issueId) {
        return {
          issueId,
        };
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [onNotificationReceived]);
}

export async function getStoredPushToken(): Promise<string | null> {
  return getPushToken();
}
