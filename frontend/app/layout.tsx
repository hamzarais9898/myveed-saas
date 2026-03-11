import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Chatbot from '@/components/Chatbot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: {
        default: 'MAVEED | Créez des Vidéos Virales avec l\'IA en 1 Clic (Shorts, TikTok, Reels)',
        template: '%s | MAVEED - #1 Automatisaton Vidéo IA'
    },
    description: 'Générez automatiquement des Shorts, Reels et TikTok viraux. Transformez vos liens YouTube en vidéos, clonez votre voix, et utilisez des avatars IA. Essai gratuit sans carte.',
    keywords: [
        'IA vidéo', 'générer des vidéos IA', 'YouTube to Shorts IA', 'créateur de reels automatique',
        'sous-titres vidéos IA', 'montage vidéo automatique', 'automatisation TikTok',
        'TikTok marketing IA', 'Intelligence Artificielle vidéo', 'MAVEED',
        'créer des vidéos virales', 'IA voix off française', 'text to speech français',
        'monétisation TikTok IA', 'video creator AI', 'TikTok automation tool',
        'deepfake', 'liens youtube vers shorts', 'automatisation réseaux sociaux',
        'montage vidéo ia gratuit', 'auto-caption', 'subtitles AI', 'influenceur IA', 'clone vocal'
    ],
    authors: [{ name: 'MAVEED', url: 'https://maveed.io' }],
    creator: 'MAVEED Team',
    publisher: 'MAVEED',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://maveed.io'),
    alternates: {
        canonical: '/',
        languages: {
            'fr-FR': '/fr',
            'en-US': '/en',
            'ar-MA': '/ar',
        },
    },
    openGraph: {
        title: 'MAVEED | Créez des Vidéos Virales avec l\'IA en 1 Clic',
        description: 'Générez automatiquement des Shorts, Reels et TikTok viraux. Transformez vos liens YouTube en vidéos, clonez votre voix, et utilisez des avatars IA. Essai gratuit sans carte.',
        url: 'https://maveed.io',
        siteName: 'MAVEED',
        images: [
            {
                url: '/images/og-image.png',
                width: 1200,
                height: 630,
                alt: 'MAVEED AI Video Platform',
            },
        ],
        locale: 'fr_FR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MAVEED | Créez des Vidéos Virales avec l\'IA en 1 Clic',
        description: 'Générez automatiquement des Shorts, Reels et TikTok viraux. Transformez vos liens YouTube en vidéos, clonez votre voix, et utilisez des avatars IA.',
        images: ['/images/og-image.png'],
        creator: '@dawer_ma',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'google-site-verification-id', // User should update this
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Chatbot />
                </Providers>
            </body>
        </html>
    );
}
