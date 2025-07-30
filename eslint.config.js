export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                Date: 'readonly',
                Math: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
            },
        },
        rules: {
            indent: ['error', 4],
            'linebreak-style': ['error', 'unix'],
            quotes: ['error', 'single'],
            semi: ['error', 'never'],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
            'prefer-const': 'error',
            'no-var': 'error',
            'arrow-spacing': 'error',
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'comma-dangle': ['error', 'only-multiline'],
            'max-len': ['warn', { code: 120, ignoreComments: true }],
        },
    },
    {
        ignores: ['node_modules/**', 'dist/**', '*.min.js', 'test-results/**', 'playwright-report/**', 'coverage/**'],
    },
]
