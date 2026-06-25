// Couche de données ADMIN (démo) basée sur localStorage.
// Conçue pour être remplacée par de vrais appels API en phase 2 :
// il suffira de réimplémenter createRepository (ou ses méthodes) avec fetch,
// les pages admin n'auront pas à changer.

// ---------------------------------------------------------------------------
// Types métier
// ---------------------------------------------------------------------------
// Un rôle est désormais dynamique (créable/modifiable depuis l'admin).
// `Role` reste un alias de string pour la compatibilité du typage.
export type Role = string;

export interface RoleDef {
  id: string;
  label: string;
  description?: string;
  system?: boolean; // rôle de base non supprimable (ex: admin)
}

export interface Article {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  image?: string;
  content: string;
  draft: boolean;
  pubDate: string; // ISO 8601
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Review {
  id: string;
  author: string;
  role: string; // ex: "Randonneur", "Voyageuse"
  trip: string; // voyage / activité concernée
  rating: number; // 1 à 5
  quote: string;
  image?: string;
  status: 'published' | 'pending'; // publié sur le site / en attente de modération
  date: string; // ISO 8601
}

export type MessageStatus = 'new' | 'read' | 'handled';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  status: MessageStatus;
  date: string; // ISO 8601
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // prix de VENTE en Ariary (MGA)
  costPrice?: number; // prix d'ACHAT unitaire en MGA (sert au calcul des marges)
  stock: number;
  image?: string;
  description?: string;
  featured: boolean;
  tags: string[];
}

// Entrée de stock / approvisionnement : achat de marchandise (nouveau produit
// ou réassort d'un produit existant). Sert de registre des achats pour calculer
// l'investissement et les marges.
export interface StockEntry {
  id: string;
  productId: string;
  productName: string; // figé au moment de l'entrée (lisibilité de l'historique)
  quantity: number;
  unitCost: number; // prix d'achat unitaire en MGA
  note?: string;
  date: string; // ISO 8601
}

// --- Commandes (boutique) ---------------------------------------------------
export interface OrderItem {
  productId: string;
  name: string;
  price: number; // prix unitaire en MGA au moment de la commande
  quantity: number;
}

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  reference: string; // référence lisible, ex: CMD-1A2B
  customer: { name: string; email: string; phone?: string };
  items: OrderItem[];
  total: number; // en MGA
  note?: string;
  status: OrderStatus;
  date: string; // ISO 8601
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji ou pictogramme
  image?: string;
  features: string[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO 8601
  location?: string;
  activity?: string;
  image?: string;
  description?: string;
  draft: boolean;
}

// Catégories de matériel (réutilisées par le formulaire produit).
export const PRODUCT_CATEGORIES = [
  { id: 'tentes', name: 'Tentes & Abris' },
  { id: 'sac-couchage', name: 'Sacs de couchage' },
  { id: 'cuisine', name: 'Cuisine' },
  { id: 'randonnee', name: 'Randonnée' },
  { id: 'camping-car', name: 'Camping-car' },
  { id: 'accessoires', name: 'Accessoires' },
];

// ---------------------------------------------------------------------------
// Accès localStorage générique
// ---------------------------------------------------------------------------
function read<T>(key: string, fallback: T[]): T[] {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function write<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Crée un dépôt CRUD typé persisté dans localStorage.
 * Signature pensée pour être identique à une future implémentation API.
 */
export function createRepository<T extends { id: string }>(key: string) {
  return {
    /** Initialise les données de départ si le dépôt est vide. */
    seedIfEmpty(seed: T[]): void {
      if (typeof localStorage === 'undefined') return;
      if (localStorage.getItem(key) === null) write(key, seed);
    },
    getAll(): T[] {
      return read<T>(key, []);
    },
    get(id: string): T | undefined {
      return read<T>(key, []).find((item) => item.id === id);
    },
    create(data: Omit<T, 'id'> & { id?: string }): T {
      const items = read<T>(key, []);
      const item = { ...data, id: data.id ?? uid() } as T;
      items.push(item);
      write(key, items);
      return item;
    },
    update(id: string, patch: Partial<Omit<T, 'id'>>): T | undefined {
      const items = read<T>(key, []);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...patch, id };
      write(key, items);
      return items[index];
    },
    remove(id: string): void {
      write(
        key,
        read<T>(key, []).filter((item) => item.id !== id),
      );
    },
  };
}

