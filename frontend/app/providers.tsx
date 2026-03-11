'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/components/ThemeProvider';

import { LanguageProvider } from '@/context/LanguageContext';

import { ToastProvider } from '@/context/ToastContext';
import { ScheduledTasksProvider } from '@/context/ScheduledTasksContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <ToastProvider>
                <ScheduledTasksProvider>
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
                        <ThemeProvider>
                            {children}
                        </ThemeProvider>
                    </GoogleOAuthProvider>
                </ScheduledTasksProvider>
            </ToastProvider>
        </LanguageProvider>
    );
}
