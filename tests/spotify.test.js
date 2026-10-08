/**
 * spotify.test.js
 * Pruebas unitarias para js/utils/spotify.js
 */

import { getSpotifyUrl } from '../js/utils/spotify.js';

describe('getSpotifyUrl', () => {
    test('devuelve cadena vacía para valores nulos o inválidos', () => {
        expect(getSpotifyUrl(null)).toBe('');
        expect(getSpotifyUrl(undefined)).toBe('');
        expect(getSpotifyUrl('')).toBe('');
        expect(getSpotifyUrl(123)).toBe('');
    });

    test('devuelve la URL directamente si ya es http/https', () => {
        const url = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
        expect(getSpotifyUrl(url)).toBe(url);
    });

    test('convierte URI de track a URL canónica', () => {
        const uri = 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh';
        expect(getSpotifyUrl(uri)).toBe(
            'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
        );
    });

    test('convierte URI de album a URL canónica', () => {
        const uri = 'spotify:album:1A2GTWGtFfWp7KSQTwWOyo';
        expect(getSpotifyUrl(uri)).toBe(
            'https://open.spotify.com/album/1A2GTWGtFfWp7KSQTwWOyo'
        );
    });

    test('es case-insensitive en la URI', () => {
        const uri = 'Spotify:Track:4iV5W9uYEdYUVa79Axb7Rh';
        expect(getSpotifyUrl(uri)).toBe(
            'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
        );
    });

    test('devuelve cadena vacía para cadenas no reconocidas', () => {
        expect(getSpotifyUrl('no-es-nada-valido')).toBe('');
        expect(getSpotifyUrl('spotify:playlist:xyz')).toBe('');
    });
});
