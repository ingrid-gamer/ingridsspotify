# DJ Ingrid — Estadísticas de Spotify

Dashboard personal con estadísticas de escucha de Spotify, construido con HTML + JavaScript + Supabase.

---

## Tecnologías

| Capa         | Tecnología                        |
| ------------ | --------------------------------- |
| Frontend     | HTML, Tailwind CSS (CDN), JS ESM  |
| Base de datos| Supabase (PostgreSQL)             |
| API          | Spotify Web API                   |
| Automatización | GitHub Actions                  |

---

## Arquitectura

```
CLIENTE (navegador)
    index.html
        └── js/
            ├── components/   ← renderizado HTML
            ├── services/     ← Supabase, portadas
            └── utils/        ← formato, seguridad, validación
                │
                ↓ Publishable Key (anon key)
            Supabase Views (solo lectura pública)


SERVIDOR (Node.js / GitHub Actions)
    sync-spotify.js       ← obtiene reproducciones nuevas
    enrich-metadata.js    ← busca portadas faltantes
    import-history/
        import-history.js ← importa historial de Spotify
        spotify-auth.js   ← obtiene el refresh token
                │
                ↓ Secret Key
            Supabase (lectura + escritura)
```

**El navegador nunca ve las claves secretas.** Solo conoce `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`.

---

## Estructura de carpetas

```
dj-ingrid-stats/
│
├── .github/
│   └── workflows/
│       ├── sync-spotify.yml      ← sincronización automática cada 5 min
│       └── deploy-pages.yml      ← publica el frontend en GitHub Pages
│
├── import-history/
│   ├── import-history.js         ← importa archivos JSON de Spotify
│   └── spotify-auth.js           ← flujo OAuth para obtener refresh token
│
├── js/
│   ├── components/
│   │   ├── track-list.js         ← renderiza listas de canciones
│   │   ├── album-list.js         ← renderiza listas de álbumes
│   │   └── error-message.js      ← mensajes de error/carga reutilizables
│   │
│   ├── services/
│   │   ├── supabase.js           ← consultas a las vistas públicas
│   │   └── covers.js             ← resolución de portadas (Spotify/iTunes/Deezer)
│   │
│   └── utils/
│       ├── format.js             ← formatNumber, formatRelativeTime, safeNumber
│       ├── security.js           ← escapeHTML
│       ├── validation.js         ← normalizeText, validateFrontendConfig
│       └── spotify.js            ← getSpotifyUrl
│
├── tests/
│   ├── format.test.js
│   ├── spotify.test.js
│   ├── validation.test.js
│   └── security.test.js
│
├── dev-server.js                 ← servidor local para abrir el dashboard
├── spotify-data/                 ← archivos JSON del historial (en .gitignore)
│
├── .env                          ← variables secretas (en .gitignore)
├── .env.example                  ← plantilla pública
├── .gitignore
├── index.html                    ← página principal del dashboard
├── sync-spotify.js               ← sincronización de reproducciones recientes
├── enrich-metadata.js            ← enriquecimiento de portadas en Supabase
├── check-env.js                  ← verifica que .env esté configurado
├── supabase-setup.sql            ← tabla, índices, vistas y permisos
├── jest.config.js
├── eslint.config.js
├── package.json
└── README.md
```

---

## Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dj-ingrid-stats.git
cd dj-ingrid-stats
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear `.env`

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SECRET_KEY=eyJ...

SPOTIFY_MARKET=CL
SPOTIFY_HISTORY_DIR=./spotify-data
IMPORT_BATCH_SIZE=500
```

### 4. Configurar la base de datos

Ejecuta `supabase-setup.sql` en el **SQL Editor de Supabase**. Crea la tabla, los índices, las vistas públicas y los permisos correctos.

---

## Variables de entorno

| Variable                 | Requerida | Descripción                                |
| ------------------------ | --------- | ------------------------------------------ |
| `SUPABASE_URL`           | ✅        | URL del proyecto Supabase                  |
| `SUPABASE_SECRET_KEY`    | ✅        | Service role key (solo backend)            |
| `SPOTIFY_CLIENT_ID`      | ✅        | App ID de Spotify Developer Dashboard      |
| `SPOTIFY_CLIENT_SECRET`  | ✅        | App Secret de Spotify Developer Dashboard  |
| `SPOTIFY_REFRESH_TOKEN`  | ✅        | Token de actualización OAuth               |
| `SPOTIFY_MARKET`         | —         | Mercado Spotify (default: `CL`)            |
| `SPOTIFY_HISTORY_DIR`    | —         | Carpeta con JSON del historial (default: `./spotify-data`) |
| `IMPORT_BATCH_SIZE`      | —         | Tamaño de lote de importación (default: `500`) |

---

## Ejecución local

### Abrir el dashboard

Instala las dependencias una vez y arranca el servidor local:

```bash
npm install
npm run start
```

Luego abre <http://localhost:4173>. El dashboard consulta Supabase usando la
publishable key configurada en `js/services/supabase.js`.

Para sincronizar datos, importar el historial o enriquecer portadas, configura
las credenciales de backend en `.env` como se indica arriba. No pongas claves
secretas en el frontend.

### Scripts de backend

```bash
# Verificar que .env está bien configurado
npm run check

# Sincronizar reproducciones recientes desde Spotify
npm run sync

# Importar historial completo de Spotify
npm run import

# Enriquecer portadas faltantes en Supabase
npm run covers

# Obtener refresh token (primera vez)
npm run auth
```

---

## Testing

```bash
npm test
```

Los tests cubren las utilidades más críticas del proyecto:

- `format.test.js` → `safeNumber`, `formatNumber`, `formatRelativeTime`
- `spotify.test.js` → `getSpotifyUrl` (URIs y URLs)
- `validation.test.js` → `normalizeText`, `validateFrontendConfig`
- `security.test.js` → `escapeHTML`

---

## Lint

```bash
npm run lint
```

---

## Sincronización automática

GitHub Actions ejecuta `sync-spotify.js` automáticamente cada 5 minutos mediante un cron job definido en `.github/workflows/sync-spotify.yml`.

Las siguientes variables deben estar configuradas como **Secrets** en el repositorio de GitHub:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

---

## Seguridad

- La `SUPABASE_SECRET_KEY` nunca llega al navegador.
- El frontend usa exclusivamente la `SUPABASE_PUBLISHABLE_KEY` (anon key).
- Las vistas de Supabase solo exponen los datos necesarios (RLS habilitado).
- Todas las cadenas renderizadas en HTML pasan por `escapeHTML()` para prevenir XSS.

---

## Base de datos

La tabla principal es `spotify_history_extended`. La clave de deduplicación es `source_key` (SHA-256 de: fecha + URI + nombre + artista + álbum + duración).

Vistas públicas disponibles:

| Vista                     | Descripción                              |
| ------------------------- | ---------------------------------------- |
| `view_recent_plays`       | Últimas 20 reproducciones                |
| `view_stats_general`      | Total de reproducciones y artistas       |
| `view_top_tracks_recent`  | Top 10 canciones (últimos 30 días)       |
| `view_top_albums_recent`  | Top 5 álbumes (últimos 30 días)          |
| `view_top_tracks_all_time`| Top 10 canciones (todos los tiempos)     |
| `view_top_albums_all_time`| Top 5 álbumes (todos los tiempos)        |
