import globals from 'globals';
import js from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';
import react from 'eslint-plugin-react'; // Importing the plugin for React
import reactHooks from 'eslint-plugin-react-hooks';
import { FlatCompat } from '@eslint/eslintrc'; // FlatCompat helps with legacy config compatibility
import path from 'path';
import { fileURLToPath } from 'url';
import vitest from 'eslint-plugin-vitest-globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize FlatCompat for legacy compatibility
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname, // Makes sure plugins are resolved from the correct directory
});

export default [
  // Use compat.extends to include legacy config from eslint-plugin-react
  ...compat.extends('plugin:react/recommended'), // This pulls in eslint-plugin-react's recommended rules
  ...compat.extends('plugin:react/jsx-runtime'),
  ...compat.extends('plugin:vitest-globals/recommended'),
  js.configs.recommended, // ESLint's recommended config for JS
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...vitest.environments.env.globals,
      },
    },
    plugins: {
      '@stylistic/js': stylisticJs,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      '@stylistic/js/indent': ['error', 2], // Stylistic rules for JS indentation
      '@stylistic/js/linebreak-style': ['error', 'unix'],
      '@stylistic/js/quotes': ['error', 'single'],
      eqeqeq: 'error',
      'no-trailing-spaces': 'error',
      'no-shadow': 'warn',
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'react/react-in-jsx-scope': 'off',
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  { ignores: ['dist/**', 'build/**', 'eslint.config.mjs'] },
];
