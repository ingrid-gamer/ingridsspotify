/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'spotify-data/**'],
        rules: {
            'no-unused-vars':    ['warn', { argsIgnorePattern: '^_' }],
            'no-undef':          'error',
            'no-console':        'off',
            'prefer-const':      'error',
            'eqeqeq':            ['error', 'always'],
            'no-var':            'error'
        },
        languageOptions: {
            ecmaVersion:  2022,
            sourceType:   'module',
            globals: {
                // Browser globals (para index.html / js/)
                document:  'readonly',
                window:    'readonly',
                fetch:     'readonly',
                Map:       'readonly',
                Set:       'readonly',
                URL:       'readonly',
                URLSearchParams: 'readonly',
                AbortController: 'readonly',
                setTimeout:      'readonly',
                clearTimeout:    'readonly',
                setInterval:     'readonly',
                Date:            'readonly',
                Number:          'readonly',
                Array:           'readonly',
                String:          'readonly',
                Boolean:         'readonly',
                Object:          'readonly',
                Promise:         'readonly',
                JSON:            'readonly',
                console:         'readonly',
                // Node globals (para scripts de backend)
                process:         'readonly',
                Buffer:          'readonly'
            }
        }
    },
    {
        // Jest proporciona estas funciones durante los tests; decláralas
        // solo para los archivos de prueba para que ESLint no marque no-undef.
        files: ['tests/**/*.test.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                test:     'readonly',
                expect:   'readonly'
            }
        }
    }
];
