import React, { useEffect, useState } from 'react';

interface PushNotificationManagerProps {
  children?: React.ReactNode;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar soporte para notificaciones push
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', reg);
      setRegistration(reg);

      // Verificar si ya está suscrito
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log('Mensaje del Service Worker:', event.data);
    
    if (event.data.type === 'NOTIFICATION_CLICK') {
      // Manejar navegación cuando se hace clic en una notificación
      window.location.href = event.data.url;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Las notificaciones push no están soportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    if (!registration || !isSupported) {
      console.warn('Service Worker no registrado o no soportado');
      return false;
    }

    try {
      // Solicitar permisos si no están concedidos
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return false;
        }
      }

      // Generar claves VAPID (en producción, estas deberían venir del servidor)
      const vapidPublicKey = await getVapidPublicKey();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      console.log('Suscripción a push creada:', subscription);

      // Enviar suscripción al servidor
      const success = await sendSubscriptionToServer(subscription);
      
      if (success) {
        setIsSubscribed(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al suscribirse a push notifications:', error);
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!registration) {
      return false;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const success = await subscription.unsubscribe();
        
        if (success) {
          // Notificar al servidor que se desuscribió
          await removeSubscriptionFromServer(subscription);
          setIsSubscribed(false);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error al desuscribirse de push notifications:', error);
      return false;
    }
  };

  const getVapidPublicKey = async (): Promise<string> => {
    // En un entorno real, esto vendría de tu servidor
    // Por ahora, usaremos una clave de ejemplo (debes generar la tuya)
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmLWjMpS_7VnYkYdw7MWBpVha6r5FhMKt2A_q_1_LFDo';
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: JSON.stringify(subscription),
          device_type: 'web'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error al enviar suscripción al servidor:', error);
      return false;
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/push-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: JSON.stringify(subscription)
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error al eliminar suscripción del servidor:', error);
      return false;
    }
  };

  // Función helper para convertir VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Función para testear notificaciones
  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('Notificación de prueba', {
        body: 'Esta es una notificación de prueba de TiChat',
        icon: '/favicon.png',
        tag: 'test'
      });
    }
  };

  // Exponer funciones globalmente para uso en otros componentes
  useEffect(() => {
    (window as any).pushNotificationManager = {
      isSupported,
      permission,
      isSubscribed,
      requestPermission,
      subscribeToPush,
      unsubscribeFromPush,
      testNotification
    };
  }, [isSupported, permission, isSubscribed]);

  return (
    <>
      {children}
      
      {/* Componente de configuración de notificaciones (opcional) */}
      {isSupported && (
        <div className="hidden">
          {/* Este div está oculto pero mantiene las funciones disponibles */}
        </div>
      )}
    </>
  );
};

// Hook para usar el push notification manager
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar si el manager está disponible
    const checkManager = () => {
      const manager = (window as any).pushNotificationManager;
      if (manager) {
        setIsSupported(manager.isSupported);
        setPermission(manager.permission);
        setIsSubscribed(manager.isSubscribed);
      }
    };

    checkManager();
    
    // Verificar periódicamente hasta que esté disponible
    const interval = setInterval(checkManager, 100);
    
    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    const manager = (window as any).pushNotificationManager;
    if (manager) {
      const granted = await manager.requestPermission();
      setPermission(Notification.permission);
      return granted;
    }
    return false;
  };

  const subscribe = async () => {
    const manager = (window as any).pushNotificationManager;
    if (manager) {
      const success = await manager.subscribeToPush();
      setIsSubscribed(success);
      return success;
    }
    return false;
  };

  const unsubscribe = async () => {
    const manager = (window as any).pushNotificationManager;
    if (manager) {
      const success = await manager.unsubscribeFromPush();
      setIsSubscribed(!success);
      return success;
    }
    return false;
  };

  const testNotification = () => {
    const manager = (window as any).pushNotificationManager;
    if (manager) {
      manager.testNotification();
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  };
};

export default PushNotificationManager;