export const articlesRepo = createRepository<Article>('cse_admin_articles');
export const usersRepo = createRepository<User>('cse_admin_users');
export const reviewsRepo = createRepository<Review>('cse_admin_reviews');
export const messagesRepo = createRepository<ContactMessage>('cse_admin_messages');
export const rolesRepo = createRepository<RoleDef>('cse_admin_roles');
export const productsRepo = createRepository<Product>('cse_admin_products');
export const servicesRepo = createRepository<Service>('cse_admin_services');
export const eventsRepo = createRepository<EventItem>('cse_admin_events');
export const ordersRepo = createRepository<Order>('cse_admin_orders');
export const stockEntriesRepo = createRepository<StockEntry>('cse_admin_stock_entries');

// ---------------------------------------------------------------------------
// Permissions (matrice rôle → permissions)
// ---------------------------------------------------------------------------
export const PERMISSIONS: Record<string, string> = {
  'articles.view': 'Consulter les articles',
  'articles.edit': 'Créer / modifier les articles',
  'articles.delete': 'Supprimer les articles',
  'reviews.view': 'Consulter les avis',
  'reviews.moderate': 'Modérer les avis (publier / supprimer)',
  'messages.view': 'Consulter les messages de contact',
  'messages.manage': 'Traiter / supprimer les messages',
  'products.view': 'Consulter le matériel',
  'products.manage': 'Gérer le matériel (ajout / édition)',
  'services.view': 'Consulter les services',
  'services.manage': 'Gérer les services',
  'events.view': 'Consulter les événements',
  'events.manage': 'Gérer les événements',
  'orders.view': 'Consulter les commandes',
  'orders.manage': 'Gérer les commandes (statut / suppression)',
  'stock.view': 'Consulter le stock et les achats',
  'stock.manage': 'Gérer les achats / entrées de stock',
  'users.manage': 'Gérer les utilisateurs',
  'roles.manage': 'Gérer les rôles et permissions',
};

// Rôles de départ (démo). `superadmin` et `admin` sont protégés (system).
// Le PREMIER utilisateur du projet (côté Supabase) reçoit le rôle `superadmin` :
// c'est lui qui crée les autres rôles et invite les utilisateurs.
export const DEFAULT_ROLES: RoleDef[] = [
  { id: 'superadmin', label: 'Super administrateur', description: 'Contrôle total : gère les rôles, invite les utilisateurs.', system: true },
  { id: 'admin', label: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités.', system: true },
  { id: 'editor', label: 'Éditeur', description: 'Gère le contenu (articles, avis) et consulte les messages.' },
  { id: 'viewer', label: 'Lecteur', description: 'Consultation seule.' },
];

/** Garantit que les rôles de base existent dans le dépôt. */
export function seedRoles(): void {
  rolesRepo.seedIfEmpty(DEFAULT_ROLES);
}

const PERMISSIONS_KEY = 'cse_admin_permissions';

const DEFAULT_PERMISSION_MATRIX: Record<string, string[]> = {
  superadmin: Object.keys(PERMISSIONS),
  admin: Object.keys(PERMISSIONS),
  editor: [
    'articles.view', 'articles.edit', 'reviews.view', 'reviews.moderate', 'messages.view',
    'products.view', 'products.manage', 'services.view', 'services.manage', 'events.view', 'events.manage',
    'orders.view', 'orders.manage', 'stock.view', 'stock.manage',
  ],
  viewer: ['articles.view', 'reviews.view', 'messages.view', 'products.view', 'services.view', 'events.view', 'orders.view', 'stock.view'],
};

export function getPermissionMatrix(): Record<string, string[]> {
  if (typeof localStorage === 'undefined') return DEFAULT_PERMISSION_MATRIX;
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  if (!raw) return structuredClone(DEFAULT_PERMISSION_MATRIX);
  try {
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return structuredClone(DEFAULT_PERMISSION_MATRIX);
  }
}

export function savePermissionMatrix(matrix: Record<string, string[]>): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(matrix));
}

