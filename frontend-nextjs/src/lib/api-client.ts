import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // Aumentado para mejor estabilidad
});

// Request interceptor - Add NextAuth token
apiClient.interceptors.request.use(
    async (config) => {
        if (typeof window !== 'undefined') {
            const session = await getSession();
            if (session?.user?.accessToken) {
                config.headers.Authorization = `Bearer ${session.user.accessToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[API Client] Error:', error.response?.status, error.message);

        // NO redirigir automáticamente a login - dejar que NextAuth middleware lo maneje
        // Esto previene loops de redirección

        if (error.response?.status === 401) {
            console.warn('[API Client] 401 Unauthorized - Session may be invalid');
            // Solo loggear, NO redirigir
        }

        return Promise.reject(error);
    }
);

export default apiClient;
