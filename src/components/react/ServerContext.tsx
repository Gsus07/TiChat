import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GameServerWithJoins } from '../../utils/games';
import { supabase } from '../../utils/supabaseClient';

// Tipos para el estado y acciones
interface ServerState {
  servers: GameServerWithJoins[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

type ServerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SERVERS'; payload: GameServerWithJoins[] }
  | { type: 'ADD_SERVER'; payload: GameServerWithJoins }
  | { type: 'UPDATE_SERVER'; payload: GameServerWithJoins }
  | { type: 'DELETE_SERVER'; payload: string }
  | { type: 'REFRESH_SERVERS' };

// Estado inicial
const initialState: ServerState = {
  servers: [],
  loading: false,
  error: null,
  lastUpdated: 0,
};

// Reducer para manejar las acciones
function serverReducer(state: ServerState, action: ServerAction): ServerState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SERVERS':
      return { 
        ...state, 
        servers: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: Date.now()
      };
    
    case 'ADD_SERVER':
      return { 
        ...state, 
        servers: [action.payload, ...state.servers],
        lastUpdated: Date.now()
      };
    
    case 'UPDATE_SERVER':
      return { 
        ...state, 
        servers: state.servers.map(server => 
          server.id === action.payload.id ? action.payload : server
        ),
        lastUpdated: Date.now()
      };
    
    case 'DELETE_SERVER':
      return { 
        ...state, 
        servers: state.servers.filter(server => server.id !== action.payload),
        lastUpdated: Date.now()
      };
    
    case 'REFRESH_SERVERS':
      return { ...state, lastUpdated: 0 };
    
    default:
      return state;
  }
}

// Contexto
interface ServerContextType {
  state: ServerState;
  actions: {
    loadServers: () => Promise<void>;
    createServer: (serverData: any) => Promise<GameServerWithJoins | null>;
    updateServer: (id: string, serverData: any) => Promise<GameServerWithJoins | null>;
    deleteServer: (id: string) => Promise<boolean>;
    refreshServers: () => void;
  };
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export function useServerContext() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return context;
}

// Proveedor del contexto
interface ServerProviderProps {
  children: ReactNode;
}

export function ServerProvider({ children }: ServerProviderProps) {
  const [state, dispatch] = useReducer(serverReducer, initialState);

  // Función para cargar servidores
  const loadServers = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        dispatch({ type: 'SET_ERROR', payload: 'Usuario no autenticado' });
        return;
      }

      const { data: userServers, error: serversError } = await supabase
        .from('game_servers')
        .select(`
          *,
          games:game_id(name, cover_image_url),
          server_stats(*)
        `)
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (serversError) {
        dispatch({ type: 'SET_ERROR', payload: serversError.message });
        return;
      }

      dispatch({ type: 'SET_SERVERS', payload: userServers || [] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al cargar servidores' });
    }
  };

  // Función para crear servidor
  const createServer = async (serverData: any): Promise<GameServerWithJoins | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        dispatch({ type: 'SET_ERROR', payload: 'Sesión expirada' });
        return null;
      }

      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(serverData)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Obtener el servidor completo con joins
        const { data: fullServer } = await supabase
          .from('game_servers')
          .select(`
            *,
            games:game_id(name, cover_image_url),
            server_stats(*)
          `)
          .eq('id', result.data.id)
          .single();

        if (fullServer) {
          dispatch({ type: 'ADD_SERVER', payload: fullServer });
          return fullServer;
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Error al crear servidor' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al crear servidor' });
    }
    
    return null;
  };

  // Función para actualizar servidor
  const updateServer = async (id: string, serverData: any): Promise<GameServerWithJoins | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        dispatch({ type: 'SET_ERROR', payload: 'Sesión expirada' });
        return null;
      }

      const response = await fetch(`/api/servers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(serverData)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Obtener el servidor actualizado con joins
        const { data: fullServer } = await supabase
          .from('game_servers')
          .select(`
            *,
            games:game_id(name, cover_image_url),
            server_stats(*)
          `)
          .eq('id', id)
          .single();

        if (fullServer) {
          dispatch({ type: 'UPDATE_SERVER', payload: fullServer });
          return fullServer;
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Error al actualizar servidor' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar servidor' });
    }
    
    return null;
  };

  // Función para eliminar servidor
  const deleteServer = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        dispatch({ type: 'SET_ERROR', payload: 'Sesión expirada' });
        return false;
      }

      const response = await fetch(`/api/servers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        dispatch({ type: 'DELETE_SERVER', payload: id });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Error al eliminar servidor' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar servidor' });
      return false;
    }
  };

  // Función para refrescar servidores
  const refreshServers = () => {
    dispatch({ type: 'REFRESH_SERVERS' });
  };

  // Cargar servidores al montar el componente o cuando se solicite refresh
  useEffect(() => {
    if (state.lastUpdated === 0) {
      loadServers();
    }
  }, [state.lastUpdated]);

  // Persistir estado en localStorage
  useEffect(() => {
    if (state.servers.length > 0) {
      localStorage.setItem('servers_cache', JSON.stringify({
        servers: state.servers,
        lastUpdated: state.lastUpdated
      }));
    }
  }, [state.servers, state.lastUpdated]);

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    const cached = localStorage.getItem('servers_cache');
    if (cached) {
      try {
        const { servers, lastUpdated } = JSON.parse(cached);
        // Solo usar cache si es reciente (menos de 5 minutos)
        if (Date.now() - lastUpdated < 5 * 60 * 1000) {
          dispatch({ type: 'SET_SERVERS', payload: servers });
        }
      } catch (error) {
        console.error('Error loading cached servers:', error);
      }
    }
  }, []);

  const contextValue: ServerContextType = {
    state,
    actions: {
      loadServers,
      createServer,
      updateServer,
      deleteServer,
      refreshServers,
    },
  };

  return (
    <ServerContext.Provider value={contextValue}>
      {children}
    </ServerContext.Provider>
  );
}