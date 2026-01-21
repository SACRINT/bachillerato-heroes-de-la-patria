"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Loader2 } from "lucide-react";

export default function DashboardEstudiantesPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        } else if (user && user.role !== "student") {
            // Redirect to appropriate dashboard
            router.push(`/dashboard/${user.role === "teacher" ? "docentes" : user.role === "admin" ? "admin" : "padres"}`);
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
                <div className="container py-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold">
                                ¡Hola, {user.nombre}! 👋
                            </h1>
                            <p className="text-primary-100">
                                Bienvenido a tu portal de estudiante
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="rounded-lg bg-white/10 px-6 py-4 backdrop-blur-sm">
                                <div className="text-sm text-primary-100">Nivel Actual</div>
                                <div className="text-2xl font-bold">Nivel 5</div>
                                <div className="mt-2 h-2 w-32 rounded-full bg-white/20">
                                    <div className="h-full w-3/4 rounded-full bg-white"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container py-8">
                {/* Stats Cards */}
                <div className="mb-8 grid gap-6 md:grid-cols-4">
                    <div className="card">
                        <div className="mb-2 text-sm font-medium text-gray-600">
                            Promedio General
                        </div>
                        <div className="text-3xl font-bold text-primary-600">8.5</div>
                        <div className="mt-1 text-xs text-green-600">↑ +0.3 este mes</div>
                    </div>

                    <div className="card">
                        <div className="mb-2 text-sm font-medium text-gray-600">
                            Tareas Pendientes
                        </div>
                        <div className="text-3xl font-bold text-orange-600">5</div>
                        <div className="mt-1 text-xs text-gray-600">3 con fecha próxima</div>
                    </div>

                    <div className="card">
                        <div className="mb-2 text-sm font-medium text-gray-600">
                            Racha de Estudio
                        </div>
                        <div className="text-3xl font-bold text-purple-600">12 días</div>
                        <div className="mt-1 text-xs text-purple-600">🔥 ¡Sigue así!</div>
                    </div>

                    <div className="card">
                        <div className="mb-2 text-sm font-medium text-gray-600">
                            IA Coins
                        </div>
                        <div className="text-3xl font-bold text-yellow-600">2,450</div>
                        <div className="mt-1 text-xs text-gray-600">+150 esta semana</div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Calificaciones */}
                        <div className="card">
                            <h2 className="mb-4 text-xl font-bold">Mis Calificaciones</h2>
                            <div className="space-y-3">
                                {[
                                    { materia: "Matemáticas", cal: 9.0, color: "green" },
                                    { materia: "Física", cal: 8.5, color: "blue" },
                                    { materia: "Química", cal: 8.0, color: "blue" },
                                    { materia: "Inglés", cal: 9.5, color: "green" },
                                    { materia: "Historia", cal: 7.5, color: "yellow" },
                                ].map((item) => (
                                    <div
                                        key={item.materia}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <div className="font-medium">{item.materia}</div>
                                            <div className="text-sm text-gray-500">Parcial 2</div>
                                        </div>
                                        <div
                                            className={`text-2xl font-bold ${item.color === "green"
                                                    ? "text-green-600"
                                                    : item.color === "blue"
                                                        ? "text-blue-600"
                                                        : "text-yellow-600"
                                                }`}
                                        >
                                            {item.cal}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tareas Pendientes */}
                        <div className="card">
                            <h2 className="mb-4 text-xl font-bold">Tareas Pendientes</h2>
                            <div className="space-y-3">
                                {[
                                    {
                                        titulo: "Ensayo sobre la Revolución",
                                        materia: "Historia",
                                        fecha: "25 Ene",
                                        urgente: true,
                                    },
                                    {
                                        titulo: "Ejercicios de Derivadas",
                                        materia: "Matemáticas",
                                        fecha: "28 Ene",
                                        urgente: false,
                                    },
                                    {
                                        titulo: "Laboratorio de Química",
                                        materia: "Química",
                                        fecha: "30 Ene",
                                        urgente: false,
                                    },
                                ].map((tarea, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-gray-300 text-primary-600"
                                            />
                                            <div>
                                                <div className="font-medium">{tarea.titulo}</div>
                                                <div className="text-sm text-gray-500">{tarea.materia}</div>
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${tarea.urgente
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {tarea.fecha}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Horario de Hoy */}
                        <div className="card">
                            <h2 className="mb-4 text-xl font-bold">Horario de Hoy</h2>
                            <div className="space-y-3">
                                {[
                                    { hora: "08:00", materia: "Matemáticas", salon: "A-201" },
                                    { hora: "09:00", materia: "Física", salon: "B-104" },
                                    { hora: "10:00", materia: "Química", salon: "Lab-01" },
                                    { hora: "11:00", materia: "Inglés", salon: "A-305" },
                                ].map((clase, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-600">
                                            {clase.hora}
                                        </div>
                                        <div>
                                            <div className="font-medium">{clase.materia}</div>
                                            <div className="text-sm text-gray-500">{clase.salon}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logros Recientes */}
                        <div className="card">
                            <h2 className="mb-4 text-xl font-bold">Logros Recientes</h2>
                            <div className="space-y-3">
                                {[
                                    { icon: "🏆", nombre: "Racha de 10 días", puntos: "+100" },
                                    { icon: "📚", nombre: "5 Tareas Completadas", puntos: "+50" },
                                    { icon: "⭐", nombre: "Calificación Perfecta", puntos: "+200" },
                                ].map((logro, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 p-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl">{logro.icon}</div>
                                            <div className="font-medium">{logro.nombre}</div>
                                        </div>
                                        <span className="font-bold text-yellow-600">{logro.puntos}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
