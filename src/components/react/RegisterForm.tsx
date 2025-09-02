import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addNotification } = useNotifications();

  // Check if user is already logged in
  useEffect(() => {
    const existingSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (existingSession) {
      window.location.href = '/';
    }
  }, []);

  // Real-time validation
  useEffect(() => {
    const newErrors: FormErrors = {};

    // Name validation
    if (formData.name && formData.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Username validation
    if (formData.username) {
      if (formData.username.length < 3) {
        newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Solo se permiten letras, números y guiones bajos';
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    // Password validation
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Debe contener al menos una mayúscula, una minúscula y un número';
      }
    }

    // Confirm password validation
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(errors).length > 0) {
      addNotification('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          full_name: formData.name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la cuenta');
      }

      addNotification('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión', 'success');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);
      addNotification(error.message || 'Error al crear la cuenta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName: keyof FormErrors) => {
    return errors[fieldName];
  };

  const getFieldBorderClass = (fieldName: keyof FormErrors) => {
    const hasError = getFieldError(fieldName);
    if (hasError) return 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
    return 'border-white/20 focus:border-calico-orange-500 focus:ring-calico-orange-500/20';
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-calico-orange-600/20 to-calico-gray-600/20 p-8 text-center border-b border-white/10">
          <div className="w-20 h-20 bg-gradient-to-r from-calico-orange-500 to-calico-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-calico-white mb-2">Únete a nosotros</h1>
          <p className="text-calico-gray-300">Crea tu cuenta en Gaming Hub</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-calico-gray-300">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('name')}`}
                  required
                />
              </div>
              {getFieldError('name') && (
                <p className="text-red-400 text-xs mt-1">{getFieldError('name')}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-calico-gray-300">Nombre de Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  id="username" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="tu_usuario"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('username')}`}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              {getFieldError('username') && (
                <p className="text-red-400 text-xs mt-1">{getFieldError('username')}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-calico-gray-300">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('email')}`}
                  required
                />
              </div>
              {getFieldError('email') && (
                <p className="text-red-400 text-xs mt-1">{getFieldError('email')}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-calico-gray-300">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('password')}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="text-red-400 text-xs mt-1">{getFieldError('password')}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-calico-gray-300">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  type="password"
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${getFieldBorderClass('confirmPassword')}`}
                  required
                />
              </div>
              {getFieldError('confirmPassword') && (
                <p className="text-red-400 text-xs mt-1">{getFieldError('confirmPassword')}</p>
              )}
            </div>

            <div className="flex items-start">
              <input 
                type="checkbox" 
                id="terms" 
                name="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                className="w-4 h-4 mt-1 text-calico-orange-600 bg-white/10 border-white/20 rounded focus:ring-calico-orange-500 focus:ring-2"
                required
              />
              <label htmlFor="terms" className="ml-3 text-sm text-calico-gray-300">
                Acepto los 
                <a href="#" className="text-calico-orange-400 hover:text-calico-orange-300 transition-colors">términos y condiciones</a>
                {' '}y la{' '}
                <a href="#" className="text-calico-orange-400 hover:text-calico-orange-300 transition-colors">política de privacidad</a>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || Object.keys(errors).length > 0}
              className="w-full bg-gradient-to-r from-calico-orange-600 to-calico-gray-600 hover:from-calico-orange-700 hover:to-calico-gray-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-calico-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-calico-orange-500/25 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <span>{isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
              {isLoading && (
                <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-4 text-sm text-gray-400">o</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="group-hover:text-white transition-colors">Registrarse con Google</span>
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-300 group">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="group-hover:text-white transition-colors">Registrarse con Facebook</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-calico-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-calico-orange-400 hover:text-calico-orange-300 font-medium transition-colors">Inicia sesión aquí</a>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="inline-flex items-center text-calico-gray-400 hover:text-calico-white transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default RegisterForm;