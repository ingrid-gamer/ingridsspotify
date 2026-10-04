# DJ Ingrid Stats — proyecto corregido

Este proyecto corrige la ruta de importación y la carga rápida de las últimas reproducciones.

## Correcciones principales

- Una sola tabla oficial: `spotify_history_extended`.
- Una sola clave de deduplicación: `source_key`.
- Se elimina la restricción antigua `unique_played_at_track`.
- `sync-spotify.js` usa `onConflict: 'source_key'`.
- El frontend deja de consultar `spotify_history` y consulta `view_recent_plays`.
- Las 20 reproducciones recientes se cargan antes que los rankings.
- Las recientes se vuelven a consultar cada 10 segundos.
- Los rankings recientes usan una ventana móvil de 30 días y se refrescan cada 5 minutos.
- La vista de álbumes expone URIs de Spotify para resolver portadas con Spotify oEmbed.
- Las portadas existentes en Supabase se muestran inmediatamente; las APIs externas quedan como respaldo.
- Los errores HTTP muestran el código y mensaje real en pantalla/terminal.
- `spotify-auth.js` queda en ES modules para eliminar el warning de Node sobre `MODULE_TYPELESS_PACKAGE_JSON`.
- `axios` queda declarado en `package.json`.
- GitHub Actions sincroniza Spotify cada 5 minutos como máximo por el límite de programación de workflows.

## 1. Seguridad

No copies las credenciales reales que estaban en la conversación. Rota el Client Secret de Spotify, el refresh token de Spotify y la clave secret/service_role de Supabase.

Crea `.env` a partir de `.env.example` y coloca allí los valores nuevos.

Nunca pongas `SUPABASE_SERVICE_ROLE_KEY`, `SPOTIFY_CLIENT_SECRET` ni `SPOTIFY_REFRESH_TOKEN` en `index.html`.

## 2. Supabase — ejecutar antes del importador

En Supabase > SQL Editor ejecuta `supabase-setup.sql` completo.

Si la base ya estaba configurada, vuelve a ejecutar el archivo completo para
actualizar el periodo de los rankings a 30 días y recrear `view_top_albums_recent`
con las URIs necesarias para recuperar las portadas.

Esto elimina específicamente:

```sql
unique_played_at_track
```

y deja `source_key` como deduplicación.

Comprueba después:

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'spotify_history_extended'
  AND indexname = 'unique_played_at_track';
```

Debe devolver 0 filas.

## 3. Preparar Node

```powershell
npm install
```

## 4. Importar el historial antiguo

Pon los archivos `Streaming_History_Audio*.json` dentro de:

```text
spotify-data/
```

Luego:

```powershell
npm run import
```

También puedes indicar la carpeta explícitamente:

```powershell
node impor-history/import-history.js .\spotify-data
```

No uses en PowerShell la sintaxis:

```text
SPOTIFY_HISTORY_DIR=./spotify-data
```

En Windows esa variable debe ir en `.env`, o puedes pasar la ruta como argumento al script.

## 5. Portadas

```powershell
npm run covers
```

## 6. Probar sincronización manual

```powershell
npm run sync
```

Esto consulta las últimas reproducciones disponibles desde Spotify y las guarda en `spotify_history_extended`.

Spotify permite hasta 50 elementos en `GET /me/player/recently-played` y requiere el scope `user-read-recently-played`.

## 7. Frontend

En `index.html` configura únicamente la clave pública:

```js
const SUPABASE_PUBLISHABLE_KEY = 'TU_SUPABASE_PUBLISHABLE_O_ANON_KEY_AQUI';
```

por tu clave pública/publishable o la legacy `anon`.

No pongas la secret/service_role allí.

## 8. GitHub Actions

En el repositorio agrega estos GitHub Secrets:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

El workflow `.github/workflows/sync-spotify.yml` ejecuta `npm run sync` cada 5 minutos.

También puedes ejecutarlo manualmente desde GitHub Actions con `Run workflow`.

## 11. Publicar la página

El workflow `.github/workflows/deploy-pages.yml` publica únicamente `index.html` en GitHub Pages; no incluye `.env` ni `spotify-data`.

1. Crea un repositorio en GitHub y sube el proyecto a la rama `main`. El `.gitignore` excluye `.env` y los archivos de `spotify-data`.
2. En GitHub, abre `Settings > Pages` y selecciona `GitHub Actions` como fuente de publicación.
3. En `Settings > Secrets and variables > Actions`, agrega los secretos indicados en la sección 8. El workflow programado necesita los valores nuevos de Spotify y Supabase.
4. En `Actions`, ejecuta `Deploy DJ Ingrid Stats` con `Run workflow` o sube un cambio a `index.html`. La URL pública aparecerá en el resultado del despliegue y tendrá el formato `https://USUARIO.github.io/REPOSITORIO/`.

La página será pública para cualquier persona con el enlace. GitHub Actions intenta sincronizar Spotify cada cinco minutos; la página consulta Supabase cada diez segundos. La actualización depende también de cuándo Spotify exponga cada reproducción en su API.

## 9. Actualización de las últimas reproducciones

La página consulta `view_recent_plays` inmediatamente al cargar.

Después vuelve a consultarla cada 10 segundos.

Esto significa que el navegador detectará rápidamente un registro nuevo una vez que el sincronizador lo haya guardado en Supabase.

El navegador no consulta Spotify directamente con el refresh token. La sincronización se mantiene del lado servidor/CI.

## 10. Prueba final

Después de ejecutar `npm run sync`:

```sql
SELECT
    id,
    played_at,
    track_name,
    artist_name,
    album_name
FROM public.spotify_history_extended
ORDER BY played_at DESC, id DESC
LIMIT 20;
```

Y:

```sql
SELECT *
FROM public.view_recent_plays;
```

Ambas consultas deberían mostrar tus reproducciones más recientes.
