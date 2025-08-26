import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

interface ServerFormData {
  name: string;
  description: string;
  ip: string;
  port: string;
  version: string;
  image: string;
}

interface ServerFormErrors {
  name?: string;
  description?: string;
  ip?: string;
  port?: string;
  version?: string;
  image?: string;
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
    image: '/minecraft-custom.jpg'
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
          image: editingServer.image || '/minecraft-custom.jpg'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          ip: '',
          port: '25565',
          version: '1.20.1',
          image: '/minecraft-custom.jpg'
        });
      }
      setErrors({});
    }
  }, [isModalOpen, editingServer]);

  const validateForm = (): boolean => {
    const newErrors: ServerFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del servidor es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.ip.trim()) {
      newErrors.ip = 'La dirección IP es requerida';
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.ip)) {
      newErrors.ip = 'Formato de IP inválido';
    }

    if (!formData.port.trim()) {
      newErrors.port = 'El puerto es requerido';
    } else if (!/^\d+$/.test(formData.port) || parseInt(formData.port) < 1 || parseInt(formData.port) > 65535) {
      newErrors.port = 'Puerto inválido (1-65535)';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'La versión es requerida';
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
      const serverName = formData.name;
      const serverSlug = serverName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const serverData = {
        id: editingServer?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        ip: formData.ip,
        port: formData.port,
        version: formData.version,
        image: formData.image,
        link: `/minecraft/custom-${serverSlug}`
      };
      
      // Get existing servers
      let customServers = JSON.parse(localStorage.getItem('minecraft_customServers') || '[]');
      
      if (editingServer) {
        // Update existing server
        const serverIndex = customServers.findIndex((s: any) => s.id === editingServer.id);
        if (serverIndex !== -1) {
          customServers[serverIndex] = serverData;
        }
        
        // Show success notification
        addNotification('Servidor actualizado correctamente', 'success');
      } else {
        // Add new server
        customServers.push(serverData);
        
        // Show success notification
        addNotification('Servidor agregado correctamente', 'success');
      }
      
      // Save to localStorage
      localStorage.setItem('minecraft_customServers', JSON.stringify(customServers));
      
      // Notify parent to reload servers
      const reloadEvent = new CustomEvent('serverUpdated');
      window.dispatchEvent(reloadEvent);
      
      // Close modal
        setIsModalOpen(false);
        if (onClose) onClose();
    } catch (error) {
      console.error('Error saving server:', error);
      addNotification('Error al guardar el servidor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
    setShowImageGallery(false);
  };

  if (!isModalOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-react-modal="add-server">
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingServer ? 'Editar Servidor' : 'Añadir Nuevo Servidor'}
            </h3>
            <button 
                 onClick={() => {
                   setIsModalOpen(false);
                   if (onClose) onClose();
                 }}
                 className="text-gray-400 hover:text-white transition-colors"
               >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Servidor</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.name ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: Mi Servidor Personalizado"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
              <input 
                type="text" 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.description ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: Servidor de aventuras épicas"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dirección IP</label>
              <input 
                type="text" 
                name="ip"
                value={formData.ip}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.ip ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: miservidor.com"
              />
              {errors.ip && <p className="text-red-400 text-sm mt-1">{errors.ip}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Puerto</label>
              <input 
                type="text" 
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.port ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: 25565"
              />
              {errors.port && <p className="text-red-400 text-sm mt-1">{errors.port}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Versión</label>
              <input 
                type="text" 
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.version ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Ej: 1.20.1"
              />
              {errors.version && <p className="text-red-400 text-sm mt-1">{errors.version}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagen (URL)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="Ej: /mi-servidor.jpg" 
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button 
                  type="button" 
                  onClick={() => setShowImageGallery(true)}
                  className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/30 transition-colors"
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
                 className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
               >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Guardando...' : (editingServer ? 'Actualizar Servidor' : 'Crear Servidor')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Seleccionar Imagen</h3>
              <button 
                onClick={() => setShowImageGallery(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
                      ? 'border-green-500 ring-2 ring-green-500/50' 
                      : 'border-white/20 hover:border-green-400'
                  }`}
                >
                  <img 
                    src={imageUrl} 
                    alt="Server option" 
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  {formData.image === imageUrl && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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