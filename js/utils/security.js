/**
 * security.js
 * Utilidades de seguridad para el frontend.
 */

/**
 * Escapa caracteres HTML especiales para prevenir inyección XSS.
 * @param {*} value
 * @returns {string}
 */
export function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}
