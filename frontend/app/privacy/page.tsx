'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-black text-gray-900 mb-8">Politique de Confidentialité</h1>
                <div className="prose prose-lg text-gray-600">
                    <p className="mb-6">
                        Chez MAVEED, nous accordons une grande importance à la confidentialité de vos données. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Collecte des Données</h2>
                    <p className="mb-4">
                        Nous collectons les informations que vous nous fournissez lors de votre inscription (nom, email) ainsi que les données relatives à votre utilisation de nos services (vidéos générées, historique).
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Utilisation des Données</h2>
                    <p className="mb-4">
                        Vos données sont utilisées pour fournir et améliorer nos services, gérer votre compte, traiter vos paiements et vous communiquer des informations importantes. Nous ne vendons pas vos données à des tiers.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Sécurité des Données</h2>
                    <p className="mb-4">
                        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou altération.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Partage avec des Tiers</h2>
                    <p className="mb-4">
                        Nous pouvons partager certaines données avec des prestataires de services tiers (hébergement, paiement) uniquement dans le but de fournir nos services. Ces tiers sont tenus de respecter la confidentialité de vos données.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Vos Droits</h2>
                    <p className="mb-4">
                        Conformément à la réglementation, vous disposez d&apos;un droit d&apos;accès, de modification et de suppression de vos données personnelles. Vous pouvez exercer ces droits en nous contactant.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Cookies</h2>
                    <p className="mb-4">
                        Nous utilisons des cookies pour améliorer votre expérience utilisateur et analyser le trafic sur notre site. Vous pouvez gérer vos préférences en matière de cookies dans les paramètres de votre navigateur.
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
