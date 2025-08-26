import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationProvider';

interface User {
  name: string;
  avatar?: string;
}

interface UserSession {
  user: User;
}

const Navigation: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { addNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check authentication status
  const checkAuthStatus = () => {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    
    if (userSession) {
      try {
        const session: UserSession = JSON.parse(userSession);
        setUser(session.user);
      } catch (error) {
        console.error('Error parsing user session:', error);
        // Clear invalid session
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear session data
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    
    // Show notification
    addNotification('Sesión cerrada exitosamente', 'success');
    
    // Update state
    setUser(null);
    setIsUserDropdownOpen(false);
    
    // Redirect to home
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for storage changes (for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSession' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span className="font-bold text-lg">Gaming Hub</span>
              </a>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Inicio</a>
                <a href="/minecraft" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Minecraft</a>
                <a href="/call-of-duty" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Call of Duty</a>
                <a href="/among-us" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Among Us</a>
                <a href="/uno" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">UNO</a>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Guest buttons */}
              {!user && (
                <div className="flex items-center space-x-3">
                  <a href="/login" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Iniciar Sesión</a>
                  <a href="/register" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105">Registrarse</a>
                </div>
              )}

              {/* User menu */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <img 
                      src={user.avatar || '/default-avatar.png'} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border-2 border-purple-500"
                    />
                    <span className="text-sm font-medium">{user.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-lg border border-white/10 py-1">
                      <a href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Perfil
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Configuraciones
                      </a>
                      <hr className="my-1 border-white/10" />
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800/95 backdrop-blur-md border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="/" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">Inicio</a>
              <a href="/minecraft" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">Minecraft</a>
              <a href="/call-of-duty" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">Call of Duty</a>
              <a href="/among-us" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">Among Us</a>
              <a href="/uno" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">UNO</a>
            </div>
          </div>
        )}
      </nav>
  );
};

export default Navigation;