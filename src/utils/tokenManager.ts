import { supabase } from './supabaseClient';
import { getUserSession, saveUserSession, logout } from './auth';

interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

interface RefreshResult {
  success: boolean;
  error?: string;
  session?: any;
}

/**
 * Decodifica un JWT para obtener información de expiración
 */
export function decodeJWT(token: string): { exp?: number; iat?: number } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return {};
  }
}

/**
 * Verifica si un token está próximo a expirar (dentro de 5 minutos)
 */
function isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  const decoded = decodeJWT(token);
  if (!decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = decoded.exp;
  const bufferSeconds = bufferMinutes * 60;
  
  return (expiresAt - now) <= bufferSeconds;
}

/**
 * Verifica si un token ya ha expirado
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

/**
 * Intenta refrescar el token usando el refresh token
 */
async function refreshToken(): Promise<RefreshResult> {
  try {
    const session = getUserSession();
    if (!session?.refresh_token) {
      return { success: false, error: 'No refresh token available' };
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'No session returned from refresh' };
    }

    // Actualizar la sesión guardada con los nuevos tokens
    const updatedSession = {
      ...session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      loginTime: new Date().toISOString()
    };

    // Guardar en el mismo storage que se usó originalmente
    const storage = session.rememberMe ? localStorage : sessionStorage;
    storage.setItem('userSession', JSON.stringify(updatedSession));

    return { success: true, session: data.session };

  } catch (error) {
    return { success: false, error: 'Unexpected error during token refresh' };
  }
}

/**
 * Verifica y refresca el token si es necesario
 */
export async function ensureValidToken(): Promise<boolean> {
  const session = getUserSession();
  if (!session?.access_token) {
    return false;
  }

  // Si el token ya expiró, intentar refrescar
  if (isTokenExpired(session.access_token)) {
    const refreshResult = await refreshToken();
    
    if (!refreshResult.success) {
      logout();
      
      // Emitir evento de cambio de estado de autenticación
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Mostrar notificación de sesión expirada
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: { 
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 
          type: 'warning' 
        }
      }));
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    
    return true;
  }

  // Si el token está próximo a expirar, refrescar proactivamente
  if (isTokenExpiringSoon(session.access_token)) {
    const refreshResult = await refreshToken();
    
    if (!refreshResult.success) {
      // No cerrar sesión aún, el token todavía es válido
    }
  }

  return true;
}

/**
 * Configura la verificación automática de tokens
 */
export function setupTokenVerification(): void {
  // Verificar token cada 2 minutos
  const intervalId = setInterval(async () => {
    const session = getUserSession();
    if (session?.access_token) {
      await ensureValidToken();
    } else {
      // Si no hay sesión, limpiar el intervalo
      clearInterval(intervalId);
    }
  }, 2 * 60 * 1000); // 2 minutos

  // Limpiar intervalo cuando se cierre la ventana
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });

  // Verificar inmediatamente al configurar
  ensureValidToken();
}

/**
 * Interceptor para requests que requieren autenticación
 */
export async function createAuthenticatedRequest(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Asegurar que el token sea válido antes de hacer la request
  const isValid = await ensureValidToken();
  if (!isValid) {
    throw new Error('No valid authentication token available');
  }

  const session = getUserSession();
  if (!session?.access_token) {
    throw new Error('No access token available');
  }

  // Agregar el token de autorización
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Si recibimos un 401, intentar refrescar el token y reintentar
  if (response.status === 401) {
    const refreshResult = await refreshToken();
    if (refreshResult.success) {
      const newSession = getUserSession();
      if (newSession?.access_token) {
        // Reintentar con el nuevo token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newSession.access_token}`
        };
        
        return fetch(url, {
          ...options,
          headers: retryHeaders
        });
      }
    }
    
    // Si no se pudo refrescar, cerrar sesión
    logout();
    
    // Emitir evento de cambio de estado de autenticación
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    window.dispatchEvent(new CustomEvent('addNotification', {
      detail: { 
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 
        type: 'error' 
      }
    }));
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }

  return response;
}

/**
 * Obtiene información detallada del token actual
 */
export function getTokenInfo(): TokenInfo | null {
  const session = getUserSession();
  if (!session?.access_token) return null;

  const decoded = decodeJWT(session.access_token);
  if (!decoded.exp || !decoded.iat) return null;

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    expires_at: decoded.exp,
    expires_in: decoded.exp - Math.floor(Date.now() / 1000)
  };
}

/**
 * Verifica si el usuario tiene una sesión válida y activa
 */
export async function isSessionValid(): Promise<boolean> {
  const session = getUserSession();
  if (!session?.access_token) return false;

  // Verificar con Supabase si la sesión es válida
  try {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

// Configurar verificación automática cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Solo en el cliente
  document.addEventListener('DOMContentLoaded', () => {
    setupTokenVerification();
  });
  
  // Si el DOM ya está cargado
  if (document.readyState !== 'loading') {
    setupTokenVerification();
  }
}