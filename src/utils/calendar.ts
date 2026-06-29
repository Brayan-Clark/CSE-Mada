// Petits utilitaires de calendrier mensuel (semaine commençant le lundi).
// Les dates sont manipulées en chaîne locale AAAA-MM-JJ pour éviter les
// décalages de fuseau horaire (pas de conversion UTC).

/** Date → "AAAA-MM-JJ" en heure locale. */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "AAAA-MM-JJ" du jour courant. */
export function todayYmd(): string {
  return ymd(new Date());
}

/**
 * Grille du mois : tableau de cases, `null` pour les jours de remplissage
 * avant/après le mois (afin d'aligner sur une grille de 7 colonnes).
 * @param year  année (ex. 2026)
 * @param month mois 0-11
 */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // getDay(): 0=dim … 6=sam ; on veut lundi=0.
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(ymd(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Liste des dates "AAAA-MM-JJ" entre `start` et `end` (bornes incluses). */
export function datesInRange(start: string, end: string): string[] {
  if (!start || !end) return [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const out: string[] = [];
  const cur = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);
  while (cur <= last) {
    out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Libellé long d'une date "AAAA-MM-JJ" (ex. "lundi 6 juillet 2026"). */
export function longDate(ymdStr: string): string {
  if (!ymdStr) return '';
  const [y, m, d] = ymdStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
