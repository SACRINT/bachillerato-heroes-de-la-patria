import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    name: string; // Mapped from nombre + apellido_paterno
    role: 'student' | 'teacher' | 'parent' | 'admin';
    avatar_url?: string;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email: string, password: string) => {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password }),
                        }
                    );

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Error al iniciar sesión');
                    }

                    const data = await response.json();

                    // Map backend user to frontend User interface
                    const mappedUser: User = {
                        id: data.user.id,
                        email: data.user.email,
                        name: `${data.user.nombre} ${data.user.apellido_paterno || ''}`.trim(),
                        role: data.user.role,
                        avatar_url: data.user.avatar_url
                    };

                    set({
                        user: mappedUser,
                        token: data.token,
                        isAuthenticated: true,
                    });

                    // Save to localStorage for api-client
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('auth_token', data.token);
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    throw error;
                }
            },

            register: async (userData: any) => {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData),
                        }
                    );

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Error al registrarse');
                    }

                    const data = await response.json();

                    // Auto-login after registration
                    if (data.token) {
                        const mappedUser: User = {
                            id: data.user.id,
                            email: data.user.email,
                            name: `${data.user.nombre} ${data.user.apellido_paterno || ''}`.trim(),
                            role: data.user.role,
                            avatar_url: data.user.avatar_url
                        };

                        set({
                            user: mappedUser,
                            token: data.token,
                            isAuthenticated: true,
                        });

                        if (typeof window !== 'undefined') {
                            localStorage.setItem('auth_token', data.token);
                        }
                    }
                } catch (error) {
                    console.error('Register error:', error);
                    throw error;
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                }
            },

            setUser: (user: User) => set({ user, isAuthenticated: true }),
            setToken: (token: string) => {
                set({ token, isAuthenticated: true });
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                }
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
