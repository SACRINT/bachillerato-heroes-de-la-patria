'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function AuthSync() {
    const { data: session, status } = useSession();
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Sync session user to Zustand store
            setUser({
                id: (session.user as any).id || '0',
                email: session.user.email || '',
                name: session.user.name || 'Usuario', // This will now have the full name from route.ts
                role: (session.user as any).role || 'estudiante',
                avatar_url: session.user.image || undefined
            });

            // Sync access token if available
            if ((session.user as any).accessToken) {
                setToken((session.user as any).accessToken);
            }
        } else if (status === 'unauthenticated') {
            // Optional: clear store if session is gone
            // logout(); 
            // Commented out to prevent aggressive clearing if checking auth
        }
    }, [session, status, setUser, setToken]);

    return null;
}
