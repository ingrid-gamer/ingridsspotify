/**
 * validation.js
 * Utilidades de validación y normalización de texto.
 */

/**
 * Normaliza un texto para comparaciones: minúsculas, sin acentos, sin símbolos.
 * Ejemplo: "Björk" → "bjork"
 * @param {*} value
 * @returns {string}
 */
export function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Verifica que SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY estén configurados
 * y no sean los valores de ejemplo del .env.example.
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @throws {Error} si la configuración es inválida
 */
export function validateFrontendConfig(supabaseUrl, supabaseKey) {
    if (
        !supabaseUrl?.trim() ||
        !supabaseKey?.trim() ||
        /^(TU_|YOUR_)/i.test(supabaseKey.trim())
    ) {
        throw new Error(
            'Configura SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en index.html.'
        );
    }
}
