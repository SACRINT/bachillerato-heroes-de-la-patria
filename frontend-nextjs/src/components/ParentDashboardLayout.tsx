'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
    Home,
    User,
    BookOpen,
    DollarSign,
    MessageSquare,
    Calendar,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface ParentDashboardLayoutProps {
    children: ReactNode;
}

const parentNavItems = [
    { label: 'Inicio', href: '/dashboard/padres', icon: Home },
    { label: 'Mis Hijos', href: '/dashboard/padres/hijos', icon: Users },
    { label: 'Calificaciones', href: '/dashboard/padres/calificaciones', icon: BookOpen },
    { label: 'Pagos', href: '/dashboard/padres/pagos', icon: DollarSign },
    { label: 'Mensajes', href: '/dashboard/padres/mensajes', icon: MessageSquare },
    { label: 'Calendario', href: '/dashboard/padres/calendario', icon: Calendar },
];

export default function ParentDashboardLayout({ children }: ParentDashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-emerald-900 to-teal-900 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
                            <span className="text-xl font-bold text-white">BGE</span>
                        </div>
                        <span className="text-lg font-semibold text-white">Padres</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="text-white lg:hidden" aria-label="Cerrar menú">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {parentNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-bold text-slate-900">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'P'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium text-white">
                                {user?.name || 'Padre/Madre'}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                                {user?.email || 'tutor@bge.edu.mx'}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 lg:hidden" aria-label="Abrir menú">
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Portal de Padres</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Notificaciones">
                            <Bell className="h-5 w-5" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'P'}
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg">
                                    <div className="p-1">
                                        <Link
                                            href="/dashboard/padres/perfil"
                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="h-4 w-4" />
                                            Mi Perfil
                                        </Link>
                                        <Link
                                            href="/dashboard/padres/configuracion"
                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Configuración
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
