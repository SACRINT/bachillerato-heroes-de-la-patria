'use client';

import {
    Calendar,
    Plus,
    FileText,
    MoreHorizontal,
    Clock,
    CheckSquare,
    Layout,
    Book,
    Search
} from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useState } from 'react';

export default function PlaneacionPage() {
    const [activeTab, setActiveTab] = useState('planes');

    const planes = [
        {
            id: 1,
            titulo: 'Unidad 1: Ecuaciones Lineales',
            materia: 'Matemáticas III',
            duracion: '3 Semanas',
            estado: 'activo',
            actividades: 12,
            progreso: 65,
            ultimaModificacion: '15 Ene 2026'
        },
        {
            id: 2,
            titulo: 'Unidad 2: Matrices',
            materia: 'Álgebra Lineal',
            duracion: '4 Semanas',
            estado: 'borrador',
            actividades: 8,
            progreso: 0,
            ultimaModificacion: '10 Ene 2026'
        },
        {
            id: 3,
            titulo: 'Introducción al Cálculo',
            materia: 'Cálculo Diferencial',
            duracion: '2 Semanas',
            estado: 'programado',
            actividades: 5,
            progreso: 0,
            ultimaModificacion: '18 Ene 2026'
        }
    ];

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Planeación Académica</h1>
                        <p className="text-gray-500">Organiza tus lecciones, recursos y evaluaciones</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        Nuevo Plan
                    </button>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('planes')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'planes' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Planes de Clase
                        </button>
                        <button
                            onClick={() => setActiveTab('recursos')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'recursos' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Recursos
                        </button>
                        <button
                            onClick={() => setActiveTab('evaluaciones')}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'evaluaciones' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Evaluaciones
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {planes.map((plan) => (
                        <div key={plan.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="mb-4 flex items-start justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.materia.includes('Matemáticas') ? 'bg-blue-100 text-blue-600' :
                                        plan.materia.includes('Álgebra') ? 'bg-purple-100 text-purple-600' :
                                            'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    <Layout className="h-5 w-5" />
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>

                            <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-blue-600">
                                {plan.titulo}
                            </h3>
                            <p className="mb-4 text-sm text-gray-500">{plan.materia}</p>

                            <div className="mb-4 space-y-2 border-t border-dashed border-gray-200 pt-4">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" /> Duración
                                    </span>
                                    <span className="font-medium">{plan.duracion}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-gray-400" /> Actividades
                                    </span>
                                    <span className="font-medium">{plan.actividades}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" /> Actualizado
                                    </span>
                                    <span className="font-medium">{plan.ultimaModificacion}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${plan.estado === 'activo' ? 'bg-green-100 text-green-700' :
                                        plan.estado === 'borrador' ? 'bg-gray-100 text-gray-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {plan.estado.charAt(0).toUpperCase() + plan.estado.slice(1)}
                                </span>
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Editar Plan →
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder Card */}
                    <button className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Crear Nuevo Plan</span>
                    </button>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
