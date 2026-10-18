import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api';
import { queryKeys } from '../../api/queryKeys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications');
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await apiClient.patch(`/notifications/${notificationId}/read`);
      return data;
    },
  });
}

export const useMarkRead = useMarkNotificationRead;

export function useMarkAllRead() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch('/notifications/read-all');
      return data;
    },
  });
}
