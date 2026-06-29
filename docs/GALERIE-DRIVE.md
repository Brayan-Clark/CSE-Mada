# Galerie photo des événements via Google Drive

Ce document explique comment configurer et utiliser la galerie photo des
événements, qui s'appuie sur **Google Drive** pour le stockage (illimité) et
sur l'**API Google Drive** pour afficher les photos directement dans le site.

> Pourquoi Drive et pas l'upload classique ? Le stockage Supabase est limité
> (1 Go sur l'offre gratuite). Drive offre beaucoup plus d'espace et reste
> simple à alimenter pour l'équipe (glisser-déposer des photos). On affiche les
> images via les **URL miniatures** Drive (`drive.google.com/thumbnail?id=…`),
> fiables dans une balise `<img>` — contrairement aux liens de téléchargement
> direct, qui cassent souvent.

---

## 1. Vue d'ensemble (comment ça marche)

1. Pour chaque événement, on crée **un dossier Google Drive** partagé
   publiquement (« Tout le monde avec le lien »).
2. Dans l'admin (`/admin/events`), on colle le **lien du dossier** dans le
   champ « Galerie photo » de l'événement. Le site en extrait l'identifiant et
   le stocke (colonne `events.gallery_folder`).
3. À l'affichage, le site appelle l'**API Drive** (lecture seule, avec une clé
   API publique restreinte) pour **lister les images** du dossier, puis les
   montre :
   - sur `/events/gallery?id=<id>` → grille + visionneuse plein écran ;
   - sur `/galerie` → toutes les galeries d'événements regroupées ;
   - un bouton « Voir la galerie photo » apparaît sur la fiche de l'événement.

Si la clé API est absente, la galerie reste simplement vide : **le site ne
plante jamais**.

---

## 2. Créer la clé API Google (une seule fois)

1. Aller sur **<https://console.cloud.google.com>** et se connecter.
2. En haut, **créer un projet** (ou en choisir un existant). Ex. nom : `CSE-Mada`.
3. Menu **APIs & Services → Library** (Bibliothèque).
   - Rechercher **« Google Drive API »** → l'ouvrir → **Enable** (Activer).
4. Menu **APIs & Services → Credentials** (Identifiants).
   - **Create credentials → API key**. Une clé est générée : la copier.
5. Cliquer sur la clé pour la **restreindre** (important pour la sécurité) :
   - **Application restrictions** → **Websites** (Sites web). Ajouter les URL
     autorisées :
     - `https://<votre-utilisateur>.github.io/*` (le site en production)
     - `http://localhost:3000/*` (pour tester en local)
   - **API restrictions** → **Restrict key** → cocher **Google Drive API**.
   - **Save**.

> La clé est **publique** (elle apparaît dans le code du navigateur), comme la
> clé `anon` de Supabase. La sécurité vient des **restrictions** (lecture seule
> de l'API Drive + limitée à votre domaine) et du fait que seuls des dossiers
> **déjà publics** sont lisibles.

---

## 3. Renseigner la clé dans le projet

### En local (pour tester)

Dans le fichier `.env` à la racine (voir `.env.example`) :

```
PUBLIC_GOOGLE_API_KEY=AIza...votre_cle...
```

Puis relancer `npm run dev`.

### En production (GitHub Pages)

Dépôt GitHub → **Settings → Secrets and variables → Actions** →
**New repository secret** :

- **Name** : `PUBLIC_GOOGLE_API_KEY`
- **Value** : la clé copiée

> ⚠️ Ce doit être un **Repository secret**, PAS un **Environment secret** : le
> job de build n'est pas rattaché à l'environnement `github-pages` et ne verrait
> pas un secret d'environnement (même piège que pour les clés Supabase).

Le workflow `.github/workflows/deploy.yml` passe déjà cette variable au build.
Relancer un déploiement (un push, ou *Re-run* du workflow) pour qu'elle soit
prise en compte.

---

## 4. Préparer un dossier Drive par événement

1. Dans Google Drive, **créer un dossier** (ex. au nom de l'événement).
2. Y déposer les photos (JPG, PNG, WebP…).
3. **Clic droit sur le dossier → Partager → Partager**.
   - Sous « Accès général », choisir **« Tout le monde avec le lien »**, rôle
     **Lecteur**.
   - Cliquer **Copier le lien**.
4. Dans l'admin du site : `/admin/events` → éditer l'événement → coller le lien
   dans **« Galerie photo (lien du dossier Google Drive) »** → Enregistrer.

Le lien ressemble à :
`https://drive.google.com/drive/folders/1AbCdEf...XyZ?usp=sharing`
Le site n'a besoin que de l'identifiant (`1AbCdEf...XyZ`), extrait
automatiquement — on peut donc coller le lien complet sans souci.

---

## 5. Vérifier

- Page publique `/galerie` : la galerie de l'événement apparaît (avec une photo
  de couverture et le nombre de photos).
- `/events/gallery?id=<id>` : la grille de photos s'affiche, clic = plein écran.
- Fiche de l'événement (`/events/detail?id=<id>`) : bouton « Voir la galerie
  photo ».

### Si les photos ne s'affichent pas

- **Dossier non public** : revérifier le partage « Tout le monde avec le lien ».
- **Clé absente / mal restreinte** : vérifier le secret `PUBLIC_GOOGLE_API_KEY`
  et que l'URL du site figure bien dans les restrictions de la clé.
- **API non activée** : confirmer que « Google Drive API » est *Enabled*.
- **Cache de build** : en production, relancer le déploiement après avoir ajouté
  le secret.
- Ouvrir la console du navigateur : les erreurs Drive y sont journalisées
  (`[drive] …`).

---

## 6. Détails techniques (pour les développeurs)

- Helper : `src/utils/drive.ts`
  - `isDriveEnabled` — vrai si `PUBLIC_GOOGLE_API_KEY` est défini.
  - `extractFolderId(lienOuId)` — extrait l'ID depuis un lien `…/folders/<ID>…`.
  - `listDriveImages(folderId)` — appelle
    `GET https://www.googleapis.com/drive/v3/files` avec
    `q='<folderId>' in parents and mimeType contains 'image/' and trashed=false`.
    Renvoie `[]` en cas d'absence de clé ou d'erreur (jamais d'exception).
  - `driveThumb(id, size)` — `https://drive.google.com/thumbnail?id=<id>&sz=w<size>`.
- Donnée : `EventItem.galleryFolder` ↔ colonne `events.gallery_folder`
  (mapper dédié dans `src/utils/db.ts`).
- Pages : `src/pages/events/gallery.astro` (galerie d'un événement),
  `src/pages/galerie.astro` (index des galeries), lien sur
  `src/pages/events/detail.astro`.
- L'ancien système MDX (`/events/gallery/[slug]`, lecture du dossier
  `public/images/events/<nom>/` au build) reste en place pour les événements
  statiques. Les événements **gérés en base** utilisent Drive.
