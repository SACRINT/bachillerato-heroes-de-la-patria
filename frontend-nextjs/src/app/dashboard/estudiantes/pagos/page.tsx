'use client';

import { CreditCard, DollarSign, CheckCircle, Shield, Clock, Award } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function PaymentsPage() {
    const stats = [
        {
            title: 'Saldo IA Coins',
            value: '2,450',
            icon: Award,
            iconColor: 'text-yellow-600',
            iconBgColor: 'bg-yellow-100',
        },
        {
            title: 'Último Pago',
            value: '$500',
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Estado',
            value: 'Al Corriente',
            icon: CheckCircle,
            iconColor: 'text-green-600',
            iconBgColor: 'bg-green-100',
        },
        {
            title: 'Próximo Vencimiento',
            value: '15 Feb',
            icon: Clock,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
    ];

    const coinPackages = [
        { coins: 500, precio: 50, descuento: 0 },
        { coins: 1200, precio: 100, descuento: 20, popular: true },
        { coins: 2500, precio: 200, descuento: 25 },
        { coins: 5500, precio: 400, descuento: 30 },
    ];

    const vipPlans = [
        {
            nombre: 'VIP Mensual',
            precio: 99,
            periodo: 'mes',
            beneficios: [
                'Boost de XP x2 permanente',
                'Acceso a items exclusivos',
                'Prioridad en la tienda',
                '10% descuento en coins',
            ],
        },
        {
            nombre: 'VIP Trimestral',
            precio: 249,
            periodo: '3 meses',
            beneficios: [
                'Todos los beneficios mensuales',
                'Boost de XP x2.5',
                '15% descuento en coins',
                'Avatar legendario gratis',
            ],
            popular: true,
        },
        {
            nombre: 'VIP Anual',
            precio: 899,
            periodo: 'año',
            beneficios: [
                'Todos los beneficios trimestrales',
                'Boost de XP x3',
                '25% descuento en coins',
                'Acceso VIP de por vida',
            ],
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white md:p-8">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-12 w-12" />
                        <div>
                            <h1 className="text-3xl font-bold md:text-4xl">Pagos y Suscripciones</h1>
                            <p className="mt-2 text-emerald-100">
                                Administra tus compras de IA Coins y planes VIP
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

                {/* IA Coins Packages */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Paquetes de IA Coins
                        </h2>
                        <Shield className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {coinPackages.map((pkg, index) => (
                            <div
                                key={index}
                                className={`relative overflow-hidden rounded-lg border-2 p-6 transition-all hover:scale-105 ${pkg.popular
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 bg-white hover:border-emerald-300'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute right-0 top-0 rounded-bl-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                        Popular
                                    </div>
                                )}
                                <div className="mb-4 text-center">
                                    <div className="mb-2 text-4xl font-bold text-yellow-600">
                                        {pkg.coins}
                                    </div>
                                    <div className="text-sm text-gray-600">IA Coins</div>
                                </div>
                                <div className="mb-4 text-center">
                                    <div className="text-3xl font-bold text-gray-900">
                                        ${pkg.precio}
                                    </div>
                                    {pkg.descuento > 0 && (
                                        <div className="mt-1 text-sm font-semibold text-emerald-600">
                                            ¡{pkg.descuento}% descuento!
                                        </div>
                                    )}
                                </div>
                                <button className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">
                                    Comprar
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span>
                            Pagos seguros procesados con Stripe. Acepta tarjetas y pagos en OXXO.
                        </span>
                    </div>
                </div>

                {/* VIP Plans */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Planes VIP</h2>
                        <p className="mt-2 text-gray-600">
                            Desbloquea beneficios exclusivos y acelera tu progreso
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {vipPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative overflow-hidden rounded-lg border-2 p-6 ${plan.popular
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute right-0 top-0 rounded-bl-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                                        Recomendado
                                    </div>
                                )}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">{plan.nombre}</h3>
                                    <div className="mt-2 flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900">
                                            ${plan.precio}
                                        </span>
                                        <span className="text-gray-600">/ {plan.periodo}</span>
                                    </div>
                                </div>
                                <ul className="mb-6 space-y-3">
                                    {plan.beneficios.map((beneficio, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                                            <span className="text-gray-700">{beneficio}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={`w-full rounded-lg py-3 font-semibold text-white ${plan.popular
                                            ? 'bg-purple-600 hover:bg-purple-700'
                                            : 'bg-gray-600 hover:bg-gray-700'
                                        }`}
                                >
                                    Suscribirme
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
