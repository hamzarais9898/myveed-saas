# Guide de Configuration VEO & SORA

Ce document explique comment configurer et utiliser les moteurs de génération vidéo VEO et SORA dans votre application.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration VEO](#configuration-veo)
3. [Configuration SORA](#configuration-sora)
4. [Variables d'environnement](#variables-denvironnement)
5. [Utilisation dans l'application](#utilisation-dans-lapplication)
6. [Architecture technique](#architecture-technique)

---

## Vue d'ensemble

L'application supporte maintenant **deux moteurs de génération vidéo**:

| Moteur | Fournisseur | Qualité | Vitesse | Coût |
|--------|-------------|---------|---------|------|
| **VEO** | Google | Très haute | Moyen | Modéré |
| **SORA** | OpenAI | Exceptionnelle | Lent | Premium |

Les utilisateurs peuvent choisir le moteur au moment de la génération.

---

## Configuration VEO

### 1. Créer un compte Google Cloud

1. Accédez à [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet (ex: "RemakeIt Video Generation")
3. Activez l'API VEO:
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Veo API"
   - Cliquez sur "Enable"

### 2. Créer une clé API

1. Dans la Console Cloud, allez à "Credentials"
2. Cliquez sur "Create Credentials" > "API Key"
3. Sélectionnez le type "Service Account"
4. Téléchargez la clé JSON

### 3. Configurer le `.env`

```env
# VEO Configuration
VEO_API_KEY=YOUR_VEO_API_KEY_HERE
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta/video
VEO_MODEL=veo-2  # ou veo-1
```

### 4. Points de terminaison VEO

```
POST https://generativelanguage.googleapis.com/v1beta/video/generate
Headers:
  Authorization: Bearer YOUR_VEO_API_KEY
  Content-Type: application/json

Body:
{
  "prompt": "Description de la vidéo",
  "model": "veo-2",
  "aspect_ratio": "16:9",  // ou "9:16" pour shorts
  "quality": "high",
  "duration": 60,
  "callback_url": "https://yourapp.com/api/videos/webhook"
}
```

---

## Configuration SORA

### 1. Accéder à OpenAI

1. Accédez à [OpenAI Platform](https://platform.openai.com)
2. Créez un compte ou connectez-vous
3. Accédez à "API Keys"
4. Cliquez sur "Create new secret key"

### 2. Obtenir l'accès à SORA

SORA est actuellement en accès limité. Pour accéder:

1. Rendez-vous sur [sora.com](https://www.sora.com)
2. Demandez l'accès à l'API (waitlist)
3. Une fois approuvé, générez votre clé API

### 3. Configurer le `.env`

```env
# SORA Configuration
SORA_API_KEY=sk_your_sora_api_key_here
SORA_API_URL=https://api.openai.com/v1
SORA_MODEL=gpt-4-turbo-with-vision
```

### 4. Points de terminaison SORA

```
POST https://api.openai.com/v1/video/generations
Headers:
  Authorization: Bearer sk_YOUR_SORA_API_KEY
  Content-Type: application/json

Body:
{
  "prompt": "Description de la vidéo",
  "model": "gpt-4-turbo-with-vision",
  "duration": 60,
  "resolution": "1920x1080",  // ou "1080x1920" pour shorts
  "quality": "hd",
  "callback_url": "https://yourapp.com/api/videos/webhook"
}
```

---

## Variables d'environnement

### Configuration complète du `.env`

```env
# ==================== VIDEO GENERATION ====================

# VEO (Google) Configuration
VEO_API_KEY=your_veo_api_key_here
VEO_API_URL=https://api.veo.example.com
VEO_MODEL=veo-2  # ou veo-1

# SORA (OpenAI) Configuration
SORA_API_KEY=your_sora_api_key_here
SORA_API_URL=https://api.openai.com/v1
SORA_MODEL=gpt-4-turbo-with-vision

# Default video generator (veo or sora)
DEFAULT_VIDEO_GENERATOR=veo

# ==================== APPLICATION ====================
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/remakeit
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

---

## Utilisation dans l'application

### Frontend - Utiliser le sélecteur VEO/SORA

La page de génération affiche automatiquement les moteurs disponibles:

```tsx
// Page: /app/generate/page.tsx
// Un sélecteur affiche VEO et SORA
// L'utilisateur clique sur le moteur désiré
// La sélection est enregistrée dans: videoGenerator
```

### API - Requête de génération

```bash
POST /api/videos/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "promptText": "Une vidéo montrant un coucher de soleil",
  "format": "youtube",        // youtube, short, ou both
  "variants": 3,              // Nombre de variantes (1-10)
  "videoGenerator": "veo"     // veo ou sora (optionnel, par défaut VEO)
}
```

### Réponse API

```json
{
  "success": true,
  "message": "Successfully generated 3 video(s)",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "count": 3,
  "videos": [
    {
      "id": "video_id_1",
      "promptText": "Une vidéo montrant un coucher de soleil",
      "videoUrl": "https://storage.example.com/video1.mp4",
      "format": "youtube",
      "videoGenerator": "veo",
      "variantNumber": 1,
      "status": "generated",
      "createdAt": "2025-01-30T10:30:00Z"
    }
  ],
  "creditsUsed": 30,
  "creditsRemaining": 70
}
```

### Récupérer les générateurs disponibles

```bash
GET /api/videos/generators/available
Authorization: Bearer YOUR_JWT_TOKEN
```

Réponse:

```json
{
  "success": true,
  "generators": [
    {
      "id": "veo",
      "name": "VEO (Google)",
      "description": "High-quality video generation by Google",
      "supported": true
    },
    {
      "id": "sora",
      "name": "SORA (OpenAI)",
      "description": "Advanced AI video generation by OpenAI",
      "supported": false  // API key not configured
    }
  ]
}
```

---

## Architecture technique

### Structure des fichiers

```
backend/
├── src/
│   ├── services/
│   │   ├── vo3Service.js              # Service VEO (renommé de vo3Service)
│   │   ├── soraService.js             # Service SORA (nouveau)
│   │   └── videoGenerationService.js  # Abstraction de sélection (nouveau)
│   ├── controllers/
│   │   └── videoController.js         # Mise à jour avec videoGenerator
│   ├── models/
│   │   └── Video.js                   # Ajout du champ videoGenerator
│   └── routes/
│       └── videoRoutes.js             # Nouvelle route /generators/available
│
frontend/
├── app/
│   └── generate/
│       └── page.tsx                   # UI avec sélecteur VEO/SORA
└── services/
    └── videoService.ts                # Fonction getAvailableGenerators()
```

### Flux de génération

```
User Interface (generate/page.tsx)
           ↓
    Sélection VEO ou SORA
           ↓
Frontend Service (videoService.ts)
    generateVideo(prompt, format, variants, videoGenerator)
           ↓
API Endpoint (videoController.js)
    POST /api/videos/generate
           ↓
Service Abstraction (videoGenerationService.js)
    Routage vers VEO ou SORA
           ↓
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
↓                          ↓
VEO Service            SORA Service
(vo3Service.js)        (soraService.js)
│                          │
└──────────────────────────┴──────────────────────────┘
           ↓
        Google/OpenAI API
           ↓
        Video Generated
           ↓
        Database (Video.js)
           ↓
      Return to Frontend
```

### Services et leurs responsabilités

#### 1. **vo3Service.js** (VEO)
- `generateVideo(promptText, format)`: Génère une vidéo avec Google VEO
- `checkVideoStatus(videoId)`: Vérifie le statut de génération
- Gère les tentatives API et les fallbacks

#### 2. **soraService.js** (SORA)
- `generateVideo(promptText, format)`: Génère une vidéo avec OpenAI SORA
- `checkVideoStatus(videoId)`: Vérifie le statut de génération
- Gère les tentatives API et les fallbacks

#### 3. **videoGenerationService.js** (Abstraction)
- `generateVideo(promptText, format, generator)`: Route vers le bon service
- `checkVideoStatus(videoId, generator)`: Vérifie le statut auprès du bon service
- `getAvailableGenerators()`: Retourne les générateurs disponibles

#### 4. **videoController.js** (API)
- `generateVideo()`: Accepte le paramètre `videoGenerator`
- `getAvailableGenerators()`: Endpoint pour récupérer les générateurs disponibles

---

## Dépannage

### VEO API Key not configured

**Cause**: `VEO_API_KEY` est manquant ou égal à `your_veo_api_key_here`

**Solution**:
1. Obtenez votre clé API VEO depuis Google Cloud Console
2. Mettez à jour le `.env`
3. Relancez le serveur

### SORA API Key not configured

**Cause**: `SORA_API_KEY` est manquant ou non configuré

**Solution**:
1. Demandez l'accès à SORA sur openai.com
2. Générez votre clé API
3. Mettez à jour le `.env`

### Les deux moteurs sont désactivés

**Solution**: Allez dans le fichier `.env` et configurez au moins un des deux services avec une vraie clé API.

### La génération échoue mais montre quand même du contenu

C'est normal! En mode développement (`NODE_ENV=development`), l'application utilise des vidéos de fallback pour tester l'interface.

Pour tester avec des vraies générations, configurez les clés API réelles.

---

## Prochaines étapes

1. **Intégration avec webhooks**: Ajouter les endpoints pour gérer les callbacks de génération
2. **Files d'attente**: Implémenter une queue (Bull, RabbitMQ) pour les générations longues
3. **Monitoring**: Tracker les appels API et les coûts
4. **Caching**: Mettre en cache les vidéos générées pour réduire les coûts

---

## Support

Pour toute question, consultez:
- [Documentation Google VEO](https://ai.google.dev/api)
- [Documentation OpenAI SORA](https://platform.openai.com/docs/guides/video)
- Code source: `backend/src/services/`
