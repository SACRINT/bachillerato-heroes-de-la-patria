'use client';

import { BarChart, TrendingUp, PieChart, LineChart } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';

export default function AnalyticsAdminPage() {
    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analíticas y Estadísticas</h1>
                    <p className="text-gray-500">Visualiza métricas y tendencias del sistema</p>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-blue-100">
                        <BarChart className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistema de Analíticas Avanzadas
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                        El módulo de analíticas avanzadas estará disponible próximamente con dashboards interactivos,
                        gráficos en tiempo real y análisis predictivo.
                    </p>

                    {/* Feature Preview */}
                    <div className="grid gap-4 md:grid-cols-3 w-full max-w-2xl mt-4">
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Tendencias</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Análisis de patrones
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <PieChart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Distribuciones</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Gráficos circulares
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <LineChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Comparativas</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Métricas históricas
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
