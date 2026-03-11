'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { register, googleLogin } from '@/services/authService';

export default function RegisterPage() {
    const router = useRouter();

    // Redirect to unified auth page
    if (typeof window !== 'undefined') {
        router.push('/login');
    }

    return null;
}
