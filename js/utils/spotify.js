/**
 * spotify.js
 * Utilidades para construir URLs de Spotify.
 */

/**
 * Convierte una URI de Spotify o una URL a una URL canónica de open.spotify.com.
 * Devuelve cadena vacía si el valor no es válido.
 *
 * Ejemplos:
 *   "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" → "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"
 *   "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh" → mismo valor (sin cambios)
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function getSpotifyUrl(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const spotifyUri = trimmed.match(/^spotify:(track|album):([A-Za-z0-9]+)$/i);
    if (spotifyUri) {
        return `https://open.spotify.com/${spotifyUri[1].toLowerCase()}/${spotifyUri[2]}`;
    }

    return '';
}
