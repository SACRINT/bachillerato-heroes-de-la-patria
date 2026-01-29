'use client';

import { MessageSquare, Send, Inbox, Archive } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';

export default function MensajesPage() {
    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
                    <p className="text-gray-500">Comunícate con los docentes y administradores</p>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
                        <MessageSquare className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistema de Mensajería
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                        El sistema de mensajería estará disponible próximamente. Podrás enviar y recibir mensajes
                        de docentes y personal administrativo.
                    </p>

                    {/* Features Preview */}
                    <div className="grid gap-4 md:grid-cols-3 w-full max-w-2xl mt-4">
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <Send className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Mensajes Directos</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Comunícate directamente con los docentes
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <Inbox className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Bandeja de Entrada</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Recibe notificaciones importantes
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <Archive className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Historial</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Consulta mensajes anteriores
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
