# Gestion des utilisateurs (invitation + mots de passe)

Ce document explique comment fonctionne l'ajout d'utilisateurs dans l'admin et
comment **déployer la fonction nécessaire** (cause de l'erreur
« Failed to send a request to the Edge Function »).

---

## 1. Comment ça marche (le flux)

Dans `/admin/users`, le **super administrateur** clique « Inviter », saisit
**nom + email + rôle**, puis :

1. L'app appelle l'Edge Function **`invite-user`** (côté serveur Supabase).
2. La fonction crée le compte avec un **mot de passe aléatoire** (email déjà
   confirmé) et applique le rôle choisi.
3. Le **mot de passe temporaire est renvoyé et affiché au créateur**, avec un
   bouton « Copier ». → Le créateur le transmet à la personne (email, message…).
4. La personne se connecte avec ce mot de passe, puis le **change dans
   « Mon compte »** (`/admin/account`).

> Pourquoi une Edge Function ? La création d'un utilisateur nécessite la clé
> **`service_role`** (toute-puissante). Elle ne doit **jamais** être exposée
> dans le site (statique/navigateur) : elle reste donc côté serveur, dans la
> fonction. Code : `supabase/functions/invite-user/index.ts`. Seul un
> **superadmin** authentifié peut l'appeler (la fonction le vérifie).

En **mode démo** (sans Supabase), l'utilisateur est créé en local et un mot de
passe illustratif est affiché — pas d'envoi réel.

---

## 2. Cause de l'erreur « Failed to send a request to the Edge Function »

La fonction `invite-user` existe dans le dépôt mais **n'est pas encore déployée**
sur ton projet Supabase. Il faut la déployer une fois (puis à chaque
modification de son code).

---

## 3. Déployer la fonction (une fois)

### Prérequis : la CLI Supabase

```bash
# macOS / Linux (Homebrew)
brew install supabase/tap/supabase

# ou npm (npx fonctionne aussi sans installation globale)
npm install -g supabase
```

Vérifier : `supabase --version`.

### Étapes

```bash
# 1) Se connecter (ouvre le navigateur pour autoriser)
supabase login

# 2) Lier le dossier au projet Supabase (depuis la racine du dépôt)
#    <project-ref> = l'identifiant du projet (Dashboard → Settings → General,
#    ou dans l'URL du projet : https://app.supabase.com/project/<project-ref>)
supabase link --project-ref <project-ref>

# 3) Déployer la fonction
supabase functions deploy invite-user
```

> Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et
> `SUPABASE_SERVICE_ROLE_KEY` sont **fournies automatiquement** aux Edge
> Functions par la plateforme : rien à configurer côté secrets pour celle-ci.

Une fois déployée, retourne dans `/admin/users` → « Inviter » : le mot de passe
temporaire s'affiche.

---

## 4. Vérifier / déboguer

- **Lister les fonctions déployées** : Dashboard Supabase → **Edge Functions**.
  `invite-user` doit y apparaître avec un statut actif.
- **Logs** : Dashboard → Edge Functions → `invite-user` → **Logs** (on y voit
  les erreurs d'exécution, ex. email déjà utilisé).
- **« Réservé au super administrateur »** : seul le compte superadmin peut
  inviter. Vérifie ton rôle (badge en haut de l'admin / table `profiles`).
- **« A user with this email address has already been registered »** : l'email
  existe déjà dans Supabase Auth.
- **Tester en local** (optionnel) :
  ```bash
  supabase functions serve invite-user
  ```

---

## 5. Récapitulatif des fichiers

- `supabase/functions/invite-user/index.ts` — la fonction (création + rôle).
- `src/pages/admin/users/index.astro` — bouton « Inviter », appel
  `sb.functions.invoke('invite-user', …)`, affichage du mot de passe.
- `src/pages/admin/account.astro` — changement de mot de passe par l'utilisateur
  (`sb.auth.updateUser({ password })`).
