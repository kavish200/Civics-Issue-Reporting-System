export interface NotificationIssueMeta {
  _id: string;
  trackingId: string;
  category: string;
  status: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: string;
  issue?: NotificationIssueMeta;
  type: 'status_update' | 'assignment' | 'duplicate' | 'rating_request' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
