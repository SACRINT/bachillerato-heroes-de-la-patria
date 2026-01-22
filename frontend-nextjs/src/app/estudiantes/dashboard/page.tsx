'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentApiClient } from '@/lib/student-api-client';
import {
    useStudentProfile,
    useStudentGrades,
    useStudentAssignments,
} from '@/hooks/use-student-api';
import { BookOpen, Award, Clock, LogOut } from 'lucide-react';

export default function StudentDashboardPage() {
    const router = useRouter();

    // Verificar autenticación
    useEffect(() => {
        if (!studentApiClient.isAuthenticated()) {
            router.push('/estudiantes/login');
        }
    }, [router]);

    // Fetch data usando hooks nuevos
    const { data: profile, isLoading: profileLoading } = useStudentProfile();
    const { data: grades, isLoading: gradesLoading } = useStudentGrades();
    const { data: assignments, isLoading: assignmentsLoading } =
        useStudentAssignments('pendiente');

    const handleLogout = () => {
        studentApiClient.logout();
    };

    if (profileLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                ¡Hola, {profile?.nombre}!
                            </h1>
                            <p className="text-sm text-gray-600">
                                Matrícula: {profile?.matricula} • {profile?.grado} {profile?.grupo}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Calificaciones */}
                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-3">
                                <Award className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Calificaciones
                            </h2>
                        </div>
                        {gradesLoading ? (
                            <p className="text-sm text-gray-600">Cargando...</p>
                        ) : grades && grades.length > 0 ? (
                            <div className="space-y-2">
                                {grades.slice(0, 5).map((grade: any) => (
                                    <div
                                        key={grade.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                                    >
                                        <span className="text-sm font-medium text-gray-700">
                                            {grade.materia}
                                        </span>
                                        <span className="text-sm font-bold text-blue-600">
                                            {grade.calificacion}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No hay calificaciones disponibles
                            </p>
                        )}
                    </div>

                    {/* Tareas Pendientes */}
                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-orange-100 p-3">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Tareas Pendientes
                            </h2>
                        </div>
                        {assignmentsLoading ? (
                            <p className="text-sm text-gray-600">Cargando...</p>
                        ) : assignments && assignments.length > 0 ? (
                            <div className="space-y-2">
                                {assignments.slice(0, 5).map((assignment: any) => (
                                    <div
                                        key={assignment.id}
                                        className="rounded-lg border border-gray-200 p-3"
                                    >
                                        <p className="text-sm font-medium text-gray-700">
                                            {assignment.titulo}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {assignment.materia} • Entrega:{' '}
                                            {new Date(
                                                assignment.fechaEntrega
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                ¡No tienes tareas pendientes!
                            </p>
                        )}
                    </div>

                    {/* Accesos Rápidos */}
                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-3">
                                <BookOpen className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Accesos Rápidos
                            </h2>
                        </div>
                        <div className="space-y-2">
                            <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                Ver Horario
                            </button>
                            <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                Mis Calificaciones Completas
                            </button>
                            <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                Mis Tareas
                            </button>
                            <button className="w-full rounded-lg border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                                Notificaciones
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-6 rounded-lg bg-blue-50 p-6">
                    <h3 className="mb-2 font-semibold text-blue-900">
                        ✅ Sistema de Autenticación Activo
                    </h3>
                    <p className="text-sm text-blue-700">
                        Tu sesión está protegida con JWT almacenado en localStorage.
                        Token: {studentApiClient.getToken()?.substring(0, 20)}...
                    </p>
                </div>
            </main>
        </div>
    );
}
