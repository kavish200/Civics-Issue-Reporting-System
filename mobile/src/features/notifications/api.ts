import { apiClient } from '../../api';
import { NotificationsResponse, NotificationItem } from './types';

export async function getNotificationsApi(
  unreadOnly: boolean = false,
): Promise<NotificationsResponse> {
  const params = unreadOnly ? { unread: 'true' } : {};
  const response = await apiClient.get<NotificationsResponse>('/notifications', {
    params,
  });
  return response.data;
}

export async function markNotificationReadApi(
  id: string,
): Promise<NotificationItem> {
  const response = await apiClient.patch<{ notification: NotificationItem }>(
    `/notifications/${id}/read`,
  );
  return response.data.notification;
}

export async function markAllNotificationsReadApi(): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>(
    '/notifications/read-all',
  );
  return response.data;
}
