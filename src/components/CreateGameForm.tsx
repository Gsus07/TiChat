import React, { useState } from 'react';
import type { Game } from '../types/game';
import { supabase } from '../utils/supabaseClient';
import { useNotifications } from './react/NotificationProvider';
import { uploadGameImage, validateImageFile } from '../utils/imageUpload';

interface CreateGameFormProps {
  onGameCreated: (game: Game) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  genre: string;
  platform: string;
  cover_image_url: string;
  has_servers: boolean;
}

interface ImageUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  genre?: string;
  platform?: string;
  cover_image_url?: string;
  image?: string;
  general?: string;
}

export default function CreateGameForm({ onGameCreated, onCancel }: CreateGameFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    genre: '',
    platform: '',
    cover_image_url: '',
    has_servers: false
  });

  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del juego es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar imagen si se seleccionó un archivo
    if (imageUpload.file) {
      const imageValidation = validateImageFile(imageUpload.file);
      if (!imageValidation.valid) {
        newErrors.image = imageValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setImageUpload({ file: null, preview: null, uploading: false });
      return;
    }

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, image: validation.error }));
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUpload({
        file,
        preview: event.target?.result as string,
        uploading: false
      });
    };
    reader.readAsDataURL(file);

    // Limpiar errores de imagen
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const removeImage = () => {
    setImageUpload({ file: null, preview: null, uploading: false });
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Obtener el token de autenticación de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No estás autenticado. Por favor, inicia sesión.');
      }

      let imageUrl = formData.cover_image_url;

      // Subir imagen si se seleccionó un archivo
      if (imageUpload.file) {
        setImageUpload(prev => ({ ...prev, uploading: true }));
        
        const uploadResult = await uploadGameImage(imageUpload.file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Error al subir la imagen');
        }
        
        imageUrl = uploadResult.url || '';
        setImageUpload(prev => ({ ...prev, uploading: false }));
      }

      // Preparar datos del juego con la URL de imagen
      const gameDataToSend = {
        ...formData,
        cover_image_url: imageUrl
      };

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(gameDataToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el juego');
      }

      console.log('✅ Juego creado exitosamente:', result.data);
      addNotification('¡Juego creado exitosamente!', 'success');
      onGameCreated(result.data);
      
    } catch (error) {
      console.error('❌ Error creando juego:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el juego';
      setErrors({ general: errorMessage });
      addNotification(errorMessage, 'error');
      setImageUpload(prev => ({ ...prev, uploading: false }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="glass-calico backdrop-blur-md border border-calico-stripe-light/20 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Scroll indicator for mobile */}
        <div className="sm:hidden w-12 h-1 bg-surface-600 rounded-full mx-auto mb-4"></div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-calico-white">Crear Nuevo Juego</h2>
          <button
            onClick={onCancel}
            className="text-surface-400 hover:text-white transition-colors p-1 hover:bg-surface-700/50 rounded-lg"
            type="button"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Nombre del juego */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
              Nombre del juego *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark/50 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-calico-stripe-light/30 focus:border-calico-orange-500 focus:ring-calico-orange-500/20'
              }`}
              placeholder="Ej: Minecraft, Valorant, League of Legends"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark/50 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all resize-none text-sm sm:text-base ${
                errors.description 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-calico-stripe-light/30 focus:border-calico-orange-500 focus:ring-calico-orange-500/20'
              }`}
              placeholder="Describe el juego y su comunidad..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Género */}
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
              Género
            </label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark border border-calico-stripe-light/30 rounded-xl text-calico-white focus:outline-none focus:ring-2 focus:border-calico-orange-500 focus:ring-calico-orange-500/20 transition-all text-sm sm:text-base"
              style={{ backgroundColor: '#1f2937', color: '#ffffff' }}
              disabled={isSubmitting}
            >
              <option value="" style={{ backgroundColor: '#374151', color: '#9ca3af' }}>Seleccionar género</option>
              <option value="Acción" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Acción</option>
              <option value="Aventura" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Aventura</option>
              <option value="RPG" style={{ backgroundColor: '#374151', color: '#ffffff' }}>RPG</option>
              <option value="Estrategia" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Estrategia</option>
              <option value="Simulación" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Simulación</option>
              <option value="Deportes" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Deportes</option>
              <option value="Carreras" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Carreras</option>
              <option value="Shooter" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Shooter</option>
              <option value="MOBA" style={{ backgroundColor: '#374151', color: '#ffffff' }}>MOBA</option>
              <option value="Battle Royale" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Battle Royale</option>
              <option value="Sandbox" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Sandbox</option>
              <option value="Supervivencia" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Supervivencia</option>
              <option value="Otro" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Otro</option>
            </select>
          </div>

          {/* Plataforma */}
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
              Plataforma
            </label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark border border-calico-stripe-light/30 rounded-xl text-calico-white focus:outline-none focus:ring-2 focus:border-calico-orange-500 focus:ring-calico-orange-500/20 transition-all text-sm sm:text-base"
              style={{ backgroundColor: '#1f2937', color: '#ffffff' }}
              disabled={isSubmitting}
            >
              <option value="" style={{ backgroundColor: '#374151', color: '#9ca3af' }}>Seleccionar plataforma</option>
              <option value="PC" style={{ backgroundColor: '#374151', color: '#ffffff' }}>PC</option>
              <option value="PlayStation" style={{ backgroundColor: '#374151', color: '#ffffff' }}>PlayStation</option>
              <option value="Xbox" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Xbox</option>
              <option value="Nintendo Switch" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Nintendo Switch</option>
              <option value="Mobile" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Mobile</option>
              <option value="Multiplataforma" style={{ backgroundColor: '#374151', color: '#ffffff' }}>Multiplataforma</option>
            </select>
          </div>

          {/* Subida de imagen */}
          <div>
            <label className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
              Imagen de portada
            </label>
            
            {/* Preview de imagen */}
            {imageUpload.preview && (
              <div className="mb-3 relative">
                <img 
                  src={imageUpload.preview} 
                  alt="Preview" 
                  className="w-full h-32 sm:h-40 object-cover rounded-xl border border-calico-stripe-light/30"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  disabled={isSubmitting || imageUpload.uploading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {imageUpload.uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-white">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm">Subiendo...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Input de archivo */}
            <div className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 transition-all ${
              errors.image 
                ? 'border-red-500 bg-red-500/5' 
                : 'border-calico-stripe-light/30 hover:border-calico-orange-500/50 bg-calico-stripe-dark/20'
            }`}>
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting || imageUpload.uploading}
              />
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-calico-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm sm:text-base text-calico-gray-300 mb-1">
                  {imageUpload.preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </p>
                <p className="text-xs text-calico-gray-400">
                  JPG, PNG, WEBP hasta 5MB
                </p>
              </div>
            </div>
            
            {errors.image && (
              <p className="mt-1 text-sm text-red-400">{errors.image}</p>
            )}
          </div>

          {/* Tiene servidores */}
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-calico-stripe-dark/30 rounded-xl border border-calico-stripe-light/20">
            <input
              type="checkbox"
              id="has_servers"
              name="has_servers"
              checked={formData.has_servers}
              onChange={handleInputChange}
              className="w-4 h-4 sm:w-5 sm:h-5 text-calico-orange-500 bg-calico-stripe-dark border-calico-stripe-light/30 rounded focus:ring-calico-orange-500 focus:ring-2"
              disabled={isSubmitting}
            />
            <label htmlFor="has_servers" className="text-sm sm:text-base text-calico-white cursor-pointer">
              Este juego tiene servidores
            </label>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm sm:text-base text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-calico-stripe-dark hover:bg-calico-stripe-light/20 text-calico-white rounded-xl transition-colors text-sm sm:text-base font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-calico-orange-600 to-calico-orange-500 hover:from-calico-orange-700 hover:to-calico-orange-600 text-calico-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium shadow-lg hover:shadow-xl hover-glow-orange"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creando...</span>
                </span>
              ) : (
                'Crear Juego'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}