import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import { saveUserSession } from '../../utils/auth';

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
      const params = new URLSearchParams(window.location.search);
      const rawRedirect = params.get('redirect');
      const redirect = rawRedirect ? decodeURIComponent(rawRedirect) : null;
      const target = redirect && redirect.startsWith('/') ? redirect : '/';
      window.location.href = target;
    }
  }, []);

  // Validación de email
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Por favor, completa todos los campos requeridos.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Por favor, ingresa un email válido.';
    }
    return undefined;
  };

  // Validación de contraseña
  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) {
      return 'Por favor, completa todos los campos requeridos.';
    }
    return undefined;
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Función para mapear errores de la API a mensajes amigables
  const getErrorMessage = (error: any): string => {
    const errorMessage = error.message || error.error || error;
    
    // Mapear errores específicos de Supabase a mensajes amigables
    if (errorMessage.includes('Invalid login credentials') || 
        errorMessage.includes('invalid_credentials') ||
        errorMessage.includes('Invalid email or password')) {
      return 'La contraseña ingresada no es válida. ¿Olvidaste tu contraseña?';
    }
    
    if (errorMessage.includes('Email not confirmed') || 
        errorMessage.includes('email_not_confirmed')) {
      return 'Por favor, confirma tu email antes de iniciar sesión.';
    }
    
    if (errorMessage.includes('User not found') || 
        errorMessage.includes('user_not_found') ||
        errorMessage.includes('No user found')) {
      return 'El usuario no existe. ¿Deseas registrarte?';
    }
    
    if (errorMessage.includes('Too many requests') || 
        errorMessage.includes('rate_limit')) {
      return 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
    }
    
    if (errorMessage.includes('Network') || 
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch')) {
      return 'Problema de conexión. Por favor, verifica tu internet e inténtalo nuevamente.';
    }
    
    // Mensaje genérico para otros errores
    return 'Algo salió mal. Por favor, verifica tus datos e inténtalo nuevamente.';
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
      
      // Mostrar notificación para campos vacíos
      if (!formData.email.trim() || !formData.password.trim()) {
        addNotification('Por favor, completa todos los campos requeridos.', 'warning');
      }
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

      // Crear datos de sesión (incluye loginTime y rememberMe)
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
        expires_at: result.session?.expires_at,
        loginTime: new Date().toISOString(),
        rememberMe: !!formData.rememberMe
      };

      // Guardar usando util centralizada (limpia storage opuesto y calcula expiresAt)
      saveUserSession(sessionData as any, !!formData.rememberMe);

      // Aplicar tema guardado en el perfil si existe
      try {
        const rawTheme = result.profile?.theme;
        let profileTheme: any = null;
        if (rawTheme) {
          if (typeof rawTheme === 'string') {
            const t = rawTheme.trim();
            if (t === 'light' || t === 'dark' || t === 'auto') {
              profileTheme = { mode: t };
            } else {
              try { profileTheme = JSON.parse(t); } catch {}
            }
          } else if (typeof rawTheme === 'object') {
            profileTheme = rawTheme;
          }
        }

        if (profileTheme) {
          if (profileTheme.colors) {
            try {
              localStorage.setItem('theme-custom-colors', JSON.stringify(profileTheme.colors));
            } catch {}
            window.dispatchEvent(new CustomEvent('theme-custom-colors-updated', { detail: { colors: profileTheme.colors } }));
          }
          const mode = profileTheme.mode as 'light' | 'dark' | 'auto' | undefined;
          if (mode) {
            try { localStorage.setItem('tichat-theme-preference', mode); } catch {}
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
            document.documentElement.classList.toggle('dark', resolved === 'dark');
            document.documentElement.classList.toggle('light', resolved === 'light');
            document.documentElement.setAttribute('data-theme', resolved);
          }
        }
      } catch {}

      // Mostrar mensaje de éxito
      addNotification('¡Bienvenido! Has iniciado sesión correctamente.', 'success');

      // Callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      // Redirigir después de un delay más largo para que se vea la notificación
      setTimeout(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          const rawRedirect = params.get('redirect');
          const redirect = rawRedirect ? decodeURIComponent(rawRedirect) : null;
          const target = redirect && redirect.startsWith('/') ? redirect : '/';
          window.location.href = target;
        } catch {
          window.location.href = '/';
        }
      }, 2500);

    } catch (error: any) {
      console.error('Error en login:', error);
      const friendlyMessage = getErrorMessage(error);
      
      // Mostrar notificación de error
      addNotification(friendlyMessage, 'error');
      
      // Callback de error
      if (onError) {
        onError(friendlyMessage);
      }
      
      // Establecer error general para mostrar en el formulario
      setErrors({ general: friendlyMessage });
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
        <div className="space-y-2">
          <label htmlFor="email" className="block text-base font-semibold text-primary">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
              </svg>
            </div>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="tu@email.com"
              className={`w-full pl-12 pr-4 py-4 bg-surface border-2 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-base ${
                errors.email ? 'border-error ring-2 ring-error/20' : 'border-primary hover:border-orange-400'
              }`}
              disabled={isLoading}
              required
            />
          </div>
          {errors.email && (
            <div className="flex items-center mt-2 p-3 bg-error-subtle border border-error/30 rounded-lg">
              <svg className="w-4 h-4 text-error mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-error text-sm font-medium">{errors.email}</p>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-base font-semibold text-primary">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-4 bg-surface border-2 rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-base ${
                errors.password ? 'border-error ring-2 ring-error/20' : 'border-primary hover:border-orange-400'
              }`}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-primary transition-colors"
              disabled={isLoading}
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
          {errors.password && (
            <div className="flex items-center mt-2 p-3 bg-error-subtle border border-error/30 rounded-lg">
              <svg className="w-4 h-4 text-error mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-error text-sm font-medium">{errors.password}</p>
            </div>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
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
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all duration-300 font-semibold text-lg shadow-theme-md hover:shadow-theme-lg transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
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