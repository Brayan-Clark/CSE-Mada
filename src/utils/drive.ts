// Galerie d'événements via Google Drive.
// Principe : chaque événement pointe vers un dossier Drive public ; on liste
// ses images avec l'API Drive (lecture seule, clé API publique restreinte au
// domaine) puis on les affiche via les URL "thumbnail" de Drive, fiables en
// <img> (contrairement aux liens de téléchargement direct).
//
// La clé API se définit dans la variable d'environnement PUBLIC_GOOGLE_API_KEY
// (Repository secret côté GitHub Pages, comme les clés Supabase).

const API_KEY = (import.meta.env.PUBLIC_GOOGLE_API_KEY as string | undefined) ?? '';

/** La galerie Drive est-elle configurée (clé API présente) ? */
export const isDriveEnabled = API_KEY.length > 0;

export interface DriveImage {
  id: string;
  name: string;
}

/**
 * Extrait l'identifiant d'un dossier Drive depuis un lien de partage
 * (…/folders/<ID>…) ou renvoie la valeur telle quelle si c'est déjà un ID.
 */
export function extractFolderId(linkOrId: string): string {
  if (!linkOrId) return '';
  const m = linkOrId.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  const id = linkOrId.match(/[-\w]{20,}/);
  return id ? id[0] : linkOrId.trim();
}

/** URL d'affichage (miniature haute résolution) d'un fichier Drive. */
export function driveThumb(id: string, size = 1600): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

/**
 * Liste les images d'un dossier Drive public (triées par nom).
 * Renvoie [] si la clé API est absente, le dossier vide, ou en cas d'erreur.
 */
export async function listDriveImages(folderId: string): Promise<DriveImage[]> {
  if (!isDriveEnabled || !folderId) return [];
  const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
  const url =
    'https://www.googleapis.com/drive/v3/files'
    + `?q=${encodeURIComponent(q)}`
    + '&fields=files(id,name)'
    + '&orderBy=name_natural'
    + '&pageSize=1000'
    + `&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[drive] échec du listing :', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.files ?? []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }));
  } catch (e) {
    console.warn('[drive] erreur réseau :', e);
    return [];
  }
}
