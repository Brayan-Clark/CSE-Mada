// Notifications « toast » — légères, sans dépendance, utilisables depuis
// n'importe quel script client (admin ou public).
//
//   import { toast } from '../utils/toast';
//   toast.success('Produit enregistré');
//   toast.error("Échec de l'enregistrement");
//
// Le conteneur est créé à la volée ; les styles sont injectés une seule fois
// (CSS autonome → insensible au purge Tailwind).

type ToastType = 'success' | 'error' | 'info' | 'warning';

const STYLE_ID = 'cse-toast-styles';
const CONTAINER_ID = 'cse-toast-container';

const META: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: '#16a34a', icon: 'M5 13l4 4L19 7' },
  error: { bar: '#dc2626', icon: 'M6 18L18 6M6 6l12 12' },
  warning: { bar: '#d97706', icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  info: { bar: '#2563eb', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${CONTAINER_ID} {
      position: fixed; top: 1rem; right: 1rem; z-index: 9999;
      display: flex; flex-direction: column; gap: .5rem;
      max-width: min(92vw, 24rem); pointer-events: none;
    }
    .cse-toast {
      display: flex; align-items: flex-start; gap: .6rem;
      background: #fff; color: #111827;
      border: 1px solid #e5e7eb; border-left-width: 4px;
      border-radius: .6rem; padding: .7rem .85rem;
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
      font-size: .875rem; line-height: 1.35; pointer-events: auto;
      opacity: 0; transform: translateX(12px);
      transition: opacity .22s ease, transform .22s ease;
    }
    .cse-toast.cse-in { opacity: 1; transform: translateX(0); }
    .cse-toast svg { width: 1.1rem; height: 1.1rem; flex-shrink: 0; margin-top: .05rem; }
    .cse-toast-msg { flex: 1; word-break: break-word; }
    .cse-toast-close { background: none; border: 0; cursor: pointer; color: #9ca3af; font-size: 1rem; line-height: 1; padding: 0 .1rem; }
    .cse-toast-close:hover { color: #4b5563; }
    .dark .cse-toast { background: #1f2937; color: #f3f4f6; border-color: #374151; }
    .dark .cse-toast-close { color: #6b7280; }
    .dark .cse-toast-close:hover { color: #d1d5db; }
  `;
  document.head.appendChild(style);
}

function container(): HTMLElement {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    document.body.appendChild(el);
  }
  return el;
}

function show(message: string, type: ToastType = 'info', durationMs = 4000): void {
  if (typeof document === 'undefined') return;
  ensureStyles();
  const { bar, icon } = META[type];
  const el = document.createElement('div');
  el.className = 'cse-toast';
  el.style.borderLeftColor = bar;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="${bar}" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="${icon}" /></svg>
    <span class="cse-toast-msg"></span>
    <button class="cse-toast-close" aria-label="Fermer">&times;</button>`;
  (el.querySelector('.cse-toast-msg') as HTMLElement).textContent = message;

  const remove = () => {
    el.classList.remove('cse-in');
    setTimeout(() => el.remove(), 240);
  };
  el.querySelector('.cse-toast-close')?.addEventListener('click', remove);
  container().appendChild(el);
  requestAnimationFrame(() => el.classList.add('cse-in'));
  if (durationMs > 0) setTimeout(remove, durationMs);
}

export const toast = {
  success: (m: string, d?: number) => show(m, 'success', d),
  error: (m: string, d?: number) => show(m, 'error', d ?? 6000),
  info: (m: string, d?: number) => show(m, 'info', d),
  warning: (m: string, d?: number) => show(m, 'warning', d),
};
