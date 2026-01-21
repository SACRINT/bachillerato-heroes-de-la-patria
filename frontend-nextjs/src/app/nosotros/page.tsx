'use client';

import { Target, Users, Heart, Award, Lightbulb, BookOpen } from 'lucide-react';

export default function NosotrosPage() {
    const valores = [
        {
            icon: Heart,
            titulo: 'Ética y Valores',
            descripcion: 'Formamos ciudadanos íntegros comprometidos con su comunidad',
        },
        {
            icon: Lightbulb,
            titulo: 'Innovación',
            descripcion: 'Utilizamos tecnología de punta en el proceso educativo',
        },
        {
            icon: Award,
            titulo: 'Excelencia',
            descripcion: 'Buscamos la mejora continua en todos nuestros procesos',
        },
        {
            icon: Users,
            titulo: 'Inclusión',
            descripcion: 'Valoramos la diversidad y promovemos la equidad',
        },
    ];

    const stats = [
        { numero: '25+', label: 'Años de experiencia' },
        { numero: '1,200+', label: 'Estudiantes activos' },
        { numero: '85+', label: 'Docentes certificados' },
        { numero: '95%', label: 'Satisfacción' },
    ];

    const equipo = [
        {
            nombre: 'Dr. Roberto Martínez',
            puesto: 'Director General',
            area: 'Administración',
        },
        {
            nombre: 'Mtra. Ana Rodríguez',
            puesto: 'Directora Académica',
            area: 'Académico',
        },
        {
            nombre: 'Lic. Carlos Hernández',
            puesto: 'Coordinador de Tecnología',
            area: 'Innovación',
        },
        {
            nombre: 'Psic. María González',
            puesto: 'Coordinadora de Psicopedagogía',
            area: 'Bienestar',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-20 text-white">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="mb-6 text-5xl font-bold">Nosotros</h1>
                        <p className="text-xl text-blue-100">
                            Más de 25 años formando líderes comprometidos con México
                        </p>
                    </div>
                </div>
            </section>

            {/* Misión y Visión */}
            <section className="py-20">
                <div className="container">
                    <div className="grid gap-12 lg:grid-cols-2">
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                                <Target className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="mb-4 text-3xl font-bold text-blue-900">Misión</h2>
                            <p className="text-lg leading-relaxed text-blue-800">
                                Formar estudiantes integrales con excelencia académica, valores éticos
                                y compromiso social, preparados para enfrentar los retos del siglo XXI
                                a través de metodologías innovadoras y tecnología de vanguardia.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="mb-4 text-3xl font-bold text-emerald-900">Visión</h2>
                            <p className="text-lg leading-relaxed text-emerald-800">
                                Ser la institución educativa líder en México, reconocida por su
                                innovación pedagógica, formación integral y el éxito de sus egresados
                                como agentes de cambio positivo en la sociedad.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-16 text-white">
                <div className="container">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="mb-2 text-5xl font-bold">{stat.numero}</div>
                                <div className="text-lg text-blue-100">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Valores */}
            <section className="py-20">
                <div className="container">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Nuestros Valores</h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Los principios que guían nuestra labor educativa diariamente
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {valores.map((valor, index) => {
                            const Icon = valor.icon;
                            return (
                                <div
                                    key={index}
                                    className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:scale-105 hover:shadow-lg"
                                >
                                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                        <Icon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                        {valor.titulo}
                                    </h3>
                                    <p className="text-gray-600">{valor.descripcion}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Equipo */}
            <section className="bg-slate-50 py-20">
                <div className="container">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Equipo Directivo</h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Profesionales comprometidos con la excelencia educativa
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {equipo.map((persona, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
                            >
                                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-3xl font-bold text-white">
                                    {persona.nombre.charAt(0)}
                                </div>
                                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                                    {persona.nombre}
                                </h3>
                                <div className="mb-1 text-sm font-medium text-blue-600">
                                    {persona.puesto}
                                </div>
                                <div className="text-sm text-gray-500">{persona.area}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
