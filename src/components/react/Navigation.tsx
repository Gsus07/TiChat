import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const { addNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    console.log('Logout function called');
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
      const target = event.target as Node;
      
      // Check if click is outside both the button and the dropdown menu
      const isClickOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isClickOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      
      if (isClickOutsideButton && isClickOutsideDropdown) {
        console.log('Click outside detected, closing dropdown');
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      // Add a small delay to prevent immediate closure when opening
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

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
    console.log('Navigation component mounted and hydrated');
    checkAuthStatus();
  }, []);

  // Debug effect to check if component is working
  useEffect(() => {
    console.log('Navigation component state updated:', { user, isUserDropdownOpen });
  }, [user, isUserDropdownOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-calico-cream via-white to-calico-orange-50 backdrop-blur-md border-b-2 border-calico-orange-200 shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Decorative paw prints */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-2 left-10 w-4 h-4 text-calico-orange-400">
          <svg fill="currentColor" viewBox="0 0 24 24">
            {/* Real cat paw print */}
            <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
            <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
            <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute top-3 right-20 w-3 h-3 text-calico-orange-300 rotate-45">
          <svg fill="currentColor" viewBox="0 0 24 24">
            {/* Real cat paw print */}
            <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
            <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
            <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute bottom-2 left-1/3 w-3 h-3 text-calico-orange-300 -rotate-12">
          <svg fill="currentColor" viewBox="0 0 24 24">
            {/* Real cat paw print */}
            <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
            <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
            <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
            <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
          </svg>
        </div>
      </div>
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-3 text-gray-800 hover:text-calico-orange-600 transition-all duration-300 group">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg group-hover:shadow-calico-orange-300/50 transition-all duration-300">
                  <img 
                    src="/tina-logo.png" 
                    alt="Tina Gaming Hub Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-gray-800 drop-shadow-sm">Gaming Hub</span>
                  <span className="text-xs text-calico-orange-600 font-semibold tracking-wide drop-shadow-sm">🐾 Calico Gaming</span>
                </div>
              </a>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <a href="/" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 hover:shadow-sm">
                  <svg className="w-4 h-4 text-calico-orange-500 group-hover:text-calico-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                  <span>Inicio</span>
                  <div className="w-1 h-1 bg-calico-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="/minecraft" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 hover:shadow-sm">
                  <svg className="w-4 h-4 text-green-600 group-hover:text-green-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z"/>
                  </svg>
                  <span>Minecraft</span>
                  <div className="w-1 h-1 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="/call-of-duty" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 hover:shadow-sm">
                  <svg className="w-4 h-4 text-red-600 group-hover:text-red-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
                  </svg>
                  <span>Call of Duty</span>
                  <div className="w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="/among-us" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 hover:shadow-sm">
                  <svg className="w-4 h-4 text-blue-600 group-hover:text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span>Among Us</span>
                  <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                <a href="/uno" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 hover:shadow-sm">
                  <svg className="w-4 h-4 text-yellow-600 group-hover:text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <span>UNO</span>
                  <div className="w-1 h-1 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Guest buttons */}
              {!user && (
                <div className="flex items-center space-x-3">
                  <a href="/login" className="group flex items-center space-x-2 text-gray-700 hover:text-calico-orange-600 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-calico-orange-50 rounded-lg">
                    <svg className="w-4 h-4 text-calico-orange-500 group-hover:text-calico-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                    </svg>
                    <span>Iniciar Sesión</span>
                  </a>
                  <a href="/register" className="group relative bg-gradient-to-r from-calico-orange-500 to-calico-orange-600 hover:from-calico-orange-600 hover:to-calico-orange-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-calico-orange-300/50 overflow-hidden">
                    {/* Paw print decoration */}
                    <div className="absolute top-0 right-0 w-5 h-5 text-white/20 transform translate-x-1 -translate-y-1">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        {/* Real cat paw print */}
                        <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
                        <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                        <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                        <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
                        <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="relative z-10 flex items-center space-x-2 text-gray-800">
                      <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                      </svg>
                      <span className="font-semibold text-gray-800">Registrarse</span>
                    </span>
                  </a>
                </div>
              )}

              {/* User menu */}
              {user && (
                <div className="relative z-[999999]">
                  <button 
                    ref={buttonRef}
                    onClick={() => {
                      console.log('=== USER BUTTON CLICKED ===');
                      console.log('Current dropdown state:', isUserDropdownOpen);
                      
                      if (!isUserDropdownOpen && buttonRef.current) {
                        const rect = buttonRef.current.getBoundingClientRect();
                        const position = {
                          top: rect.bottom + window.scrollY + 8,
                          right: window.innerWidth - rect.right
                        };
                        console.log('Calculated position:', position);
                        setDropdownPosition(position);
                      }
                      
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                      console.log('Setting dropdown to:', !isUserDropdownOpen);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-calico-orange-600 transition-colors"
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

                  {/* Dropdown menu with createPortal for maximum z-index */}
                  {isUserDropdownOpen && createPortal(
                    <div 
                      ref={dropdownRef}
                      className="fixed w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-calico-gray-200 py-1"
                      style={{
                        top: `${dropdownPosition.top}px`,
                        right: `${dropdownPosition.right}px`,
                        zIndex: 2147483647 // Maximum z-index value
                      }}
                      onClick={(e) => {
                        console.log('Dropdown container clicked');
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        console.log('Dropdown mousedown - preventing close');
                        e.stopPropagation();
                      }}
                    >
                      <button 
                        onClick={(e) => {
                          console.log('=== PERFIL BUTTON CLICKED ===');
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          console.log('Navigating to /profile');
                          window.location.href = '/profile';
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-calico-orange-600 hover:bg-calico-orange-50 transition-colors"
                        onMouseEnter={() => console.log('Perfil button hover')}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Perfil
                      </button>
                      <button 
                        onClick={(e) => {
                          console.log('=== CONFIGURACIONES BUTTON CLICKED ===');
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          console.log('Navigating to /settings');
                          window.location.href = '/settings';
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-calico-orange-600 hover:bg-calico-orange-50 transition-colors"
                        onMouseEnter={() => console.log('Configuraciones button hover')}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Configuraciones
                      </button>
                      <hr className="my-1 border-calico-stripe-light/20" />
                      <button 
                        onClick={(e) => {
                          console.log('=== CERRAR SESIÓN BUTTON CLICKED ===');
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          console.log('Calling handleLogout');
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        onMouseEnter={() => console.log('Cerrar Sesión button hover')}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>,
                    document.body
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden relative p-2 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 rounded-lg transition-all duration-300 group"
              >
                {/* Cat ears decoration */}
                <div className="absolute -top-1 left-1 w-2 h-2 bg-calico-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -top-1 right-1 w-2 h-2 bg-calico-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                </svg>
                
                {/* Paw print */}
                <div className="absolute -bottom-1 -right-1 w-2 h-2 text-calico-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    {/* Real cat paw print */}
                    <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
                    <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                    <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                    <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
                    <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gradient-to-b from-white/95 to-calico-orange-50/95 backdrop-blur-md border-t-2 border-calico-orange-200 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-10 h-10 text-calico-orange-200/30 transform translate-x-2 -translate-y-2">
              <svg fill="currentColor" viewBox="0 0 24 24">
                {/* Real cat paw print */}
                <ellipse cx="12" cy="8" rx="2.5" ry="3" fill="currentColor"/>
                <ellipse cx="8" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                <ellipse cx="16" cy="12" rx="1.5" ry="2" fill="currentColor"/>
                <ellipse cx="10" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
                <ellipse cx="14" cy="16" rx="1.2" ry="1.8" fill="currentColor"/>
              </svg>
            </div>
            
            <div className="px-4 py-3 space-y-1 relative z-10">
              <a href="/" className="group flex items-center space-x-3 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300">
                <svg className="w-5 h-5 text-calico-orange-500 group-hover:text-calico-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Inicio</span>
                <div className="ml-auto w-2 h-2 bg-calico-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <a href="/minecraft" className="group flex items-center space-x-3 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300">
                <svg className="w-5 h-5 text-green-600 group-hover:text-green-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z"/>
                </svg>
                <span>Minecraft</span>
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <a href="/call-of-duty" className="group flex items-center space-x-3 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300">
                <svg className="w-5 h-5 text-red-600 group-hover:text-red-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z"/>
                </svg>
                <span>Call of Duty</span>
                <div className="ml-auto w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <a href="/among-us" className="group flex items-center space-x-3 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300">
                <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Among Us</span>
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <a href="/uno" className="group flex items-center space-x-3 text-gray-700 hover:text-calico-orange-600 hover:bg-calico-orange-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300">
                <svg className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span>UNO</span>
                <div className="ml-auto w-2 h-2 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
            </div>
            
            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-calico-orange-300 via-calico-orange-400 to-calico-orange-300"></div>
          </div>
        )}
      </nav>
  );
};

export default Navigation;