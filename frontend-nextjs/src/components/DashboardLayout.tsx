'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Award,
    Bell,
    BookOpen,
    Bot,
    Calendar,
    ChevronDown,
    CreditCard,
    FileText,
    Home,
    LogOut,
    Menu,
    MessageSquare,
    Settings,
    Trophy,
    User,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { signOut } from 'next-auth/react';

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const studentNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/estudiantes', icon: Home },
    { label: 'Calificaciones', href: '/dashboard/estudiantes/calificaciones', icon: BookOpen },
    { label: 'Tareas', href: '/dashboard/estudiantes/tareas', icon: FileText },
    { label: 'Horario', href: '/dashboard/estudiantes/horario', icon: Calendar },
    { label: 'IA Coins', href: '/dashboard/estudiantes/iacoins', icon: Trophy },
    { label: 'Tutor IA', href: '/dashboard/estudiantes/tutor-ia', icon: Bot },
    { label: 'Pagos', href: '/dashboard/estudiantes/pagos', icon: CreditCard },
    { label: 'Logros', href: '/dashboard/estudiantes/logros', icon: Award },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        logout(); // Limpia estado de Zustand
        await signOut({ callbackUrl: '/login' }); // Limpia cookie de NextAuth y redirige
    };


    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-slate-900 to-blue-900 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
                            <span className="text-xl font-bold text-white">BGE</span>
                        </div>
                        <span className="text-lg font-semibold text-white">Estudiantes</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-white lg:hidden"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {studentNavItems.map((item) => {
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

                {/* User Info */}
                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-bold text-slate-900">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium text-white">
                                {user?.name || 'Usuario'}
                            </div>
                            <div className="truncate text-xs text-slate-400">Estudiante</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-600 lg:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button
                            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                            aria-label="Notificaciones"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-1 top-1 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg">
                                    <div className="border-b px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user?.name || 'Usuario'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user?.email || ''}
                                        </div>
                                    </div>
                                    <div className="p-1">
                                        <Link
                                            href="/dashboard/estudiantes/perfil"
                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="h-4 w-4" />
                                            Mi Perfil
                                        </Link>
                                        <Link
                                            href="/dashboard/estudiantes/configuracion"
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

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div >
        </div >
    );
}
