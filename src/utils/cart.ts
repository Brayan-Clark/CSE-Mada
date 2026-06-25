// Panier de la boutique — persistance localStorage, utilisable côté client.
// Émet un évènement `cart:change` sur `window` à chaque modification pour
// rafraîchir le badge et le tiroir du panier sans rechargement.

export interface CartLine {
  productId: string;
  name: string;
  price: number; // prix unitaire en MGA
  image?: string;
  quantity: number;
}

const CART_KEY = 'cse_cart';

function read(): CartLine[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export function getCart(): CartLine[] {
  return read();
}

/** Ajoute un produit (incrémente la quantité s'il est déjà présent). */
export function addToCart(line: Omit<CartLine, 'quantity'>, quantity = 1): void {
  const lines = read();
  const existing = lines.find((l) => l.productId === line.productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    lines.push({ ...line, quantity });
  }
  write(lines);
}

/** Définit la quantité d'une ligne (supprime la ligne si <= 0). */
export function setQuantity(productId: string, quantity: number): void {
  let lines = read();
  if (quantity <= 0) {
    lines = lines.filter((l) => l.productId !== productId);
  } else {
    const line = lines.find((l) => l.productId === productId);
    if (line) line.quantity = quantity;
  }
  write(lines);
}

export function removeFromCart(productId: string): void {
  write(read().filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  write([]);
}

/** Nombre total d'articles (somme des quantités). */
export function cartCount(): number {
  return read().reduce((sum, l) => sum + l.quantity, 0);
}

/** Montant total du panier en MGA. */
export function cartTotal(): number {
  return read().reduce((sum, l) => sum + l.price * l.quantity, 0);
}
