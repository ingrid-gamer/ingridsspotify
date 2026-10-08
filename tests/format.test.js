/**
 * format.test.js
 * Pruebas unitarias para js/utils/format.js
 */

import { safeNumber, formatNumber, formatRelativeTime } from '../js/utils/format.js';

// ─── safeNumber ──────────────────────────────────────────────────────────────

describe('safeNumber', () => {
    test('devuelve el número si es finito', () => {
        expect(safeNumber(42)).toBe(42);
        expect(safeNumber('10')).toBe(10);
        expect(safeNumber(3.14)).toBeCloseTo(3.14);
    });

    test('devuelve 0 para valores no finitos', () => {
        expect(safeNumber(null)).toBe(0);
        expect(safeNumber(undefined)).toBe(0);
        expect(safeNumber('')).toBe(0);
        expect(safeNumber(NaN)).toBe(0);
        expect(safeNumber(Infinity)).toBe(0);
        expect(safeNumber(-Infinity)).toBe(0);
    });
});

// ─── formatNumber ────────────────────────────────────────────────────────────

describe('formatNumber', () => {
    test('formatea con separadores de miles en es-CL', () => {
        // En es-CL los miles se separan con punto: 1.000
        const result = formatNumber(1000);
        expect(result).toMatch(/1[.,]000/); // acepta punto o coma según entorno
    });

    test('devuelve "0" para valores no numéricos', () => {
        expect(formatNumber(null)).toBe('0');
        expect(formatNumber(undefined)).toBe('0');
    });
});

// ─── formatRelativeTime ──────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
    test('devuelve cadena vacía para valores nulos o inválidos', () => {
        expect(formatRelativeTime(null)).toBe('');
        expect(formatRelativeTime('')).toBe('');
        expect(formatRelativeTime('no-es-fecha')).toBe('');
    });

    test('devuelve "hace menos de un minuto" si es reciente', () => {
        const ahora = new Date().toISOString();
        expect(formatRelativeTime(ahora)).toBe('hace menos de un minuto');
    });

    test('devuelve minutos correctamente', () => {
        const hace5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        expect(formatRelativeTime(hace5Min)).toBe('hace 5 minutos');
    });

    test('devuelve "1 minuto" en singular', () => {
        const hace1Min = new Date(Date.now() - 61 * 1000).toISOString();
        expect(formatRelativeTime(hace1Min)).toBe('hace 1 minuto');
    });

    test('devuelve horas correctamente', () => {
        const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(hace2h)).toBe('hace 2 horas');
    });

    test('devuelve "1 hora" en singular', () => {
        const hace1h = new Date(Date.now() - 61 * 60 * 1000).toISOString();
        expect(formatRelativeTime(hace1h)).toBe('hace 1 hora');
    });

    test('devuelve días correctamente', () => {
        const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(hace3dias)).toBe('hace 3 días');
    });
});
