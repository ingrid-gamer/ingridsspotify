/**
 * security.test.js
 * Pruebas unitarias para js/utils/security.js
 */

import { escapeHTML } from '../js/utils/security.js';

describe('escapeHTML', () => {
    test('escapa el signo &', () => {
        expect(escapeHTML('a & b')).toBe('a &amp; b');
    });

    test('escapa los signos < y >', () => {
        expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    });

    test('escapa comillas dobles y simples', () => {
        expect(escapeHTML('"hola"')).toBe('&quot;hola&quot;');
        expect(escapeHTML("it's")).toBe('it&#039;s');
    });

    test('maneja valores nulos correctamente', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });

    test('devuelve la cadena intacta si no contiene caracteres especiales', () => {
        expect(escapeHTML('texto normal')).toBe('texto normal');
    });

    test('escapa una cadena con múltiples caracteres especiales', () => {
        expect(escapeHTML('<b class="test">A & B</b>')).toBe(
            '&lt;b class=&quot;test&quot;&gt;A &amp; B&lt;/b&gt;'
        );
    });
});
