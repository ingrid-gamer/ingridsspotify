/**
 * supabase.js
 * Servicio de consultas a Supabase.
 * El frontend solo usa las vistas públicas con la publishable key (anon key).
 */

import { validateFrontendConfig } from '../utils/validation.js';

const SUPABASE_URL             = 'https://zbovgcnqoavnmlybkhfj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpib3ZnY25xb2F2bm1seWJraGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNDA1MTEsImV4cCI6MjEwNDkxNjUxMX0.BEoV7tFd4c6OKtvThJkTaHP5SKevOUnGBHCNtDbjSfE';

/**
 * Realiza un fetch con timeout y parseo de errores detallado.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function fetchJson(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text     = await response.text();

        let body = {};
        try {
            body = text ? JSON.parse(text) : {};
        } catch {
            body = { raw: text };
        }

        if (!response.ok) {
            const detail =
                body?.message ||
                body?.details ||
                body?.hint    ||
                body?.code    ||
                body?.raw     ||
                '';

            throw new Error(
                `HTTP ${response.status}${detail ? ` — ${detail}` : ''}`
            );
        }

        return body;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Consulta una vista pública de Supabase y devuelve el array de filas.
 * @param {string} viewName
 * @returns {Promise<Array>}
 */
export async function queryView(viewName) {
    validateFrontendConfig(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    const endpoint = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(viewName)}?select=*`;

    const data = await fetchJson(endpoint, {
        method: 'GET',
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Accept: 'application/json'
        },
        cache: 'no-store'
    });

    if (!Array.isArray(data)) {
        throw new Error(`${viewName}: la respuesta no es una lista válida.`);
    }

    return data;
}
