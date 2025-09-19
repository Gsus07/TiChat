// Authentication utility functions

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  createdAt?: string;
}

interface UserSession {
  user: User;
  access_token?: string;
  refresh_token?: string;
  loginTime: string;
  rememberMe: boolean;
  expiresAt?: number; // Timestamp de expiración del token
}

/**
 * Decodifica un JWT para obtener información de expiración
 */
function decodeJWT(token: string): { exp?: number; iat?: number } {
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
    console.error('Error decoding JWT:', error);
    return {};
  }
}

/**
 * Verifica si un token ha expirado
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
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
 * Intenta refrescar el token usando el refresh token
 */
async function refreshToken(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = getUserSession();
    if (!session?.refresh_token) {
      return { success: false, error: 'No refresh token available' };
    }

    console.log('🔄 Intentando refrescar token...');
    
    // Importar dinámicamente supabase para evitar problemas de SSR
    const { supabase } = await import('./supabaseClient');
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token
    });

    if (error) {
      console.error('❌ Error al refrescar token:', error);
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

    // Guardar usando la función mejorada
    saveUserSession(updatedSession, session.rememberMe);

    console.log('✅ Token refrescado exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error inesperado al refrescar token:', error);
    return { success: false, error: 'Unexpected error during token refresh' };
  }
}

/**
 * Get the current user session from localStorage or sessionStorage
 * @returns UserSession object or null if no valid session exists
 */
export function getUserSession(): UserSession | null {
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  console.log('Getting user session:', {
    hasLocalStorage: !!localStorage.getItem('userSession'),
    hasSessionStorage: !!sessionStorage.getItem('userSession'),
    rawSession: userSession ? 'exists' : 'null'
  });
  
  if (!userSession) {
    console.log('No user session found in storage');
    return null;
  }
  
  try {
    const parsedSession = JSON.parse(userSession) as UserSession;
    
    // Verificar si el token ha expirado
    if (parsedSession.access_token && isTokenExpired(parsedSession.access_token)) {
      // Si el usuario marcó "Recordarme" y tenemos refresh token, intentar refrescar
      if (parsedSession.rememberMe && parsedSession.refresh_token) {
        console.log('Token expired but user has "Remember Me" - attempting refresh...');
        
        // Intentar refresh de forma síncrona (esto puede causar un pequeño delay)
        refreshToken().then(result => {
          if (!result.success) {
            console.log('Failed to refresh token, clearing session');
            logout();
          }
        }).catch(() => {
          console.log('Error during token refresh, clearing session');
          logout();
        });
        
        // Retornar la sesión actual mientras se intenta el refresh
        // El próximo getUserSession() tendrá el token actualizado
        return parsedSession;
      } else {
        console.log('Token has expired, clearing session');
        logout();
        return null;
      }
    }
    
    // Si el token está próximo a expirar y el usuario marcó "Recordarme", refrescar proactivamente
    if (parsedSession.access_token && 
        parsedSession.rememberMe && 
        parsedSession.refresh_token && 
        isTokenExpiringSoon(parsedSession.access_token)) {
      console.log('Token expiring soon and user has "Remember Me" - refreshing proactively...');
      
      // Refresh proactivo en background
      refreshToken().catch(error => {
        console.warn('Proactive token refresh failed:', error);
      });
    }
    
    // Para sesiones que no son "recordarme", verificar si han pasado más de 24 horas
    if (!parsedSession.rememberMe) {
      const loginTime = new Date(parsedSession.loginTime).getTime();
      const now = Date.now();
      const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin > 24) {
        console.log('Session expired (24 hours limit for non-remember sessions)');
        logout();
        return null;
      }
    }
    
    console.log('Parsed user session:', {
      hasUser: !!parsedSession.user,
      userId: parsedSession.user?.id,
      hasAccessToken: !!parsedSession.access_token,
      hasRefreshToken: !!parsedSession.refresh_token,
      loginTime: parsedSession.loginTime,
      rememberMe: parsedSession.rememberMe,
      isExpired: parsedSession.access_token ? isTokenExpired(parsedSession.access_token) : 'no token',
      isExpiringSoon: parsedSession.access_token ? isTokenExpiringSoon(parsedSession.access_token) : 'no token'
    });
    
    return parsedSession;
  } catch (error) {
    console.error('Error parsing user session:', error);
    // Clear invalid session
    logout();
    return null;
  }
}

/**
 * Check if user is currently authenticated
 * @returns boolean indicating if user is logged in
 */
export function isAuthenticated(): boolean {
  return getUserSession() !== null;
}

/**
 * Clear user session and logout
 */
export function logout(): void {
  localStorage.removeItem('userSession');
  sessionStorage.removeItem('userSession');
}

