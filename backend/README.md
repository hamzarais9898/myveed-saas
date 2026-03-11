# Video SaaS Backend

API REST pour la génération de vidéos avec Vo3 et publication sur Instagram/TikTok.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` basé sur `.env.example` :

```env
MONGODB_URI=mongodb://localhost:27017/video-saas
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Lancement

```bash
# Développement
npm run dev

# Production
npm start
```

## Structure

```
src/
├── controllers/    # Logique métier
├── models/        # Schémas MongoDB
├── routes/        # Routes API
├── services/      # Services externes
├── middlewares/   # Middleware
└── server.js      # Point d'entrée
```

## API

Voir le README principal pour la documentation complète de l'API.
