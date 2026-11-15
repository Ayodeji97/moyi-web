import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://getmoyi.app',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
});
