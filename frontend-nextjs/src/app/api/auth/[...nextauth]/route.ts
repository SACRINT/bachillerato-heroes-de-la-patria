import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

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
                    // Call backend login endpoint
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
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
                        const error = await response.json();
                        throw new Error(error.message || 'Credenciales inválidas');
                    }

                    const data = await response.json();

                    // Return user object
                    return {
                        id: data.user.id.toString(),
                        email: data.user.email,
                        name: data.user.nombre || data.user.name,
                        role: data.user.role || data.user.tipo_usuario || 'student',
                        accessToken: data.token,
                    };
                } catch (error: any) {
                    console.error('Login error:', error);
                    throw new Error(error.message || 'Error al iniciar sesión');
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.accessToken = (user as any).accessToken;
            }

            // Google OAuth
            if (account?.provider === 'google') {
                // Call backend to create/get user from Google
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
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
                        token.accessToken = data.token;
                        token.role = data.user.role || 'student';
                        token.id = data.user.id;
                    }
                } catch (error) {
                    console.error('Google auth backend error:', error);
                }
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
