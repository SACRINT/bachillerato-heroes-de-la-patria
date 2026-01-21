'use client';

import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface BlogPost {
    id: number;
    titulo: string;
    extracto: string;
    imagen: string;
    categoria: string;
    autor: string;
    fecha: string;
    tiempoLectura: string;
}

export default function BlogPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('todas');

    const categorias = ['Todas', 'Educación', 'Tecnología', 'Noticias', 'Consejos'];

    const posts: BlogPost[] = [
        {
            id: 1,
            titulo: 'El Futuro de la Educación con Inteligencia Artificial',
            extracto:
                'Descubre cómo la IA está transformando la manera en que aprendemos y enseñamos en el siglo XXI. Desde tutores personalizados hasta análisis predictivo del rendimiento estudiantil.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Tecnología',
            autor: 'Dr. Roberto Martínez',
            fecha: '15 Enero 2026',
            tiempoLectura: '5 min',
        },
        {
            id: 2,
            titulo: 'Consejos para Prepararte para tus Exámenes Finales',
            extracto:
                'Tips prácticos y estrategias comprobadas para maximizar tu rendimiento en los exámenes. Organización, técnicas de estudio y manejo del estrés.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Consejos',
            autor: 'Mtra. Ana Rodríguez',
            fecha: '12 Enero 2026',
            tiempoLectura: '7 min',
        },
        {
            id: 3,
            titulo: 'Gamificación en el Aula: Más que Solo Juegos',
            extracto:
                'Exploramos cómo el sistema de IA Coins y achievements motiva a los estudiantes a alcanzar sus metas académicas mientras se divierten aprendiendo.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Educación',
            autor: 'Lic. Carlos Hernández',
            fecha: '10 Enero 2026',
            tiempoLectura: '6 min',
        },
        {
            id: 4,
            titulo: 'Becas y Apoyos Disponibles para el Ciclo 2026',
            extracto:
                'Conoce las diferentes opciones de becas académicas, deportivas y de liderazgo disponibles para estudiantes destacados de BGE Héroes de la Patria.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Noticias',
            autor: 'Psic. María González',
            fecha: '8 Enero 2026',
            tiempoLectura: '4 min',
        },
        {
            id: 5,
            titulo: 'Laboratorios Virtuales: Ciencia sin Límites',
            extracto:
                'Nuestros laboratorios virtuales en 3D permiten a los estudiantes experimentar con química, física y biología de forma segura e ilimitada.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Tecnología',
            autor: 'Dr. Roberto Martínez',
            fecha: '5 Enero 2026',
            tiempoLectura: '8 min',
        },
        {
            id: 6,
            titulo: 'Habilidades del Siglo XXI: Más Allá del Conocimiento',
            extracto:
                'Pensamiento crítico, creatividad, colaboración y comunicación: las habilidades que todo estudiante necesita para triunfar en el futuro.',
            imagen: '/api/placeholder/800/400',
            categoria: 'Educación',
            autor: 'Mtra. Ana Rodríguez',
            fecha: '3 Enero 2026',
            tiempoLectura: '6 min',
        },
    ];

    const filteredPosts = posts.filter((post) => {
        const matchesSearch = post.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === 'todas' ||
            post.categoria.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-gradient-to-r from-indigo-700 to-purple-700 py-20 text-white">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="mb-4 text-5xl font-bold">Blog Educativo</h1>
                        <p className="text-xl text-indigo-100">
                            Artículos, noticias y consejos para estudiantes, padres y educadores
                        </p>
                    </div>
                </div>
            </section>

            {/* Search & Filters */}
            <section className="border-b bg-slate-50 py-8">
                <div className="container">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Search */}
                        <div className="relative flex-1 md:max-w-md">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar artículos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto">
                            {categorias.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat.toLowerCase())}
                                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.toLowerCase()
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Posts Grid */}
            <section className="py-12">
                <div className="container">
                    {filteredPosts.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-xl text-gray-600">
                                No se encontraron artículos con los filtros seleccionados.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPosts.map((post) => (
                                <article
                                    key={post.id}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-lg"
                                >
                                    {/* Image */}
                                    <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500"></div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Category Badge */}
                                        <div className="mb-3">
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                                {post.categoria}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="mb-3 text-xl font-bold text-gray-900">
                                            {post.titulo}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="mb-4 text-sm leading-relaxed text-gray-600">
                                            {post.extracto}
                                        </p>

                                        {/* Meta */}
                                        <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                <span>{post.autor}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{post.fecha}</span>
                                            </div>
                                            <span>• {post.tiempoLectura}</span>
                                        </div>

                                        {/* Read More */}
                                        <Link
                                            href={`/blog/${post.id}`}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                        >
                                            Leer más
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="bg-gradient-to-r from-indigo-700 to-purple-700 py-16 text-white">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="mb-4 text-3xl font-bold">
                            Mantente Actualizado
                        </h2>
                        <p className="mb-8 text-lg text-indigo-100">
                            Suscríbete a nuestro newsletter y recibe los últimos artículos
                            directamente en tu correo.
                        </p>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="flex-1 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                            />
                            <button className="rounded-lg bg-white px-8 py-3 font-semibold text-indigo-700 transition-all hover:scale-105 hover:shadow-lg">
                                Suscribirme
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
