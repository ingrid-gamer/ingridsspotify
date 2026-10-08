/**
 * validation.test.js
 * Pruebas unitarias para js/utils/validation.js
 */

import { normalizeText, validateFrontendConfig } from '../js/utils/validation.js';

// ─── normalizeText ───────────────────────────────────────────────────────────

describe('normalizeText', () => {
    test('convierte a minúsculas', () => {
        expect(normalizeText('BJÖRK')).toBe('bjork');
    });

    test('elimina acentos y diacríticos', () => {
        expect(normalizeText('Héroe')).toBe('heroe');
        expect(normalizeText('niño')).toBe('nino');
        expect(normalizeText('café')).toBe('cafe');
    });

    test('reemplaza caracteres especiales por espacio y hace trim', () => {
        expect(normalizeText('AC/DC')).toBe('ac dc');
        expect(normalizeText('  espacios  ')).toBe('espacios');
    });

    test('devuelve cadena vacía para valores nulos', () => {
        expect(normalizeText(null)).toBe('');
        expect(normalizeText(undefined)).toBe('');
        expect(normalizeText('')).toBe('');
    });

    test('mantiene números', () => {
        expect(normalizeText('2pac')).toBe('2pac');
        expect(normalizeText('blink-182')).toBe('blink 182');
    });
});

// ─── validateFrontendConfig ──────────────────────────────────────────────────

describe('validateFrontendConfig', () => {
    const validUrl = 'https://zbovgcnqoavnmlybkhfj.supabase.co';
    const validKey = 'eyJhbGciOiJIUzI1NiJ9.test.signature';

    test('no lanza error con valores válidos', () => {
        expect(() => validateFrontendConfig(validUrl, validKey)).not.toThrow();
    });

    test('lanza error si la URL está vacía', () => {
        expect(() => validateFrontendConfig('', validKey)).toThrow();
        expect(() => validateFrontendConfig(null, validKey)).toThrow();
    });

    test('lanza error si la key está vacía', () => {
        expect(() => validateFrontendConfig(validUrl, '')).toThrow();
        expect(() => validateFrontendConfig(validUrl, null)).toThrow();
    });

    test('lanza error si la key tiene prefijo de ejemplo TU_', () => {
        expect(() => validateFrontendConfig(validUrl, 'TU_CLAVE')).toThrow();
    });

    test('lanza error si la key tiene prefijo de ejemplo YOUR_', () => {
        expect(() => validateFrontendConfig(validUrl, 'YOUR_KEY')).toThrow();
    });
});
