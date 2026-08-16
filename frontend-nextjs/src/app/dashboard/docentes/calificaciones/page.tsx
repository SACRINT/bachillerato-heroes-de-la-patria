'use client';

import { BookOpen, Search, Filter, Download, ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useTeacherClasses } from '@/hooks/useTeacher';
import { useState } from 'react';

export default function CalificacionesPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('parcial1');
    const [searchTerm, setSearchTerm] = useState('');
    const { data: clasesData, isLoading } = useTeacherClasses();

    // Transformar datos del backend para mostrar en la tabla
    const clasesList = Array.isArray(clasesData) ? clasesData : ((clasesData as any)?.clases || []);
    const grupos = clasesList.map((clase: any) => ({
        id: clase.id,
        materia: clase.materia || clase.nombre,
        grupo: clase.grupo || 'Sin grupo',
        alumnos: clase.total_estudiantes || clase.estudiantes || 0,
        entregadas: clase.calificaciones_entregadas || 0,
        estado: clase.calificaciones_entregadas === clase.total_estudiantes
            ? 'completado'
            : clase.calificaciones_entregadas > 0
                ? 'pendiente'
                : 'no_iniciado',
        promedio: clase.promedio_general ? clase.promedio_general.toFixed(1) : '-',
        fechaCierre: clase.fecha_cierre || new Date().toISOString().split('T')[0]
    }));

    // Filtrar grupos por búsqueda
    const gruposFiltrados = grupos.filter((grupo: any) =>
        grupo.materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.grupo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'completado':
                return (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Completado
                    </span>
                );
            case 'pendiente':
                return (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                        <Clock className="h-3 w-3" /> En Progreso
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        <AlertCircle className="h-3 w-3" /> No Iniciado
                    </span>
                );
        }
    };

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
                        <p className="text-gray-500">Captura y gestiona las evaluaciones de tus grupos</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Exportar Todo
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center lg:p-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar grupo o materia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <select
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            <option value="parcial1">1° Parcial</option>
                            <option value="parcial2">2° Parcial</option>
                            <option value="parcial3">3° Parcial</option>
                            <option value="final">Final</option>
                        </select>
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Filter className="h-4 w-4" />
                            Más Filtros
                        </button>
                    </div>
                </div>

                {/* Groups List */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Materia / Grupo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Progreso</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Promedio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cierre</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Cargando calificaciones...
                                    </td>
                                </tr>
                            ) : gruposFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        {searchTerm ? 'No se encontraron grupos' : 'No tienes grupos asignados'}
                                    </td>
                                </tr>
                            ) : gruposFiltrados.map((grupo: any) => (
                                <tr key={grupo.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{grupo.materia}</div>
                                                <div className="text-sm text-gray-500">{grupo.grupo} • {grupo.alumnos} alumnos</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(grupo.estado)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-full max-w-[140px]">
                                            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                                <span>{grupo.entregadas}/{grupo.alumnos}</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                                    style={{ width: `${grupo.alumnos > 0 ? (grupo.entregadas / grupo.alumnos) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {grupo.promedio}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(grupo.fechaCierre).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900">Capturar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
