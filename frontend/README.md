# Video SaaS Frontend

Interface utilisateur Next.js 14 pour la plateforme Video SaaS.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Lancement

```bash
# Développement
npm run dev

# Build production
npm run build

# Serveur production
npm start
```

## Structure

```
app/
├── login/         # Authentification
├── register/      # Inscription
├── dashboard/     # Dashboard principal
├── generate/      # Génération de vidéos
├── settings/      # Paramètres OAuth
└── page.tsx       # Landing page

components/        # Composants réutilisables
services/          # Services API
```

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios
