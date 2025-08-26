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
  loginTime: string;
  rememberMe: boolean;
}

/**
 * Get the current user session from localStorage or sessionStorage
 * @returns UserSession object or null if no valid session exists
 */
export function getUserSession(): UserSession | null {
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    return null;
  }
  
  try {
    return JSON.parse(userSession) as UserSession;
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