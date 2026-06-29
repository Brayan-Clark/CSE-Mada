# Référencement (SEO) — état et bonnes pratiques

Ce document répond à : « mes articles/événements sont-ils visibles sur Google ? »
et liste ce qui est en place et ce qu'il faut faire pour être bien indexé.

---

## 1. Ce qui est en place

- **`site` configuré** : `https://brayan-clark.github.io` (base `/CSE-Mada`) →
  URL canoniques et absolues correctes.
- **Balises SEO** sur chaque page (dans `Layout.astro`) : `<title>`,
  `description`, **canonical**, **Open Graph** (partage Facebook/WhatsApp/
  LinkedIn) et **Twitter Card**, `theme-color`. Chaque page passe son propre
  `title`/`description` (et éventuellement une `image` pour le partage).
- **Sitemap** : `/CSE-Mada/sitemap.xml` (généré au build, endpoint
  `src/pages/sitemap.xml.ts`) — liste les pages éditoriales + le contenu MDX.
- **robots.txt** : `public/robots.txt` autorise l'indexation, **bloque
  `/admin/`**, et déclare le sitemap.
- **Admin non indexable** : `AdminLayout` envoie `<meta name="robots"
  content="noindex, nofollow">`.

---

## 2. ⚠️ Important : contenu en base vs contenu indexable

Le site est **statique** (généré au build). Deux types de contenu coexistent :

| Contenu | Indexable par Google ? |
|---|---|
| Pages éditoriales (`/services`, `/materiel`, `/location`, `/events`, `/blog`…) | ✅ Oui |
| Articles/événements **en MDX** (`src/content/…`, pré-générés en pages `/blog/<slug>`, `/events/<slug>`) | ✅ Oui |
| Articles/événements **créés dans l'admin (base Supabase)** | ❌ **Non** (voir ci-dessous) |

**Pourquoi le contenu de la base n'est pas indexé :** il est chargé **côté
navigateur** (JavaScript) après l'ouverture de la page, et les pages de détail
utilisent une URL à paramètre (`/blog/detail?id=…`, `/events/detail?id=…`) qui
n'est pas une page distincte. Les robots voient surtout du HTML vide pour ce
contenu.

### Que faire ?

**Option A — simple (recommandée pour le contenu durable) :** publier les
articles/événements importants **en MDX** (fichiers dans `src/content/blog` ou
`src/content/events`, commités). Ils deviennent de vraies pages pré-générées,
présentes dans le sitemap et indexées. → Idéal pour les articles « de fond » que
l'on veut voir remonter sur Google.

> La base Supabase reste parfaite pour le contenu **opérationnel** (commandes,
> réservations, stock, avis, galeries…) et pour publier vite, mais sans
> garantie de référencement.

**Option B — avancée (si on veut indexer le contenu de la base) :** pré-générer
les pages au build en lisant Supabase (`getStaticPaths` qui interroge la base)
et **relancer un build à chaque publication** (action GitHub planifiée ou
webhook). Plus de travail, et le contenu n'apparaît qu'après reconstruction.
À envisager seulement si le blog en base devient un vrai canal d'acquisition.

---

## 3. Se faire indexer par Google (à faire une fois)

1. **Google Search Console** : <https://search.google.com/search-console>
   → ajouter la propriété **`https://brayan-clark.github.io/CSE-Mada/`**
   (préfixe d'URL).
2. **Vérifier la propriété** : la méthode « balise HTML » est la plus simple —
   coller la balise `<meta name="google-site-verification" …>` fournie dans le
   `<head>` (on peut l'ajouter dans `Layout.astro`). Me le demander si besoin.
3. **Soumettre le sitemap** : dans Search Console → Sitemaps → indiquer
   `sitemap.xml`.
4. (Option) **Demander l'indexation** d'URL précises via l'outil d'inspection.

Le référencement prend **quelques jours à quelques semaines**. Avoir des
**liens entrants** (réseaux sociaux, Google Business Profile, annuaires locaux
Madagascar) accélère et améliore le positionnement.

---

## 4. Pistes d'amélioration (optionnelles)

- **Nom de domaine personnalisé** (ex. `campingstore.mg`) au lieu de
  `…github.io/CSE-Mada` : meilleure image de marque et SEO. GitHub Pages
  supporte les domaines personnalisés (fichier `CNAME`).
- **Données structurées** (JSON-LD `LocalBusiness`, `Event`, `Product`) pour des
  résultats enrichis. À ajouter page par page si souhaité.
- **Images** : préférer des images compressées et des `alt` descriptifs
  (déjà en place sur la plupart des visuels).
- **Google Business Profile** : essentiel pour une activité locale à Madagascar
  (apparaître sur Maps + recherches locales).

---

## 5. Note sécurité (en-têtes HTTP)

Le fichier `public/_headers` (en-têtes de sécurité) **n'est pas appliqué par
GitHub Pages** (il n'est lu que par certains hébergeurs comme Netlify). Sur
Pages, la sécurité repose sur : HTTPS automatique, les **règles RLS Supabase**
(le vrai contrôle d'accès aux données) et la clé `service_role` gardée **hors du
front** (Edge Function uniquement). Pour des en-têtes personnalisés, il faudrait
un hébergeur qui les supporte ou un proxy/CDN devant le site.
