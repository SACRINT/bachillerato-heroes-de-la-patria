import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        // Credentials (Email & Password)
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email y contraseña son requeridos');
                }

                try {
                    const response = await fetch(
                        `${BACKEND_URL}/api/auth/login`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: credentials.email,
                                password: credentials.password,
                            }),
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Credenciales inválidas');
                    }

                    const data = await response.json();

                    return {
                        id: data.user.id.toString(),
                        email: data.user.email,
                        name: `${data.user.nombre} ${data.user.apellido_paterno || ''}`.trim() || data.user.username,
                        role: data.user.role || data.user.tipo_usuario || 'estudiante',
                        accessToken: data.token || data.tokens?.accessToken,
                    };
                } catch (error: any) {
                    if (error.message.includes('fetch') || error.cause?.code === 'ECONNREFUSED') {
                        throw new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
                    }

                    throw new Error(error.message || 'Error al iniciar sesión');
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.accessToken = (user as any).accessToken;
            }

            // Google OAuth
            if (account?.provider === 'google') {
                try {
                    const response = await fetch(
                        `${BACKEND_URL}/api/auth/google`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: token.email,
                                name: token.name,
                                picture: token.picture,
                                googleId: token.sub,
                            }),
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        token.accessToken = data.token || data.tokens?.accessToken;
                        token.role = data.user?.role || 'estudiante';
                        token.id = data.user?.id;
                    }
                } catch (error) {}
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).accessToken = token.accessToken;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: false,
};
