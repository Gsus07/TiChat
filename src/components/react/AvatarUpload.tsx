import React, { useState, useRef } from 'react';
import { changeUserAvatar } from '../../utils/storage';
import { useNotifications } from './NotificationProvider';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (newAvatarUrl: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'medium',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  // Configuración de tamaños
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      addNotification('Solo se permiten archivos de imagen', 'error');
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addNotification('El archivo es demasiado grande. Máximo 5MB permitido', 'error');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const result = await changeUserAvatar(file);

      if (result.error) {
        addNotification(result.error, 'error');
        setPreviewUrl(null);
      } else if (result.data) {
        addNotification('Avatar actualizado correctamente', 'success');
        onAvatarChange?.(result.data.publicUrl);
        setPreviewUrl(null); // Limpiar preview ya que se actualizó el avatar principal
      }
    } catch (error) {
      addNotification('Error inesperado al subir el avatar', 'error');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl || '/default-avatar.png';

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Avatar clickeable */}
      <div
        onClick={handleClick}
        className={`
          ${sizeClasses[size]} 
          relative cursor-pointer rounded-full overflow-hidden 
          border-2 border-calico-gray-300 hover:border-calico-orange-500 
          transition-all duration-200 group
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Imagen del avatar */}
        <img
          src={displayUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/default-avatar.png';
          }}
        />

        {/* Overlay de hover */}
        <div className="
          absolute inset-0 bg-black bg-opacity-50 
          flex items-center justify-center 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-200
        ">
          {isUploading ? (
            <div className="text-calico-white text-xs text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-calico-white mx-auto mb-1"></div>
              <span>Subiendo...</span>
            </div>
          ) : (
            <div className="text-calico-white text-xs text-center">
              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Cambiar</span>
            </div>
          )}
        </div>

        {/* Indicador de carga */}
        {isUploading && (
          <div className="absolute inset-0 bg-calico-orange-500 bg-opacity-20 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Texto de ayuda */}
      <div className="mt-2 text-xs text-calico-gray-500 text-center max-w-[120px]">
        <p>Click para cambiar</p>
        <p>Máx. 5MB</p>
      </div>
    </div>
  );
};

export default AvatarUpload;