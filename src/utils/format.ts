// Formatage monétaire — Ariary malgache (MGA).
// L'Ariary n'a pas de décimales d'usage courant : on arrondit à l'entier.
const mgaFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/** Formate un montant en Ariary, ex: 250000 -> "250 000 Ar". */
export function formatMGA(amount: number): string {
  return `${mgaFormatter.format(Math.round(amount || 0))} Ar`;
}
