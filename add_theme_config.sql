-- Migración para agregar campos de personalización visual
-- Agregar columna theme_config a la tabla games
ALTER TABLE games ADD COLUMN IF NOT EXISTS theme_config JSONB;

-- Agregar columna theme_config a la tabla game_servers
ALTER TABLE game_servers ADD COLUMN IF NOT EXISTS theme_config JSONB;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN games.theme_config IS 'Configuración de tema visual para el juego (colores, tipografía, imágenes, layout)';
COMMENT ON COLUMN game_servers.theme_config IS 'Configuración de tema visual para el servidor (colores, tipografía, imágenes, layout)';

-- Configuraciones de tema por defecto para juegos existentes
UPDATE games SET theme_config = '{
  "colors": {
    "primary": "#4ade80",
    "secondary": "#22c55e",
    "accent": "#16a34a",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFont": "Orbitron, monospace"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop",
    "pattern": "/patterns/minecraft-blocks.svg"
  },
  "layout": {
    "borderRadius": "12px",
    "spacing": "1rem"
  }
}' WHERE name = 'Minecraft';

UPDATE games SET theme_config = '{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#1d4ed8",
    "accent": "#1e40af",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFont": "Rajdhani, sans-serif"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=600&fit=crop",
    "pattern": "/patterns/fortnite-storm.svg"
  },
  "layout": {
    "borderRadius": "8px",
    "spacing": "1rem"
  }
}' WHERE name = 'Fortnite';

UPDATE games SET theme_config = '{
  "colors": {
    "primary": "#ef4444",
    "secondary": "#dc2626",
    "accent": "#b91c1c",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFont": "Exo 2, sans-serif"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    "pattern": "/patterns/among-us-crewmates.svg"
  },
  "layout": {
    "borderRadius": "16px",
    "spacing": "1.25rem"
  }
}' WHERE name = 'Among Us';

UPDATE games SET theme_config = '{
  "colors": {
    "primary": "#f59e0b",
    "secondary": "#d97706",
    "accent": "#b45309",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFont": "Teko, sans-serif"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=1200&h=600&fit=crop",
    "pattern": "/patterns/military-camo.svg"
  },
  "layout": {
    "borderRadius": "4px",
    "spacing": "0.75rem"
  }
}' WHERE name = 'Call of Duty';

UPDATE games SET theme_config = '{
  "colors": {
    "primary": "#8b5cf6",
    "secondary": "#7c3aed",
    "accent": "#6d28d9",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f8fafc"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFont": "Fredoka One, cursive"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=1200&h=600&fit=crop",
    "pattern": "/patterns/uno-cards.svg"
  },
  "layout": {
    "borderRadius": "20px",
    "spacing": "1.5rem"
  }
}' WHERE name = 'UNO';

-- Configuraciones de tema para servidores de Minecraft
UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#22c55e",
    "secondary": "#16a34a",
    "accent": "#15803d"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop",
    "icon": "/icons/survival.svg"
  }
}' WHERE name = 'Survival' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#1d4ed8",
    "accent": "#1e40af"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    "icon": "/icons/creative.svg"
  }
}' WHERE name = 'Creative' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#ef4444",
    "secondary": "#dc2626",
    "accent": "#b91c1c"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=600&fit=crop",
    "icon": "/icons/pvp.svg"
  }
}' WHERE name = 'PvP' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#f59e0b",
    "secondary": "#d97706",
    "accent": "#b45309"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=1200&h=600&fit=crop",
    "icon": "/icons/minigames.svg"
  }
}' WHERE name = 'Minigames' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#06b6d4",
    "secondary": "#0891b2",
    "accent": "#0e7490"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=600&fit=crop",
    "icon": "/icons/skyblock.svg"
  }
}' WHERE name = 'Skyblock' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

UPDATE game_servers SET theme_config = '{
  "colors": {
    "primary": "#8b5cf6",
    "secondary": "#7c3aed",
    "accent": "#6d28d9"
  },
  "images": {
    "hero": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop",
    "icon": "/icons/modded.svg"
  }
}' WHERE name = 'Modded' AND game_id = (SELECT id FROM games WHERE name = 'Minecraft');

-- Crear índices para mejorar el rendimiento de consultas con theme_config
CREATE INDEX IF NOT EXISTS idx_games_theme_config ON games USING GIN (theme_config);
CREATE INDEX IF NOT EXISTS idx_game_servers_theme_config ON game_servers USING GIN (theme_config);

COMMIT;