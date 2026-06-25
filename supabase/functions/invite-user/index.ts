// Edge Function Supabase : invite-user
// -----------------------------------------------------------------------------
// Crée un nouvel utilisateur (email + mot de passe aléatoire) — réservé au
// SUPER ADMIN. Utilise la clé service_role (jamais exposée au navigateur), donc
// DOIT tourner côté serveur (Edge Function), pas dans le front statique.
//
// Déploiement :
//   supabase functions deploy invite-user
//   (les variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sont fournies
//    automatiquement par la plateforme)
//
// Appel depuis le front (utilisateur superadmin connecté) :
//   supabase.functions.invoke('invite-user', { body: { email, name, roleId } })
// Réponse : { email, password, roleId }  → le superadmin communique le mot de
// passe temporaire à l'utilisateur, qui le changera dans « Mon compte ».
// -----------------------------------------------------------------------------
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function randomPassword(len = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // 1) Vérifie que l'appelant est connecté ET superadmin.
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin.from('profiles').select('role_id').eq('user_id', userData.user.id).maybeSingle();
    if (profile?.role_id !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Réservé au super administrateur.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // 2) Crée l'utilisateur avec un mot de passe aléatoire.
    const { email, name, roleId } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requis.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const password = randomPassword();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name ?? '' },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'Création impossible.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // 3) Affecte le rôle demandé (le trigger a déjà créé le profil en `viewer`).
    if (roleId) {
      await admin.from('profiles').update({ role_id: roleId, name: name ?? null }).eq('user_id', created.user.id);
    }

    return new Response(JSON.stringify({ email, password, roleId: roleId ?? 'viewer' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
