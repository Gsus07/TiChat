import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const NotificationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const addResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setResults(prev => [...prev, { test, status, message }]);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Verificar usuario autenticado
      addResult('Usuario autenticado', user ? 'success' : 'error', 
        user ? `Usuario: ${user.email}` : 'No hay usuario autenticado');

      if (!user) {
        setLoading(false);
        return;
      }

      // Test 2: Verificar tabla notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

      addResult('Acceso a tabla notifications', 
        notifError ? 'error' : 'success',
        notifError ? notifError.message : 'Tabla accesible');

      // Test 3: Verificar preferencias de notificación
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      addResult('Preferencias de notificación',
        prefError ? 'error' : 'success',
        prefError ? prefError.message : `Preferencias encontradas: new_posts=${preferences?.new_posts}`);

      // Test 4: Crear preferencias si no existen
      if (prefError && prefError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: user.id,
            new_posts: true,
            email_notifications: true,
            push_notifications: true
          }]);

        addResult('Crear preferencias',
          insertError ? 'error' : 'success',
          insertError ? insertError.message : 'Preferencias creadas exitosamente');
      }

      // Test 5: Verificar suscripción en tiempo real
      const channel = supabase
        .channel('test-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            addResult('Notificación en tiempo real',
              'success',
              `Recibida notificación: ${payload.new.title}`);
          }
        )
        .subscribe();

      addResult('Suscripción en tiempo real',
        'success',
        'Suscripción configurada correctamente');

      // Test 6: Crear notificación de prueba
      const { error: testNotifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: 'Notificación de prueba',
          message: 'Esta es una notificación de prueba del sistema',
          type: 'info'
        }]);

      addResult('Crear notificación de prueba',
        testNotifError ? 'error' : 'success',
        testNotifError ? testNotifError.message : 'Notificación de prueba creada');

      // Cleanup
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 5000);

    } catch (error) {
      addResult('Error general', 'error', error instanceof Error ? error.message : String(error));
    }

    setLoading(false);
  };

  const createTestPost = async () => {
    if (!user) return;

    try {
      // Obtener un juego para el post de prueba
      const { data: games } = await supabase
        .from('games')
        .select('id, name')
        .limit(1);

      if (!games || games.length === 0) {
        addResult('Crear post de prueba', 'error', 'No hay juegos disponibles');
        return;
      }

      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          game_id: games[0].id,
          title: 'Post de prueba para notificaciones',
          content: 'Este es un post de prueba para verificar que las notificaciones funcionan correctamente.',
          post_type: 'general'
        }]);

      addResult('Crear post de prueba',
        error ? 'error' : 'success',
        error ? error.message : 'Post creado - debería generar notificaciones automáticamente');

    } catch (error) {
      addResult('Crear post de prueba', 'error', error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔔 Pruebas del Sistema de Notificaciones
      </h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Pruebas'}
        </button>

        <button
          onClick={createTestPost}
          disabled={!user}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Crear Post de Prueba
        </button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              result.status === 'success'
                ? 'bg-green-50 border-green-500 text-green-800'
                : result.status === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-yellow-50 border-yellow-500 text-yellow-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{result.test}:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.status === 'success'
                  ? 'bg-green-200 text-green-800'
                  : result.status === 'error'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm">{result.message}</p>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          Haz clic en "Ejecutar Pruebas" para verificar el sistema de notificaciones
        </div>
      )}
    </div>
  );
};

export default NotificationTest;