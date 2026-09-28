import dotenv from 'dotenv';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

dotenv.config({
    path: envPath
});

const SUPABASE_URL =
    process.env.SUPABASE_URL?.trim();

const SUPABASE_KEY = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
).trim();

const CLIENT_ID =
    process.env.SPOTIFY_CLIENT_ID?.trim();

const CLIENT_SECRET =
    process.env.SPOTIFY_CLIENT_SECRET?.trim();

const REFRESH_TOKEN =
    process.env.SPOTIFY_REFRESH_TOKEN?.trim();

const TABLE_NAME =
    'spotify_history_extended';

const missing = [];

if (!SUPABASE_URL) {
    missing.push('SUPABASE_URL');
}

if (!SUPABASE_KEY) {
    missing.push(
        'SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY)'
    );
}

if (!CLIENT_ID) {
    missing.push('SPOTIFY_CLIENT_ID');
}

if (!CLIENT_SECRET) {
    missing.push('SPOTIFY_CLIENT_SECRET');
}

if (!REFRESH_TOKEN) {
    missing.push('SPOTIFY_REFRESH_TOKEN');
}

if (missing.length) {
    console.error(
        '❌ Faltan variables de entorno necesarias:'
    );

    for (const name of missing) {
        console.error(`   - ${name}`);
    }

    console.error(
        `\n📄 Node está buscando .env en:\n   ${envPath}`
    );

    process.exit(1);
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

function sha256(value) {
    return crypto
        .createHash('sha256')
        .update(value, 'utf8')
        .digest('hex');
}

async function getAccessToken() {

    const credentials = Buffer
        .from(`${CLIENT_ID}:${CLIENT_SECRET}`)
        .toString('base64');

    const response = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',

            headers: {
                Authorization:
                    `Basic ${credentials}`,

                'Content-Type':
                    'application/x-www-form-urlencoded'
            },

            body: new URLSearchParams({
                grant_type:
                    'refresh_token',

                refresh_token:
                    REFRESH_TOKEN
            })
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            `Spotify rechazó el token (HTTP ${response.status}): ${JSON.stringify(data)}`
        );
    }

    if (!data.access_token) {

        throw new Error(
            'Spotify no devolvió un access_token.'
        );
    }

    return data.access_token;
}

async function fetchRecentlyPlayed(
    accessToken
) {

    const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=50',
        {
            headers: {
                Authorization:
                    `Bearer ${accessToken}`
            }
        }
    );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            `Spotify API respondió HTTP ${response.status}: ${JSON.stringify(data)}`
        );
    }

    return data.items || [];
}

async function saveRows(rows) {

    const { error } =
        await supabase
            .from(TABLE_NAME)
            .upsert(rows, {
                onConflict:
                    'source_key',

                ignoreDuplicates:
                    true
            });

    if (error) {

        throw new Error(
            `Supabase rechazó la operación: ${error.message}`
        );
    }
}

async function main() {

    try {

        console.log(
            '=============================================='
        );

        console.log(
            '🎧 DJ INGRID — SINCRONIZACIÓN SPOTIFY'
        );

        console.log(
            '=============================================='
        );

        console.log(
            '🔐 Obteniendo token de Spotify...'
        );

        const accessToken =
            await getAccessToken();

        console.log(
            '✅ Token obtenido.'
        );

        console.log(
            '🎵 Consultando reproducciones recientes...'
        );

        const items =
            await fetchRecentlyPlayed(
                accessToken
            );

        console.log(
            `📥 Spotify devolvió ${items.length} reproducciones.`
        );

        if (!items.length) {

            console.log(
                'ℹ️ No hay reproducciones nuevas para guardar.'
            );

            return;
        }

        const rows =
            items
                .filter(
                    item => item?.track
                )
                .map(item => {

                    const track =
                        item.track;

                    const playedAt =
                        new Date(
                            item.played_at
                        ).toISOString();

                    const trackName =
                        track.name ||
                        'Desconocido';

                    const artistName =
                        track.artists
                            ?.map(
                                artist =>
                                    artist.name
                            )
                            .join(', ') ||
                        'Desconocido';

                    const albumName =
                        track.album?.name ||
                        null;

                    const albumCover =
                        track.album?.images?.[0]?.url ||
                        null;

                    const spotifyTrackUri =
                        track.uri ||
                        null;

                    const spotifyAlbumUri =
                        track.album?.uri ||
                        null;

                    const durationMs =
                        Number(
                            track.duration_ms ||
                            0
                        );

                    const sourceKey =
                        sha256(
                            [
                                playedAt,
                                spotifyTrackUri ||
                                    '',
                                trackName,
                                artistName,
                                albumName ||
                                    '',
                                String(
                                    durationMs
                                )
                            ].join(
                                '\u001f'
                            )
                        );

                    return {

                        source_key:
                            sourceKey,

                        played_at:
                            playedAt,

                        track_name:
                            trackName,

                        artist_name:
                            artistName,

                        album_name:
                            albumName,

                        album_cover:
                            albumCover,

                        spotify_track_uri:
                            spotifyTrackUri,

                        spotify_album_uri:
                            spotifyAlbumUri,

                        ms_played:
                            durationMs,

                        skipped:
                            false,

                        shuffle:
                            false,

                        offline:
                            false,

                        incognito_mode:
                            false,

                        source_file:
                            'spotify_api_auto'
                    };
                });

        if (!rows.length) {

            console.log(
                'ℹ️ No se generaron registros válidos.'
            );

            return;
        }

        console.log(
            `💾 Guardando ${rows.length} registros en Supabase...`
        );

        await saveRows(rows);

        console.log(
            '✅ Sincronización completada.'
        );

        console.log(
            '=============================================='
        );

    } catch (error) {

        console.error(
            '\n❌ ERROR DE SINCRONIZACIÓN'
        );

        console.error(
            error instanceof Error
                ? error.message
                : error
        );

        process.exit(1);
    }
}

main();