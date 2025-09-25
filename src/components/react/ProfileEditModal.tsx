import React, { useState, useEffect } from 'react';
import { getUserSession } from '../../utils/auth.ts';
import { useNotifications } from './NotificationProvider';
import AvatarUpload from './AvatarUpload';

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  createdAt?: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: (user: User) => void;
}

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose, onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Listen for custom events from Astro page
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openProfileEditModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openProfileEditModal', handleOpenModal);
    };
  }, []);

  // Update isOpen state when prop changes
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen) {
      const session = getUserSession();
      if (session) {
        setCurrentUser(session.user);
        setFormData({
          name: session.user.full_name || session.user.username || '',
          email: session.user.email
        });
      }
    }
  }, [isOpen]);



  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'El nombre es requerido';
    if (name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (name.trim().length > 50) return 'El nombre no puede exceder 50 caracteres';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Real-time validation
    if (field === 'name') {
      const nameError = validateName(value);
      if (nameError) {
        setErrors(prev => ({ ...prev, name: nameError }));
      }
    }

    if (field === 'email') {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    }
  };



  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const session = getUserSession();
    if (!session) {
      addNotification('Sesión no válida', 'error');
      return;
    }

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);

    if (nameError || emailError) {
      setErrors({
        name: nameError,
        email: emailError
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Update user data
      const updatedUser = {
        ...session.user,
        full_name: formData.name,
        email: formData.email
      };

      const updatedSession = {
        ...session,
        user: updatedUser
      };

      // Update in storage
      if (localStorage.getItem('userSession')) {
        localStorage.setItem('userSession', JSON.stringify(updatedSession));
      } else {
        sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
      }

      // Update users array (legacy support)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === session.user.id);
      if (userIndex !== -1) {
        users[userIndex].full_name = formData.name;
        users[userIndex].email = formData.email;
        localStorage.setItem('users', JSON.stringify(users));
      }

      // Call callback if provided
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }

      addNotification('Perfil actualizado exitosamente', 'success');
      
      // Close modal after short delay
      setTimeout(() => {
        propOnClose();
      }, 1000);

    } catch (error) {
      addNotification('Error al actualizar el perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      setIsOpen(false);
      if (propOnClose) {
        propOnClose();
      }
      // Reload profile data on the page
      const event = new CustomEvent('profileUpdated');
      window.dispatchEvent(event);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Get field error
  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return errors[field];
  };

  // Get field border class
  const getFieldBorderClass = (field: keyof FormErrors): string => {
    if (errors[field]) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
    }
    return 'border-white/20 focus:border-calico-orange-500 focus:ring-calico-orange-500/20';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="glass-calico backdrop-blur-xl rounded-2xl border border-calico-stripe-light/20 shadow-2xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-calico-white">Editar Perfil</h3>
              <button 
                onClick={handleClose}
                disabled={isLoading}
                className="text-calico-gray-400 hover:text-calico-white transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Avatar Upload Section */}
            <div className="flex justify-center mb-6">
              <AvatarUpload 
                currentAvatarUrl={currentUser?.avatar}
                onAvatarChange={(newAvatarUrl) => {
                  if (currentUser) {
                    const updatedUser = { ...currentUser, avatar: newAvatarUrl };
                    setCurrentUser(updatedUser);
                    
                    // Update session storage
                    const session = getUserSession();
                    if (session) {
                      const updatedSession = {
                        ...session,
                        user: updatedUser
                      };
                      
                      if (localStorage.getItem('userSession')) {
                        localStorage.setItem('userSession', JSON.stringify(updatedSession));
                      } else {
                        sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
                      }
                      
                      // Update users array (legacy support)
                      const users = JSON.parse(localStorage.getItem('users') || '[]');
                      const userIndex = users.findIndex((u: any) => u.id === session.user.id);
                      if (userIndex !== -1) {
                        users[userIndex].avatar = newAvatarUrl;
                        localStorage.setItem('users', JSON.stringify(users));
                      }
                      
                      // Notify parent component
                      if (onProfileUpdate) {
                        onProfileUpdate(updatedUser);
                      }
                      
                      // Dispatch event for profile page update
                      const event = new CustomEvent('profileUpdated');
                      window.dispatchEvent(event);
                    }
                  }
                }}
                size="large"
                className="mb-2"
              />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-calico-gray-300 mb-2">
                  Nombre
                </label>
                <input 
                  type="text" 
                  id="editName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('name')}`}
                  placeholder="Tu nombre completo"
                  disabled={isLoading}
                  required
                />
                {getFieldError('name') && (
                  <p className="text-red-400 text-xs mt-1">{getFieldError('name')}</p>
                )}
              </div>
              
              {/* Email field */}
              <div>
                <label htmlFor="editEmail" className="block text-sm font-medium text-calico-gray-300 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  id="editEmail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('email')}`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                  required
                />
                {getFieldError('email') && (
                  <p className="text-red-400 text-xs mt-1">{getFieldError('email')}</p>
                )}
              </div>
              
              {/* General error */}
              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{errors.general}</p>
                </div>
              )}
              
              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-calico-orange-600 to-calico-orange-700 hover:from-calico-orange-700 hover:to-calico-orange-800 text-calico-white py-3 px-4 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-calico-gray-300 py-3 px-4 rounded-xl transition-all duration-300 font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>


    </>
  );
};

export default ProfileEditModal;