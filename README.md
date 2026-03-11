# Video SaaS Application - V3 Multi-Provider Edition

Application SaaS complète de génération de vidéos IA avec support multi-providers (LUMA, PIKA, RUNWAY), publication automatique sur Instagram et TikTok, multi-formats, génération par lots, et planification automatique.

---

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer MongoDB URI et provider APIs dans .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Ouvrir `http://localhost:3000`

---

## ✨ Fonctionnalités V3

### 🎯 Multi-Providers Support
- **LUMA Dream Machine** ✅ (Production - API mode)
- **PIKA 1.0** ⏳ (Coming Soon - Manual/API mode)
- **RUNWAY Gen-2** ⏳ (Coming Soon - Manual/API mode)
- **SORA** (OpenAI) - Placeholder pour futur
- **VEO** (Google) - Placeholder pour futur

### 🎨 Multi-Formats
- YouTube (16:9) - Format paysage
- Short/TikTok (9:16) - Format vertical
- Les deux - Génère les 2 formats simultanément

### ⚡ Génération par Lots
- Jusqu'à 20 variantes par prompt
- Groupement automatique par lot
- Progression en temps réel
- Support multi-providers par lot

### 🔄 Dual-Mode Generation
- **API Mode**: Provider génère automatiquement
- **Manual Mode**: Upload vidéo manuellement via admin
- Basculement transparent selon provider

### 📹 Manual Video Upload
- Admin interface pour upload manuel
- Support pour PIKA et RUNWAY
- Statut auto-update après upload

- Gestion tokens sécurisée

### 📅 Planification Automatique
- Planification date/heure précise
- Cron job automatique (chaque minute)
- Publication automatique

---

## 🏗️ Architecture

### Backend
- **Express.js** - API REST
- **MongoDB + Mongoose** - Base de données
- **JWT + bcrypt** - Authentification
- **node-cron** - Scheduler
- **uuid** - Batch IDs

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling moderne
- **Axios** - Requêtes HTTP
- **react-datepicker** - Sélection date/heure
- **file-saver** - Téléchargements

---

## 📁 Structure

```
remakeit/
├── backend/
│   ├── src/
│   │   ├── controllers/      # authController, videoController, publishController, tiktokAccountController
│   │   ├── models/           # User, Video, TikTokAccount
│   │   ├── routes/           # authRoutes, videoRoutes, publishRoutes, tiktokAccountRoutes
│   │   ├── services/         # vo3Service, schedulerService, downloadService, instagramService, tiktokService
│   │   ├── middlewares/      # authMiddleware
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Landing page premium
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/        # Dashboard avec stats et filtres
│   │   ├── generate/         # Génération multi-format
│   │   ├── settings/
│   │   └── tiktok-accounts/  # Gestion comptes TikTok
│   ├── components/
│   │   ├── VideoCard.tsx     # Carte vidéo avec download/schedule
│   │   ├── FormatSelector.tsx
│   │   ├── BatchProgress.tsx
│   │   ├── ScheduleModal.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── videoService.ts
│   │   ├── publishService.ts
│   │   └── tiktokAccountService.ts
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Videos
- `POST /api/videos/generate` - Générer vidéo(s) (format, variants)
- `GET /api/videos` - Liste vidéos
- `GET /api/videos/batch/:batchId` - Vidéos d'un lot
- `GET /api/videos/:id` - Détails vidéo
- `GET /api/videos/download/:id` - Télécharger
- `POST /api/videos/:id/schedule` - Planifier
- `DELETE /api/videos/:id/schedule` - Annuler planification
- `DELETE /api/videos/:id` - Supprimer

### TikTok Accounts
- `GET /api/tiktok-accounts` - Liste comptes
- `POST /api/tiktok-accounts/connect` - Initier OAuth
- `GET /api/tiktok-accounts/callback` - Callback OAuth
- `POST /api/tiktok-accounts/save` - Sauvegarder compte
- `DELETE /api/tiktok-accounts/:id` - Déconnecter
- `PUT /api/tiktok-accounts/:id/refresh` - Refresh token

### Publishing
- `POST /api/publish/instagram` - Publier Instagram
- `POST /api/publish/tiktok` - Publier TikTok

---

## 🎯 Utilisation

### 1. Génération Multi-Format

```
1. Aller sur /generate
2. Entrer prompt: "Un chat qui joue du piano"
3. Sélectionner format: "Both"
4. Variantes: 3
5. Générer

Résultat: 6 vidéos (3 YouTube + 3 Shorts)
```

### 2. Planification

```
1. Dashboard → Sélectionner vidéo
2. Cliquer "Planifier"
3. Choisir compte TikTok
4. Date: 30/01/2026 10:00
5. Confirmer

→ Publication automatique à 10h
```

### 3. Téléchargement

```
1. Dashboard → Vidéo générée
2. Cliquer "Télécharger"
→ Fichier MP4 téléchargé
```

---

## 🔐 Variables d'Environnement

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-saas
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
VO3_API_KEY=your_vo3_key
INSTAGRAM_CLIENT_ID=your_instagram_id
INSTAGRAM_CLIENT_SECRET=your_instagram_secret
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Test génération
1. S'inscrire: http://localhost:3000/register
2. Générer vidéo: /generate
3. Voir dashboard: /dashboard
4. Gérer TikTok: /tiktok-accounts
```

---

## 📦 Dépendances

### Backend
- express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv
- **V2:** uuid, node-cron

### Frontend
- next, react, react-dom, typescript, tailwindcss, axios
- **V2:** react-datepicker, file-saver

---

## 🎨 Design

**Landing Page Premium:**
- Style AI SaaS (OpenAI, Midjourney)
- Gradients modernes purple/pink
- Animations fluides
- Navigation sticky avec blur
- Hero avec stats
- Grille fonctionnalités

**Dashboard:**
- Stats temps réel
- Filtres format/statut
- Groupement par lots
- Cartes vidéo interactives

---

## ⚠️ V2 Limitations

**Simulations:**
- OAuth TikTok simulé
- Publication TikTok simulée
- Génération Vo3 avec vidéos de démo

**Pour production:**
1. Intégrer vraie API Vo3
2. Configurer OAuth TikTok réel
3. Implémenter vraie publication TikTok
4. Ajouter refresh automatique tokens

---

## 📝 License

MIT

---

## 🚀 Prochaines Étapes

- [ ] Intégrer vraies APIs (Vo3, TikTok)
- [ ] Analytics par vidéo
- [ ] Notifications push
- [ ] Multi-langue
- [ ] Tests unitaires
- [ ] Déploiement production

---

**Application prête pour tests et déploiement ! 🎉**


ya encore des defaillances au niveau des langues je evux qu quand tu met anglais ou espagnol , le site en entier tout tout tout se met a la langue choisit , parcours tout le site et fait ca 
