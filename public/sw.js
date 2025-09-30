// Service Worker para notificaciones push
const CACHE_NAME = 'tichat-notifications-v1';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('Push recibido:', event);
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación en TiChat',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.id || notificationData.tag,
        data: data.data || data,
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      };
    } catch (error) {
      console.error('Error al parsear datos de push:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = '/';

  // Determinar URL basada en el tipo de notificación
  if (notificationData.post_id) {
    urlToOpen = `/post/${notificationData.post_id}`;
  } else if (notificationData.game_id) {
    urlToOpen = `/game/${notificationData.game_id}`;
  } else if (notificationData.server_id) {
    urlToOpen = `/server/${notificationData.server_id}`;
  }

  // Manejar acciones de notificación
  if (event.action) {
    switch (event.action) {
      case 'view':
        urlToOpen = notificationData.url || urlToOpen;
        break;
      case 'dismiss':
        return; // No hacer nada, solo cerrar
      default:
        break;
    }
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Buscar si ya hay una ventana abierta
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        // Enfocar la ventana existente y navegar
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          url: urlToOpen,
          data: notificationData
        });
        return client.focus();
      }
    }
    
    // Si no hay ventana abierta, abrir una nueva
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Notificación cerrada:', event);
  
  // Opcional: enviar analytics o limpiar datos
  const notificationData = event.notification.data || {};
  
  // Aquí podrías enviar una señal al servidor de que la notificación fue cerrada
  if (notificationData.trackClose) {
    fetch('/api/notifications/track-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: notificationData.id,
        action: 'close'
      })
    }).catch(error => {
      console.error('Error al trackear cierre de notificación:', error);
    });
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('Mensaje recibido en SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Función helper para obtener todos los clientes
function getClients() {
  return clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  });
}

// Función para enviar mensaje a todos los clientes
function broadcastMessage(message) {
  getClients().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}