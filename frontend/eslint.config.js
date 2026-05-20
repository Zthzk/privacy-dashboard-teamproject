import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const mantisTemplateFiles = [
  'src/components/@extended/**/*.{js,jsx}',
  'src/components/logo/**/*.{js,jsx}',
  'src/components/third-party/**/*.{js,jsx}',
  'src/components/Loader.jsx',
  'src/components/MainCard.jsx',
  'src/components/ScrollTop.jsx',
  'src/contexts/**/*.{js,jsx}',
  'src/layout/**/*.{js,jsx}',
  'src/routes/**/*.{js,jsx}',
  'src/themes/**/*.{js,jsx}',
  'src/utils/**/*.{js,jsx}',
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
    },
  },
  {
    files: mantisTemplateFiles,
    rules: {
      'no-extra-boolean-cast': 'off',
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^React$' }],
      'no-useless-assignment': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
