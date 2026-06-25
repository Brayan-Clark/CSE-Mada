-- =============================================================================
-- CSE-Mada — Schéma de base de données Supabase (PostgreSQL)
-- =============================================================================
-- À exécuter dans Supabase : Dashboard → SQL Editor → coller → Run.
-- Idempotent autant que possible (create if not exists).
--
-- Modèle de sécurité :
--   - Le site est statique (GitHub Pages) et utilise la clé "anon" PUBLIQUE.
--   - La sécurité repose donc sur les politiques RLS ci-dessous.
--   - Lecture publique : uniquement le contenu PUBLIÉ.
--   - Écriture publique : uniquement l'envoi de messages et le dépôt d'avis
--     (créés "en attente" de modération).
--   - Le reste (création/édition/suppression) est réservé aux utilisateurs
--     authentifiés (l'équipe admin).
-- =============================================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helper : l'utilisateur courant est-il connecté (membre de l'équipe) ?
-- (Phase 1 : tout utilisateur authentifié est considéré comme membre admin.
--  Pour un contrôle plus fin par rôle, voir la table `profiles` plus bas.)
-- -----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql stable as $$
  select auth.role() = 'authenticated';
$$;

-- -----------------------------------------------------------------------------
-- RÔLES & PERMISSIONS
-- -----------------------------------------------------------------------------
create table if not exists public.roles (
  id          text primary key,
  label       text not null,
  description text,
  system      boolean not null default false,
  permissions text[] not null default '{}'
);

-- -----------------------------------------------------------------------------
-- PROFILS (utilisateurs de l'équipe gérés dans l'admin)
-- Lié à auth.users pour la vraie authentification.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users (id) on delete set null,
  name      text not null,
  email     text not null,
  role_id   text references public.roles (id) on delete set null,
  active    boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ARTICLES (blog)
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  title       text not null,
  description text default '',
  author      text default 'Équipe CSEM',
  tags        text[] not null default '{}',
  image       text,
  content     text default '',
  draft       boolean not null default false,
  pub_date    timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ÉVÉNEMENTS
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  title       text not null,
  date        timestamptz not null default now(),
  location    text,
  activity    text,
  image       text,
  description text, -- résumé court
  content     text default '', -- contenu détaillé (Markdown)
  draft       boolean not null default false,
  created_at  timestamptz not null default now()
);
-- Ajout de la colonne si la table existe déjà (migration)
alter table public.events add column if not exists content text default '';

-- -----------------------------------------------------------------------------
-- MATÉRIEL (produits)
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'accessoires',
  price       numeric(12,2) not null default 0, -- prix de VENTE en Ariary (MGA)
  cost_price  numeric(12,2) not null default 0, -- prix d'ACHAT unitaire (MGA)
  stock       integer not null default 0,
  image       text,
  description text,
  featured    boolean not null default false,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);
-- Ajout de la colonne si la table existe déjà (migration)
alter table public.products add column if not exists cost_price numeric(12,2) not null default 0;

