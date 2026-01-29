'use client';

import { Settings, Save, Bell, Lock, Mail, Globe } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';

export default function ConfiguracionAdminPage() {
    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
                    <p className="text-gray-500">Administra las configuraciones generales</p>
                </div>

                {/* Settings Categories */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">General</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Configuración básica del sistema, nombre de la institución, logo, etc.
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                <Mail className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Configuración de servidor SMTP y plantillas de correo electrónico.
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                <Bell className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Gestiona las notificaciones automáticas y alertas del sistema.
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                <Lock className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Configuración de políticas de seguridad, contraseñas y accesos.
                        </p>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                        <Settings className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Panel de Configuración Completo
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                        El panel de configuración completo estará disponible próximamente con todas las opciones
                        para personalizar el sistema según las necesidades de tu institución.
                    </p>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
