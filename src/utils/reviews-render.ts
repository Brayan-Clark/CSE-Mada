// Rendu unifié d'une carte d'avis/témoignage — utilisé à la fois côté serveur
// (placeholder au build) et côté client (hydratation live), pour que la page
// Témoignages et la section avis de Services affichent EXACTEMENT le même format.
import type { Review } from './store';

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stars(n: number): string {
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += `<svg class="h-5 w-5 ${i < n ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
  }
  return out;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.valueOf()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Carte d'avis unifiée (HTML string). */
export function reviewCardHTML(r: Review): string {
  const initial = (r.author || '?').charAt(0).toUpperCase();
  const avatar = r.image
    ? `<img class="h-12 w-12 rounded-full object-cover" src="${esc(r.image)}" alt="${esc(r.author)}" loading="lazy" />`
    : `<div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 text-lg font-bold">${esc(initial)}</div>`;
  const sub = [r.role, r.trip].filter(Boolean).map(esc).join(' · ');
  const date = fmtDate(r.date);
  return `
    <article class="flex flex-col rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6">
      <div class="flex items-center gap-4">
        ${avatar}
        <div class="min-w-0">
          <h3 class="font-semibold text-gray-900 dark:text-white truncate">${esc(r.author)}</h3>
          ${sub ? `<p class="text-sm text-gray-500 dark:text-gray-400 truncate">${sub}</p>` : ''}
        </div>
      </div>
      <div class="mt-4 flex items-center gap-0.5">${stars(r.rating)}</div>
      <blockquote class="mt-4 flex-1 border-l-2 border-green-500 pl-4 text-gray-700 dark:text-gray-300 italic">“${esc(r.quote)}”</blockquote>
      ${date ? `<p class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-400">${date}</p>` : ''}
    </article>`;
}

/** Rend une liste d'avis publiés (filtrés + limités). */
export function publishedReviewsHTML(reviews: Review[], limit?: number): string {
  const list = reviews.filter((r) => r.status === 'published');
  return (limit ? list.slice(0, limit) : list).map(reviewCardHTML).join('');
}
