import React, { useState, useEffect } from 'react';
import { uploadGameImage, deleteGameImage, type ImageUploadResult } from '../utils/imageUpload';
import { supabase } from '../utils/supabaseClient';

interface Game {
  id: string;
  name: string;
  description: string;
  genre: string;
  platform: string;
  cover_image_url: string;
  has_servers: boolean;
}

interface EditGameFormProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  genre: string;
  platform: string;
  has_servers: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  genre?: string;
  platform?: string;
  image?: string;
  general?: string;
}

interface ImageUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
}

const EditGameForm: React.FC<EditGameFormProps> = ({ game, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    genre: '',
    platform: '',
    has_servers: false
  });

  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    file: null,
    preview: null,
    uploading: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del juego cuando se abre el modal
  useEffect(() => {
    if (isOpen && game) {
      setFormData({
        name: game.name || '',
        description: game.description || '',
        genre: game.genre || '',
        platform: game.platform || '',
        has_servers: game.has_servers || false
      });
      
      // Si hay imagen existente, mostrarla como preview
      if (game.cover_image_url) {
        setImageUpload({
          file: null,
          preview: game.cover_image_url,
          uploading: false
        });
      } else {
        setImageUpload({
          file: null,
          preview: null,
          uploading: false
        });
      }
      
      setErrors({});
    }
  }, [isOpen, game]);

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

    if (imageUpload.file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(imageUpload.file.type)) {
        newErrors.image = 'Solo se permiten archivos JPG, PNG y WEBP';
      } else if (imageUpload.file.size > 5 * 1024 * 1024) {
        newErrors.image = 'La imagen no puede ser mayor a 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUpload({
        file,
        preview: e.target?.result as string,
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
    setImageUpload({
      file: null,
      preview: game.cover_image_url || null, // Volver a la imagen original
      uploading: false
    });
    
    // Limpiar el input de archivo
    const fileInput = document.getElementById('image-upload-edit') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setErrors({ general: 'Debes iniciar sesión para editar juegos' });
        return;
      }

      let imageUrl = game.cover_image_url; // Mantener imagen actual por defecto

      // Si se seleccionó una nueva imagen, subirla
      if (imageUpload.file) {
        setImageUpload(prev => ({ ...prev, uploading: true }));
        
        try {
          const uploadResult: ImageUploadResult = await uploadGameImage(imageUpload.file, game.id);
          imageUrl = uploadResult.url;
          
          // Si había una imagen anterior y era del bucket, eliminarla
          if (game.cover_image_url && game.cover_image_url.includes('supabase')) {
            try {
              const urlParts = game.cover_image_url.split('/');
              const oldFileName = urlParts[urlParts.length - 1];
              await deleteGameImage(oldFileName);
            } catch (deleteError) {
              console.warn('Error eliminando imagen anterior:', deleteError);
            }
          }
        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          setErrors({ image: 'Error al subir la imagen. Inténtalo de nuevo.' });
          setImageUpload(prev => ({ ...prev, uploading: false }));
          return;
        }
      }

      // Preparar datos para enviar
      const gameDataToSend = {
        id: game.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        genre: formData.genre.trim(),
        platform: formData.platform.trim(),
        cover_image_url: imageUrl,
        has_servers: formData.has_servers
      };

      // Enviar datos al servidor
      const response = await fetch('/api/games', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(gameDataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ general: result.error || 'Error al actualizar el juego' });
      }
    } catch (error) {
      console.error('Error updating game:', error);
      setErrors({ general: 'Error al actualizar el juego. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
      setImageUpload(prev => ({ ...prev, uploading: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-calico-stripe-dark border border-calico-stripe-light/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-calico-white">
              Editar Juego
            </h2>
            <button
              onClick={onClose}
              className="text-calico-gray-400 hover:text-calico-white transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                placeholder="Ej: League of Legends"
                disabled={isSubmitting}
                required
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
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark/50 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base resize-none ${
                  errors.description 
                    ? 'border-red-500 focus:ring-red-500/50' 
                    : 'border-calico-stripe-light/30 focus:border-calico-orange-500 focus:ring-calico-orange-500/20'
                }`}
                placeholder="Describe el juego..."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Género y Plataforma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
                  Género
                </label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark/50 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                    errors.genre 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-calico-stripe-light/30 focus:border-calico-orange-500 focus:ring-calico-orange-500/20'
                  }`}
                  placeholder="Ej: MOBA, FPS, RPG"
                  disabled={isSubmitting}
                />
                {errors.genre && (
                  <p className="mt-1 text-sm text-red-400">{errors.genre}</p>
                )}
              </div>

              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-calico-gray-300 mb-1.5 sm:mb-2">
                  Plataforma
                </label>
                <input
                  type="text"
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-calico-stripe-dark/50 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base ${
                    errors.platform 
                      ? 'border-red-500 focus:ring-red-500/50' 
                      : 'border-calico-stripe-light/30 focus:border-calico-orange-500 focus:ring-calico-orange-500/20'
                  }`}
                  placeholder="Ej: PC, PlayStation, Xbox"
                  disabled={isSubmitting}
                />
                {errors.platform && (
                  <p className="mt-1 text-sm text-red-400">{errors.platform}</p>
                )}
              </div>
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
                  id="image-upload-edit"
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
                    {imageUpload.file ? 'Cambiar imagen' : 'Seleccionar nueva imagen'}
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

            {/* Checkbox de servidores */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_servers"
                name="has_servers"
                checked={formData.has_servers}
                onChange={handleInputChange}
                className="w-4 h-4 text-calico-orange-500 bg-calico-stripe-dark border-calico-stripe-light/30 rounded focus:ring-calico-orange-500/20 focus:ring-2"
                disabled={isSubmitting}
              />
              <label htmlFor="has_servers" className="ml-2 text-sm text-calico-gray-300">
                Este juego tiene servidores
              </label>
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-calico-stripe-light/20 hover:bg-calico-stripe-light/30 text-calico-gray-300 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-calico-orange-500 to-calico-orange-600 hover:from-calico-orange-600 hover:to-calico-orange-700 text-white px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isSubmitting || imageUpload.uploading}
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Juego'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditGameForm;