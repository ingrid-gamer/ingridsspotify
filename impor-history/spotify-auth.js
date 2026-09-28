import dotenv from 'dotenv';
import { readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import {
    URL,
    fileURLToPath
} from 'node:url';

const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );

const projectRoot =
    path.resolve(
        __dirname,
        '..'
    );

const envPath =
    path.join(
        projectRoot,
        '.env'
    );

async function saveRefreshToken(
    refreshToken
) {

    let envContent = '';

    try {
        envContent = await readFile(
            envPath,
            'utf8'
        );
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    const newline = envContent.includes('\r\n')
        ? '\r\n'
        : '\n';

    const lines = envContent.split(/\r?\n/);
    const tokenLine = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`;
    const tokenIndex = lines.findIndex(
        line => line.startsWith('SPOTIFY_REFRESH_TOKEN=')
    );

    if (tokenIndex === -1) {
        while (lines.at(-1) === '') {
            lines.pop();
        }

        lines.push(tokenLine);
    } else {
        lines[tokenIndex] = tokenLine;
    }

    await writeFile(
        envPath,
        `${lines.join(newline)}${newline}`,
        'utf8'
    );
}

dotenv.config({
    path: envPath
});

const CLIENT_ID =
    (
        process.env.SPOTIFY_CLIENT_ID ||
        ''
    )
    .trim()
    .replace(
        /[\r\n]/g,
        ''
    );

const CLIENT_SECRET =
    (
        process.env.SPOTIFY_CLIENT_SECRET ||
        ''
    )
    .trim()
    .replace(
        /[\r\n]/g,
        ''
    );

const REDIRECT_URI =
    'http://127.0.0.1:3000/callback';

const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-recently-played',
    'user-read-currently-playing',
    'user-read-playback-state'
].join(' ');

if (
    !CLIENT_ID ||
    !CLIENT_SECRET
) {

    console.error(
        '❌ Faltan SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET en .env.'
    );

    console.error(
        `📄 Archivo esperado: ${envPath}`
    );

    process.exit(1);
}

console.log(
    '--- VERIFICACIÓN DE CREDENCIALES ---'
);

console.log(
    `CLIENT_ID: ${CLIENT_ID.substring(0, 8)}...`
);

console.log(
    `CLIENT_SECRET: configurado`
);

console.log(
    `Longitud CLIENT_SECRET: ${CLIENT_SECRET.length}`
);

console.log(
    '------------------------------------\n'
);

const state =
    crypto.randomBytes(16)
        .toString('hex');

const authorizeUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({

        client_id:
            CLIENT_ID,

        response_type:
            'code',

        redirect_uri:
            REDIRECT_URI,

        scope:
            SCOPES,

        state

    }).toString();

console.log(
    'Abre esta dirección en tu navegador:\n'
);

console.log(
    authorizeUrl
);

console.log(
    '\nEsperando autorización de Spotify...\n'
);

const server =
    http.createServer(
        async (
            req,
            res
        ) => {

            const url =
                new URL(
                    req.url,
                    REDIRECT_URI
                );

            if (
                url.pathname !==
                '/callback'
            ) {

                res.writeHead(
                    404
                );

                res.end(
                    'Ruta no encontrada'
                );

                return;
            }

            const returnedState =
                url.searchParams.get(
                    'state'
                );

            const code =
                url.searchParams.get(
                    'code'
                );

            const error =
                url.searchParams.get(
                    'error'
                );

            if (error) {

                res.writeHead(
                    400,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );

                res.end(
                    `Spotify devolvió un error: ${error}`
                );

                server.close();

                return;
            }

            if (
                returnedState !==
                state
            ) {

                res.writeHead(
                    400,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );

                res.end(
                    'Error: state inválido.'
                );

                server.close();

                return;
            }

            if (!code) {

                res.writeHead(
                    400,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );

                res.end(
                    'No se recibió el código de autorización.'
                );

                server.close();

                return;
            }

            try {

                const credentials =
                    Buffer
                        .from(
                            `${CLIENT_ID}:${CLIENT_SECRET}`
                        )
                        .toString(
                            'base64'
                        );

                const response =
                    await fetch(
                        'https://accounts.spotify.com/api/token',
                        {

                            method:
                                'POST',

                            headers: {

                                Authorization:
                                    `Basic ${credentials}`,

                                'Content-Type':
                                    'application/x-www-form-urlencoded'
                            },

                            body:
                                new URLSearchParams({

                                    grant_type:
                                        'authorization_code',

                                    code,

                                    redirect_uri:
                                        REDIRECT_URI

                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    console.error(
                        '\nSpotify respondió con un error:'
                    );

                    console.error(
                        data
                    );

                    res.writeHead(
                        500,
                        {
                            'Content-Type':
                                'text/plain; charset=utf-8'
                        }
                    );

                    res.end(
                        'Spotify rechazó el intercambio del código. Revisa la consola.'
                    );

                    server.close();

                    return;
                }

                if (!data.refresh_token) {
                    throw new Error(
                        'Spotify no devolvió un refresh token.'
                    );
                }

                await saveRefreshToken(
                    data.refresh_token
                );

                console.log(
                    '\n========================================'
                );

                console.log(
                    'AUTORIZACIÓN COMPLETADA CON ÉXITO'
                );

                console.log(
                    '========================================\n'
                );

                console.log(
                    'Refresh token guardado en .env.'
                );

                res.writeHead(
                    200,
                    {
                        'Content-Type':
                            'text/html; charset=utf-8'
                    }
                );

                res.end(`
                    <!doctype html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>Spotify autorizado</title>
                    </head>

                    <body
                        style="
                            font-family:Arial,sans-serif;
                            padding:40px;
                            background:#121212;
                            color:white
                        "
                    >
                        <h1 style="color:#1DB954">
                            Spotify autorizado correctamente
                        </h1>

                        <p>
                            Ya puedes volver a la terminal de VS Code.
                        </p>

                        <p>
                            El Refresh Token se guardó en .env.
                        </p>
                    </body>
                    </html>
                `);

                server.close();

            } catch (err) {

                console.error(
                    '\nError:',
                    err
                );

                res.writeHead(
                    500,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );

                res.end(
                    'Error interno. Revisa la terminal.'
                );

                server.close();
            }
        }
    );

server.listen(
    3000,
    '127.0.0.1',
    () => {

        console.log(
            `Servidor de autorización escuchando en: ${REDIRECT_URI}`
        );
    }
);