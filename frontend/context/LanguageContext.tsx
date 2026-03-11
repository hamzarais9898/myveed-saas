'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import fr from '../translations/fr.json';
import en from '../translations/en.json';

import es from '../translations/es.json';
import de from '../translations/de.json';
import ar from '../translations/ar.json';

type Language = 'fr' | 'en' | 'es' | 'de' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, params?: Record<string, any>) => any;
}

const translations: Record<Language, any> = { fr, en, es, de, ar };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('fr');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && ['fr', 'en', 'es', 'de', 'ar'].includes(savedLang)) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    const t = (path: string, params?: Record<string, any>): any => {
        const keys = path.split('.');
        let result = translations[language];
        for (const key of keys) {
            if (result && result[key] !== undefined) {
                result = result[key];
            } else {
                return path; // Fallback to key name
            }
        }

        if (typeof result === 'string' && params) {
            let interpolated = result;
            Object.keys(params).forEach(key => {
                interpolated = interpolated.replace(`{${key}}`, params[key]);
            });
            return interpolated;
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
