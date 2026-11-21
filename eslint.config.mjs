// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'docs/reference/'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['webpack.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  prettier,
)
