import React, { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

/**
 * Componente que maneja la verificación automática de sesión
 * Debe ser incluido en el layout principal de la aplicación
 */
const SessionManager: React.FC = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Importar dinámicamente las funciones de auth para evitar problemas de SSR
    const initializeSessionManagement = async () => {
      try {
        const { setupSessionVerification } = await import('../../utils/auth');
        
        // Configurar la verificación automática de sesión
        setupSessionVerification();
        
        // Escuchar eventos de sesión expirada
        const handleSessionExpired = (event: CustomEvent) => {
          addNotification(event.detail.message, 'error');
        };
        
        window.addEventListener('sessionExpired', handleSessionExpired as EventListener);
        
        // Cleanup
        return () => {
          window.removeEventListener('sessionExpired', handleSessionExpired as EventListener);
        };
      } catch (error) {
        console.error('Error initializing session management:', error);
      }
    };

    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      initializeSessionManagement();
    }
  }, [addNotification]);

  // Este componente no renderiza nada visible
  return null;
};

export default SessionManager;