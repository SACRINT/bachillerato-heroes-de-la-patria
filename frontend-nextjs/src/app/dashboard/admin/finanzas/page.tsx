'use client';

import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';

export default function FinanzasAdminPage() {
    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión Financiera</h1>
                    <p className="text-gray-500">Administra pagos, colegiaturas e ingresos</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Ingresos del Mes</p>
                                <p className="text-2xl font-bold text-emerald-600">$485,000</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pagos Pendientes</p>
                                <p className="text-2xl font-bold text-orange-600">$125,000</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pagos al Día</p>
                                <p className="text-2xl font-bold text-blue-600">87%</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                        <CreditCard className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistema Financiero Completo
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                        El módulo financiero completo estará disponible próximamente con gestión de pagos,
                        generación de recibos, reportes financieros y más.
                    </p>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
