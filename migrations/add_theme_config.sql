-- Migración para agregar campos de personalización visual
-- Fecha: 2024-01-XX
-- Descripción: Agrega campos theme_config a las tablas games y game_servers

-- Agregar campo theme_config a la tabla games
ALTER TABLE games 
ADD COLUMN theme_config JSONB DEFAULT '{}'::jsonb;

-- Agregar campo theme_config a la tabla game_servers
ALTER TABLE game_servers 
ADD COLUMN theme_config JSONB DEFAULT '{}'::jsonb;

-- Crear índices para mejorar el rendimiento de consultas JSON
CREATE INDEX idx_games_theme_config ON games USING GIN (theme_config);
CREATE INDEX idx_game_servers_theme_config ON game_servers USING GIN (theme_config);

-- Insertar configuraciones de tema por defecto para juegos existentes

-- Minecraft (con servidores)
UPDATE games 
SET theme_config = '{
  "colors": {
    "primary": "#10B981",
    "secondary": "#059669",
    "accent": "#34D399",
    "background": {
      "from": "green-900",
      "to": "emerald-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-4xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    "icon": "/minecraft.svg",
    "background": "/minecraft-bg.jpg"
  },
  "layout": {
    "hasServers": true,
    "showStats": true,
    "enableCustomServers": true
  }
}'::jsonb
WHERE name = 'Minecraft';

-- Fortnite (muro directo)
UPDATE games 
SET theme_config = '{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#1D4ED8",
    "accent": "#60A5FA",
    "background": {
      "from": "blue-900",
      "to": "indigo-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-4xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop",
    "icon": "/fortnite.svg",
    "background": "/fortnite-bg.jpg"
  },
  "layout": {
    "hasServers": false,
    "showStats": true,
    "enableCustomServers": false
  }
}'::jsonb
WHERE name = 'Fortnite';

-- Among Us (muro directo)
UPDATE games 
SET theme_config = '{
  "colors": {
    "primary": "#EF4444",
    "secondary": "#DC2626",
    "accent": "#F87171",
    "background": {
      "from": "red-900",
      "to": "rose-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-4xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=600&fit=crop",
    "icon": "/among-us.svg",
    "background": "/among-us-bg.jpg"
  },
  "layout": {
    "hasServers": false,
    "showStats": true,
    "enableCustomServers": false
  }
}'::jsonb
WHERE name = 'Among Us';

-- Call of Duty (muro directo)
UPDATE games 
SET theme_config = '{
  "colors": {
    "primary": "#F59E0B",
    "secondary": "#D97706",
    "accent": "#FBBF24",
    "background": {
      "from": "yellow-900",
      "to": "orange-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-4xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=600&fit=crop",
    "icon": "/call-of-duty.svg",
    "background": "/cod-bg.jpg"
  },
  "layout": {
    "hasServers": false,
    "showStats": true,
    "enableCustomServers": false
  }
}'::jsonb
WHERE name = 'Call of Duty';

-- UNO (muro directo)
UPDATE games 
SET theme_config = '{
  "colors": {
    "primary": "#8B5CF6",
    "secondary": "#7C3AED",
    "accent": "#A78BFA",
    "background": {
      "from": "purple-900",
      "to": "violet-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-4xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=1200&h=600&fit=crop",
    "icon": "/uno.svg",
    "background": "/uno-bg.jpg"
  },
  "layout": {
    "hasServers": false,
    "showStats": true,
    "enableCustomServers": false
  }
}'::jsonb
WHERE name = 'UNO';

-- Configuraciones para servidores de Minecraft

-- Servidor Survival
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#059669",
    "secondary": "#047857",
    "accent": "#10B981"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop",
    "icon": "/survival-icon.svg"
  }
}'::jsonb
WHERE name = 'Survival';

-- Servidor Creative
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#1D4ED8",
    "accent": "#60A5FA"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=400&fit=crop",
    "icon": "/creative-icon.svg"
  }
}'::jsonb
WHERE name = 'Creative';

-- Servidor PvP
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#EF4444",
    "secondary": "#DC2626",
    "accent": "#F87171"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
    "icon": "/pvp-icon.svg"
  }
}'::jsonb
WHERE name = 'PvP';

-- Servidor Minigames
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#F59E0B",
    "secondary": "#D97706",
    "accent": "#FBBF24"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=400&fit=crop",
    "icon": "/minigames-icon.svg"
  }
}'::jsonb
WHERE name = 'Minigames';

-- Servidor Skyblock
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#06B6D4",
    "secondary": "#0891B2",
    "accent": "#22D3EE"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop",
    "icon": "/skyblock-icon.svg"
  }
}'::jsonb
WHERE name = 'Skyblock';

-- Servidor Modded
UPDATE game_servers 
SET theme_config = '{
  "colors": {
    "primary": "#8B5CF6",
    "secondary": "#7C3AED",
    "accent": "#A78BFA"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=400&fit=crop",
    "icon": "/modded-icon.svg"
  }
}'::jsonb
WHERE name = 'Modded';

-- Comentarios sobre la migración
COMMENT ON COLUMN games.theme_config IS 'Configuración de tema visual en formato JSON que incluye colores, tipografía, imágenes y layout';
COMMENT ON COLUMN game_servers.theme_config IS 'Configuración de tema visual específica del servidor que se combina con el tema del juego padre';