// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://brayan-clark.github.io/CSE-Mada',
  integrations: [
    tailwind({
      // Utiliser la configuration par défaut de Tailwind
      config: {
        applyBaseStyles: true,
      },
    }),
  ],
  vite: {
    css: {
      devSourcemap: true,
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  scopedStyleStrategy: 'class',
});
