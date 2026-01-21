'use client';

import Link from 'next/link';
import {
    ArrowRight,
    BookOpen,
    Trophy,
    Sparkles,
    Users,
    Target,
    TrendingUp,
    Award,
    Zap,
    Brain,
    Rocket,
    BarChart3,
    GraduationCap,
    Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 6);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: Brain,
            title: 'IA Adaptativa',
            description: 'Rutas de aprendizaje personalizadas que se adaptan a tu ritmo',
            color: 'from-blue-600 to-cyan-500',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Trophy,
            title: 'Gamificación Total',
            description: 'Gana XP, desbloquea logros y compite en torneos',
            color: 'from-emerald-600 to-teal-500',
            bgColor: 'bg-emerald-50',
        },
        {
            icon: Sparkles,
            title: 'Tutor IA 24/7',
            description: 'Asistente inteligente siempre disponible',
            color: 'from-cyan-600 to-blue-500',
            bgColor: 'bg-cyan-50',
        },
        {
            icon: Users,
            title: 'Colaboración',
            description: 'Trabaja en equipo con compañeros y docentes',
            color: 'from-teal-600 to-emerald-500',
            bgColor: 'bg-teal-50',
        },
        {
            icon: BarChart3,
            title: 'Analytics Avanzado',
            description: 'Seguimiento detallado de tu progreso académico',
            color: 'from-indigo-600 to-blue-500',
            bgColor: 'bg-indigo-50',
        },
        {
            icon: Rocket,
            title: 'Aprendizaje Rápido',
            description: 'Metodología comprobada para resultados 3x más rápidos',
            color: 'from-blue-700 to-cyan-600',
            bgColor: 'bg-blue-50',
        },
    ];

    const stats = [
        { value: '10K+', label: 'Estudiantes Activos', icon: Users },
        { value: '95%', label: 'Tasa de Éxito', icon: Target },
        { value: '4.9/5', label: 'Rating Promedio', icon: Star },
        { value: '500+', label: 'Cursos Disponibles', icon: BookOpen },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section Premium */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-white/10 blur-3xl delay-1000" />
                    <div className="absolute top-1/2 left-1/2 h-96 w-96 animate-pulse rounded-full bg-white/5 blur-3xl delay-500" />
                </div>

                <div className="container relative z-10 py-20 md:py-32">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Left Content */}
                        <div className="text-white">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                                <Zap className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Plataforma Educativa de Nueva Generación
                                </span>
                            </div>

                            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                                Aprende Más Rápido
                                <span className="mt-2 block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    Con IA Avanzada
                                </span>
                            </h1>

                            <p className="mb-8 text-xl leading-relaxed text-purple-100">
                                Plataforma educativa inteligente con gamificación, aprendizaje adaptativo
                                y análisis predictivo. Únete a miles de estudiantes que ya están
                                transformando su futuro.
                            </p>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-900 shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/50"
                                >
                                    Comenzar gratis
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                                >
                                    Iniciar Sesión
                                    <GraduationCap className="h-5 w-5" />
                                </Link>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-12 grid grid-cols-3 gap-6">
                                {stats.slice(0, 3).map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="mb-1 text-3xl font-bold">{stat.value}</div>
                                        <div className="text-sm text-purple-200">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Visual - 3D Floating Cards */}
                        <div className="relative hidden lg:block">
                            <div className="relative h-[500px]">
                                {/* Main floating card */}
                                <div className="absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 animate-float rounded-2xl bg-white p-6 shadow-2xl">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
                                            <Brain className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                Progreso del día
                                            </div>
                                            <div className="text-sm text-gray-500">75% completado</div>
                                        </div>
                                    </div>
                                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <div className="rounded-lg bg-blue-50 p-3">
                                            <div className="text-2xl font-bold text-blue-700">
                                                12
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Lecciones completadas
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-emerald-50 p-3">
                                            <div className="text-2xl font-bold text-emerald-700">8.5</div>
                                            <div className="text-xs text-gray-600">
                                                Promedio general
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating achievement badge */}
                                <div className="absolute right-0 top-10 animate-float-delayed rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-4 shadow-xl delay-300">
                                    <Trophy className="h-10 w-10 text-white" />
                                </div>

                                {/* Floating XP badge */}
                                <div className="absolute bottom-20 left-0 animate-float rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-xl delay-500">
                                    <Zap className="h-8 w-8 text-white" />
                                    <div className="mt-1 text-xs font-bold text-white">+250 XP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg
                        viewBox="0 0 1440 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full"
                    >
                        <path
                            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Grid - Interactive */}
            <section className="py-20">
                <div className="container">
                    <div className="mb-16 text-center">
                        <div className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                            🚀 Características Principales
                        </div>
                        <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                            Todo lo que necesitas para
                            <span className="block bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                                triunfar académicamente
                            </span>
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Herramientas de última generación para estudiantes modernos
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            const isActive = mounted && index === activeFeature;
                            return (
                                <div
                                    key={index}
                                    className={`group relative overflow-hidden rounded-2xl border-2 p-8 transition-all duration-500 ${isActive
                                        ? 'scale-105 border-blue-300 shadow-2xl shadow-blue-200'
                                        : 'border-gray-100 hover:border-blue-200 hover:shadow-xl'
                                        }`}
                                    onMouseEnter={() => setActiveFeature(index)}
                                >
                                    {/* Background gradient */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 group-hover:opacity-5 ${isActive ? 'opacity-5' : ''}`}
                                    />

                                    {/* Icon */}
                                    <div
                                        className={`relative mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${feature.bgColor} transition-transform duration-500 ${isActive ? 'scale-110 shadow-lg' : 'group-hover:scale-110'}`}
                                    >
                                        <Icon
                                            className={`h-8 w-8 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}
                                        />
                                    </div>

                                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600">{feature.description}</p>

                                    {/* Hover arrow */}
                                    <div
                                        className={`mt-4 flex items-center gap-2 text-blue-700 transition-all ${isActive ? 'translate-x-2' : 'group-hover:translate-x-2'}`}
                                    >
                                        <span className="text-sm font-semibold">Explorar</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Stats Section with Visual Bars */}
            <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
                <div className="container">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
                                >
                                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-100 opacity-20 transition-transform group-hover:scale-150" />
                                    <Icon className="mb-4 h-10 w-10 text-blue-700" />
                                    <div className="mb-2 text-4xl font-bold text-gray-900">
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-600">{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="py-20">
                <div className="container">
                    <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-blue-700 via-cyan-700 to-teal-600 p-12 text-white shadow-2xl">
                        <div className="mb-6 flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                            ))}
                        </div>
                        <blockquote className="mb-6 text-2xl font-medium leading-relaxed">
                            "Esta plataforma transformó completamente mi forma de estudiar. Las rutas
                            personalizadas y la gamificación me mantuvieron motivado todo el
                            semestre. ¡Subí mi promedio de 7.5 a 9.2!"
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                                MR
                            </div>
                            <div>
                                <div className="font-semibold">María Rodríguez</div>
                                <div className="text-cyan-200">Estudiante de 3er Semestre</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 py-20 text-white">
                <div className="container text-center">
                    <Award className="mx-auto mb-6 h-16 w-16" />
                    <h2 className="mb-4 text-4xl font-bold md:text-5xl">
                        ¿Listo para el siguiente nivel?
                    </h2>
                    <p className="mb-8 text-xl text-cyan-100">
                        Únete a 10,000+ estudiantes que ya están usando IA para aprender mejor
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-5 text-lg font-bold text-blue-900 shadow-2xl transition-all hover:scale-105 hover:shadow-cyan-500/50"
                    >
                        Comenzar ahora gratis
                        <Rocket className="h-5 w-5" />
                    </Link>
                    <p className="mt-4 text-sm text-cyan-200">
                        No requiere tarjeta de crédito • Cancela cuando quieras
                    </p>
                </div>
            </section>
        </div>
    );
}
