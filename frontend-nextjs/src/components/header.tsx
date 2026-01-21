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
                    <div className="hidden items-center space-x-4 md:flex">
                        {isAuthenticated && user ? (
                            <>
                                {/* Dashboard Link */}
                                <Link
                                    href={dashboardLinks[user.role] || "/dashboard"}
                                    className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>

                                {/* User Menu */}
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                                        {user.nombre.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">
                                            {user.nombre}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                                        title="Cerrar sesión"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                >
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                                >
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="border-t py-4 md:hidden">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-2 rounded-lg px-4 py-2 ${isActive
                                                ? "bg-primary-50 text-primary-600"
                                                : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-4 space-y-2 border-t pt-4">
                            {isAuthenticated && user ? (
                                <>
                                    <Link
                                        href={dashboardLinks[user.role] || "/dashboard"}
                                        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-white"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="flex w-full justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2 text-white"
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
