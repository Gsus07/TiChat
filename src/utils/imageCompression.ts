import imageCompression from 'browser-image-compression';

/**
 * Opciones de compresión para diferentes tipos de imágenes
 */
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
  initialQuality?: number;
}

/**
 * Configuraciones predefinidas para diferentes casos de uso
 */
export const COMPRESSION_PRESETS = {
  avatar: {
    maxSizeMB: 0.5, // 500KB máximo
    maxWidthOrHeight: 400, // 400px máximo
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8
  } as CompressionOptions,
  
  post: {
    maxSizeMB: 1.5, // 1.5MB máximo
    maxWidthOrHeight: 1200, // 1200px máximo
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85
  } as CompressionOptions,
  
  thumbnail: {
    maxSizeMB: 0.2, // 200KB máximo
    maxWidthOrHeight: 200, // 200px máximo
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7
  } as CompressionOptions
};

/**
 * Comprime una imagen usando las opciones especificadas
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = COMPRESSION_PRESETS.post
): Promise<File> {
  try {
    // Validar que el archivo sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Comprimir la imagen
    const compressedFile = await imageCompression(file, options);

    return compressedFile;
  } catch (error) {
    throw new Error(`Error al comprimir imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Comprime una imagen para avatar de usuario
 * @param file - Archivo de imagen
 * @returns Promise con el archivo comprimido
 */
export async function compressAvatarImage(file: File): Promise<File> {
  return compressImage(file, COMPRESSION_PRESETS.avatar);
}

/**
 * Comprime una imagen para post
 * @param file - Archivo de imagen
 * @returns Promise con el archivo comprimido
 */
export async function compressPostImage(file: File): Promise<File> {
  return compressImage(file, COMPRESSION_PRESETS.post);
}

/**
 * Comprime una imagen para thumbnail
 * @param file - Archivo de imagen
 * @returns Promise con el archivo comprimido
 */
export async function compressThumbnailImage(file: File): Promise<File> {
  return compressImage(file, COMPRESSION_PRESETS.thumbnail);
}

/**
 * Valida el tamaño y tipo de archivo antes de la compresión
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (antes de compresión)
 * @returns true si es válido, throw error si no
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): boolean {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, WebP');
  }

  // Validar tamaño máximo (antes de compresión)
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > maxSizeMB) {
    throw new Error(`El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`);
  }

  return true;
}

/**
 * Obtiene información detallada de un archivo de imagen
 * @param file - Archivo de imagen
 * @returns Información del archivo
 */
export function getImageInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  };
}