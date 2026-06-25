// Base path du site, défini une seule fois dans astro.config.mjs (`base`).
// Astro l'expose via import.meta.env.BASE_URL (ex: "/CSE-Mada/" en prod, "/" en local).
const BASE = import.meta.env.BASE_URL;

/**
 * Construit une URL interne robuste, quel que soit le base path configuré.
 * À utiliser pour TOUS les liens et assets internes, afin que le site
 * fonctionne à l'identique en local et en ligne sans rien modifier à la main.
 *
 * Les URL absolues (http(s)://, //, data:, mailto:, tel:) sont renvoyées telles
 * quelles : on ne préfixe que les chemins internes relatifs.
 *
 * @example withBase('/blog')                 -> "/CSE-Mada/blog"
 * @example withBase('images/x.jpg')          -> "/CSE-Mada/images/x.jpg"
 * @example withBase('https://cdn/x.jpg')      -> "https://cdn/x.jpg" (inchangé)
 */
export function withBase(path = ''): string {
  if (/^([a-z]+:)?\/\//i.test(path) || /^(data|mailto|tel):/i.test(path)) {
    return path;
  }
  const clean = path.replace(/^\/+/, '');
  const prefix = BASE.endsWith('/') ? BASE : `${BASE}/`;
  return `${prefix}${clean}`;
}
