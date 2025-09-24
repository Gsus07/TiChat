import React, { useState, useEffect } from 'react';
import type { Notification } from './types';

interface NotificationSystemProps {
  notifications?: Notification[];
  onRemove?: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications: externalNotifications = [], 
  onRemove 
}) => {
  const [internalNotifications, setInternalNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Combine external and internal notifications
  useEffect(() => {
    setAllNotifications([...externalNotifications, ...internalNotifications]);
  }, [externalNotifications, internalNotifications]);

  // Listen for global notification events
  useEffect(() => {
    const handleShowNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;
      addNotification(notification.message, notification.type, notification.duration);
    };

    window.addEventListener('showNotification', handleShowNotification as EventListener);
    
    return () => {
      window.removeEventListener('showNotification', handleShowNotification as EventListener);
    };
  }, []);

  // Add notification function
  const addNotification = (message: string, type: Notification['type'], duration: number = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const notification: Notification = { id, message, type, duration };
    
    setInternalNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  // Remove notification function
  const removeNotification = (id: string) => {
    setInternalNotifications(prev => prev.filter(n => n.id !== id));
    if (onRemove) {
      onRemove(id);
    }
  };

  // Get notification styles
  const getNotificationStyles = (type: Notification['type']): string => {
    const baseStyles = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 border backdrop-blur-sm';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500/90 text-white border-green-400/50`;
      case 'error':
        return `${baseStyles} bg-red-500/90 text-white border-red-400/50`;
      case 'warning':
        return `${baseStyles} bg-yellow-500/90 text-white border-yellow-400/50`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500/90 text-white border-blue-400/50`;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        );
      case 'error':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        );
      case 'warning':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        );
      case 'info':
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
    }
  };

  // Expose global notification function
  useEffect(() => {
    (window as any).showGlobalNotification = addNotification;
    
    return () => {
      delete (window as any).showGlobalNotification;
    };
  }, []);

  if (allNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 pointer-events-none">
      {allNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyles(notification.type)} pointer-events-auto animate-slide-in-right`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {getNotificationIcon(notification.type)}
              </svg>
              <span className="text-sm font-medium text-white">{notification.message}</span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-calico-white/80 hover:text-calico-white transition-colors flex-shrink-0"
              aria-label="Cerrar notificación"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to show notifications from anywhere in the app
export const showNotification = (message: string, type: Notification['type'] = 'info', duration: number = 5000) => {
  const event = new CustomEvent('showNotification', {
    detail: { id: '', message, type, duration }
  });
  window.dispatchEvent(event);
};

// Note: useNotifications hook is now provided by NotificationProvider.tsx
// This avoids conflicts and ensures proper context usage

export default NotificationSystem;