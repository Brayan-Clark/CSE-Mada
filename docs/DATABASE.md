# 🔌 Connecter CSE-Mada à une base de données (Supabase)

Ce document explique, étape par étape, comment brancher le site sur une vraie
base de données **Supabase**. Tant que ce n'est pas fait, **le site fonctionne
normalement en « mode démo »** (données locales par défaut) et ne plante jamais.

---

## 1. Comment c'est pensé (architecture)

Le site est **statique** et hébergé sur **GitHub Pages** : il n'y a pas de serveur
applicatif à nous. On utilise donc Supabase **directement depuis le navigateur**,
avec la clé publique « anon ».

```
Navigateur ──> (clé anon publique) ──> Supabase (PostgreSQL + RLS)
     │
     └── si Supabase non configuré ──> données locales / par défaut (localStorage)
```

Points clés :

- **La sécurité ne repose PAS sur le secret de la clé** (elle est publique) mais
  sur les **règles RLS** (Row Level Security) définies dans `supabase/schema.sql` :
  le public ne lit que le contenu **publié** et ne peut qu'**envoyer un message**
  ou **déposer un avis** (en attente de modération). Tout le reste exige une
  session authentifiée.
- **Repli gracieux** : `src/utils/supabase.ts` renvoie `null` si les variables
  d'environnement sont absentes → l'app retombe sur les données par défaut.
  → **Une base absente ou mal configurée ne casse jamais le site.**
- Un badge dans l'admin indique l'état : **« Supabase connecté »** ou **« Mode démo (local) »**.

---

## 2. Créer le projet Supabase

1. Créer un compte sur https://supabase.com puis un **nouveau projet**.
2. Dans **SQL Editor**, ouvrir un nouveau script, **coller le contenu de
   [`supabase/schema.sql`](../supabase/schema.sql)** et cliquer **Run**.
   → Cela crée toutes les tables, les règles RLS et les rôles de départ.
3. Dans **Project Settings → API**, récupérer :
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public key** → `PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Configurer les variables d'environnement

### En local

Créer un fichier `.env` à la racine (copié depuis `.env.example`) :

```bash
PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Relancer `npm run dev`. Le badge admin doit passer à **« Supabase connecté »**.

### En production (GitHub Pages)

Les variables `PUBLIC_*` sont **intégrées au build**. Il faut donc les fournir au
workflow GitHub Actions :

1. Dans le dépôt GitHub : **Settings → Secrets and variables → Actions → New repository secret**
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
2. Le workflow `.github/workflows/deploy.yml` les expose déjà à l'étape *Build*
   (voir la section `env:`). Aucune autre action n'est nécessaire : au prochain
   push sur `main`, le site déployé sera connecté.

> ⚠️ **Piège fréquent** : ajoutez-les bien en **Repository secrets**, PAS en
> **Environment secrets**. Le job `build` (qui exécute `npm run build` et intègre
> les variables `PUBLIC_*` dans le site) ne tourne **pas** dans l'environnement
> `github-pages` ; il ne voit donc pas les secrets d'environnement, et le site
> serait construit en **mode démo**. Les `PUBLIC_*` n'étant pas sensibles (elles
> finissent dans le bundle client), un *repository secret* convient parfaitement.

> ⚠️ Ne jamais committer le fichier `.env` (il est déjà ignoré par `.gitignore`).

---

## 4. Brancher le code sur Supabase ✅ (fait)

La couche d'accès asynchrone commune **`src/utils/db.ts`** est en place. Elle
expose, pour chaque entité, un objet `xxxData` avec `list / get / create /
update / remove` (asynchrones) + `seedIfEmpty` (amorçage local uniquement). En
interne : **Supabase si `getSupabase()` est non nul, sinon repli sur le dépôt
local de `store.ts`** — donc rien ne casse sans base.

