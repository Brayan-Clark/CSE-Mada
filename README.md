# Camping Store & Event Madagascar

Site web officiel de Camping Store & Event Madagascar, construit avec [Astro](https://astro.build/) et [Tailwind CSS](https://tailwindcss.com/). Ce site présente nos services de location de matériel de camping et d'organisation d'événements en plein air à Antsiranana, Madagascar.

## 🚀 Fonctionnalités

- ⚡ **Site ultra-rapide** grâce à Astro
- 🎨 **Design moderne et élégant** avec Tailwind CSS
- 🌓 **Thème clair/sombre** avec persistance locale
- 📱 **Design responsive** optimisé pour tous les appareils
- 📍 **Carte interactive** avec localisation de notre magasin
- ✉️ **Formulaire de contact** fonctionnel
- 📄 **Pages légales complètes** (Mentions légales, CGV, Politique de confidentialité)
- 🎯 **SEO optimisé** pour une meilleure visibilité

## 🛠 Installation et développement

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Brayan-Clark/CSE-Mada.git
   cd CSE-Mada
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   # ou
   pnpm dev
   ```

4. **Ouvrir dans votre navigateur**
   Le site sera disponible à l'adresse [http://localhost:3000/CSE-Mada/](http://localhost:3000/CSE-Mada/)

## 🔗 Gestion du chemin de base (local = en ligne)

Le site est publié sur GitHub Pages sous le préfixe `/CSE-Mada`. Ce préfixe est défini **à un seul endroit** : le champ `base` dans `astro.config.mjs`.

➡️ **Ne jamais écrire `/CSE-Mada/...` en dur dans les liens ou les images.** Utilisez toujours le helper :

```astro
---
import { withBase } from '../utils/url';
---
<a href={withBase('/contact')}>Contact</a>
<img src={withBase('/images/logo.jpg')} />
```

`withBase()` s'appuie sur `import.meta.env.BASE_URL`, donc le site fonctionne **à l'identique en local et en ligne** sans rien changer. Pour tester sans préfixe en local, il suffirait de passer `base: '/'` dans `astro.config.mjs`.

## 🔐 Espace d'administration

Une interface d'administration (front uniquement, démo) est disponible sur `/admin` :

- **Connexion** : `/admin/login` — identifiants par défaut `admin` / `cse-admin-2026`
- Gestion des **articles** (ajout, édition, suppression)
- Gestion des **utilisateurs** et des **permissions** par rôle

⚠️ Cette phase est **front uniquement** : l'authentification est statique et les données sont stockées dans le `localStorage` du navigateur (amorcées avec les vrais articles au premier chargement). La sécurité réelle et la persistance serveur seront ajoutées en phase 2 (back-end). La couche de données (`src/utils/store.ts`) est conçue pour être branchée sur une API sans modifier les pages.

## 🏗 Structure du projet

```
/
├── public/              # Fichiers statiques
│   ├── icons/           # Icônes SVG
│   └── images/          # Images du site
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Header.astro # En-tête du site
│   │   ├── Footer.astro # Pied de page
│   │   └── ThemeToggle.astro # Bouton de changement de thème
│   │
│   ├── layouts/         # Mises en page
│   │   └── Layout.astro # Mise en page principale
│   │
│   ├── pages/           # Pages du site
│   │   ├── index.astro  # Page d'accueil
│   │   ├── contact.astro # Page de contact
│   │   ├── cgv.astro    # Conditions Générales de Vente
│   │   ├── confidentialite.astro # Politique de confidentialité
│   │   └── mentions-legales.astro # Mentions légales
│   │
│   └── styles/          # Fichiers CSS globaux
│       ├── global.css   # Styles globaux
│       └── theme.css    # Variables de thème
│
├── astro.config.mjs     # Configuration d'Astro (chemin `base` unique)
├── package.json
├── postcss.config.cjs   # Configuration de PostCSS
└── tailwind.config.mjs  # Configuration de Tailwind CSS
```

> ℹ️ **En-têtes de sécurité** : GitHub Pages ne permet pas de définir des en-têtes HTTP personnalisés (le fichier `public/_headers` n'est pris en compte que par des hébergeurs comme Netlify/Cloudflare). Les vrais en-têtes de sécurité seront mis en place avec le back-end.

## 🌍 Déploiement

Le site est configuré pour être déployé sur GitHub Pages. Pour générer une version de production :

```bash
npm run build
# ou
pnpm build
```

Les fichiers générés seront disponibles dans le dossier `dist/`.

## 📝 Licence

Tous droits réservés © 2025 Camping Store & Event Madagascar. Toute reproduction ou utilisation non autorisée est strictement interdite.

## 📞 Contact

- **Email** : camping.storeevent@gmail.com
- **Téléphone** : +261 34 21 807 57 / 032 75 170 48
- **Adresse** : Lazaret nord, Antsiranana, Madagascar

## 🙏 Remerciements

- [Astro](https://astro.build/) - Le framework web tout-en-un
- [Tailwind CSS](https://tailwindcss.com/) - Un framework CSS utilitaire
- [Heroicons](https://heroicons.com/) - Icônes SVG de qualité
- [Google Fonts](https://fonts.google.com/) - Polices d'écran
