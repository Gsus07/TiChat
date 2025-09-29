import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addNotification } = useNotifications();

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (userSession) {
      window.location.href = '/';
    }
  }, []);

  // Validación en tiempo real
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return undefined;
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validación en tiempo real
    if (field === 'email' && typeof value === 'string') {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    }
    
    if (field === 'password' && typeof value === 'string') {
      const passwordError = validatePassword(value);
      if (passwordError) {
        setErrors(prev => ({ ...prev, password: passwordError }));
      }
    }
  };



  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al iniciar sesión');
      }

      // Crear datos de sesión
      const sessionData = {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.profile?.username || result.user.user_metadata?.username || 'Usuario',
          full_name: result.profile?.full_name || result.user.user_metadata?.full_name || 'Usuario',
          avatar: result.profile?.avatar_url || '/default-avatar.png'
        },
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
        loginTime: new Date().toISOString(),
        rememberMe: formData.rememberMe
      };

      // Guardar sesión usando la función mejorada
      const { saveUserSession } = await import('../../utils/auth');
      saveUserSession(sessionData, formData.rememberMe);

      addNotification('¡Bienvenido de vuelta!', 'success');
      
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrors({ general: errorMessage });
      addNotification(errorMessage, 'error');
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-primary rounded-2xl shadow-theme-lg p-8 border border-primary">
      {/* Título Principal */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold hero-title mb-3 tracking-tight">
          Iniciar Sesión
        </h1>
        <p className="text-base hero-subtitle font-medium">
          Accede a tu cuenta para continuar
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Field */}
        <div className="space-y-3">
          <label htmlFor="email" className="block text-base font-semibold text-primary tracking-wide">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-5 py-4 bg-primary border-2 rounded-xl text-base font-medium text-primary placeholder-muted focus:outline-none focus:ring-3 transition-all duration-300 shadow-theme-sm ${
              errors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
                : 'border-primary focus:border-orange-500 focus:ring-orange-500/30 hover:border-secondary'
            }`}
            placeholder="tu@email.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-error text-sm font-medium flex items-center mt-2 px-1">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-3">
          <label htmlFor="password" className="block text-base font-semibold text-primary tracking-wide">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-5 py-4 pr-14 bg-primary border-2 rounded-xl text-base font-medium text-primary placeholder-muted focus:outline-none focus:ring-3 transition-all duration-300 shadow-theme-sm ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
                  : 'border-primary focus:border-orange-500 focus:ring-orange-500/30 hover:border-secondary'
              }`}
              placeholder="Tu contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-secondary"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
            </button>
          </div>
          {errors.password && (
            <p className="text-error text-sm font-medium flex items-center mt-2 px-1">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center py-3 border-t border-primary pt-6">
          <input
            type="checkbox"
            id="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="w-5 h-5 text-orange-500 bg-primary border-2 border-primary rounded-md focus:ring-orange-500 focus:ring-3 focus:ring-offset-0 transition-all duration-200"
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-3 text-base font-medium text-primary cursor-pointer select-none">
            Recordarme
          </label>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-error-subtle border-2 border-error rounded-xl shadow-theme-sm">
            <p className="text-error text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.general}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-primary">
        <button
          type="submit"
          disabled={isLoading || !!errors.email || !!errors.password}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all duration-300 font-semibold text-lg shadow-theme-md hover:shadow-theme-lg focus:outline-none focus:ring-3 focus:ring-orange-500/30"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
        </div>

        {/* Register Link */}
        <div className="text-center pt-6 border-t border-primary">
          <p className="text-base text-secondary font-medium">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-orange-500 hover:text-orange-600 transition-colors font-semibold underline decoration-2 underline-offset-2 hover:decoration-orange-600">
              Regístrate aquí
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;