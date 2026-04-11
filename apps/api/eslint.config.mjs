import eslint from '@eslint/js'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginImportHelpers from 'eslint-plugin-import-helpers'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      import: eslintPluginImport,
      'import-helpers': eslintPluginImportHelpers
    },
    languageOptions: {
      globals: {
        ...globals.node
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': [
        'error',
        {
          semi: false,
          singleQuote: true,
          arrowParens: 'avoid',
          trailingComma: 'none',
          endOfLine: 'auto',
          printWidth: 120,
          tabWidth: 2
        }
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-helpers/order-imports': [
        'warn',
        {
          newlinesBetween: 'always',
          groups: ['module', ['parent', 'sibling', 'index']],
          alphabetize: { order: 'asc', ignoreCase: true }
        }
      ]
    }
  }
)