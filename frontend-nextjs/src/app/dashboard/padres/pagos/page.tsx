'use client';

import { DollarSign, CreditCard, Clock, CheckCircle2, FileText } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import { usePendingPayments } from '@/hooks/useParents';

export default function PagosPage() {
    const { data: paymentsData, isLoading } = usePendingPayments();

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pagos y Colegiaturas</h1>
                    <p className="text-gray-500">Consulta y realiza pagos de colegiaturas y servicios</p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Saldo Pendiente</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    ${isLoading ? '...' : '0.00'}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pagos al Corriente</p>
                                <p className="text-2xl font-bold text-emerald-600">0</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Recibos</p>
                                <p className="text-2xl font-bold text-blue-600">0</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                        <DollarSign className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistema de Pagos en Línea
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                        Próximamente podrás realizar pagos de colegiaturas y servicios escolares directamente
                        desde el portal con tarjeta de crédito, débito u OXXO Pay.
                    </p>

                    {/* Features Preview */}
                    <div className="grid gap-4 md:grid-cols-3 w-full max-w-2xl mt-4">
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <CreditCard className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Pago con Tarjeta</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Visa, Mastercard, AMEX
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">OXXO Pay</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Paga en efectivo en OXXO
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <CheckCircle2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Recibos Digitales</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Descarga tus comprobantes
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">
                                ¿Tienes dudas sobre pagos?
                            </h3>
                            <p className="text-sm text-blue-800">
                                Por el momento, los pagos se realizan de manera presencial en la caja de la institución.
                                Para más información, contacta al departamento de administración.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