/** Permissions d'un rôle donné (`superadmin`/`admin` ont toujours tout). */
export function getRolePermissions(roleId: string): string[] {
  if (roleId === 'superadmin' || roleId === 'admin') return Object.keys(PERMISSIONS);
  return getPermissionMatrix()[roleId] ?? [];
}

/** Définit les permissions d'un rôle puis persiste la matrice. */
export function setRolePermissions(roleId: string, perms: string[]): void {
  const matrix = getPermissionMatrix();
  matrix[roleId] = perms;
  savePermissionMatrix(matrix);
}

/** Supprime un rôle de la matrice (utilisé à la suppression d'un rôle). */
export function removeRoleFromMatrix(roleId: string): void {
  const matrix = getPermissionMatrix();
  delete matrix[roleId];
  savePermissionMatrix(matrix);
}

// Données de départ pour les utilisateurs (démo).
export const DEFAULT_USERS: User[] = [
  { id: 'u-admin', name: 'Administrateur', email: 'admin@cse-mada.mg', role: 'admin', active: true },
  { id: 'u-editor', name: 'Éditeur démo', email: 'editeur@cse-mada.mg', role: 'editor', active: true },
];

// Avis de départ (démo) — repris des témoignages du site.
export const DEFAULT_REVIEWS: Review[] = [
  { id: 'r-1', author: 'Sophie Martin', role: 'Voyageuse', trip: 'Expédition Tsingy', rating: 5, quote: "L'expérience la plus incroyable de ma vie ! L'équipe de CSEM a rendu notre aventure inoubliable.", status: 'published', date: '2023-06-15' },
  { id: 'r-2', author: 'Thomas Dubois', role: 'Randonneur', trip: 'Randonnée Andringitra', rating: 5, quote: 'Un service exceptionnel du début à la fin. Les guides sont très compétents et attentionnés.', status: 'published', date: '2023-05-02' },
  { id: 'r-3', author: 'Camille et Pierre', role: 'Voyageurs', trip: 'Voyage de noces sur mesure', rating: 5, quote: 'Notre voyage de noces a été parfaitement organisé. Des moments magiques dans des endroits préservés.', status: 'published', date: '2023-04-22' },
  { id: 'r-4', author: 'Julien Leroy', role: 'Photographe', trip: 'Voyage photo', rating: 4, quote: 'CSEM a su me guider vers des endroits extraordinaires, loin des sentiers battus.', status: 'pending', date: '2023-03-10' },
];

// Messages de contact de départ (démo).
export const DEFAULT_MESSAGES: ContactMessage[] = [
  { id: 'm-1', name: 'Aina Rakoto', email: 'aina@example.mg', phone: '034 12 345 67', service: 'Réservation', message: 'Bonjour, je souhaite réserver une tente 4 places pour le week-end prochain. Est-ce disponible ?', status: 'new', date: '2026-06-20T09:15:00.000Z' },
  { id: 'm-2', name: 'Marc Lefèvre', email: 'marc.l@example.com', service: 'Événements', message: 'Nous organisons un team building pour 25 personnes en juillet. Pouvez-vous nous faire un devis ?', status: 'read', date: '2026-06-18T14:30:00.000Z' },
];

