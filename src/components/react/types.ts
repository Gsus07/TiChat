// Shared types for notification system
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type'], duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}