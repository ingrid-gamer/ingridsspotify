/**
 * error-message.js
 * Componente reutilizable para mostrar mensajes de error.
 */

import { escapeHTML } from '../utils/security.js';

/**
 * Genera el HTML de un mensaje de error estilizado.
 * @param {string} message - Mensaje principal visible al usuario
 * @param {string} [detail] - Detalle técnico opcional (p.ej. error.message)
 * @returns {string} HTML listo para asignar a .innerHTML
 */
export function renderErrorMessage(message, detail = '') {
    const detailHtml = detail
        ? `<p class="text-xs text-red-400 mt-1">${escapeHTML(detail)}</p>`
        : '';

    return `
        <div class="bg-red-950/40 border border-red-800 rounded-lg p-4">
            <p class="text-sm text-red-300 font-semibold">${escapeHTML(message)}</p>
            ${detailHtml}
        </div>
    `;
}

/**
 * Genera el HTML de un mensaje de estado vacío (sin datos).
 * @param {string} [message]
 * @returns {string}
 */
export function renderEmptyMessage(message = 'No se encontraron datos.') {
    return `<p class="text-sm text-gray-500 p-2">${escapeHTML(message)}</p>`;
}

/**
 * Genera el HTML de un mensaje de carga (estado LOADING).
 * @param {string} [message]
 * @returns {string}
 */
export function renderLoadingMessage(message = 'Cargando...') {
    return `<p class="text-sm text-gray-500 p-2">${escapeHTML(message)}</p>`;
}
