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
    console.log('Parsed user session:', {
      hasUser: !!parsedSession.user,
      userId: parsedSession.user?.id,
      hasAccessToken: !!parsedSession.access_token,
      hasRefreshToken: !!parsedSession.refresh_token,
      loginTime: parsedSession.loginTime,
      rememberMe: parsedSession.rememberMe
    });
    return parsedSession;
  } catch (error) {
    console.error('Error parsing user session:', error);
    // Clear invalid session
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
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
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('userSession', JSON.stringify(session));
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