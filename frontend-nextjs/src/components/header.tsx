"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
    Home,
    BookOpen,
    Trophy,
    GraduationCap,
    Users,
    Mail,
    Menu,
    X,
    LogOut,
    User,
    LayoutDashboard,
} from "lucide-react";
import { useState } from "react";

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: "Inicio", href: "/", icon: Home },
        { name: "Oferta Educativa", href: "/oferta-educativa", icon: BookOpen },
        { name: "Servicios", href: "/servicios", icon: GraduationCap },
        { name: "Comunidad", href: "/comunidad", icon: Users },
        { name: "Contacto", href: "/contacto", icon: Mail },
    ];

    const dashboardLinks: Record<string, string> = {
        student: "/dashboard/estudiantes",
        teacher: "/dashboard/docentes",
        parent: "/dashboard/padres",
        admin: "/dashboard/admin",
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
            <nav className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                            BGE
                        </div>
                        <span className="hidden font-bold text-gray-900 md:block">
                            Héroes de la Patria
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center space-x-1 md:flex">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-1 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                                        ? "bg-primary-50 text-primary-600"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            href="/"
                            className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                        >
                            Inicio
                        </Link>
                        <Link
                            href="/oferta-educativa"
                            className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                        >
                            Oferta Educativa
                        </Link>
                        <Link
                            href="/nosotros"
                            className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                        >
                            Nosotros
                        </Link>
                        <Link
                            href="/contacto"
                            className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                        >
                            Contacto
                        </Link>
                        <Link
                            href="/inscripciones"
                            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                        >
                            Inscripciones
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden items-center gap-4 md:flex">
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDashboardMenuOpen(!dashboardMenuOpen)}
                                    className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    <span>Mi Portal</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {dashboardMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg">
                                        <Link
                                            href={getDashboardUrl()}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setDashboardMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/dashboard/estudiantes"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setDashboardMenuOpen(false)}
                                        >
                                            Portal Estudiantes
                                        </Link>
                                        <Link
                                            href="/dashboard/docentes"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setDashboardMenuOpen(false)}
                                        >
                                            Portal Docentes
                                        </Link>
                                        <Link
                                            href="/dashboard/padres"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setDashboardMenuOpen(false)}
                                        >
                                            Portal Padres
                                        </Link>
                                        <Link
                                            href="/dashboard/admin"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setDashboardMenuOpen(false)}
                                        >
                                            Portal Admin
                                        </Link>
                                        <div className="border-t">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setDashboardMenuOpen(false);
                                                }}
                                                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t py-4 md:hidden">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/"
                                className="text-sm font-medium text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/oferta-educativa"
                                className="text-sm font-medium text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Oferta Educativa
                            </Link>
                            <Link
                                href="/nosotros"
                                className="text-sm font-medium text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Nosotros
                            </Link>
                            <Link
                                href="/contacto"
                                className="text-sm font-medium text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Contacto
                            </Link>
                            <Link
                                href="/inscripciones"
                                className="font-semibold text-emerald-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Inscripciones
                            </Link>
                            <div className="my-2 border-t"></div>
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href={getDashboardUrl()}
                                        className="text-sm font-medium text-blue-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Mi Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="text-left text-sm font-medium text-red-600"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-gray-700"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-sm font-semibold text-blue-600"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
