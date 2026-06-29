// Sitemap généré au build. Intégration @astrojs/sitemap écartée (incompatible
// avec la version d'Astro du projet) → endpoint maison, fiable et explicite.
// On référence les pages STATIQUES indexables (pages éditoriales + contenu MDX).
// Le contenu piloté par la base (rendu côté client) n'est pas inclus : il n'est
// de toute façon pas indexable tel quel — voir docs/SEO.md.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { withBase } from '../utils/url';

const SITE = 'https://brayan-clark.github.io';

// Pages éditoriales fixes (sans l'espace /admin, non indexable).
const STATIC_PATHS = [
  '/', '/services', '/materiel', '/location', '/events', '/reservation',
  '/blog', '/galerie', '/temoignages', '/notre-histoire', '/equipe',
  '/contact', '/faq', '/cgv', '/confidentialite', '/mentions-legales',
];

export const GET: APIRoute = async () => {
  const blog = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.data.pubDate }));
  const events = (await getCollection('events'))
    .filter((e) => !e.data.draft)
    .map((e) => ({ path: `/events/${e.slug}`, lastmod: e.data.date }));

  const entries = [
    ...STATIC_PATHS.map((path) => ({ path, lastmod: undefined as Date | undefined })),
    ...blog,
    ...events,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(({ path, lastmod }) => {
    const loc = `${SITE}${withBase(path)}`;
    const lm = lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${loc}</loc>${lm}</url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
