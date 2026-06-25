// Couche d'accès aux données ASYNCHRONE : Supabase si configuré, sinon repli
// sur les dépôts localStorage de `store.ts`. Les pages admin/publiques appellent
// `await xxxData.list()` etc. — la bascule Supabase se fait ici, sans toucher aux
// pages. Voir docs/DATABASE.md pour le détail de la migration.
//
// Tant que Supabase n'est pas configuré (`getSupabase()` renvoie null), TOUT
// passe par le localStorage : le site ne plante jamais sans base de données.

import { getSupabase } from './supabase';
import {
  articlesRepo, eventsRepo, productsRepo, servicesRepo, reviewsRepo,
  messagesRepo, usersRepo, rolesRepo, ordersRepo, stockEntriesRepo,
} from './store';
import type {
  Article, EventItem, Product, Service, Review, ContactMessage, User, RoleDef, Order, StockEntry,
} from './store';

type Row = Record<string, unknown>;

interface LocalRepo<T extends { id: string }> {
  seedIfEmpty(seed: T[]): void;
  getAll(): T[];
  get(id: string): T | undefined;
  create(data: Omit<T, 'id'> & { id?: string }): T;
  update(id: string, patch: Partial<Omit<T, 'id'>>): T | undefined;
  remove(id: string): void;
}

interface Mapper<T> {
  /** Type métier → ligne Supabase (camelCase → snake_case si besoin). */
  toRow?: (entity: Partial<T>) => Row;
  /** Ligne Supabase → type métier. */
  fromRow?: (row: Row) => T;
}

interface SortSpec {
  column: string;
  ascending: boolean;
}

/**
 * Fabrique une couche de données pour une entité.
 * @param repo   dépôt local (repli)
 * @param table  nom de la table Supabase
 * @param order  tri par défaut pour `list()`
 * @param mapper conversion camelCase ↔ snake_case (identité par défaut)
 */
