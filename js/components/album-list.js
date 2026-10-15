/**
 * album-list.js
 * Componente de renderizado de listas de álbumes.
 */

import { escapeHTML }     from '../utils/security.js';
import { formatNumber }   from '../utils/format.js';
import { resolveCover, DEFAULT_COVER } from '../services/covers.js';
import { renderEmptyMessage } from './error-message.js';

/**
 * Renderiza una lista de álbumes en el contenedor indicado.
 * Las portadas y el año de lanzamiento se resuelven de forma asíncrona.
 *
 * @param {string} containerId - id del elemento <div> destino
 * @param {Array}  rows        - array de objetos devueltos por Supabase
 */
export function renderAlbumList(containerId, rows) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        container.innerHTML = renderEmptyMessage();
        return;
    }

    const html = rows.map((row, index) => {
        const rawAlbumName = row.album_name || 'Álbum desconocido';
        const albumName    = escapeHTML(rawAlbumName);
        const artistName   = escapeHTML(row.artist_name || 'Artista desconocido');
        const plays        = formatNumber(row.veces_reproducidas);
        const visibleYear  = row.album_year || row.release_year || row.year || '';
        const imgId        = `img-album-${containerId}-${index}`;
        const cover        = row.album_cover || DEFAULT_COVER;

        const yearHtml = /^(19|20)\d{2}$/.test(String(visibleYear))
            ? `<span id="year-album-${containerId}-${index}" class="text-gray-400 font-normal ml-1">(${escapeHTML(visibleYear)})</span>`
            : `<span id="year-album-${containerId}-${index}" class="text-gray-400 font-normal ml-1"></span>`;

        return `
            <div class="flex items-center gap-3 p-2 rounded-md hover:bg-cardHover transition-colors">
                <div class="text-lg font-bold text-gray-500 w-8 text-center shrink-0">${index + 1}</div>
                <div class="flex-1 min-w-0 flex flex-col text-right pr-1">
                    <h3 class="text-base font-bold text-gray-900 truncate">${albumName}${yearHtml}</h3>
                    <p class="text-sm text-lightText truncate">${artistName}</p>
                </div>
                <div class="text-xs font-bold text-gray-900 mr-1 whitespace-nowrap shrink-0">${plays} <span class="text-gray-500 font-normal">plays</span></div>
                <img
                    id="${imgId}"
                    src="${escapeHTML(cover)}"
                    alt="Portada de ${albumName}"
                    class="w-14 h-14 rounded bg-gray-200 object-cover flex-shrink-0"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${DEFAULT_COVER}'"
                >
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    // Resolución asíncrona de portadas y años tras el render inicial
    rows.forEach((row, index) => {
        const imgId = `img-album-${containerId}-${index}`;
        resolveCover(
            imgId,
            row.artist_name,
            row.album_name,
            row.spotify_url || row.spotify_album_uri || row.spotify_track_uri || '',
            true
        ).then(metadata => {
            const yearElement = document.getElementById(`year-album-${containerId}-${index}`);
            if (
                yearElement &&
                !yearElement.textContent.trim() &&
                metadata?.releaseYear &&
                /^(19|20)\d{2}$/.test(String(metadata.releaseYear))
            ) {
                yearElement.textContent = `(${metadata.releaseYear})`;
            }
        });
    });
}
