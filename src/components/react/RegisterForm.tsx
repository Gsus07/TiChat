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

  // Función para mapear errores de la API a mensajes amigables
  const getErrorMessage = (error: any): string => {
    const errorMessage = error.message || error.error || error;
    
    // Mapear errores específicos de Supabase a mensajes amigables
    if (errorMessage.includes('User already registered') || 
        errorMessage.includes('already_registered') ||
        errorMessage.includes('Email already exists') ||
        errorMessage.includes('email_address_already_in_use')) {
      return 'Ya existe una cuenta con este email. ¿Deseas iniciar sesión?';
    }
    
    if (errorMessage.includes('Username already exists') || 
        errorMessage.includes('username_taken')) {
      return 'Este nombre de usuario ya está en uso. Por favor, elige otro.';
    }
    
    if (errorMessage.includes('Password should be at least') || 
        errorMessage.includes('password_too_short')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    
    if (errorMessage.includes('Invalid email') || 
        errorMessage.includes('invalid_email')) {
      return 'Por favor, ingresa un email válido.';
    }
    
    if (errorMessage.includes('Network') || 
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch')) {
      return 'Problema de conexión. Por favor, verifica tu internet e inténtalo nuevamente.';
    }
    
    if (errorMessage.includes('Rate limit') || 
        errorMessage.includes('too_many_requests')) {
      return 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
    }
    
    // Mensaje genérico para otros errores
    return 'Algo salió mal. Por favor, verifica tus datos e inténtalo nuevamente.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    const requiredFields = ['name', 'username', 'email', 'password', 'confirmPassword'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof FormData].toString().trim());
    
    if (emptyFields.length > 0) {
      addNotification('Por favor, completa todos los campos requeridos.', 'warning');
      return;
    }
    
    if (!formData.terms) {
      addNotification('Debes aceptar los términos y condiciones para continuar.', 'warning');
      return;
    }
    
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

      // Mostrar mensaje de éxito específico
      addNotification('¡Registro completado! Ahora puedes iniciar sesión con tus credenciales.', 'success');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (error: any) {
      console.error('Error en registro:', error);
      const friendlyMessage = getErrorMessage(error);
      addNotification(friendlyMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: keyof FormErrors): string | undefined => {
    return errors[field];
  };

  const getFieldBorderClass = (field: keyof FormErrors): string => {
    if (errors[field]) {
      return 'border-red-400 focus:border-red-500 focus:ring-red-500/30';
    }
    return 'border-calico-gray-600 focus:border-calico-orange-500 focus:ring-calico-orange-500/30';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-calico-gray-800/90 backdrop-blur-lg border border-calico-gray-700 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-calico-orange-500 to-calico-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-calico-white mb-2">Crear Cuenta</h1>
          <p className="text-calico-gray-300 text-base">Únete a nuestra comunidad gaming</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
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
                minLength={2}
                maxLength={100}
              />
            </div>
            {getFieldError('name') && (
              <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-xs">{getFieldError('name')}</p>
              </div>
            )}
          </div>

          {/* Username Field */}
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
              <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-xs">{getFieldError('username')}</p>
              </div>
            )}
          </div>

          {/* Email Field */}
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
              <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-xs">{getFieldError('email')}</p>
              </div>
            )}
          </div>

          {/* Password Field */}
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
              <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-xs">{getFieldError('password')}</p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
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
              <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-xs">{getFieldError('confirmPassword')}</p>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
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
          {getFieldError('terms') && (
            <div className="flex items-center mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <svg className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-xs">{getFieldError('terms')}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(errors).length > 0}
            className="w-full bg-gradient-to-r from-calico-orange-500 to-calico-orange-600 hover:from-calico-orange-600 hover:to-calico-orange-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center pt-6 border-t border-calico-gray-700">
            <p className="text-base text-calico-gray-300">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-calico-orange-400 hover:text-calico-orange-300 transition-colors font-semibold underline decoration-2 underline-offset-2 hover:decoration-calico-orange-300">
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;