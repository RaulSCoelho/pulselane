import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintPluginImportHelpers from 'eslint-plugin-import-helpers'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'import-helpers': eslintPluginImportHelpers
    },
    rules: {
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
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts']
  }
]

export default eslintConfig
