import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

const result = dotenv.config({
    path: envPath
});

console.log('==============================================');
console.log('🔎 DJ INGRID — COMPROBACIÓN DE .env');
console.log('==============================================');

console.log(`📄 Archivo esperado: ${envPath}`);

if (result.error) {
    console.error('❌ No se pudo cargar .env.');
    console.error(result.error.message);
    process.exit(1);
}

const required = [
    'SUPABASE_URL',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REFRESH_TOKEN'
];

let missing = false;

for (const name of required) {
    const value = process.env[name]?.trim();
    const present = Boolean(value);

    console.log(
        `${present ? '✅' : '❌'} ${name}: ${
            present ? 'configurada' : 'FALTA'
        }`
    );

    if (!present) {
        missing = true;
    }
}

const supabaseSecret = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
).trim();

console.log(
    `${supabaseSecret ? '✅' : '❌'} SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY: ${
        supabaseSecret ? 'configurada' : 'FALTA'
    }`
);

if (!supabaseSecret) {
    missing = true;
}

console.log(
    `✅ SPOTIFY_MARKET: ${
        process.env.SPOTIFY_MARKET?.trim() || 'CL (por defecto)'
    }`
);

console.log(
    `✅ SPOTIFY_HISTORY_DIR: ${
        process.env.SPOTIFY_HISTORY_DIR?.trim() ||
        './spotify-data (por defecto)'
    }`
);

console.log(
    `✅ IMPORT_BATCH_SIZE: ${
        process.env.IMPORT_BATCH_SIZE?.trim() ||
        '500 (por defecto)'
    }`
);

if (missing) {
    console.error(
        '\n❌ Faltan una o más variables obligatorias en .env.'
    );

    console.error(
        'Revisa el archivo .env indicado arriba.'
    );

    process.exit(1);
}

console.log('\n✅ .env está correctamente cargado.');
console.log('==============================================\n');