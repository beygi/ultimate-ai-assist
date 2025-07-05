import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  ignores: ['dist/', 'node_modules/'],
  files: ['src/**/*.ts'],
  extends: [...tseslint.configs.recommended, eslintPluginPrettierRecommended],
});
