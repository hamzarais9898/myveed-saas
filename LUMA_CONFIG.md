# 🚀 Configuration LUMA Dream Machine

Guide complet pour lancer ton application MAINTENANT avec LUMA, et switcher vers SORA/VEO plus tard.

## 📋 Table des matières

1. [Pourquoi LUMA?](#pourquoi-luma)
2. [Configuration rapide](#configuration-rapide)
3. [Obtenir ta clé API](#obtenir-ta-clé-api)
4. [Variables d'environnement](#variables-denvironnement)
5. [Architecture des providers](#architecture-des-providers)
6. [Tester la génération](#tester-la-génération)
7. [Switch vers SORA/VEO plus tard](#switch-vers-soraveo-plus-tard)

---

## Pourquoi LUMA?

| Critère | LUMA | SORA | VEO |
|---------|------|------|-----|
| **Disponibilité** | ✅ Maintenant | ⏳ Waitlist | ⏳ Waitlist |
| **Qualité vidéo** | 🔥 Excellente | 🔥 Exceptionnelle | 🔥 Très bonne |
| **Vitesse génération** | ⚡ 30-60s | 🐢 2-5min | ⚡ 30-60s |
| **API stable** | ✅ Production-ready | ⏳ Beta | ⏳ Beta |
| **Coût** | 💰 Modéré | 💸 Premium | 💰 Modéré |
| **Support text→video** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Support image→video** | ✅ Oui | ✅ Oui | ✅ Oui |

**Stratégie gagnante:** Lance avec LUMA maintenant, intègre SORA/VEO dès qu'ils sont disponibles.

---

## Configuration rapide (5 minutes)

### 1. Créer un compte LUMA

```bash
# Va sur:
https://lumalabs.ai

# Crée un compte
# Attends la confirmation d'email
```

### 2. Demander l'accès API

Dans ton compte LUMA:
- Va à "Settings"
- Clique sur "API Access"
- Demande l'accès API
- Copie ta clé: `lm_xxxxxxxxx`

### 3. Mettre à jour `.env`

```env
# LUMA Dream Machine
LUMA_API_KEY=lm_xxxxxxxxxxxxxxx
LUMA_API_URL=https://api.lumalabs.ai/dream-machine/v1

# Default provider
DEFAULT_PROVIDER=luma
```

### 4. Relancer l'app

```bash
npm run dev
# ou
yarn dev
```

**C'est tout!** Ton app utilise maintenant LUMA. 🎉

---

## Obtenir ta clé API

### Étape par étape

1. **Créer un compte LUMA**
   ```
   https://lumalabs.ai → Sign Up
   Email + Password
   Confirme ton email
   ```

2. **Accéder à la console API**
   ```
   Dashboard → Settings → API Keys
   ```

3. **Générer une clé API**
   ```
   Clique "Generate New Key"
   Copie: lm_xxxxxxxxx
   ```

4. **Ajouter au `.env`**
   ```env
   LUMA_API_KEY=lm_xxxxxxxxx
   ```

### ⚠️ Points importants

- **Ne partage JAMAIS** ta clé API
- La clé commence par `lm_`
- Garde-la dans `.env` (jamais en GitHub)
- Régénère-la si compromise

---

## Variables d'environnement

### `.env` complet

```env
# ==================== VIDEO GENERATION ====================

# LUMA Dream Machine (ACTIVE)
LUMA_API_KEY=lm_xxxxxxxxxxxxxxx
LUMA_API_URL=https://api.lumalabs.ai/dream-machine/v1

# SORA (OpenAI) - Coming Soon
SORA_API_KEY=your_sora_api_key_here
SORA_API_URL=https://api.openai.com/v1
SORA_MODEL=gpt-4-turbo-with-vision

# VEO (Google) - Coming Soon
VEO_API_KEY=your_veo_api_key_here
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta
VEO_MODEL=veo-2

# Provider actif
DEFAULT_PROVIDER=luma

# ==================== APPLICATION ====================
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

---

## Architecture des providers

### Structure dossiers

```
backend/
├── src/
│   ├── providers/
│   │   ├── index.js                 # Router principal
│   │   ├── luma.provider.js         # ✅ Actif
│   │   ├── sora.provider.js         # ⏳ Coming Soon
│   │   └── veo.provider.js          # ⏳ Coming Soon
│   ├── controllers/
│   │   └── videoController.js       # POST /generate
│   ├── routes/
│   │   └── videoRoutes.js           # Routes API
│   └── models/
│       └── Video.js                 # DB Schema
```

### Flux de génération

```
Frontend (generate page)
    ↓
    Sélectionne provider: LUMA (actif), SORA (coming), VEO (coming)
    ↓
POST /api/videos/generate
{
  "promptText": "...",
  "format": "youtube",
  "variants": 1,
  "provider": "luma"  // ou "auto"
}
    ↓
videoController.generateVideo()
    ↓
providerRouter.generateVideo(prompt, format, "luma")
    ↓
lumaProvider.generateVideo()
    ↓
LUMA Dream Machine API
    ↓
Generation Job Created (status: processing)
    ↓
Video Record Saved in DB
    ↓
Response to Frontend
{
  "success": true,
  "provider": "luma",
  "videos": [...]
}
```

### Code du routeur

```javascript
// backend/src/providers/index.js

exports.generateVideo = async (promptText, format, provider = 'auto') => {
  // Résout le provider
  const selected = provider === 'auto' 
    ? (process.env.DEFAULT_PROVIDER || 'luma')
    : provider;

  // Route vers le bon provider
  switch (selected) {
    case 'luma':
      return await lumaProvider.generateVideo(promptText, format);
    case 'sora':
      return await soraProvider.generateVideo(promptText, format);
    case 'veo':
      return await veoProvider.generateVideo(promptText, format);
  }
};
```

---

## Tester la génération

### Via l'interface (recommandé)

1. Va sur `http://localhost:3000/generate`
2. Tu vois le sélecteur:
   - 🟢 **LUMA** (actif)
   - 🔒 **SORA** (coming soon)
   - 🔒 **VEO** (coming soon)
3. Sélectionne **LUMA**
4. Rentre un prompt: "A cinematic sunset over Morocco"
5. Clique "Générer"
6. Attends 30-60s

### Via l'API (curl)

```bash
# Générer avec LUMA
curl -X POST http://localhost:5000/api/videos/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "A cinematic night shot of Casablanca medina",
    "format": "youtube",
    "variants": 1,
    "provider": "luma"
  }'
```

### Réponse réussie

```json
{
  "success": true,
  "message": "Successfully generated 1 video(s)",
  "provider": "luma",
  "videos": [
    {
      "id": "...",
      "promptText": "A cinematic night shot of Casablanca medina",
      "provider": "luma",
      "generationId": "dream_xxxxx",
      "status": "processing",
      "format": "youtube",
      "createdAt": "2025-01-30T..."
    }
  ]
}
```

### Récupérer les providers disponibles

```bash
curl http://localhost:5000/api/videos/providers/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Réponse:

```json
{
  "success": true,
  "activeProvider": "luma",
  "providers": [
    {
      "id": "luma",
      "name": "LUMA Dream Machine",
      "description": "Cinematic video generation - Fast & Reliable",
      "status": "active",
      "supported": true,
      "features": ["text-to-video", "image-to-video", "6s videos", "cinematic"]
    },
    {
      "id": "sora",
      "name": "SORA (OpenAI)",
      "description": "Advanced AI video - Coming Soon",
      "status": "coming-soon",
      "supported": false,
      "waitlist": true,
      "signupUrl": "https://platform.openai.com"
    },
    {
      "id": "veo",
      "name": "VEO (Google)",
      "description": "High-quality generation - Coming Soon",
      "status": "coming-soon",
      "supported": false,
      "waitlist": true,
      "signupUrl": "https://console.cloud.google.com"
    }
  ]
}
```

---

## Switch vers SORA/VEO plus tard

### Quand tu auras accès à SORA

1. **Obtiens ta clé API OpenAI**
   ```
   https://platform.openai.com → API Keys
   Crée une clé: sk_xxxxx
   ```

2. **Met à jour `.env`**
   ```env
   SORA_API_KEY=sk_xxxxx
   ```

3. **Active la implémentation dans `sora.provider.js`**
   ```javascript
   // Décommente le code dans sora.provider.js
   ```

4. **Change le DEFAULT_PROVIDER (optionnel)**
   ```env
   DEFAULT_PROVIDER=sora
   ```

5. **Relance l'app**
   ```bash
   npm run dev
   ```

**C'est tout!** L'interface affichera SORA comme actif. ✅

### Quand tu auras accès à VEO

Même processus avec `veo.provider.js` et Google Cloud.

### Code prêt à activer

Chaque provider (SORA, VEO) a le code commenté, prêt à décommenter:

```javascript
// sora.provider.js
/*
const fetch = require('node-fetch');

exports.generateVideo = async (promptText, format) => {
  // Implémentation SORA ici
  // Décommente quand tu as accès
};
*/
```

---

## ⚙️ API LUMA - Référence rapide

### Créer une génération

```bash
POST https://api.lumalabs.ai/dream-machine/v1/generations

Headers:
  Authorization: Bearer lm_xxxxx
  Content-Type: application/json

Body:
{
  "prompt": "A cinematic drone shot of a mountain landscape at sunset",
  "aspect_ratio": "16:9",    // ou "9:16" pour shorts
  "loop": false,             // Pas de boucle infinie
  "duration": 6              // LUMA génère des vidéos 6 secondes
}

Response:
{
  "id": "dream_xxxxx",
  "state": "queued",
  "created_at": "2025-01-30T..."
}
```

### Vérifier le statut

```bash
GET https://api.lumalabs.ai/dream-machine/v1/generations/{id}

Headers:
  Authorization: Bearer lm_xxxxx

Response (en cours):
{
  "id": "dream_xxxxx",
  "state": "processing",
  "assets": null
}

Response (complété):
{
  "id": "dream_xxxxx",
  "state": "completed",
  "assets": {
    "video": "https://..../video.mp4"
  }
}
```

---

## 💰 Monétisation & Crédits

### Coûts LUMA (estimation)

- **1 génération** = 1-10 crédits (selon durée/qualité)
- **Crédit** = ~0.01-0.05$ (varie)
- **Gratuit au départ** = 30 crédits de démo

### Plan tarifaire exemple

```
Starter: $10/mois = 1000 crédits
Pro: $50/mois = 7000 crédits
Enterprise: Custom pricing
```

### Dans ton app

```javascript
// Chaque génération déduit des crédits
const creditsNeeded = totalVideos * 10; // 10 crédits par vidéo

subscription.deductCredits(creditsNeeded);
// Enregistre: creditsRemaining - creditsNeeded
```

---

## 🐛 Dépannage

### "LUMA API Key not configured"

**Cause:** `LUMA_API_KEY` est manquant ou `your_luma_api_key_here`

**Solution:**
```bash
# Vérifie .env
cat .env | grep LUMA_API_KEY

# Doit être:
LUMA_API_KEY=lm_xxxxxxx
```

### "Invalid API Key"

**Cause:** Clé API invalide ou expirée

**Solution:**
```bash
# Régénère la clé sur https://lumalabs.ai
# Mets à jour .env
# Relance l'app
```

### La génération reste en "processing" indéfiniment

**Cause:** LUMA n'a pas terminé, ou la file d'attente est chargée

**Solution:**
```javascript
// Ajoute un timeout et polling
const maxAttempts = 60; // 10 minutes
const checkInterval = 10000; // Check every 10s

for (let i = 0; i < maxAttempts; i++) {
  const status = await providerRouter.checkVideoStatus(jobId, 'luma');
  if (status.state === 'completed') {
    return status.assets.video;
  }
  await new Promise(r => setTimeout(r, checkInterval));
}
throw new Error('Generation timeout');
```

### Vidéos de test en développement

Si tu n'as pas ta clé API, le mode développement utilise des vidéos de démo:

```bash
NODE_ENV=development npm run dev
# → Genère automatiquement des vidéos de fallback
```

---

## ✅ Checklist avant le lancement

- [ ] Créé un compte LUMA
- [ ] Demandé l'accès API
- [ ] Copié la clé `lm_xxxxx`
- [ ] Mis à jour `.env` avec `LUMA_API_KEY`
- [ ] Relancé le serveur backend
- [ ] Testé la génération via l'interface
- [ ] Testé via API (curl)
- [ ] Vérifies que seul LUMA est actif au démarrage
- [ ] Sauvegardé `.env` en sécurité (jamais en GitHub)

---

## 📚 Ressources

- **LUMA AI:** https://lumalabs.ai
- **API Docs:** https://lumalabs.ai/dream-machine
- **Changelog:** [CHANGELOG_VEO_SORA.md](./CHANGELOG_VEO_SORA.md)
- **Architecture:** [VEO_SORA_SETUP_GUIDE.md](./VEO_SORA_SETUP_GUIDE.md)

---

**Tu as maintenant une app prête à générer des vidéos cinématiques avec LUMA! 🎬🚀**

Quand tu auras accès à SORA/VEO, c'est juste un décomment et un changement de clé API.

Vive la stratégie startup! 🧠🔥
