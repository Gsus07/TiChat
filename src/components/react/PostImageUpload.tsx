import React, { useState, useRef } from 'react';
import { uploadPostImage } from '../../utils/storage';
import { useNotifications } from './NotificationProvider';
import { validateImageFile, getImageInfo } from '../../utils/imageCompression';

interface PostImageUploadProps {
  onImageUploaded?: (imageUrl: string, imagePath: string) => void;
  onImageRemoved?: () => void;
  className?: string;
  disabled?: boolean;
}

const PostImageUpload: React.FC<PostImageUploadProps> = ({
  onImageUploaded,
  onImageRemoved,
  className = '',
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      clearSelection();
      return;
    }

    try {
      // Validar el archivo
      validateImageFile(file, 15); // Máximo 15MB antes de compresión
      
      // Mostrar información del archivo
      const fileInfo = getImageInfo(file);
      console.log('📁 Archivo seleccionado:', fileInfo);
      
      setSelectedFile(file);
      
      // Crear URL de vista previa
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      addNotification(`Imagen seleccionada: ${file.name} (${fileInfo.sizeMB}MB)`, 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Archivo no válido';
      addNotification(errorMessage, 'error');
      clearSelection();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      addNotification('Selecciona una imagen primero', 'error');
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('🚀 Iniciando subida de imagen de post...');
      const result = await uploadPostImage(selectedFile);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setUploadedImageUrl(result.data.publicUrl);
        addNotification('Imagen subida exitosamente', 'success');
        
        // Notificar al componente padre
        onImageUploaded?.(result.data.publicUrl, result.data.path);
        
        console.log('✅ Imagen subida:', {
          url: result.data.publicUrl,
          path: result.data.path
        });
      }
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen';
      addNotification(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl(null);
    clearSelection();
    onImageRemoved?.();
    addNotification('Imagen removida', 'info');
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de selección de archivo */}
      {!selectedFile && !uploadedImageUrl && (
        <div
          onClick={triggerFileSelect}
          className={`
            border-2 border-dashed border-calico-stripe-light/30 rounded-lg p-8 text-center cursor-pointer
hover:border-calico-stripe-light/50 hover:bg-calico-white/5 transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center space-y-3">
            <svg className="w-12 h-12 text-calico-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-calico-white font-medium">Haz clic para seleccionar una imagen</p>
<p className="text-calico-white/60 text-sm mt-1">JPEG, PNG, WebP (máx. 15MB)</p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de imagen seleccionada */}
      {selectedFile && previewUrl && !uploadedImageUrl && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Vista previa"
              className="w-full max-h-64 object-cover rounded-lg border border-calico-stripe-light/20"
            />
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 bg-calico-red-500 hover:bg-calico-red-600 text-calico-white rounded-full p-1 transition-colors"
              disabled={isUploading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-calico-white/70">
              <p>{selectedFile.name}</p>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={clearSelection}
                disabled={isUploading}
                className="px-4 py-2 bg-calico-gray-600 hover:bg-calico-gray-700 disabled:bg-calico-gray-800 text-calico-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-calico-blue-600 hover:bg-calico-blue-700 disabled:bg-calico-blue-800 text-calico-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isUploading && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isUploading ? 'Subiendo...' : 'Subir Imagen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imagen subida exitosamente */}
      {uploadedImageUrl && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={uploadedImageUrl}
              alt="Imagen subida"
              className="w-full max-h-64 object-cover rounded-lg border border-green-500/50"
            />
            <div className="absolute top-2 left-2 bg-calico-green-500 text-calico-white px-2 py-1 rounded text-xs font-medium">
              ✓ Subida
            </div>
            <button
              onClick={removeUploadedImage}
              className="absolute top-2 right-2 bg-calico-red-500 hover:bg-calico-red-600 text-calico-white rounded-full p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-400">Imagen lista para usar en el post</p>
            <button
              onClick={triggerFileSelect}
              className="px-4 py-2 bg-calico-blue-600 hover:bg-calico-blue-700 text-calico-white rounded-lg transition-colors text-sm"
            >
              Cambiar Imagen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostImageUpload;