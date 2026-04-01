const tseslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const prettier = require('eslint-config-prettier')
const prettierPlugin = require('eslint-plugin-prettier')

module.exports = [
    {
        ignores: ['dist/**', 'out/**', 'node_modules/**'],
    },
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                BUILD_LOG_LEVEL: 'readonly',
                BUILD_ENABLE_MISTRAL: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: prettierPlugin,
        },
        rules: {
            ...prettier.rules,
            '@typescript-eslint/no-empty-interface': 'off',
            'prettier/prettier': [
                'warn',
                {
                    semi: false,
                    endOfLine: 'auto',
                    singleQuote: true,
                    tabWidth: 4,
                    useTabs: false,
                    trailingComma: 'es5',
                },
            ],
        },
    },
]
