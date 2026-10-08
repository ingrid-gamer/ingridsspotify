/**
 * format.js
 * Utilidades de formato numérico y de fechas.
 */

/**
 * Convierte un valor a número finito, devolviendo 0 si no es válido.
 * @param {*} value
 * @returns {number}
 */
export function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

/**
 * Formatea un número con separadores de miles en español (Chile).
 * @param {*} value
 * @returns {string}
 */
export function formatNumber(value) {
    return safeNumber(value).toLocaleString('es-CL');
}

/**
 * Devuelve una cadena relativa al tiempo transcurrido desde `playedAt`.
 * Ejemplo: "hace 3 minutos", "hace 2 horas", "hace 1 día".
 * @param {string|null} playedAt - ISO 8601
 * @returns {string}
 */
export function formatRelativeTime(playedAt) {
    if (!playedAt) return '';

    const date = new Date(playedAt);
    if (Number.isNaN(date.getTime())) return '';

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

    if (elapsedMinutes < 1)  return 'hace menos de un minuto';
    if (elapsedMinutes < 60) {
        return `hace ${elapsedMinutes} ${elapsedMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `hace ${elapsedHours} ${elapsedHours === 1 ? 'hora' : 'horas'}`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `hace ${elapsedDays} ${elapsedDays === 1 ? 'día' : 'días'}`;
}
