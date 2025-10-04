import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'build/**'],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],
      'prefer-template': 'error',
      'require-await': 'error',
      'no-return-await': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
    },
  },
];