function createData<T extends { id: string }>(
  repo: LocalRepo<T>,
  table: string,
  order: SortSpec,
  mapper: Mapper<T> = {},
) {
  const toRow = mapper.toRow ?? ((e) => e as Row);
  const fromRow = mapper.fromRow ?? ((r) => r as unknown as T);

  return {
    /** Amorçage des données de démo (mode local uniquement). */
    seedIfEmpty(seed: T[]): void {
      if (!getSupabase()) repo.seedIfEmpty(seed);
    },

    async list(): Promise<T[]> {
      const sb = getSupabase();
      if (!sb) return repo.getAll();
      const { data, error } = await sb.from(table).select('*').order(order.column, { ascending: order.ascending });
      if (error) {
        console.warn(`[db] ${table}.list — repli local :`, error.message);
        return repo.getAll();
      }
      return (data as Row[]).map(fromRow);
    },

    async get(id: string): Promise<T | undefined> {
      const sb = getSupabase();
      if (!sb) return repo.get(id);
      const { data, error } = await sb.from(table).select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        if (error) console.warn(`[db] ${table}.get — repli local :`, error.message);
        return repo.get(id);
      }
      return fromRow(data as Row);
    },

    async create(input: Omit<T, 'id'> & { id?: string }): Promise<T> {
      const sb = getSupabase();
      if (!sb) return repo.create(input);
      const { data, error } = await sb.from(table).insert(toRow(input as Partial<T>)).select().single();
      if (error) {
        console.warn(`[db] ${table}.create — repli local :`, error.message);
        return repo.create(input);
      }
      return fromRow(data as Row);
    },

    async update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<void> {
      const sb = getSupabase();
      if (!sb) { repo.update(id, patch); return; }
      const { error } = await sb.from(table).update(toRow(patch as Partial<T>)).eq('id', id);
      if (error) {
        console.warn(`[db] ${table}.update — repli local :`, error.message);
        repo.update(id, patch);
      }
    },

    async remove(id: string): Promise<void> {
      const sb = getSupabase();
      if (!sb) { repo.remove(id); return; }
      const { error } = await sb.from(table).delete().eq('id', id);
      if (error) {
        console.warn(`[db] ${table}.remove — repli local :`, error.message);
        repo.remove(id);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// ARTICLES — entité migrée de bout en bout (modèle de référence).
// La table Supabase utilise `pub_date` (snake_case) ; on mappe vers `pubDate`.
// ---------------------------------------------------------------------------
export const articlesData = createData<Article>(
  articlesRepo,
  'articles',
  { column: 'pub_date', ascending: false },
  {
    toRow: (a) => {
      const row: Row = {};
      if (a.id !== undefined) row.id = a.id;
      if (a.title !== undefined) row.title = a.title;
      if (a.description !== undefined) row.description = a.description;
      if (a.author !== undefined) row.author = a.author;
      if (a.tags !== undefined) row.tags = a.tags;
      if (a.image !== undefined) row.image = a.image;
      if (a.content !== undefined) row.content = a.content;
      if (a.draft !== undefined) row.draft = a.draft;
      if (a.pubDate !== undefined) row.pub_date = a.pubDate;
      return row;
    },
    fromRow: (r) => ({
      id: String(r.id),
      title: (r.title as string) ?? '',
      description: (r.description as string) ?? '',
      author: (r.author as string) ?? 'Équipe CSEM',
      tags: (r.tags as string[]) ?? [],
      image: (r.image as string) ?? undefined,
      content: (r.content as string) ?? '',
      draft: Boolean(r.draft),
      pubDate: (r.pub_date as string) ?? new Date().toISOString(),
    }),
  },
);

// ---------------------------------------------------------------------------
// Autres entités — repli local opérationnel dès maintenant.
// ⚠️ Avant d'ACTIVER Supabase pour ces entités, affiner `toRow`/`fromRow`
// (ex. orders : customer_name/email/phone ; messages : created_at ↔ date),
// sur le modèle de `articlesData` ci-dessus. Voir docs/DATABASE.md.
// ---------------------------------------------------------------------------
export const eventsData = createData<EventItem>(eventsRepo, 'events', { column: 'date', ascending: false });
export const productsData = createData<Product>(productsRepo, 'products', { column: 'created_at', ascending: false });
export const servicesData = createData<Service>(servicesRepo, 'services', { column: 'created_at', ascending: true });
export const reviewsData = createData<Review>(reviewsRepo, 'reviews', { column: 'date', ascending: false });
export const rolesData = createData<RoleDef>(rolesRepo, 'roles', { column: 'label', ascending: true });

// MESSAGES — la table Supabase utilise `created_at` ; le type métier utilise `date`.
export const messagesData = createData<ContactMessage>(
  messagesRepo,
  'messages',
  { column: 'created_at', ascending: false },
  {
    toRow: (m) => {
      const row: Row = {};
      if (m.id !== undefined) row.id = m.id;
      if (m.name !== undefined) row.name = m.name;
      if (m.email !== undefined) row.email = m.email;
      if (m.phone !== undefined) row.phone = m.phone;
      if (m.service !== undefined) row.service = m.service;
      if (m.message !== undefined) row.message = m.message;
      if (m.status !== undefined) row.status = m.status;
      if (m.date !== undefined) row.created_at = m.date;
      return row;
    },
    fromRow: (r) => ({
      id: String(r.id),
      name: (r.name as string) ?? '',
      email: (r.email as string) ?? '',
      phone: (r.phone as string) ?? undefined,
      service: (r.service as string) ?? 'Autre demande',
      message: (r.message as string) ?? '',
      status: (r.status as ContactMessage['status']) ?? 'new',
      date: (r.created_at as string) ?? new Date().toISOString(),
    }),
  },
);

// PROFILS (utilisateurs) — `role` (métier) ↔ `role_id` (table profiles).
export const usersData = createData<User>(
  usersRepo,
  'profiles',
  { column: 'created_at', ascending: false },
  {
    toRow: (u) => {
      const row: Row = {};
      if (u.id !== undefined) row.id = u.id;
      if (u.name !== undefined) row.name = u.name;
      if (u.email !== undefined) row.email = u.email;
      if (u.role !== undefined) row.role_id = u.role;
      if (u.active !== undefined) row.active = u.active;
      return row;
    },
    fromRow: (r) => ({
      id: String(r.id),
      name: (r.name as string) ?? '',
      email: (r.email as string) ?? '',
      role: (r.role_id as string) ?? 'viewer',
      active: r.active === undefined ? true : Boolean(r.active),
    }),
  },
);

// ENTRÉES DE STOCK / ACHATS — `productName ↔ product_name`, `unitCost ↔ unit_cost`,
// `date ↔ created_at`.
export const stockEntriesData = createData<StockEntry>(
  stockEntriesRepo,
  'stock_entries',
  { column: 'created_at', ascending: false },
  {
    toRow: (s) => {
      const row: Row = {};
      if (s.id !== undefined) row.id = s.id;
      if (s.productId !== undefined) row.product_id = s.productId;
      if (s.productName !== undefined) row.product_name = s.productName;
      if (s.quantity !== undefined) row.quantity = s.quantity;
      if (s.unitCost !== undefined) row.unit_cost = s.unitCost;
      if (s.note !== undefined) row.note = s.note;
      if (s.date !== undefined) row.created_at = s.date;
      return row;
    },
    fromRow: (r) => ({
      id: String(r.id),
      productId: (r.product_id as string) ?? '',
      productName: (r.product_name as string) ?? '',
      quantity: Number(r.quantity ?? 0),
      unitCost: Number(r.unit_cost ?? 0),
      note: (r.note as string) ?? undefined,
      date: (r.created_at as string) ?? new Date().toISOString(),
    }),
  },
);

// COMMANDES — `customer` imbriqué ↔ colonnes plates ; `date` ↔ `created_at`.
export const ordersData = createData<Order>(
  ordersRepo,
  'orders',
  { column: 'created_at', ascending: false },
  {
    toRow: (o) => {
      const row: Row = {};
      if (o.id !== undefined) row.id = o.id;
      if (o.reference !== undefined) row.reference = o.reference;
      if (o.customer !== undefined) {
        row.customer_name = o.customer.name;
        row.customer_email = o.customer.email;
        row.customer_phone = o.customer.phone ?? null;
      }
      if (o.items !== undefined) row.items = o.items;
      if (o.total !== undefined) row.total = o.total;
      if (o.note !== undefined) row.note = o.note;
      if (o.status !== undefined) row.status = o.status;
      if (o.date !== undefined) row.created_at = o.date;
      return row;
    },
    fromRow: (r) => ({
      id: String(r.id),
      reference: (r.reference as string) ?? '',
      customer: {
        name: (r.customer_name as string) ?? '',
        email: (r.customer_email as string) ?? '',
        phone: (r.customer_phone as string) ?? undefined,
      },
      items: (r.items as Order['items']) ?? [],
      total: Number(r.total ?? 0),
      note: (r.note as string) ?? undefined,
      status: (r.status as Order['status']) ?? 'new',
      date: (r.created_at as string) ?? new Date().toISOString(),
    }),
  },
);
