import { i18nPlugin } from '@oxog/i18n-vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    i18nPlugin({
      localesDir: './src/locales',
      typescript: {
        generate: true,
        outputFile: './src/types/i18n.d.ts',
      },
    }),
  ],
});