// Matériel de départ (démo) — prix en Ariary (MGA).
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p-1', name: 'Tente 4 saisons 2-3 personnes', category: 'tentes', price: 1250000, costPrice: 850000, stock: 5, featured: true, tags: ['Nouveauté', 'Populaire'], description: 'Tente robuste pour toutes les saisons, double-toit imperméable et montage rapide. Idéale pour les expéditions à Madagascar.', image: 'https://images.unsplash.com/photo-1624923686627-514dd5e57bae?q=80&w=387&auto=format&fit=crop' },
  { id: 'p-2', name: 'Sac de couchage -5°C confort', category: 'sac-couchage', price: 650000, costPrice: 420000, stock: 8, featured: true, tags: ['Meilleure vente'], description: 'Sac de couchage chaud (confort -5°C), garnissage performant et housse de compression incluse.', image: 'https://images.unsplash.com/photo-1558477280-1bfed08ea5db?q=80&w=388&auto=format&fit=crop' },
  { id: 'p-3', name: 'Réchaud de randonnée', category: 'cuisine', price: 180000, costPrice: 110000, stock: 12, featured: true, tags: ['Éco-responsable'], description: 'Réchaud compact et léger, allumage piézo, compatible cartouches standard. Parfait pour la randonnée.', image: 'https://images.unsplash.com/photo-1738220543088-aa5b0f83733b?q=80&w=870&auto=format&fit=crop' },
  { id: 'p-4', name: 'Sac à dos 60L', category: 'randonnee', price: 450000, costPrice: 300000, stock: 6, featured: true, tags: ['Nouveauté'], description: 'Sac à dos 60L ergonomique, dos ventilé et nombreuses poches. Confortable sur les longs treks.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop' },
  { id: 'p-5', name: 'Lampe frontale rechargeable', category: 'accessoires', price: 95000, costPrice: 55000, stock: 20, featured: false, tags: ['Pratique'], description: 'Lampe frontale LED rechargeable par USB, plusieurs modes d\'éclairage et faisceau longue portée.', image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop' },
  { id: 'p-6', name: 'Matelas gonflable de trek', category: 'randonnee', price: 220000, costPrice: 140000, stock: 10, featured: false, tags: ['Léger'], description: 'Matelas isolant ultraléger, gonflage rapide et faible encombrement. Pour un sommeil réparateur.', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop' },
  { id: 'p-7', name: 'Popote de camping inox', category: 'cuisine', price: 120000, costPrice: 75000, stock: 15, featured: false, tags: ['Inox'], description: 'Kit de popote en inox (casseroles + poêle), poignées repliables et sac de transport.', image: 'https://images.unsplash.com/photo-1571687949921-1306bfb24b72?q=80&w=800&auto=format&fit=crop' },
  { id: 'p-8', name: 'Glacière rigide 25L', category: 'camping-car', price: 380000, costPrice: 250000, stock: 4, featured: false, tags: ['Camping-car'], description: 'Glacière isotherme 25L, garde au frais plusieurs jours. Idéale pour les sorties en camping-car.', image: 'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?q=80&w=800&auto=format&fit=crop' },
];

// Entrées de stock de départ (démo) — approvisionnements initiaux.
export const DEFAULT_STOCK_ENTRIES: StockEntry[] = [
  { id: 'se-1', productId: 'p-1', productName: 'Tente 4 saisons 2-3 personnes', quantity: 5, unitCost: 850000, note: 'Stock initial', date: '2026-05-10T08:00:00.000Z' },
  { id: 'se-2', productId: 'p-2', productName: 'Sac de couchage -5°C confort', quantity: 8, unitCost: 420000, note: 'Stock initial', date: '2026-05-10T08:00:00.000Z' },
  { id: 'se-3', productId: 'p-3', productName: 'Réchaud de randonnée', quantity: 12, unitCost: 110000, note: 'Stock initial', date: '2026-05-12T08:00:00.000Z' },
];

// Services de départ (démo) — repris de la page Services.
export const DEFAULT_SERVICES: Service[] = [
  { id: 'vente', title: "Vente d'articles de camping", icon: '🛒', description: 'Découvrez notre large sélection d\'équipements de camping de qualité pour toutes vos aventures en plein air.', features: ['Matériel de qualité professionnelle', 'Grand choix de marques réputées', "Conseils d'experts", 'Garantie sur les produits'] },
  { id: 'activites', title: 'Activités de plein air', icon: '🌲', description: 'Vivez des expériences inoubliables avec nos activités encadrées par des professionnels.', features: ['Activités pour tous les niveaux', 'Matériel fourni', 'Moniteurs diplômés', 'Sécurité assurée'] },
  { id: 'location', title: "Location d'articles de camping", icon: '⛺', description: 'Besoin de matériel pour une courte durée ? Louez notre équipement de qualité.', features: ['Tarifs journaliers et hebdomadaires', 'Matériel entretenu et contrôlé', 'Assurance optionnelle', 'Réservation en ligne simple'] },
  { id: 'evenements', title: "Organisation d'événements", icon: '🎉', description: 'Confiez-nous l\'organisation de votre prochain événement en plein air.', features: ['Organisation clé en main', 'Équipement fourni', 'Restauration sur mesure', 'Animation incluse'] },
];
