import React, { useState, useEffect } from 'react';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onRemove,
  position = 'top-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: '✅',
          iconBg: 'bg-green-100 text-green-600',
          text: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          iconBg: 'bg-yellow-100 text-yellow-600',
          text: 'text-yellow-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: '❌',
          iconBg: 'bg-red-100 text-red-600',
          text: 'text-red-800'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 text-blue-600',
          text: 'text-blue-800'
        };
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
      {notifications.map((notification) => {
        const styles = getTypeStyles(notification.type);
        
        return (
          <ToastItem
            key={notification.id}
            notification={notification}
            styles={styles}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
};

interface ToastItemProps {
  notification: ToastNotification;
  styles: any;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, styles, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-remove después de la duración especificada
    const duration = notification.duration || 5000;
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [notification.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Tiempo de animación de salida
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
        ${styles.bg} border rounded-lg shadow-lg p-4 max-w-sm w-full
      `}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-1 mr-3`}>
          <span className="text-sm">{styles.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>
            {notification.title}
          </p>
          <p className={`text-sm ${styles.text} opacity-90 mt-1`}>
            {notification.message}
          </p>
        </div>
        
        <button
          onClick={handleRemove}
          className={`flex-shrink-0 ml-2 ${styles.text} opacity-60 hover:opacity-100 transition-opacity`}
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      
      {/* Barra de progreso */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-${notification.duration || 5000} ease-linear ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{
            animation: `shrink ${notification.duration || 5000}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

// Hook para manejar notificaciones toast
export const useToastNotifications = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'success', duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'error', duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'warning', duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addToast({ title, message, type: 'info', duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Estilos CSS para la animación
const styles = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default NotificationToast;