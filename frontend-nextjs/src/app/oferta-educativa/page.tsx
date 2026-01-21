'use client';

import Link from 'next/link';
import { GraduationCap, Users, BookOpen, Trophy, ArrowRight, Check } from 'lucide-react';

export default function OfertaEducativaPage() {
    const niveles = [
        {
            nombre: 'Secundaria',
            descripcion: 'Formación integral para adolescentes con enfoque en valores y excelencia académica',
            grados: ['1° Grado', '2° Grado', '3° Grado'],
            caracteristicas: [
                'Inglés intensivo',
                'Laboratorios equipados',
                'Actividades deportivas',
                'Arte y cultura',
            ],
            color: 'from-blue-600 to-cyan-600',
        },
        {
            nombre: 'Preparatoria',
            descripcion: 'Bachillerato general con especialización en áreas STEM y humanidades',
            grados: [
                '1er Semestre',
                '2do Semestre',
                '3er Semestre',
                '4to Semestre',
                '5to Semestre',
                '6to Semestre',
            ],
            caracteristicas: [
                'Certificación Cambridge',
                'Convenios con universidades',
                'Laboratorios de robótica',
                'Sistema de tutorías',
            ],
            color: 'from-emerald-600 to-teal-600',
        },
    ];

    const beneficios = [
        {
            icon: GraduationCap,
            titulo: 'Educación de Calidad',
            descripcion: 'Programa académico avalado por la SEP con docentes certificados',
        },
        {
            icon: Users,
            titulo: 'Grupos Reducidos',
            descripcion: 'Máximo 30 alumnos por grupo para atención personalizada',
        },
        {
            icon: BookOpen,
            titulo: 'Biblioteca Digital',
            descripcion: 'Acceso a más de 10,000 recursos educativos en línea',
        },
        {
            icon: Trophy,
            titulo: 'Gamificación',
            descripcion: 'Sistema de logros y recompensas para motivar el aprendizaje',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-20 text-white">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="mb-6 text-5xl font-bold">Oferta Educativa</h1>
                        <p className="text-xl text-blue-100">
                            Descubre nuestros programas académicos diseñados para formar líderes del
                            futuro
                        </p>
                    </div>
                </div>
            </section>

            {/* Niveles Educativos */}
            <section className="py-20">
                <div className="container">
                    <div className="space-y-12">
                        {niveles.map((nivel, index) => (
                            <div
                                key={index}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
                            >
                                <div
                                    className={`bg-gradient-to-r ${nivel.color} p-8 text-white`}
                                >
                                    <h2 className="mb-2 text-3xl font-bold">{nivel.nombre}</h2>
                                    <p className="text-lg opacity-90">{nivel.descripcion}</p>
                                </div>
                                <div className="p-8">
                                    <div className="mb-6">
                                        <h3 className="mb-4 text-xl font-semibold text-gray-900">
                                            Grados/Semestres
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                            {nivel.grados.map((grado, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-center font-medium text-gray-700"
                                                >
                                                    {grado}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="mb-4 text-xl font-semibold text-gray-900">
                                            Características
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {nivel.caracteristicas.map((caract, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check className="h-5 w-5 text-emerald-600" />
                                                    <span className="text-gray-700">{caract}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Beneficios */}
            <section className="bg-slate-50 py-20">
                <div className="container">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">
                            ¿Por qué elegir BGE Héroes de la Patria?
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600">
                            Ofrecemos una educación integral con las mejores herramientas y metodologías
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {beneficios.map((beneficio, index) => {
                            const Icon = beneficio.icon;
                            return (
                                <div
                                    key={index}
                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-105 hover:shadow-lg"
                                >
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                        <Icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                        {beneficio.titulo}
                                    </h3>
                                    <p className="text-gray-600">{beneficio.descripcion}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-20 text-white">
                <div className="container text-center">
                    <h2 className="mb-4 text-4xl font-bold">¿Listo para unirte?</h2>
                    <p className="mb-8 text-xl text-blue-100">
                        Inicia el proceso de inscripción hoy mismo
                    </p>
                    <Link
                        href="/inscripciones"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-700 transition-all hover:scale-105 hover:shadow-2xl"
                    >
                        Inscribirse Ahora
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
