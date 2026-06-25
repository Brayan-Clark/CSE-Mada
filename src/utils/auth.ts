// Authentification ADMIN — double mode :
//  • Supabase configuré  → vraie auth (signInWithPassword), rôle lu dans `profiles`.
//  • Sinon (mode démo)   → identifiant statique local (aucune sécurité réelle).
//
// Les getters restent SYNCHRONES (getSession/getRole/can) en s'appuyant sur un
// cache localStorage rempli à la connexion et rafraîchi par `restoreSession()`.

import type { Role } from './store';
import { getRolePermissions } from './store';
import { getSupabase } from './supabase';

const AUTH_KEY = 'cse_admin_session';
const SESSION_DURATION_HOURS = 8;

/** Identifiants par défaut pour le MODE DÉMO uniquement (pas de Supabase). */
export const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'cse-admin-2026',
  role: 'admin' as Role,
};

export interface AuthSession {
  username: string;
  role: Role;
  permissions: string[]; // permissions résolues à la connexion
  userId?: string; // id Supabase (mode connecté)
  expiresAt: number;
}

function persist(session: AuthSession): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

/** Lit le profil + permissions d'un utilisateur Supabase. */
async function resolveSupabaseProfile(userId: string): Promise<{ role: Role; permissions: string[]; name: string }> {
  const sb = getSupabase();
  if (!sb) return { role: 'viewer', permissions: [], name: '' };
  const { data: profile } = await sb.from('profiles').select('role_id, name').eq('user_id', userId).maybeSingle();
  const role = (profile?.role_id as string) ?? 'viewer';
  if (role === 'superadmin' || role === 'admin') {
    // résolu côté client : accès complet (les tables sont protégées par RLS).
    const { PERMISSIONS } = await import('./store');
    return { role, permissions: Object.keys(PERMISSIONS), name: (profile?.name as string) ?? '' };
  }
  const { data: roleRow } = await sb.from('roles').select('permissions').eq('id', role).maybeSingle();
  return { role, permissions: (roleRow?.permissions as string[]) ?? [], name: (profile?.name as string) ?? '' };
}

/** Traduit en français les messages d'erreur d'authentification Supabase. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return "Cet email n'est pas confirmé. Dans Supabase → Authentication → Users, confirmez l'utilisateur (ou désactivez « Confirm email » dans Auth → Providers).";
  if (m.includes('email logins are disabled') || m.includes('signups not allowed')) return 'La connexion par email est désactivée dans Supabase (Auth → Providers → Email).';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Connexion au serveur impossible. Vérifiez votre réseau et l\'URL Supabase.';
  return message;
}

/**
 * Tente une connexion.
 * En mode Supabase : `identifier` = email. En mode démo : nom d'utilisateur.
 */
export async function login(identifier: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  const id = identifier.trim();

  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email: id, password });
    if (error || !data.session || !data.user) {
      return { ok: false, error: error ? translateAuthError(error.message) : 'Identifiants invalides.' };
    }
    const { role, permissions, name } = await resolveSupabaseProfile(data.user.id);
    persist({
      username: name || data.user.email || id,
      role,
      permissions,
      userId: data.user.id,
      expiresAt: (data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + SESSION_DURATION_HOURS * 3600 * 1000),
    });
    return { ok: true };
  }

  // Mode démo
  if (id === DEFAULT_CREDENTIALS.username && password === DEFAULT_CREDENTIALS.password) {
    persist({
      username: id,
      role: DEFAULT_CREDENTIALS.role,
      permissions: getRolePermissions(DEFAULT_CREDENTIALS.role),
      expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
    });
    return { ok: true };
  }
  return { ok: false, error: 'Identifiants invalides.' };
}

/**
 * Valide/rafraîchit la session (à appeler au chargement des pages admin).
 * En mode Supabase, vérifie la session réelle et met à jour le cache.
 */
export async function restoreSession(): Promise<AuthSession | null> {
  const sb = getSupabase();
  if (!sb) return getSession();
  const { data } = await sb.auth.getSession();
  if (!data.session || !data.session.user) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
  const { role, permissions, name } = await resolveSupabaseProfile(data.session.user.id);
  persist({
    username: name || data.session.user.email || 'Utilisateur',
    role,
    permissions,
    userId: data.session.user.id,
    expiresAt: (data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + SESSION_DURATION_HOURS * 3600 * 1000),
  });
  return getSession();
}

export function getRole(): Role | null {
  return getSession()?.role ?? null;
}

/** Déconnecte l'utilisateur (Supabase + cache local). */
export async function logout(): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    try { await sb.auth.signOut(); } catch { /* ignore */ }
  }
  localStorage.removeItem(AUTH_KEY);
}

/** Session valide en cache (null si absente/expirée). */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/** Vrai si l'utilisateur courant est super administrateur. */
export function isSuperAdmin(): boolean {
  return getSession()?.role === 'superadmin';
}

/** Indique si le rôle connecté possède la permission demandée. */
export function can(permission: string): boolean {
  const session = getSession();
  if (!session) return false;
  if (session.role === 'superadmin' || session.role === 'admin') return true;
  const perms = session.permissions ?? getRolePermissions(session.role);
  return perms.includes(permission);
}
