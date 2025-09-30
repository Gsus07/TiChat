import React, { useState, useEffect } from 'react';
import { usePushNotifications } from './PushNotificationManager';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  new_posts: boolean;
  new_servers: boolean;
  new_games: boolean;
  follows: boolean;
}

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    new_posts: true,
    new_servers: true,
    new_games: false,
    follows: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Error al cargar preferencias');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar preferencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Error al guardar preferencias');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al guardar preferencias:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (pushPermission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }
      
      if (!pushSubscribed) {
        await subscribe();
      }
    } else {
      if (pushSubscribed) {
        await unsubscribe();
      }
    }
    
    handlePreferenceChange('push_notifications', enabled);
  };

  const ToggleSwitch: React.FC<{
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ id, label, description, checked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h2>
        <p className="text-gray-600 mt-2">
          Personaliza cómo y cuándo quieres recibir notificaciones
        </p>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800">Preferencias guardadas correctamente</p>
          </div>
        </div>
      )}

      {/* Configuración de canales de notificación */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Canales de Notificación</h3>
        
        <ToggleSwitch
          id="email_notifications"
          label="Notificaciones por Email"
          description="Recibe notificaciones importantes en tu correo electrónico"
          checked={preferences.email_notifications}
          onChange={(checked) => handlePreferenceChange('email_notifications', checked)}
        />

        <div className="space-y-2">
          <ToggleSwitch
            id="push_notifications"
            label="Notificaciones Push"
            description="Recibe notificaciones instantáneas en tu navegador"
            checked={preferences.push_notifications && pushSubscribed}
            onChange={handlePushToggle}
            disabled={!pushSupported}
          />
          
          {!pushSupported && (
            <p className="text-sm text-yellow-600 ml-4">
              ⚠️ Las notificaciones push no están soportadas en este navegador
            </p>
          )}
          
          {pushSupported && pushPermission === 'denied' && (
            <p className="text-sm text-red-600 ml-4">
              ❌ Los permisos de notificación han sido denegados. Habilítalos en la configuración del navegador.
            </p>
          )}
          
          {pushSupported && preferences.push_notifications && (
            <div className="ml-4">
              <button
                onClick={testNotification}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Probar notificación
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de tipos de notificación */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tipos de Notificación</h3>
        
        <ToggleSwitch
          id="new_posts"
          label="Nuevos Posts"
          description="Notificar cuando se publique contenido nuevo en los juegos que sigues"
          checked={preferences.new_posts}
          onChange={(checked) => handlePreferenceChange('new_posts', checked)}
        />

        <ToggleSwitch
          id="new_servers"
          label="Nuevos Servidores"
          description="Notificar cuando se agreguen nuevos servidores a tus juegos favoritos"
          checked={preferences.new_servers}
          onChange={(checked) => handlePreferenceChange('new_servers', checked)}
        />

        <ToggleSwitch
          id="new_games"
          label="Nuevos Juegos"
          description="Notificar cuando se agreguen nuevos juegos a la plataforma"
          checked={preferences.new_games}
          onChange={(checked) => handlePreferenceChange('new_games', checked)}
        />

        <ToggleSwitch
          id="follows"
          label="Actividad de Seguidos"
          description="Notificar sobre la actividad de usuarios que sigues"
          checked={preferences.follows}
          onChange={(checked) => handlePreferenceChange('follows', checked)}
        />
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-blue-800">
            <p className="font-medium">Información sobre las notificaciones</p>
            <ul className="mt-2 text-sm space-y-1">
              <li>• Las notificaciones push funcionan incluso cuando el sitio está cerrado</li>
              <li>• Puedes cambiar estas preferencias en cualquier momento</li>
              <li>• Las notificaciones por email se envían máximo una vez por día</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;