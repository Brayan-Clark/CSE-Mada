// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://brayan-clark.github.io/CSE-Mada',
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
  vite: {
    css: {
      devSourcemap: true,
    },
    ssr: {
      noExternal: true
    }
  },
  server: {
    port: 3000,
    host: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-site',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-DNS-Prefetch-Control': 'off'
    }
  },
  scopedStyleStrategy: 'class',
});