/**
 * Save user session to storage
 * @param session UserSession object to save
 * @param remember Whether to use localStorage (true) or sessionStorage (false)
 */
export function saveUserSession(session: UserSession, remember: boolean = false): void {
  // Calcular la fecha de expiración del token si existe
  if (session.access_token) {
    const decoded = decodeJWT(session.access_token);
    if (decoded.exp) {
      session.expiresAt = decoded.exp * 1000; // Convertir a milliseconds
    }
  }
  
  // Actualizar el flag rememberMe
  session.rememberMe = remember;
  
  // Limpiar el storage opuesto para evitar conflictos
  if (remember) {
    sessionStorage.removeItem('userSession');
    localStorage.setItem('userSession', JSON.stringify(session));
  } else {
    localStorage.removeItem('userSession');
    sessionStorage.setItem('userSession', JSON.stringify(session));
  }
  
  console.log('Session saved:', {
    storage: remember ? 'localStorage' : 'sessionStorage',
    rememberMe: session.rememberMe,
    expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'no expiration'
  });
}

/**
 * Get current user from request (for server-side usage)
 * @param request Request object from Astro
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(request?: Request): Promise<User | null> {
  // For now, return null as we're using client-side authentication
  // This can be extended to work with server-side sessions if needed
  return null;
}

/**
 * Get current user from client-side session
 * @returns User object or null if not authenticated
 */
export function getCurrentUserClient(): User | null {
  const session = getUserSession();
  return session ? session.user : null;
}

/**
 * Verifica si la sesión actual es válida y no ha expirado
 * @returns boolean indicating if session is valid
 */
export function isSessionValid(): boolean {
  const session = getUserSession();
  if (!session) return false;
  
  // Si no hay token, considerar la sesión como válida (para casos legacy)
  if (!session.access_token) return true;
  
  return !isTokenExpired(session.access_token);
}

/**
 * Configura la verificación automática de sesión
 * Se ejecuta cada 5 minutos para verificar si la sesión sigue siendo válida
 */
export function setupSessionVerification(): void {
  if (typeof window === 'undefined') return;
  
  // Verificar inmediatamente al configurar
  checkSessionValidity();
  
  // Configurar verificación periódica cada 5 minutos
  const intervalId = setInterval(() => {
    checkSessionValidity();
  }, 5 * 60 * 1000);
  
  // También verificar cuando la ventana recupera el foco
  window.addEventListener('focus', checkSessionValidity);
  
  console.log('Session verification setup completed');
}

/**
 * Verifica la validez de la sesión actual y la limpia si ha expirado
 */
async function checkSessionValidity(): Promise<void> {
  const session = getUserSession();
  
  if (session && session.access_token) {
    // Si el token ha expirado
    if (isTokenExpired(session.access_token)) {
      // Si el usuario marcó "Recordarme" y tenemos refresh token, intentar refrescar
      if (session.rememberMe && session.refresh_token) {
        console.log('Token expired during check, attempting refresh for "Remember Me" session...');
        
        const refreshResult = await refreshToken();
        if (refreshResult.success) {
          console.log('Token refreshed successfully during automatic check');
          return; // Sesión renovada exitosamente
        } else {
          console.log('Failed to refresh token during automatic check, logging out');
        }
      }
      
      // Si no se pudo refrescar o no es una sesión "Recordarme", cerrar sesión
      console.log('Session expired during automatic check, logging out');
      logout();
      
      // Notificar al usuario si está en una página que requiere autenticación
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Mostrar notificación de sesión expirada
        const event = new CustomEvent('sessionExpired', {
          detail: { 
            message: session.rememberMe 
              ? 'Tu sesión ha expirado y no se pudo renovar. Por favor, inicia sesión nuevamente.' 
              : 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' 
          }
        });
        window.dispatchEvent(event);
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
    // Si el token está próximo a expirar y es una sesión "Recordarme", refrescar proactivamente
    else if (session.rememberMe && session.refresh_token && isTokenExpiringSoon(session.access_token)) {
      console.log('Token expiring soon during check, refreshing proactively...');
      
      refreshToken().catch(error => {
        console.warn('Proactive token refresh failed during automatic check:', error);
      });
    }
  }
}

/**
 * Obtiene información sobre la expiración del token actual
 * @returns Object with expiration info or null if no valid session
 */
export function getTokenExpirationInfo(): { expiresAt: Date; timeUntilExpiry: number } | null {
  const session = getUserSession();
  
  if (!session || !session.access_token) return null;
  
  const decoded = decodeJWT(session.access_token);
  if (!decoded.exp) return null;
  
  const expiresAt = new Date(decoded.exp * 1000);
  const timeUntilExpiry = decoded.exp * 1000 - Date.now();
  
  return {
    expiresAt,
    timeUntilExpiry
  };
}