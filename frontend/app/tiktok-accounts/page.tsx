'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TikTokAccountsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/platforms');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
