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
   Le site sera disponible à l'adresse [http://localhost:3000](http://localhost:3000)

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
├── astro.config.mjs     # Configuration d'Astro
├── package.json
├── postcss.config.js    # Configuration de PostCSS
└── tailwind.config.mjs  # Configuration de Tailwind CSS
```

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
