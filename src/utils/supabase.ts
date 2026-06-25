// Connexion Supabase — TOLÉRANTE À L'ABSENCE DE CONFIGURATION.
//
// Le site est hébergé sur GitHub Pages (statique). Supabase est donc utilisé
// CÔTÉ CLIENT, via la clé publique « anon » (protégée par les règles RLS).
//
// Règle d'or : si les variables d'environnement ne sont pas définies, le site
// NE DOIT PAS planter. `getSupabase()` renvoie alors `null` et l'application
// retombe sur les données locales / par défaut (voir src/utils/db.ts).
//
// Variables attendues (voir .env.example) :
//   PUBLIC_SUPABASE_URL
//   PUBLIC_SUPABASE_ANON_KEY
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** Vrai si une configuration Supabase valide est présente. */
export const isSupabaseEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Renvoie le client Supabase, ou `null` si non configuré. Ne lève jamais d'erreur. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseEnabled) return null;
  if (!client) {
    try {
      client = createClient(url as string, anonKey as string);
    } catch (err) {
      console.warn('[supabase] Initialisation impossible, repli sur les données locales.', err);
      client = null;
    }
  }
  return client;
}
