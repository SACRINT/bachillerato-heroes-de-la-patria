import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Users,
    Trophy,
    Sparkles,
    Brain,
    Zap,
    Target,
    Star,
    TrendingUp
} from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* Hero Section - Más Premium */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-primary-300 blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-purple-300 blur-3xl delay-1000"></div>
                </div>

                <div className="container relative py-20 md:py-32">
                    <div className="mx-auto max-w-5xl text-center">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4 text-yellow-300" />
                            <span className="text-sm font-semibold text-white">
                                Plataforma Educativa de Nueva Generación
                            </span>
                        </div>

                        {/* Main Title */}
                        <h1 className="mb-6 text-5xl font-extrabold leading-tight text-white md:text-7xl">
                            Aprende Más Rápido
                            <br />
                            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                                Con Inteligencia Artificial
                            </span>
                        </h1>

                        <p className="mb-10 text-xl text-primary-100 md:text-2xl">
                            Gamificación, IA adaptativa, metaverso educativo y mucho más.
                            <br className="hidden md:block" />
                            La educación del futuro, disponible hoy.
                        </p>

                        {/* CTA Buttons - Más Premium */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-primary-600 shadow-2xl transition-all hover:scale-105 hover:shadow-white/20"
                            >
                                Comenzar Gratis
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                            >
                                Iniciar Sesión
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-3 gap-8 md:gap-12">
                            {[
                                { value: "10K+", label: "Estudiantes Activos" },
                                { value: "95%", label: "Tasa de Éxito" },
                                { value: "4.9/5", label: "Rating Promedio" },
                            ].map((stat, idx) => (
                                <div key={idx} className="text-center">
                                    <div className="mb-1 text-3xl font-black text-white md:text-4xl">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-primary-200">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wave Divider Mejorado */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg
                        viewBox="0 0 1440 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 120L48 105C96 90 192 60 288 45C384 30 480 30 576 37.5C672 45 768 60 864 67.5C960 75 1056 75 1152 67.5C1248 60 1344 45 1392 37.5L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Section - Rediseñado */}
            <section className="bg-gradient-to-b from-white to-gray-50 py-20">
                <div className="container">
                    {/* Section Header */}
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
                            ¿Por qué elegir BGE?
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Tecnología de vanguardia que transforma la manera de aprender
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: Brain,
                                title: "IA Adaptativa",
                                description:
                                    "Contenido personalizado que se adapta a tu ritmo y estilo de aprendizaje",
                                color: "from-blue-500 to-cyan-500",
                                bgColor: "bg-blue-50",
                            },
                            {
                                icon: Trophy,
                                title: "Gamificación Total",
                                description:
                                    "Gana XP, desbloquea logros y compite en torneos globales",
                                color: "from-yellow-500 to-orange-500",
                                bgColor: "bg-yellow-50",
                            },
                            {
                                icon: Zap,
                                title: "Aprendizaje Express",
                                description:
                                    "Aprende 3x más rápido con técnicas respaldadas por neurociencia",
                                color: "from-purple-500 to-pink-500",
                                bgColor: "bg-purple-50",
                            },
                            {
                                icon: Users,
                                title: "Comunidad Global",
                                description:
                                    "Colabora con estudiantes de todo el mundo en tiempo real",
                                color: "from-green-500 to-emerald-500",
                                bgColor: "bg-green-50",
                            },
                            {
                                icon: Target,
                                title: "Metas Claras",
                                description:
                                    "Sistema de objetivos que te guía paso a paso hacia el éxito",
                                color: "from-red-500 to-rose-500",
                                bgColor: "bg-red-50",
                            },
                            {
                                icon: Star,
                                title: "Certificaciones",
                                description:
                                    "Certificados blockchain verificables por empleadores",
                                color: "from-indigo-500 to-blue-500",
                                bgColor: "bg-indigo-50",
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:scale-105"
                            >
                                {/* Gradient Overlay on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-5`}></div>

                                <div className="relative">
                                    <div className={`mb-4 inline-flex rounded-2xl ${feature.bgColor} p-4`}>
                                        <feature.icon className="h-8 w-8 text-gray-800" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="bg-white py-16">
                <div className="container">
                    <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-purple-600 p-12 text-center shadow-2xl">
                        <div className="mb-6 flex justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-8 w-8 fill-yellow-300 text-yellow-300" />
                            ))}
                        </div>
                        <blockquote className="mb-4 text-2xl font-semibold text-white md:text-3xl">
                            "Subí mi promedio de 7.5 a 9.2 en solo un semestre.
                            <br className="hidden md:block" />
                            Esta plataforma cambió mi vida."
                        </blockquote>
                        <cite className="text-lg text-primary-100">
                            — María González, Estudiante de 3er Semestre
                        </cite>
                    </div>
                </div>
            </section>

            {/* CTA Section - Premium */}
            <section className="bg-gray-900 py-20 text-white">
                <div className="container">
                    <div className="mx-auto max-w-4xl text-center">
                        <TrendingUp className="mx-auto mb-6 h-16 w-16 text-green-400" />
                        <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                            Únete a la Revolución Educativa
                        </h2>
                        <p className="mb-10 text-xl text-gray-300">
                            Más de 10,000 estudiantes ya están aprendiendo de una manera completamente nueva
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 px-10 py-5 text-xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-green-500/50"
                        >
                            Comenzar Ahora - Es Gratis
                            <ArrowRight className="h-6 w-6" />
                        </Link>
                        <p className="mt-4 text-sm text-gray-400">
                            No se requiere tarjeta de crédito • Cancela cuando quieras
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

