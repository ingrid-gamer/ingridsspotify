/**
 * covers.js
 * Servicio de resolución de portadas.
 * Intenta Spotify oEmbed → iTunes → Deezer → imagen por defecto.
 */

import { normalizeText }  from '../utils/validation.js';
import { getSpotifyUrl }  from '../utils/spotify.js';

export const DEFAULT_COVER =
    'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2';

/** Caché en memoria para evitar peticiones repetidas durante la sesión. */
const coverCache = new Map();

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchJson(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function querySpotifyOEmbed(spotifyValue) {
    const spotifyUrl = getSpotifyUrl(spotifyValue);
    if (!spotifyUrl) return null;

    try {
        const data = await fetchJson(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
        );
        if (!data?.thumbnail_url) return null;
        return { cover: data.thumbnail_url, title: data.title || null };
    } catch (error) {
        console.warn('Spotify oEmbed no respondió:', error);
        return null;
    }
}

async function queryItunesStrict(artist, titleOrAlbum, mode = 'song') {
    if (!artist && !titleOrAlbum) return null;

    try {
        const query  = encodeURIComponent(`${artist || ''} ${titleOrAlbum || ''}`.trim());
        const entity = mode === 'album' ? 'album' : 'song';
        const data   = await fetchJson(
            `https://itunes.apple.com/search?term=${query}&entity=${entity}&limit=10&country=CL`
        );

        const results   = Array.isArray(data.results) ? data.results : [];
        if (!results.length) return null;

        const artistKey = normalizeText(artist);
        const targetKey = normalizeText(titleOrAlbum);

        const scored = results.map(item => {
            const itemArtist = normalizeText(item.artistName || '');
            const itemTitle  = normalizeText(
                mode === 'album' ? (item.collectionName || '') : (item.trackName || '')
            );

            let score = 0;
            if (artistKey && itemArtist === artistKey) score += 10;
            else if (artistKey && (itemArtist.includes(artistKey) || artistKey.includes(itemArtist))) score += 4;

            if (targetKey && itemTitle === targetKey) score += 10;
            else if (targetKey && (itemTitle.includes(targetKey) || targetKey.includes(itemTitle))) score += 3;

            return { item, score };
        }).sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (!best || best.score < 14) return null;

        const artwork = best.item.artworkUrl100;
        return {
            cover: artwork ? artwork.replace('100x100bb', '600x600bb') : null,
            releaseYear: best.item.releaseDate
                ? String(best.item.releaseDate).slice(0, 4)
                : null
        };
    } catch (error) {
        console.warn('iTunes no respondió:', error);
        return null;
    }
}

async function queryDeezerStrict(artist, title) {
    if (!artist && !title) return null;

    try {
        const query = encodeURIComponent(`${artist || ''} ${title || ''}`.trim());
        const data  = await fetchJson(
            `https://corsproxy.io/?https://api.deezer.com/search?q=${query}&limit=10`
        );

        const results   = Array.isArray(data?.data) ? data.data : [];
        const artistKey = normalizeText(artist);
        const titleKey  = normalizeText(title);

        const scored = results.map(item => {
            const itemArtist = normalizeText(item?.artist?.name || '');
            const itemTitle  = normalizeText(item?.title || '');
            let score = 0;

            if (itemArtist === artistKey) score += 10;
            else if (artistKey && itemArtist.includes(artistKey)) score += 4;

            if (itemTitle === titleKey) score += 10;
            else if (titleKey && itemTitle.includes(titleKey)) score += 3;

            return { item, score };
        }).sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (!best || best.score < 14) return null;

        return best.item?.album?.cover_xl || best.item?.album?.cover_big || null;
    } catch (error) {
        console.warn('Deezer no respondió:', error);
        return null;
    }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Resuelve la portada y el año de lanzamiento de una canción.
 * Orden: Spotify oEmbed → iTunes → Deezer → imagen por defecto.
 *
 * @param {string} artistName
 * @param {string} trackName
 * @param {string} spotifyValue - URI o URL de Spotify
 * @returns {Promise<{cover: string, releaseYear: string|null}>}
 */
export async function fetchTrackMetadata(artistName, trackName, spotifyValue) {
    const cacheKey = `track|||${normalizeText(artistName)}|||${normalizeText(trackName)}|||${normalizeText(spotifyValue)}`;
    if (coverCache.has(cacheKey)) return coverCache.get(cacheKey);

    const spotify = await querySpotifyOEmbed(spotifyValue);
    if (spotify?.cover) {
        const result = { cover: spotify.cover, releaseYear: null };
        coverCache.set(cacheKey, result);
        return result;
    }

    const itunes = await queryItunesStrict(artistName, trackName, 'song');
    if (itunes?.cover) {
        coverCache.set(cacheKey, itunes);
        return itunes;
    }

    const deezer = await queryDeezerStrict(artistName, trackName);
    if (deezer) {
        const result = { cover: deezer, releaseYear: null };
        coverCache.set(cacheKey, result);
        return result;
    }

    const result = { cover: DEFAULT_COVER, releaseYear: null };
    coverCache.set(cacheKey, result);
    return result;
}

/**
 * Resuelve la portada y el año de lanzamiento de un álbum.
 * Orden: Spotify oEmbed → iTunes → imagen por defecto.
 *
 * @param {string} artistName
 * @param {string} albumName
 * @param {string} spotifyValue - URI o URL de Spotify
 * @returns {Promise<{cover: string, releaseYear: string|null}>}
 */
export async function fetchAlbumMetadata(artistName, albumName, spotifyValue) {
    const cacheKey = `album|||${normalizeText(artistName)}|||${normalizeText(albumName)}|||${normalizeText(spotifyValue)}`;
    if (coverCache.has(cacheKey)) return coverCache.get(cacheKey);

    const spotify = await querySpotifyOEmbed(spotifyValue);
    if (spotify?.cover) {
        const result = { cover: spotify.cover, releaseYear: null };
        coverCache.set(cacheKey, result);

        const itunesYear = await queryItunesStrict(artistName, albumName, 'album');
        if (itunesYear?.releaseYear) result.releaseYear = itunesYear.releaseYear;

        return result;
    }

    const itunes = await queryItunesStrict(artistName, albumName, 'album');
    if (itunes?.cover) {
        coverCache.set(cacheKey, itunes);
        return itunes;
    }

    const result = { cover: DEFAULT_COVER, releaseYear: itunes?.releaseYear || null };
    coverCache.set(cacheKey, result);
    return result;
}

/**
 * Actualiza la imagen de un elemento del DOM y devuelve los metadatos resueltos.
 *
 * @param {string} imgId - id del <img>
 * @param {string} artistName
 * @param {string} titleName
 * @param {string} spotifyValue
 * @param {boolean} isAlbum
 * @returns {Promise<{cover: string, releaseYear: string|null}|null>}
 */
export async function resolveCover(imgId, artistName, titleName, spotifyValue = '', isAlbum = false) {
    const imgElement = document.getElementById(imgId);
    if (!imgElement) return null;

    const metadata = isAlbum
        ? await fetchAlbumMetadata(artistName, titleName, spotifyValue)
        : await fetchTrackMetadata(artistName, titleName, spotifyValue);

    const currentImage = document.getElementById(imgId);
    if (currentImage && metadata?.cover) currentImage.src = metadata.cover;

    return metadata;
}