```ts
// Modèle (déjà implémenté dans db.ts via la fabrique createData)
export const articlesData = createData<Article>(
  articlesRepo, 'articles', { column: 'pub_date', ascending: false },
  { toRow, fromRow },   // mapping camelCase ↔ snake_case
);
```

**Toutes les pages admin et publiques ont été migrées** : elles appellent
`await xxxData.list()` / `.create()` / `.update()` / `.remove()` au lieu des
dépôts synchrones. Les mappings snake_case ↔ camelCase déjà gérés dans `db.ts` :

- `articles` : `pub_date ↔ pubDate`
- `messages` : `created_at ↔ date`
- `profiles` : `role_id ↔ role`
- `orders` : `customer_name/email/phone ↔ customer.{...}`, `created_at ↔ date`,
  `items` (jsonb)

Côté **boutique** (`materiel.astro`), les produits sont chargés une fois
(`await productsData.list()`) puis filtrés/affichés ; la commande est créée via
`ordersData.create(...)`. Côté **témoignages/services**, les avis publiés sont
rendus en placeholder au build puis ré-hydratés client-side via `reviewsData`.

> Les **événements** et le **blog** restent volontairement pilotés par les
> *content collections* (MDX) : ce sont elles qui génèrent les routes statiques
> et les galeries par événement. L'admin événements écrit bien dans Supabase,
> mais l'affichage public statique s'appuie sur le contenu MDX.

Correspondance tables ↔ types (déjà alignée avec `schema.sql`) :

| Entité      | Table Supabase | Type (`store.ts`) | Dépôt local      |
|-------------|----------------|-------------------|------------------|
| Articles    | `articles`     | `Article`         | `articlesRepo`   |
| Événements  | `events`       | `EventItem`       | `eventsRepo`     |
| Matériel    | `products`     | `Product`         | `productsRepo`   |
| Services    | `services`     | `Service`         | `servicesRepo`   |
| Avis        | `reviews`      | `Review`          | `reviewsRepo`    |
| Messages    | `messages`     | `ContactMessage`  | `messagesRepo`   |
| Commandes   | `orders`       | `Order`           | `ordersRepo`     |
| Utilisateurs| `profiles`     | `User`            | `usersRepo`      |
| Rôles       | `roles`        | `RoleDef`         | `rolesRepo`      |
| Achats/stock| `stock_entries`| `StockEntry`      | `stockEntriesRepo`|

