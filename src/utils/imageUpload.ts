import { supabase } from './supabaseClient';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

/**
 * Sube una imagen al bucket 'gamesimg' de Supabase
 * @param file - El archivo de imagen a subir
 * @param gameId - ID del juego (opcional, para organizar las imágenes)
 * @returns Resultado de la subida con la URL pública
 */
export async function uploadGameImage(file: File, gameId?: string): Promise<ImageUploadResult> {
  try {
    // Validar el archivo
    if (!file) {
      return { success: false, error: 'No se proporcionó ningún archivo' };
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP' 
      };
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: 'El archivo es demasiado grande. Máximo 5MB permitido' 
      };
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Crear path simple para el bucket gamesimg
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = gameId ? `${gameId}/${fileName}` : fileName;

    // Subir archivo al bucket gamesimg
    const { data, error } = await supabase.storage
      .from('gamesimg')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg'
      });

    if (error) {
      return { 
        success: false, 
        error: `Error al subir la imagen: ${error.message}` 
      };
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('gamesimg')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { 
        success: false, 
        error: 'No se pudo obtener la URL pública de la imagen' 
      };
    }

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al subir la imagen' 
    };
  }
}

/**
 * Elimina una imagen del bucket 'gamesimg'
 * @param imagePath - Path de la imagen en el bucket
 * @returns Resultado de la eliminación
 */
export async function deleteGameImage(imagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!imagePath) {
      return { success: false, error: 'No se proporcionó el path de la imagen' };
    }

    // Extraer solo el path relativo si viene una URL completa
    let cleanPath = imagePath;
    if (imagePath.includes('/storage/v1/object/public/gamesimg/')) {
      cleanPath = imagePath.split('/storage/v1/object/public/gamesimg/')[1];
    }

    const { error } = await supabase.storage
      .from('gamesimg')
      .remove([cleanPath]);

    if (error) {
      return { 
        success: false, 
        error: `Error al eliminar la imagen: ${error.message}` 
      };
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar la imagen' 
    };
  }
}

/**
 * Actualiza la imagen de un juego (elimina la anterior y sube la nueva)
 * @param file - Nuevo archivo de imagen
 * @param gameId - ID del juego
 * @param oldImageUrl - URL de la imagen anterior (opcional)
 * @returns Resultado de la actualización
 */
export async function updateGameImage(
  file: File, 
  gameId: string, 
  oldImageUrl?: string
): Promise<ImageUploadResult> {
  try {
    // Subir nueva imagen
    const uploadResult = await uploadGameImage(file, gameId);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    // Eliminar imagen anterior si existe
    if (oldImageUrl) {
      const deleteResult = await deleteGameImage(oldImageUrl);
      if (!deleteResult.success) {
        // No fallar la operación por esto, solo advertir
      }
    }

    return uploadResult;

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar la imagen' 
    };
  }
}

/**
 * Valida si un archivo es una imagen válida
 * @param file - Archivo a validar
 * @returns true si es válido, false si no
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No se proporcionó ningún archivo' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP' 
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'El archivo es demasiado grande. Máximo 5MB permitido' 
    };
  }

  return { valid: true };
}

/**
 * Obtiene la URL pública de una imagen en el bucket
 * @param imagePath - Path de la imagen en el bucket
 * @returns URL pública de la imagen
 */
export function getGameImagePublicUrl(imagePath: string): string | null {
  try {
    if (!imagePath) return null;

    // Si ya es una URL completa, devolverla
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    const { data } = supabase.storage
      .from('gamesimg')
      .getPublicUrl(imagePath);

    return data?.publicUrl || null;
  } catch (error) {
    return null;
  }
}