// Configuration de la politique de sécurité du contenu (CSP)
// Note: Pour une sécurité optimale, utilisez des nonces ou des hachages au lieu de 'unsafe-inline'
// lorsque cela est possible dans un environnement de production.

export const cspDirectives = {
  // Par défaut, tout est bloqué sauf ce qui est explicitement autorisé
  'default-src': ["'self'"],
  
  // Scripts autorisés
  'script-src': [
    "'self'",
    // Utilisez des nonces ou des hachages dans un environnement de production
    // pour éviter d'utiliser 'unsafe-inline' et 'unsafe-eval'
    "'unsafe-inline'",  // Nécessaire pour certaines fonctionnalités d'Astro
    "'unsafe-eval'"     // Peut être nécessaire pour certains frameworks
  ],
  
  // Styles autorisés
  'style-src': [
    "'self'",
    "'unsafe-inline'"  // Nécessaire pour le CSS en ligne
  ],
  
  // Images autorisées
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http://*.google-analytics.com',
    'https://*.google-analytics.com',
    'https://*.gstatic.com',
    'https://*.google.com',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    'https://images.unsplash.com'
  ],
  
  // Polices autorisées
  'font-src': [
    "'self'",
    'data:',
    'https:',
    'https://fonts.gstatic.com'
  ],
  
  // Connexions autorisées (XHR, fetch, etc.)
  'connect-src': [
    "'self'",
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://maps.googleapis.com',
    'wss://*.hotjar.com',
    'https://*.hotjar.com',
    'https://api.github.com'
  ],
  
  // Cadres (iframes) autorisés
  'frame-src': [
    'https://www.google.com',
    'https://maps.google.com'
  ],
  
  // Sécurité avancée
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
  'manifest-src': ["'self'"],
  'media-src': ["'self'", 'data:', 'https:'],
  'worker-src': ["'self'"],
  'child-src': ["'self'"],
  'prefetch-src': ["'self'"],
  
  // Désactive l'utilisation des API dépréciées
  'require-trusted-types-for': ["'script'"],
  
  // Restreint les types de plugins pouvant être chargés
  'plugin-types': []
};

// Convertit l'objet CSP en chaîne pour l'en-tête
export function generateCSP() {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (directive === 'upgrade-insecure-requests' && sources.length === 0) {
        return `${directive};`;
      }
      return `${directive} ${sources.join(' ')};`;
    })
    .join(' ');
}