> **Stock & marges** : `products.cost_price` (prix d'achat) s'ajoute au
> `price` (prix de vente). La table `stock_entries` enregistre les
> approvisionnements (`/admin/stock`) : chaque entrée incrémente le stock du
> produit et met à jour son prix d'achat. Le dashboard calcule le **bénéfice
> estimé** = CA − coût des marchandises vendues.

> Note : Supabase renvoie `pub_date` (snake_case) ; pensez à mapper vers
> `pubDate` (camelCase) côté type, ou utilisez un `select` avec alias.

---

## 5. Authentification réelle ✅ (fait — double mode)

`src/utils/auth.ts` fonctionne en **double mode** :

- **Supabase connecté** : `login(email, password)` appelle
  `supabase.auth.signInWithPassword`, puis lit le rôle dans `profiles.role_id`
  et ses permissions dans `roles.permissions`. `restoreSession()` valide la
  session Supabase à chaque chargement de page admin.
- **Mode démo** (sans base) : identifiant statique `admin` / `cse-admin-2026`
  (aucune sécurité réelle — démo uniquement).

Pour que l'API synchrone des pages (`getRole()`, `can()`, `isSuperAdmin()`)
fonctionne, la session est mise en cache dans `localStorage` à la connexion et
rafraîchie par `restoreSession()`.

### Premier utilisateur = super administrateur

Le schéma installe un **trigger** `handle_new_user()` sur `auth.users` :
le **tout premier** compte créé reçoit le rôle `superadmin` (contrôle total),
les suivants reçoivent `viewer` (le superadmin les promeut ensuite).

➡️ **Mise en service** : créez votre propre compte en premier
(**Authentication → Users → Add user**, ou via l'écran de connexion si
l'inscription est ouverte). Ce compte sera automatiquement `superadmin`.

---

## 5 bis. Inviter des utilisateurs (Edge Function `invite-user`)

La clé `anon` (publique) **ne peut pas** créer de comptes. La création se fait
donc côté serveur via une **Edge Function** qui utilise la clé `service_role`
(secrète, **jamais** exposée au front).

Fichier : [`supabase/functions/invite-user/index.ts`](../supabase/functions/invite-user/index.ts).
Elle vérifie que l'appelant est `superadmin`, crée l'utilisateur avec un
**mot de passe aléatoire**, lui affecte le rôle demandé, et renvoie ce mot de
passe au superadmin (à communiquer à l'utilisateur, modifiable ensuite dans
« Mon compte »).

**Déploiement** (CLI Supabase) :

```bash
supabase login
supabase link --project-ref <votre-ref-projet>
supabase functions deploy invite-user
```

Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et
`SUPABASE_SERVICE_ROLE_KEY` sont **injectées automatiquement** par la plateforme
à l'exécution de la fonction. Aucune configuration supplémentaire.

Depuis l'admin (page **Utilisateurs**, bouton « Inviter un utilisateur »), le
front appelle `supabase.functions.invoke('invite-user', { body: { email, name,
roleId } })`. En mode démo, l'invitation crée un utilisateur local avec un mot
de passe illustratif.

---

## 6. Images — Supabase Storage ✅ (fait)

L'app gère **beaucoup d'images** (produits, événements, articles, avis). On les
stocke dans **Supabase Storage** (bucket public `media`) et on n'enregistre que
l'**URL publique** dans la table (pas de base64 en base — trop lourd).

- Helper : `src/utils/storage.ts` (`uploadImage`, `setupImageUpload`). Un bouton
  « Téléverser une image » est greffé sous chaque champ « Image (URL) » des
  formulaires admin (produits, événements, articles, services, avis). Au choix
  d'un fichier (≤ 5 Mo), l'image part vers Storage et l'URL remplit le champ.
- **Setup côté Supabase** : le bucket `media` et ses politiques sont créés par
  `schema.sql` (lecture publique ; upload/maj/suppression réservés aux membres
  connectés). Si le bucket existe déjà, le script ne le recrée pas.
- En **mode démo** (sans Supabase), le téléversement est désactivé : on colle
  une URL d'image manuellement.

---

## 7. Afficher les données live sur le site PUBLIC ✅ (fait)

Les pages publiques rendent un **placeholder** au build (données par défaut /
contenu MDX), puis se ré-hydratent côté client avec les données Supabase quand
elles sont disponibles :

- **Boutique** (`materiel.astro`) : produits + création de commande via `db.ts`.
- **Témoignages** (`temoignages.astro`) et **Services** (`services.astro`) :
  avis publiés ré-hydratés via `reviewsData` (rendu partagé `reviews-render.ts`).
- **Contact** (`contact.astro`) : envoi du message via `messagesData.create`.

Si Supabase n'est pas connecté, le contenu par défaut reste affiché — aucune
régression. (Événements/blog : pilotés par les content collections, cf. §4.)

---

## ✅ Checklist de mise en service

- [ ] Projet Supabase créé
- [ ] `supabase/schema.sql` exécuté (tables + RLS + rôles + trigger superadmin)
- [ ] `.env` local renseigné, badge admin = « Supabase connecté »
- [ ] Secrets GitHub ajoutés (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
- [x] `db.ts` en place et **toutes** les pages migrées (admin + public)
- [x] Authentification Supabase branchée (double mode + 1er user = superadmin)
- [ ] **Créer votre compte en premier** (→ devient `superadmin`)
- [ ] Edge Function déployée : `supabase functions deploy invite-user`
- [ ] (Option) Storage pour les images
