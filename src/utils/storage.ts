import { supabase } from './supabaseClient';
import { getUserSession } from './auth';
import { compressAvatarImage, compressPostImage, validateImageFile } from './imageCompression';

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: string | null;
}

/**
 * Configura la sesión de Supabase con el token guardado localmente
 */
async function setSupabaseSession(): Promise<boolean> {
  const session = getUserSession();
  
  if (!session || !session.access_token) {
    return false;
  }

  try {
    // Configurar la sesión en Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token || ''
    });
    
    if (error) {
      return false;
    }
    
    return !error && !!data.user;
  } catch (error) {
    return false;
  }
}

/**
 * Sube un archivo a Supabase Storage
 * @param file - El archivo a subir
 * @param bucket - El nombre del bucket (por defecto 'avatars')
 * @param folder - La carpeta dentro del bucket (opcional)
 * @returns Resultado de la subida con la URL pública
 */
export async function uploadFile(
  file: File,
  bucket: string = 'avatars',
  folder?: string
): Promise<UploadResult> {
  try {
    // Validar el archivo
    if (!file) {
      return {
        data: null,
        error: 'No se proporcionó ningún archivo'
      };
    }

    // Validar tipo de archivo (solo imágenes)
    if (!file.type.startsWith('image/')) {
      return {
        data: null,
        error: 'Solo se permiten archivos de imagen'
      };
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      return {
        data: null,
        error: 'El archivo es demasiado grande. Máximo 5MB permitido'
      };
    }

    // Configurar sesión de Supabase
    const sessionSet = await setSupabaseSession();
    if (!sessionSet) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Construir la ruta del archivo
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Subir el archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return {
        data: null,
        error: `Error al subir el archivo: ${uploadError.message}`
      };
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      data: {
        path: uploadData.path,
        fullPath: uploadData.fullPath,
        publicUrl: urlData.publicUrl
      },
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: 'Error inesperado al subir el archivo'
    };
  }
}

/**
 * Elimina un archivo de Supabase Storage
 * @param filePath - La ruta del archivo a eliminar
 * @param bucket - El nombre del bucket
 * @returns Resultado de la eliminación
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'avatars'
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { error: `Error al eliminar el archivo: ${error.message}` };
    }

    return { error: null };
  } catch (error) {
    return { error: 'Error inesperado al eliminar el archivo' };
  }
}

/**
 * Actualiza el avatar del usuario en la base de datos
 * @param avatarUrl - La nueva URL del avatar
 * @returns Resultado de la actualización
 */
export async function updateUserAvatar(
  avatarUrl: string
): Promise<{ error: string | null }> {
  try {
    // Configurar sesión de Supabase
    const sessionSet = await setSupabaseSession();
    if (!sessionSet) {
      return { error: 'Usuario no autenticado' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Usuario no autenticado' };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (updateError) {
      return { error: `Error al actualizar el avatar: ${updateError.message}` };
    }

    return { error: null };
  } catch (error) {
    return { error: 'Error inesperado al actualizar el avatar' };
  }
}

/**
 * Función completa para cambiar el avatar del usuario
 * @param file - El archivo de imagen del nuevo avatar
 * @returns Resultado de la operación completa
 */
export async function changeUserAvatar(
  file: File
): Promise<{ data: { publicUrl: string } | null; error: string | null }> {
  try {
    // Validar el archivo antes de procesar
    try {
      validateImageFile(file, 10); // Máximo 10MB antes de compresión
    } catch (validationError) {
      return {
        data: null,
        error: validationError instanceof Error ? validationError.message : 'Archivo no válido'
      };
    }

    // Comprimir la imagen antes de subirla
    let processedFile: File;
    try {
      processedFile = await compressAvatarImage(file);
    } catch (compressionError) {
      return {
        data: null,
        error: 'Error al procesar la imagen. Intenta con otro archivo.'
      };
    }

    // Configurar sesión de Supabase
    const sessionSet = await setSupabaseSession();
    if (!sessionSet) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Subir el archivo comprimido
    const uploadResult = await uploadFile(processedFile, 'avatars', user.id);
    
    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || 'Error al subir el archivo'
      };
    }

    // Actualizar el avatar en la base de datos
    const updateResult = await updateUserAvatar(uploadResult.data.publicUrl);
    
    if (updateResult.error) {
      // Si falla la actualización, intentar eliminar el archivo subido
      await deleteFile(uploadResult.data.path, 'avatars');
      return {
        data: null,
        error: updateResult.error
      };
    }

    return {
      data: {
        publicUrl: uploadResult.data.publicUrl
      },
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: 'Error inesperado al cambiar el avatar'
    };
  }
}

/**
 * Función para subir imágenes de posts
 * @param file - El archivo de imagen del post
 * @returns Resultado de la operación de subida
 */
export async function uploadPostImage(
  file: File
): Promise<{ data: { publicUrl: string; path: string } | null; error: string | null }> {
  try {
    // Validar el archivo antes de procesar
    try {
      validateImageFile(file, 15); // Máximo 15MB antes de compresión para posts
    } catch (validationError) {
      return {
        data: null,
        error: validationError instanceof Error ? validationError.message : 'Archivo no válido'
      };
    }

    // Comprimir la imagen antes de subirla
    let processedFile: File;
    try {
      processedFile = await compressPostImage(file);
    } catch (compressionError) {
      return {
        data: null,
        error: 'Error al procesar la imagen. Intenta con otro archivo.'
      };
    }

    // Configurar sesión de Supabase
    const sessionSet = await setSupabaseSession();
    if (!sessionSet) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'Usuario no autenticado'
      };
    }

    // Subir el archivo comprimido al bucket 'posts'
    const uploadResult = await uploadFile(processedFile, 'posts', user.id);
    
    if (uploadResult.error || !uploadResult.data) {
      return {
        data: null,
        error: uploadResult.error || 'Error al subir la imagen del post'
      };
    }

    return {
      data: {
        publicUrl: uploadResult.data.publicUrl,
        path: uploadResult.data.path
      },
      error: null
    };

  } catch (error) {
    return {
      data: null,
      error: 'Error inesperado al subir la imagen del post'
    };
  }
}