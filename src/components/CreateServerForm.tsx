import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { GameServer } from '../types/game';

interface CreateServerFormProps {
  gameId: string;
  onServerCreated?: (server: GameServer) => void;
  onCancel?: () => void;
}

interface ServerFormData {
  name: string;
  description: string;
  server_ip: string;
  server_port: string;
  server_version: string;
  max_players: string;
  server_type: 'survival' | 'creative' | 'pvp' | 'roleplay' | 'minigames' | 'custom';
}

interface FormErrors {
  name?: string;
  description?: string;
  server_ip?: string;
  server_port?: string;
  server_version?: string;
  max_players?: string;
  server_type?: string;
  general?: string;
}

export default function CreateServerForm({ gameId, onServerCreated, onCancel }: CreateServerFormProps) {
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    server_ip: '',
    server_port: '25565',
    server_version: '',
    max_players: '100',
    server_type: 'survival'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar tecla Escape para cerrar el modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Función para manejar el cierre del modal
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    window.parent.postMessage({ type: 'CLOSE_CREATE_SERVER_FORM' }, '*');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servidor es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar descripción
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    // Validar IP del servidor
    if (!formData.server_ip.trim()) {
      newErrors.server_ip = 'La IP del servidor es requerida';
    } else {
      const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$|^localhost$/;
      if (!ipPattern.test(formData.server_ip.trim())) {
        newErrors.server_ip = 'Ingresa una IP válida o un nombre de dominio';
      }
    }

    // Validar puerto
    const port = parseInt(formData.server_port);
    if (!formData.server_port || isNaN(port) || port < 1 || port > 65535) {
      newErrors.server_port = 'El puerto debe ser un número entre 1 y 65535';
    }

    // Validar versión
    if (!formData.server_version.trim()) {
      newErrors.server_version = 'La versión del servidor es requerida';
    } else {
      const versionPattern = /^\d+\.\d+(\.\d+)?(-\w+)?$/;
      if (!versionPattern.test(formData.server_version.trim())) {
        newErrors.server_version = 'Formato de versión inválido (ej: 1.20.1, 1.19.2-forge)';
      }
    }

    // Validar máximo de jugadores
    const maxPlayers = parseInt(formData.max_players);
    if (!formData.max_players || isNaN(maxPlayers) || maxPlayers < 1 || maxPlayers > 1000) {
      newErrors.max_players = 'El máximo de jugadores debe ser un número entre 1 y 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setErrors({ general: 'Debes estar autenticado para crear un servidor' });
        return;
      }

      // Preparar datos del servidor
      const serverData = {
        game_id: gameId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        server_ip: formData.server_ip.trim(),
        server_port: parseInt(formData.server_port),
        server_version: formData.server_version.trim(),
        max_players: parseInt(formData.max_players),
        server_type: formData.server_type,
        is_active: true,
        is_featured: false,
        owner_id: user.id
      };

      // Verificar si ya existe un servidor con el mismo nombre
      const { data: existingServers } = await supabase
        .from('game_servers')
        .select('id, name')
        .eq('game_id', gameId)
        .eq('name', formData.name.trim())
        .eq('is_active', true);

      if (existingServers && existingServers.length > 0) {
        setErrors({ name: 'Ya existe un servidor con este nombre en este juego' });
        return;
      }

      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrors({ general: 'Sesión expirada. Por favor, inicia sesión nuevamente.' });
        return;
      }

      // Crear servidor
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(serverData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 401) {
          setErrors({ general: 'No tienes permisos para crear servidores. Inicia sesión nuevamente.' });
        } else if (response.status === 400) {
          setErrors({ general: result.error || 'Datos del servidor inválidos' });
        } else if (response.status === 409) {
          setErrors({ name: 'Ya existe un servidor con este nombre' });
        } else {
          setErrors({ general: result.error || 'Error al crear el servidor' });
        }
        return;
      }

      // Notificar éxito
      if (onServerCreated && result.data) {
        onServerCreated(result.data);
      }

      // Enviar mensaje al componente padre
      window.parent.postMessage({ type: 'SERVER_CREATED', data: result.data }, '*');

      // Limpiar formulario
      setFormData({
        name: '',
        description: '',
        server_ip: '',
        server_port: '25565',
        server_version: '',
        max_players: '100',
        server_type: 'survival'
      });

    } catch (error) {
      console.error('Error creating server:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error inesperado al crear el servidor' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-calico backdrop-blur-sm border border-calico-stripe-light/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-calico-white">Crear Nuevo Servidor</h2>
          <button
            onClick={handleCancel}
            className="text-calico-gray-400 hover:text-calico-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del servidor */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-calico-white mb-2">
              Nombre del Servidor *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
              placeholder="Ej: Mi Servidor Survival"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-calico-white mb-2">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent resize-none"
              placeholder="Describe tu servidor, sus características y reglas..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* IP y Puerto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="server_ip" className="block text-sm font-medium text-calico-white mb-2">
                IP del Servidor *
              </label>
              <input
                type="text"
                id="server_ip"
                name="server_ip"
                value={formData.server_ip}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
                placeholder="Ej: play.miservidor.com"
                disabled={isSubmitting}
              />
              {errors.server_ip && (
                <p className="mt-2 text-sm text-red-400">{errors.server_ip}</p>
              )}
            </div>

            <div>
              <label htmlFor="server_port" className="block text-sm font-medium text-calico-white mb-2">
                Puerto *
              </label>
              <input
                type="number"
                id="server_port"
                name="server_port"
                value={formData.server_port}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.server_port && (
                <p className="mt-2 text-sm text-red-400">{errors.server_port}</p>
              )}
            </div>
          </div>

          {/* Versión y Máximo de jugadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="server_version" className="block text-sm font-medium text-calico-white mb-2">
                Versión *
              </label>
              <input
                type="text"
                id="server_version"
                name="server_version"
                value={formData.server_version}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
                placeholder="Ej: 1.20.1"
                disabled={isSubmitting}
              />
              {errors.server_version && (
                <p className="mt-2 text-sm text-red-400">{errors.server_version}</p>
              )}
            </div>

            <div>
              <label htmlFor="max_players" className="block text-sm font-medium text-calico-white mb-2">
                Máximo de Jugadores *
              </label>
              <input
                type="number"
                id="max_players"
                name="max_players"
                value={formData.max_players}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              {errors.max_players && (
                <p className="mt-2 text-sm text-red-400">{errors.max_players}</p>
              )}
            </div>
          </div>

          {/* Tipo de servidor */}
          <div>
            <label htmlFor="server_type" className="block text-sm font-medium text-calico-white mb-2">
              Tipo de Servidor *
            </label>
            <select
              id="server_type"
              name="server_type"
              value={formData.server_type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-calico-stripe-dark/50 border border-calico-stripe-light/30 rounded-xl text-calico-white focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="survival">Survival</option>
              <option value="creative">Creative</option>
              <option value="pvp">PvP</option>
              <option value="roleplay">Roleplay</option>
              <option value="minigames">Minijuegos</option>
              <option value="custom">Personalizado</option>
            </select>
            {errors.server_type && (
              <p className="mt-2 text-sm text-red-400">{errors.server_type}</p>
            )}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-calico-orange-600 hover:bg-calico-orange-700 disabled:bg-calico-orange-600/50 text-calico-white font-medium py-3 px-6 rounded-xl transition-colors hover-glow-orange focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:ring-offset-2 focus:ring-offset-calico-stripe-dark"
            >
              {isSubmitting ? 'Creando...' : 'Crear Servidor'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-calico-stripe-dark hover:bg-calico-stripe-light/20 disabled:bg-calico-stripe-dark/50 text-calico-white font-medium py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-calico-stripe-light focus:ring-offset-2 focus:ring-offset-calico-stripe-dark"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}