-- -----------------------------------------------------------------------------
-- ENTRÉES DE STOCK / ACHATS (approvisionnements)
-- Registre des achats de marchandise : nouveau produit ou réassort. Sert au
-- calcul de l'investissement et des marges.
-- -----------------------------------------------------------------------------
create table if not exists public.stock_entries (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity     integer not null default 0,
  unit_cost    numeric(12,2) not null default 0, -- prix d'achat unitaire (MGA)
  note         text,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- COMMANDES (boutique — pas de paiement en ligne, suivi manuel)
-- status : 'new' | 'confirmed' | 'delivered' | 'cancelled'
-- items  : tableau JSON [{productId, name, price, quantity}]
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null,
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  items          jsonb not null default '[]',
  total          numeric(12,2) not null default 0, -- en Ariary (MGA)
  note           text,
  status         text not null default 'new' check (status in ('new','confirmed','delivered','cancelled')),
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- SERVICES
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  icon        text default '•',
  image       text,
  features    text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- AVIS / TÉMOIGNAGES
-- status : 'published' | 'pending'
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  role       text default '',
  trip       text default '',
  rating     integer not null default 5 check (rating between 1 and 5),
  quote      text not null,
  image      text,
  status     text not null default 'pending' check (status in ('published','pending')),
  date       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- MESSAGES DE CONTACT
-- status : 'new' | 'read' | 'handled'
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  service    text default 'Autre demande',
  message    text not null,
  status     text not null default 'new' check (status in ('new','read','handled')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- RLS — activation
-- =============================================================================
alter table public.roles     enable row level security;
alter table public.profiles  enable row level security;
alter table public.articles  enable row level security;
alter table public.events    enable row level security;
alter table public.products  enable row level security;
alter table public.services  enable row level security;
alter table public.reviews   enable row level security;
alter table public.messages  enable row level security;
alter table public.orders    enable row level security;
alter table public.stock_entries enable row level security;

-- =============================================================================
-- RLS — politiques
-- =============================================================================

-- Lecture publique du contenu PUBLIÉ -----------------------------------------
create policy "articles_public_read" on public.articles
  for select using (draft = false);
create policy "events_public_read" on public.events
  for select using (draft = false);
create policy "products_public_read" on public.products
  for select using (true);
create policy "services_public_read" on public.services
  for select using (true);
create policy "reviews_public_read" on public.reviews
  for select using (status = 'published');
create policy "roles_public_read" on public.roles
  for select using (true);

-- Écriture publique limitée --------------------------------------------------
-- Le formulaire de contact peut créer un message.
create policy "messages_public_insert" on public.messages
  for insert with check (true);
-- Un visiteur peut déposer un avis, forcément "en attente".
create policy "reviews_public_insert" on public.reviews
  for insert with check (status = 'pending');
-- Un visiteur peut passer une commande, forcément "nouvelle".
create policy "orders_public_insert" on public.orders
  for insert with check (status = 'new');

-- Accès complet pour l'équipe authentifiée -----------------------------------
-- (un bloc par table : select/insert/update/delete)
do $$
declare t text;
begin
  foreach t in array array[
    'roles','profiles','articles','events','products','services','reviews','messages','orders','stock_entries'
  ] loop
    execute format($f$
      create policy "%1$s_staff_all" on public.%1$s
        for all using (public.is_staff()) with check (public.is_staff());
    $f$, t);
  end loop;
end $$;

-- =============================================================================
-- Données de départ (rôles)
-- =============================================================================
insert into public.roles (id, label, description, system, permissions) values
  ('superadmin', 'Super administrateur', 'Contrôle total : gère les rôles et invite les utilisateurs.', true,
    array['articles.view','articles.edit','articles.delete','reviews.view','reviews.moderate',
          'messages.view','messages.manage','products.view','products.manage','services.view',
          'services.manage','events.view','events.manage','orders.view','orders.manage',
          'stock.view','stock.manage','users.manage','roles.manage']),
  ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités.', true,
    array['articles.view','articles.edit','articles.delete','reviews.view','reviews.moderate',
          'messages.view','messages.manage','products.view','products.manage','services.view',
          'services.manage','events.view','events.manage','orders.view','orders.manage',
          'stock.view','stock.manage','users.manage','roles.manage']),
  ('editor', 'Éditeur', 'Gère le contenu et consulte les messages.', false,
    array['articles.view','articles.edit','reviews.view','reviews.moderate','messages.view',
          'products.view','products.manage','services.view','services.manage','events.view','events.manage',
          'orders.view','orders.manage','stock.view','stock.manage']),
  ('viewer', 'Lecteur', 'Consultation seule.', false,
    array['articles.view','reviews.view','messages.view','products.view','services.view','events.view','orders.view','stock.view'])
on conflict (id) do nothing;

-- =============================================================================
-- Création automatique du profil + attribution du rôle
-- Le PREMIER utilisateur inscrit devient `superadmin`, les suivants `viewer`
-- (le superadmin pourra ensuite changer leur rôle / les inviter).
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  assigned text;
begin
  select count(*) = 0 into is_first from public.profiles;
  assigned := case when is_first then 'superadmin' else 'viewer' end;
  insert into public.profiles (user_id, name, email, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    assigned
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Unicité du profil par utilisateur (rend le `on conflict` du trigger effectif
-- et évite les doublons de profils).
do $$ begin
  alter table public.profiles add constraint profiles_user_id_key unique (user_id);
exception when others then null; end $$;

-- =============================================================================
-- FILET DE SÉCURITÉ : garantir au moins UN super administrateur.
-- Utile si le tout premier compte a été créé AVANT l'installation du trigger
-- (il n'aurait alors pas reçu le rôle superadmin). Idempotent : ne fait rien
-- s'il existe déjà un superadmin.
-- =============================================================================
do $$
declare first_uid uuid;
begin
  if not exists (select 1 from public.profiles where role_id = 'superadmin') then
    select id into first_uid from auth.users order by created_at asc limit 1;
    if first_uid is not null then
      if exists (select 1 from public.profiles where user_id = first_uid) then
        update public.profiles set role_id = 'superadmin' where user_id = first_uid;
      else
        insert into public.profiles (user_id, name, email, role_id)
        select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email, 'superadmin'
        from auth.users where id = first_uid;
      end if;
    end if;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- RLS profiles : chacun lit/écrit son profil ; le staff gère tout.
-- (les politiques *_staff_all créées plus haut couvrent déjà le staff)
-- -----------------------------------------------------------------------------
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- STOCKAGE D'IMAGES (Supabase Storage)
-- Bucket public « media » : lecture publique (via CDN), upload/màj/suppression
-- réservés aux membres connectés. Voir src/utils/storage.ts.
-- =============================================================================
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

-- Lecture publique des fichiers du bucket media.
do $$ begin
  create policy "media_public_read" on storage.objects
    for select using (bucket_id = 'media');
exception when duplicate_object then null; end $$;

-- Écriture (upload/maj/suppression) réservée aux utilisateurs authentifiés.
do $$ begin
  create policy "media_auth_insert" on storage.objects
    for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "media_auth_update" on storage.objects
    for update using (bucket_id = 'media' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "media_auth_delete" on storage.objects
    for delete using (bucket_id = 'media' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
