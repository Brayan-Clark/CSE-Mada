// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://brayan-clark.github.io',
  base: '/CSE-Mada',
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
    mdx(),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  scopedStyleStrategy: 'class',
});
