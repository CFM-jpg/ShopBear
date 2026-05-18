# 🐻 ShopBear — Boutique E-commerce Complète

Boutique streetwear fullstack avec espace admin TOTP, panier animé, tunnel de commande et import Excel.

---

## 🚀 Lancement rapide

### Prérequis
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+

### 1. Installer les dépendances backend

```bash
cd backend
npm install
```

### 2. Démarrer le serveur

```bash
node server.js
```

Le serveur tourne sur **http://localhost:3001**

### 3. Ouvrir la boutique

Ouvrez votre navigateur sur **http://localhost:3001**

- 🛍 **Boutique** → http://localhost:3001/index.html
- 🔐 **Admin** → http://localhost:3001/admin.html

---

## 📁 Structure du projet

```
shopbear/
├── backend/
│   ├── server.js              # Point d'entrée Express
│   ├── routes/
│   │   ├── auth.js            # Inscription / connexion clients (JWT)
│   │   ├── admin.js           # Auth admin TOTP + CRUD + import Excel
│   │   ├── products.js        # API produits publique
│   │   └── orders.js          # Création et suivi commandes
│   ├── data/
│   │   ├── products.json      # Catalogue produits (auto-créé)
│   │   ├── orders.json        # Commandes (auto-créé)
│   │   ├── users.json         # Comptes clients (auto-créé)
│   │   └── admin.json         # Config admin + secret TOTP (auto-créé)
│   └── package.json
│
├── frontend/
│   ├── index.html             # Boutique principale (SPA)
│   └── admin.html             # Dashboard administrateur
│
├── template.xlsx              # Modèle d'import produits
└── README.md
```

---

## 🔐 Connexion Admin

**Mot de passe par défaut :** `admin123`

### Configurer l'authentification TOTP (recommandé)

1. Ouvrez http://localhost:3001/admin.html
2. Cliquez **"Configurer l'authentification TOTP"**
3. Entrez le mot de passe admin
4. Scannez le QR code avec **Google Authenticator** ou **Authy**
5. Entrez le premier code à 6 chiffres pour confirmer
6. ✅ Connexion sécurisée activée

---

## 📦 API REST

### Auth Client

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET | `/api/auth/me` | Profil (Bearer token) |

### Produits (public)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/products` | Tous les produits |
| GET | `/api/products?category=sneakers` | Filtrer par catégorie |
| GET | `/api/products?search=nike` | Recherche |
| GET | `/api/products/:id` | Détail produit |

### Commandes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orders` | Passer une commande |
| GET | `/api/orders/my` | Mes commandes (Bearer token) |

### Admin (token admin requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/admin/login` | Auth step 1 (password) |
| POST | `/api/admin/login-totp` | Auth step 2 (TOTP) |
| POST | `/api/admin/setup-totp` | Générer QR TOTP |
| POST | `/api/admin/verify-totp-setup` | Activer TOTP |
| GET | `/api/admin/dashboard` | Stats dashboard |
| GET | `/api/admin/products` | Liste produits |
| POST | `/api/admin/products` | Créer produit |
| PUT | `/api/admin/products/:id` | Modifier produit |
| DELETE | `/api/admin/products/:id` | Supprimer produit |
| GET | `/api/admin/orders` | Toutes les commandes |
| PUT | `/api/admin/orders/:id` | Changer statut commande |
| POST | `/api/admin/import-excel` | Import .xlsx (multipart) |

---

## 📊 Import Excel

Format attendu du fichier `.xlsx` (voir `template.xlsx`) :

| Colonne | Requis | Exemple |
|---------|--------|---------|
| `nom` | ✅ | B30 Black |
| `prix` | ✅ | 119.90 |
| `prix_original` | | 180.00 |
| `categorie` | | sneakers |
| `stock` | | 15 |
| `description` | | Sneaker Dior B30... |
| `image_url` | | https://... |
| `marque` | | Dior |
| `badge` | | new / sale |
| `tailles` | | 39,40,41,42,43 |

---

## ✨ Fonctionnalités

### Boutique
- ✅ Hero animé avec parallax
- ✅ Ticker de marques défilant
- ✅ Grille produits avec hover 3D
- ✅ Filtres par catégorie (chips animées)
- ✅ Fiche produit (galerie, tailles, stock temps réel)
- ✅ Panier drawer avec animations
- ✅ Tunnel de commande 3 étapes
- ✅ Toast notifications
- ✅ Scroll reveal sur tous les éléments
- ✅ Responsive mobile
- ✅ Login / inscription client JWT
- ✅ Mode hors-ligne (fallback si backend absent)

### Admin
- ✅ Login sécurisé par mot de passe
- ✅ Double authentification TOTP (QR Code)
- ✅ Dashboard avec CA du jour, commandes en attente, alertes stock
- ✅ Gestion commandes avec statuts (4 niveaux)
- ✅ CRUD produits complet
- ✅ Import Excel .xlsx automatique
- ✅ Alertes stock bas
- ✅ Recherche/filtrage temps réel

---

## 🔧 Variables d'environnement

```env
PORT=3001
JWT_SECRET=votre_secret_client
ADMIN_SECRET=votre_secret_admin
```

Créez un fichier `.env` à la racine de `/backend/` et installez `dotenv` si besoin.

---

## 🗒️ Notes

- Les données sont stockées en **JSON local** dans `/backend/data/` — aucune base de données requise
- Le mot de passe admin par défaut est hashé avec bcrypt (hash de `admin123`)
- Pour changer le mot de passe, régénérez le hash : `node -e "const b=require('bcryptjs');b.hash('nouveauMDP',10).then(console.log)"`
- Le panier est persisté dans le `localStorage` du navigateur
