import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/'];

// Rutas protegidas que REQUIEREN autenticación
const PROTECTED_ROUTES = ['/dashboard'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Obtener token de NextAuth
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // Si está en una ruta protegida sin token, redirigir a login
    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Si está en login con token válido, redirigir al dashboard según su rol
    if (pathname === '/login' && token) {
        const role = (token.role as string) || '';
        let target = '/dashboard/estudiantes';
        if (role === 'admin' || role === 'administrator') {
            target = '/dashboard/admin';
        } else if (role === 'teacher' || role === 'docente') {
            target = '/dashboard/docentes';
        } else if (role === 'parent' || role === 'padre' || role === 'padre_familia') {
            target = '/dashboard/padres';
        }
        return NextResponse.redirect(new URL(target, request.url));
    }

    return NextResponse.next();
}

// Configurar qué rutas debe verificar el middleware
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icon-192.png).*)',
    ],
};
