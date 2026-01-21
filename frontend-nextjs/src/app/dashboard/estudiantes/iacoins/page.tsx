'use client';

import { Trophy, Sparkles, Crown, TrendingUp, Award, Star } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function IACoinsPage() {
    const stats = [
        {
            title: 'Total IA Coins',
            value: '2,450',
            icon: Trophy,
            trend: { value: 15.0, isPositive: true },
            iconColor: 'text-yellow-600',
            iconBgColor: 'bg-yellow-100',
        },
        {
            title: 'Ranking Global',
            value: '#12',
            icon: Crown,
            trend: { value: 5.0, isPositive: true },
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
        {
            title: 'Racha Actual',
            value: '12 días',
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Logros Desbloqueados',
            value: '18/50',
            icon: Award,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
    ];

    const storeItems = [
        {
            id: 1,
            nombre: 'Avatar Legendario',
            precio: 500,
            rareza: 'legendario',
            tipo: 'avatar',
        },
        {
            id: 2,
            nombre: 'Boost de XP x2',
            precio: 200,
            rareza: 'raro',
            tipo: 'boost',
        },
        {
            id: 3,
            nombre: 'Tema Dark Premium',
            precio: 150,
            rareza: 'raro',
            tipo: 'tema',
        },
        {
            id: 4,
            nombre: 'Entrada Cine',
            precio: 1000,
            rareza: 'epico',
            tipo: 'premio',
        },
        {
            id: 5,
            nombre: 'Tarjeta Regalo $100',
            precio: 2000,
            rareza: 'legendario',
            tipo: 'premio',
        },
        {
            id: 6,
            nombre: 'Pase VIP Mensual',
            precio: 800,
            rareza: 'epico',
            tipo: 'suscripcion',
        },
    ];

    const recentTransactions = [
        { tipo: 'ganancia', descripcion: 'Examen perfecto en Matemáticas', coins: +100 },
        { tipo: 'gasto', descripcion: 'Compra: Boost de XP x2', coins: -200 },
        { tipo: 'ganancia', descripcion: 'Racha de 7 días completada', coins: +50 },
        { tipo: 'ganancia', descripcion: 'Tarea entregada a tiempo', coins: +25 },
    ];

    const leaderboard = [
        { posicion: 1, nombre: 'Carlos Martínez', coins: 5420, avatar: 'C' },
        { posicion: 2, nombre: 'Ana López', coins: 4890, avatar: 'A' },
        { posicion: 3, nombre: 'Juan Pérez', coins: 3750, avatar: 'J' },
        { posicion: 12, nombre: 'Tú', coins: 2450, avatar: 'T', isUser: true },
    ];

    const getRarezaColor = (rareza: string) => {
        switch (rareza) {
            case 'legendario':
                return 'from-yellow-400 to-orange-500';
            case 'epico':
                return 'from-purple-400 to-pink-500';
            case 'raro':
                return 'from-blue-400 to-cyan-500';
            default:
                return 'from-gray-400 to-gray-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white md:p-8">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-12 w-12" />
                        <div>
                            <h1 className="text-3xl font-bold md:text-4xl">IA Coins</h1>
                            <p className="mt-2 text-yellow-100">
                                Gana, compite y canjea por premios reales
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Store - Takes 2 columns */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                <Sparkles className="mb-1 inline h-5 w-5 text-yellow-600" /> Tienda
                            </h2>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                Ver todo →
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {storeItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="overflow-hidden rounded-lg border border-gray-200 transition-all hover:scale-105 hover:shadow-lg"
                                >
                                    <div
                                        className={`h-32 bg-gradient-to-br ${getRarezaColor(item.rareza)} p-4`}
                                    >
                                        <div className="flex h-full items-center justify-center">
                                            <Star className="h-16 w-16 text-white" />
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="mb-2 font-semibold text-gray-900">
                                            {item.nombre}
                                        </div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${item.rareza === 'legendario'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : item.rareza === 'epico'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                            >
                                                {item.rareza}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-yellow-600">
                                                <Trophy className="h-4 w-4" />
                                                {item.precio}
                                            </span>
                                        </div>
                                        <button className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                            Comprar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Transactions */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">Movimientos Recientes</h3>
                            <div className="space-y-3">
                                {recentTransactions.map((tx, index) => (
                                    <div key={index} className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-900">
                                                {tx.descripcion}
                                            </div>
                                        </div>
                                        <div
                                            className={`font-semibold ${tx.tipo === 'ganancia'
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                                }`}
                                        >
                                            {tx.coins > 0 ? '+' : ''}
                                            {tx.coins}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">
                                <Crown className="mb-1 inline h-5 w-5 text-yellow-600" /> Top Rankings
                            </h3>
                            <div className="space-y-3">
                                {leaderboard.map((entry) => (
                                    <div
                                        key={entry.posicion}
                                        className={`flex items-center gap-3 rounded-lg p-2 ${entry.isUser ? 'bg-blue-50' : 'bg-gray-50'
                                            }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${entry.posicion === 1
                                                    ? 'bg-yellow-500 text-white'
                                                    : entry.posicion === 2
                                                        ? 'bg-gray-400 text-white'
                                                        : entry.posicion === 3
                                                            ? 'bg-orange-600 text-white'
                                                            : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {entry.posicion <= 3 ? (
                                                <Crown className="h-4 w-4" />
                                            ) : (
                                                entry.posicion
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div
                                                className={`text-sm font-medium ${entry.isUser ? 'text-blue-900' : 'text-gray-900'
                                                    }`}
                                            >
                                                {entry.nombre}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
                                            <Trophy className="h-4 w-4" />
                                            {entry.coins}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
