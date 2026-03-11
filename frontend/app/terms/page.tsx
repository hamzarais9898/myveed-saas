'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-black text-gray-900 mb-8">Conditions Générales d&apos;Utilisation</h1>
                <div className="prose prose-lg text-gray-600">
                    <p className="mb-6">
                        Bienvenue sur MAVEED . En utilisant notre site web et nos services, vous acceptez les présentes conditions générales d&apos;utilisation. Veuillez les lire attentivement.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Utilisation du Service</h2>
                    <p className="mb-4">
                        MAVEED  est une plateforme d&apos;intelligence artificielle permettant la génération et l&apos;automatisation de vidéos pour les réseaux sociaux. Vous vous engagez à utiliser nos services de manière légale et respectueuse des droits des tiers.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Compte Utilisateur</h2>
                    <p className="mb-4">
                        Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Abonnements et Paiements</h2>
                    <p className="mb-4">
                        Certains services sont payants. En souscrivant à un abonnement, vous acceptez de payer les frais indiqués. Les paiements sont sécurisés et gérés par nos partenaires de paiement.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Propriété Intellectuelle</h2>
                    <p className="mb-4">
                        MAVEED  et son contenu sont protégés par les droits de propriété intellectuelle. Les vidéos que vous générez vous appartiennent, sous réserve du respect des conditions d&apos;utilisation des plateformes tierces.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Limitation de Responsabilité</h2>
                    <p className="mb-4">
                        MAVEED  ne peut être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation de nos services. Nous nous efforçons de fournir un service de qualité, mais nous ne garantissons pas une disponibilité ininterrompue.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Modification des Conditions</h2>
                    <p className="mb-4">
                        Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur le site.
                    </p>

                    <p className="mt-8 text-sm text-gray-500">
                        Dernière mise à jour : 29 Janvier 2026
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
