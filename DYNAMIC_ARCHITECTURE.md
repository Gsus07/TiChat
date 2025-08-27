# Arquitectura Dinámica para Páginas de Juegos

## Análisis de la Estructura Actual

### Páginas Estáticas Identificadas
- `fortnite.astro` - Juego con muro directo
- `among-us.astro` - Juego con muro directo
- `call-of-duty.astro` - Juego con muro directo
- `uno.astro` - Juego con muro directo
- `pinturillo.astro` - Juego con muro directo
- `minecraft.astro` - Juego con servidores
- `minecraft/survival.astro` - Servidor específico
- `minecraft/creative.astro` - Servidor específico
- `minecraft/pvp.astro` - Servidor específico
- `minecraft/minigames.astro` - Servidor específico
- `minecraft/skyblock.astro` - Servidor específico
- `minecraft/modded.astro` - Servidor específico

### Páginas Dinámicas Existentes
- `index.astro` - Ya dinámico, carga juegos desde BD
- `minecraft/[server].astro` - Ya dinámico para servidores

## Propuesta de Arquitectura Dinámica

### Tipos de Páginas

#### 1. Juegos con Muro Directo
**Ruta:** `/[game-slug]`
**Ejemplos:** `/fortnite`, `/among-us`, `/call-of-duty`

**Características:**
- Muro de posts directo del juego
- Sin servidores intermedios
- Personalización visual por juego

#### 2. Juegos con Servidores
**Rutas:** 
- `/[game-slug]` - Lista de servidores
- `/[game-slug]/[server-slug]` - Muro del servidor específico

**Ejemplos:** 
- `/minecraft` - Lista servidores de Minecraft
- `/minecraft/survival` - Muro del servidor Survival

**Características:**
- Página principal muestra servidores disponibles
- Cada servidor tiene su propio muro
- Personalización visual por juego y servidor

### Campos de Personalización Necesarios

#### Tabla `games`
```sql
ALTER TABLE games ADD COLUMN theme_config JSONB DEFAULT '{}';
```

**Estructura del theme_config:**
```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "accent": "#10B981",
    "background": {
      "from": "blue-900",
      "to": "purple-900"
    }
  },
  "typography": {
    "fontFamily": "Inter",
    "titleSize": "text-3xl",
    "bodySize": "text-base"
  },
  "images": {
    "hero": "/fortnite-hero.jpg",
    "icon": "/fortnite.svg",
    "background": "/fortnite-bg.jpg"
  },
  "layout": {
    "hasServers": false,
    "showStats": true,
    "enableCustomServers": false
  }
}
```

#### Tabla `game_servers`
```sql
ALTER TABLE game_servers ADD COLUMN theme_config JSONB DEFAULT '{}';
```

**Estructura del theme_config para servidores:**
```json
{
  "colors": {
    "primary": "#10B981",
    "secondary": "#059669",
    "accent": "#34D399"
  },
  "images": {
    "hero": "/minecraft-survival.jpg",
    "icon": "/survival-icon.svg"
  }
}
```

### Rutas Dinámicas Propuestas

#### Archivo: `src/pages/[game].astro`
- Reemplaza todas las páginas estáticas de juegos
- Detecta si el juego tiene servidores o muro directo
- Aplica tema personalizado desde BD

#### Archivo: `src/pages/[game]/[server].astro`
- Ya existe, pero se mejorará con temas personalizados
- Aplicará tema del servidor + tema base del juego

### Componentes Reutilizables

#### `GameTemplate.astro`
- Plantilla base para juegos con muro directo
- Recibe configuración de tema como props
- Genera CSS dinámico basado en configuración

#### `GameWithServersTemplate.astro`
- Plantilla para juegos que muestran lista de servidores
- Hereda de GameTemplate pero muestra grid de servidores

#### `ServerTemplate.astro`
- Plantilla para páginas individuales de servidores
- Combina tema del juego + tema del servidor

#### `ThemeProvider.astro`
- Componente que inyecta CSS dinámico
- Convierte configuración JSON a clases CSS

### Migración Gradual

1. **Fase 1:** Agregar campos de personalización a BD
2. **Fase 2:** Crear plantillas dinámicas
3. **Fase 3:** Migrar un juego de prueba (ej: Fortnite)
4. **Fase 4:** Migrar resto de juegos
5. **Fase 5:** Eliminar páginas estáticas obsoletas

### Beneficios

- **Escalabilidad:** Agregar nuevos juegos sin crear archivos
- **Mantenimiento:** Un solo template para todos los juegos similares
- **Personalización:** Cada juego/servidor puede tener diseño único
- **Consistencia:** Estructura base común pero flexible
- **Performance:** Menos archivos estáticos, más eficiente

### Consideraciones Técnicas

- Usar `getStaticPaths()` para pre-generar rutas conocidas
- Implementar fallback para juegos nuevos
- Cache de configuraciones de tema
- Validación de configuraciones JSON
- Migración de datos existentes