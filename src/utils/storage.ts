// Téléversement d'images vers Supabase Storage.
//
// Pourquoi Storage (et pas du base64 en base) : on aura BEAUCOUP d'images
// (produits, événements, articles). Les stocker en base alourdit les lignes et
// les requêtes. Supabase Storage sert des fichiers via un CDN avec une URL
// publique → on ne stocke que cette URL dans la table.
//
// Prérequis côté Supabase (une seule fois) :
//   1. Storage → New bucket → nom « media » → cocher « Public bucket ».
//   2. (Politique d'upload réservée aux membres connectés — voir docs/DATABASE.md)
//
// En mode démo (sans Supabase), l'upload est indisponible : on saisit une URL.

import { getSupabase } from './supabase';
import { toast } from './toast';

export const BUCKET = 'media';

export async function uploadImage(
  file: File,
  folder = 'uploads',
): Promise<{ url?: string; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Téléversement indisponible en mode démo. Collez une URL d'image." };
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Image trop lourde (5 Mo maximum).' };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) return { error: error.message };
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Greffe un bouton « Téléverser » + champ fichier juste après un input d'URL
 * d'image existant. Au choix d'un fichier, l'image est envoyée et l'URL publique
 * remplit l'input. À appeler une fois par formulaire.
 */
export function setupImageUpload(
  urlInputId: string,
  folder: string,
  onUploaded?: (_url: string) => void,
): void {
  const input = document.getElementById(urlInputId) as HTMLInputElement | null;
  if (!input || input.dataset.uploadReady) return;
  input.dataset.uploadReady = '1';

  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/*';
  file.className = 'hidden';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className =
    'mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
  btn.innerHTML =
    '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span>Téléverser une image</span>';

  input.insertAdjacentElement('afterend', file);
  file.insertAdjacentElement('afterend', btn);

  btn.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    const label = btn.querySelector('span')!;
    const prev = label.textContent;
    btn.disabled = true;
    label.textContent = 'Envoi…';
    const { url, error } = await uploadImage(f, folder);
    btn.disabled = false;
    label.textContent = prev;
    file.value = '';
    if (error || !url) { toast.error(error ?? 'Échec du téléversement.'); return; }
    input.value = url;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onUploaded?.(url);
    toast.success('Image téléversée.');
  });
}
