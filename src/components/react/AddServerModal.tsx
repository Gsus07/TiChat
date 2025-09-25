import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import { getGameByName, getServerByName, isServerSlugUnique } from '../../utils/games';
import { getCurrentUserClient } from '../../utils/auth';
import { supabase } from '../../utils/supabaseClient';

interface ServerFormData {
  name: string;
  description: string;
  ip: string;
  port: string;
  version: string;
  image: string;
  serverType: 'survival' | 'creative' | 'pvp' | 'roleplay' | 'minigames' | 'custom';
  maxPlayers: string;
}

interface ServerFormErrors {
  name?: string;
  description?: string;
  ip?: string;
  port?: string;
  version?: string;
  image?: string;
  maxPlayers?: string;
}

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingServer?: any;
}

const AddServerModal: React.FC<AddServerModalProps> = ({ isOpen = false, onClose, editingServer }) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    ip: '',
    port: '25565',
    version: '1.20.1',
    image: '/minecraft-custom.jpg',
    serverType: 'custom',
    maxPlayers: '50'
  });

  const [errors, setErrors] = useState<ServerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  const imageOptions = [
    '/minecraft-survival.jpg',
    '/minecraft-creative.jpg',
    '/minecraft-modded.jpg',
    '/minecraft-pvp.jpg',
    '/minecraft-skyblock.jpg',
    '/minecraft-minigames.jpg',
    '/minecraft-custom.jpg'
  ];

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('openAddServerModal', handleOpenModal);
    return () => window.removeEventListener('openAddServerModal', handleOpenModal);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Update modal state when prop changes
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  // Reset form when modal opens/closes or when editing server changes
  useEffect(() => {
    if (isModalOpen) {
      if (editingServer) {
        setFormData({
          name: editingServer.name || '',
          description: editingServer.description || '',
          ip: editingServer.ip || '',
          port: editingServer.port || '25565',
          version: editingServer.version || '1.20.1',
          image: editingServer.image || '/minecraft-custom.jpg',
          serverType: editingServer.serverType || 'custom',
          maxPlayers: editingServer.maxPlayers || '50'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          ip: '',
          port: '25565',
          version: '1.20.1',
          image: '/minecraft-custom.jpg',
          serverType: 'custom',
          maxPlayers: '50'
        });
      }
      setErrors({});
    }
  }, [isModalOpen, editingServer]);

  const validateForm = (): boolean => {
    const newErrors: ServerFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servidor es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    if (!formData.ip.trim()) {
      newErrors.ip = 'La dirección IP es requerida';
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.ip)) {
      newErrors.ip = 'Formato de IP inválido (solo letras, números, puntos y guiones)';
    } else if (formData.ip.length > 255) {
      newErrors.ip = 'La dirección IP es demasiado larga';
    }

    if (!formData.port.trim()) {
      newErrors.port = 'El puerto es requerido';
    } else if (!/^\d+$/.test(formData.port) || parseInt(formData.port) < 1 || parseInt(formData.port) > 65535) {
      newErrors.port = 'Puerto inválido (1-65535)';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'La versión es requerida';
    }

    if (!formData.maxPlayers.trim()) {
      newErrors.maxPlayers = 'El número máximo de jugadores es requerido';
    } else if (!/^\d+$/.test(formData.maxPlayers) || parseInt(formData.maxPlayers) < 1) {
      newErrors.maxPlayers = 'Debe ser un número mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ServerFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Obtener el juego de Minecraft
      const minecraftGameResult = await getGameByName('Minecraft');
      if (!minecraftGameResult.data) {
        throw new Error('No se pudo encontrar el juego Minecraft');
      }
      
      // Obtener el usuario actual
      const currentUser = getCurrentUserClient();
      if (!currentUser) {
        addNotification('Debes estar autenticado para crear un servidor', 'error');
        return;
      }
      
      const serverData = {
        game_id: minecraftGameResult.data.id,
        name: formData.name,
        description: formData.description,
        server_ip: formData.ip,
        server_port: parseInt(formData.port),
        server_version: formData.version,
        max_players: parseInt(formData.maxPlayers),
        server_type: formData.serverType,
        is_active: true,
        is_featured: false,
        owner_id: currentUser.id
      };
      
      if (editingServer) {
        // TODO: Implementar actualización de servidor existente
        addNotification('Función de edición aún no implementada', 'warning');
        return;
      } else {
        // Verificar si el slug del servidor es único
        const isUnique = await isServerSlugUnique(formData.name, minecraftGameResult.data.id);
        if (!isUnique) {
          addNotification('Ya existe un servidor con ese nombre. Por favor, elige otro nombre.', 'error');
          return;
        }
        
        // Crear nuevo servidor usando la API
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No hay sesión activa');
        }
        
        const response = await fetch('/api/servers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(serverData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al crear el servidor');
        }
        
        addNotification('Servidor creado correctamente en la base de datos', 'success');
      }
      
      // Notify parent to reload servers
      const reloadEvent = new CustomEvent('serverUpdated');
      window.dispatchEvent(reloadEvent);
      
      // Close modal
      setIsModalOpen(false);
      if (onClose) onClose();
      
      // Reload the page to show the new server
      window.location.reload();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el servidor';
      addNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
    setShowImageGallery(false);
  };

  return (
    <>
      {/* Main Modal */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
          isModalOpen ? 'block' : 'hidden'
        }`} 
        data-react-modal="add-server"
        style={{ overflow: isModalOpen ? 'hidden' : 'auto' }}
      >
        <div className="bg-calico-gray-800 rounded-xl w-full max-w-md border border-white/10 max-h-[90vh] flex flex-col">
          <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-calico-white">
              {editingServer ? 'Editar Servidor' : 'Añadir Nuevo Servidor'}
            </h3>
            <button 
                 onClick={() => {
                   setIsModalOpen(false);
                   if (onClose) onClose();
                 }}
                 className="text-calico-gray-400 hover:text-calico-white transition-colors"
               >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Nombre del Servidor</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.name ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: Mi Servidor Personalizado"
              />
              {errors.name && <p className="text-calico-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Descripción</label>
              <input 
                type="text" 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.description ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: Servidor de aventuras épicas"
              />
              {errors.description && <p className="text-calico-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Dirección IP</label>
              <input 
                type="text" 
                name="ip"
                value={formData.ip}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.ip ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: miservidor.com"
              />
              {errors.ip && <p className="text-calico-red-400 text-sm mt-1">{errors.ip}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Puerto</label>
              <input 
                type="text" 
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.port ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: 25565"
              />
              {errors.port && <p className="text-calico-red-400 text-sm mt-1">{errors.port}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Versión</label>
              <input 
                type="text" 
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.version ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: 1.20.1"
              />
              {errors.version && <p className="text-calico-red-400 text-sm mt-1">{errors.version}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Tipo de Servidor</label>
              <select 
                name="serverType"
                value={formData.serverType}
                onChange={(e) => setFormData(prev => ({ ...prev, serverType: e.target.value as any }))}
                className="w-full bg-calico-gray-700 border border-white/20 rounded-lg p-3 text-calico-white focus:outline-none focus:ring-2 focus:ring-calico-orange-500 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="survival" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>Supervivencia</option>
                <option value="creative" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>Creativo</option>
                <option value="pvp" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>PvP</option>
                <option value="roleplay" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>Roleplay</option>
                <option value="minigames" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>Minijuegos</option>
                <option value="custom" style={{ backgroundColor: '#334155', color: '#F5F5DC', padding: '8px' }}>Personalizado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Máximo de Jugadores</label>
              <input 
                type="text" 
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
                  errors.maxPlayers ? 'border-calico-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: 50"
              />
              {errors.maxPlayers && <p className="text-calico-red-400 text-sm mt-1">{errors.maxPlayers}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-calico-gray-300 mb-2">Imagen (URL)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="Ej: /mi-servidor.jpg" 
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg p-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500"
                />
                <button 
                  type="button" 
                  onClick={() => setShowImageGallery(true)}
                  className="px-4 py-3 bg-calico-orange-500/20 border border-calico-orange-500/30 rounded-lg text-calico-orange-400 hover:text-calico-orange-300 hover:bg-calico-orange-500/30 transition-colors"
                  title="Seleccionar de galería"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button 
                 type="button" 
                 onClick={() => {
                   setIsModalOpen(false);
                   if (onClose) onClose();
                 }}
                 className="flex-1 bg-calico-gray-600 hover:bg-calico-gray-700 text-calico-white py-2 px-4 rounded-lg transition-colors"
               >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-calico-orange-600 hover:bg-calico-orange-700 disabled:bg-calico-orange-800 disabled:cursor-not-allowed text-calico-white py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Guardando...' : (editingServer ? 'Actualizar Servidor' : 'Crear Servidor')}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-calico-gray-800 rounded-xl p-6 w-full max-w-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-calico-white">Seleccionar Imagen</h3>
              <button 
                onClick={() => setShowImageGallery(false)}
                className="text-calico-gray-400 hover:text-calico-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageOptions.map((imageUrl) => (
                <button
                  key={imageUrl}
                  onClick={() => handleImageSelect(imageUrl)}
                  className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                    formData.image === imageUrl 
                      ? 'border-calico-orange-500 ring-2 ring-calico-orange-500/50' 
                      : 'border-white/20 hover:border-calico-orange-400'
                  }`}
                >
                  <img 
                    src={imageUrl} 
                    alt="Server option" 
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  {formData.image === imageUrl && (
                    <div className="absolute inset-0 bg-calico-orange-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-calico-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddServerModal;