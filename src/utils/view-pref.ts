// Préférence d'affichage (grille / liste) persistée par section d'admin.
export type ViewMode = 'grid' | 'list';

export function getViewMode(key: string): ViewMode {
  if (typeof localStorage === 'undefined') return 'grid';
  const v = localStorage.getItem(`cse_view_${key}`);
  return v === 'list' ? 'list' : 'grid';
}

export function setViewMode(key: string, mode: ViewMode): void {
  localStorage.setItem(`cse_view_${key}`, mode);
}
