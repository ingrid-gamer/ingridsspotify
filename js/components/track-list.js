/**
 * track-list.js
 * Componente de renderizado de listas de canciones.
 */

import { escapeHTML }       from '../utils/security.js';
import { formatNumber, formatRelativeTime } from '../utils/format.js';
import { getSpotifyUrl }    from '../utils/spotify.js';
import { resolveCover, DEFAULT_COVER } from '../services/covers.js';
import { renderEmptyMessage } from './error-message.js';

/**
 * Renderiza una lista de canciones en el contenedor indicado.
 *
 * Cada fila puede mostrar:
 *  - Tiempo relativo (modo recientes) o número de posición (modo top)
 *  - Enlace a Spotify si existe la URL
 *  - Contador de reproducciones (solo si showPlays = true)
 *  - Portada que se resuelve de forma asíncrona
 *
 * @param {string}  containerId - id del elemento <div> destino
 * @param {Array}   rows        - array de objetos devueltos por Supabase
 * @param {boolean} showPlays   - muestra el contador de reproducciones
 */
export function renderTrackList(containerId, rows, showPlays = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        container.innerHTML = renderEmptyMessage();
        return;
    }

    const html = rows.map((row, index) => {
        const rawTrackName  = row.track_name  || 'Canción desconocida';
        const rawArtistName = row.artist_name || 'Artista desconocido';
        const trackName     = escapeHTML(rawTrackName);
        const artistName    = escapeHTML(rawArtistName);
        const albumName     = row.album_name ? `${escapeHTML(row.album_name)}, ` : '';
        const plays         = showPlays ? formatNumber(row.veces_reproducidas) : '';
        const link          = getSpotifyUrl(row.spotify_url || row.spotify_track_uri);
        const relativeTime  = formatRelativeTime(row.played_at);
        const imgId         = `img-track-${containerId}-${index}`;

        const left = relativeTime
            ? `<div class="recent-time text-xs text-gray-500 flex flex-col items-center justify-center w-28 text-center shrink-0"><span>${escapeHTML(relativeTime)}</span></div>`
            : `<div class="text-lg font-bold text-gray-500 w-8 text-center shrink-0">${index + 1}</div>`;

        const titleHtml = link
            ? `<a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer" class="track-title-link text-base font-bold text-gray-900 underline decoration-spotify/60 underline-offset-2 hover:text-spotify truncate">${trackName}</a>`
            : `<h3 class="text-base font-bold text-gray-900 truncate">${trackName}</h3>`;

        const playsHtml = showPlays
            ? `<div class="text-xs font-bold text-gray-900 mr-1 whitespace-nowrap shrink-0">${plays} <span class="text-gray-500 font-normal">plays</span></div>`
            : '';

        const cover = row.album_cover || DEFAULT_COVER;

        return `
            <div class="recent-row flex items-center gap-3 p-2 rounded-md hover:bg-cardHover transition-colors">
                ${left}
                <div class="flex-1 min-w-0 flex flex-col text-right pr-1">
                    ${titleHtml}
                    <p class="text-sm text-lightText truncate">${albumName}${artistName}</p>
                </div>
                ${playsHtml}
                <img
                    id="${imgId}"
                    src="${escapeHTML(cover)}"
                    alt="Portada de ${trackName}"
                    class="w-14 h-14 rounded bg-gray-200 object-cover flex-shrink-0"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${DEFAULT_COVER}'"
                >
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    // Resolución asíncrona de portadas tras el render inicial
    rows.forEach((row, index) => {
        const imgId = `img-track-${containerId}-${index}`;
        resolveCover(
            imgId,
            row.artist_name,
            row.track_name,
            row.spotify_url || row.spotify_track_uri,
            false
        );
    });
}
