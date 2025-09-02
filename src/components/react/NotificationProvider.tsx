import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Notification, NotificationContextType } from './types';
import NotificationSystem from './NotificationSystem';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Marcar como listo después de la hidratación
  useEffect(() => {
    setIsReady(true);
  }, []);

  const addNotification = (message: string, type: Notification['type'] = 'info', duration: number = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Listen for global notification events from non-React code
  useEffect(() => {
    const handleShowNotification = (event: CustomEvent<Notification>) => {
      const { message, type, duration } = event.detail;
      addNotification(message, type, duration);
    };

    window.addEventListener('showNotification', handleShowNotification as EventListener);
    
    // Expose global function for non-React code
    (window as any).showGlobalNotification = addNotification;
    
    return () => {
      window.removeEventListener('showNotification', handleShowNotification as EventListener);
      delete (window as any).showGlobalNotification;
    };
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications in React components
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    // Return a safe fallback instead of throwing an error
    // Solo mostrar warning una vez para evitar spam en consola
    if (typeof window !== 'undefined' && !(window as any).__notificationWarningShown) {
      console.warn('useNotifications called outside of NotificationProvider, using fallback');
      (window as any).__notificationWarningShown = true;
    }
    return {
      notifications: [],
      addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        console.log(`Notification fallback: [${type}] ${message}`);
        // Intentar usar la función global como respaldo
        if (typeof window !== 'undefined' && (window as any).showGlobalNotification) {
          (window as any).showGlobalNotification(message, type);
        }
      },
      removeNotification: (id: string) => {
        console.log(`Remove notification fallback: ${id}`);
      },
      clearAllNotifications: () => {
        console.log('Clear all notifications fallback');
      }
    };
  }
  return context;
};

// Helper function for non-React code to show notifications
export const showGlobalNotification = (message: string, type: Notification['type'] = 'info', duration: number = 5000) => {
  // Try to use the global function if available
  if ((window as any).showGlobalNotification) {
    (window as any).showGlobalNotification(message, type, duration);
  } else {
    // Fallback to custom event
    const event = new CustomEvent('showNotification', {
      detail: { id: '', message, type, duration }
    });
    window.dispatchEvent(event);
  }
};

export default NotificationProvider;