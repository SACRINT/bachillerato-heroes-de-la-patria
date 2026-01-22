'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { Trophy, Star, Award, Target, Zap, Crown } from 'lucide-react';

interface Achievement {
    id: number;
    titulo: string;
    descripcion: string;
    icono: string;
    rareza: 'comun' | 'raro' | 'epico' | 'legendario';
    progreso: number;
    objetivo: number;
    completado: boolean;
    recompensa: number;
}

export default function LogrosPage() {
    // TODO: Integrate with useAchievements hook when backend ready
    const logros: Achievement[] = [
        {
            id: 1,
            titulo: 'Primera Semana Completa',
            descripcion: 'Completaste todas las tareas de una semana sin faltas',
            icono: '🎯',
            rareza: 'comun',
            progreso: 7,
            objetivo: 7,
            completado: true,
            recompensa: 100,
        },
        {
            id: 2,
            titulo: 'Maestro de Matemáticas',
            descripcion: 'Obtuviste 10 en 3 exámenes seguidos de matemáticas',
            icono: '🧮',
            rareza: 'raro',
            progreso: 3,
            objetivo: 3,
            completado: true,
            recompensa: 250,
        },
        {
            id: 3,
            titulo: 'Racha de Fuego',
            descripcion: '7 días seguidos estudiando en la plataforma',
            icono: '🔥',
            rareza: 'raro',
            progreso: 7,
            objetivo: 7,
            completado: true,
            recompensa: 200,
        },
        {
            id: 4,
            titulo: 'Estudiante Destacado',
            descripcion: 'Mantén un promedio de 9.0 o superior durante un semestre',
            icono: '⭐',
            rareza: 'epico',
            progreso: 4,
            objetivo: 6,
            completado: false,
            recompensa: 500,
        },
        {
            id: 5,
            titulo: 'Mentor de la Comunidad',
            descripcion: 'Ayuda a 10 compañeros en el foro académico',
            icono: '🤝',
            rareza: 'epico',
            progreso: 6,
            objetivo: 10,
            completado: false,
            recompensa: 400,
        },
        {
            id: 6,
            titulo: 'Maestro del Metaverso',
            descripcion: 'Completa 20 lecciones en laboratorios virtuales 3D',
            icono: '🎮',
            rareza: 'epico',
            progreso: 12,
            objetivo: 20,
            completado: false,
            recompensa: 600,
        },
        {
            id: 7,
            titulo: 'Leyenda Académica',
            descripcion: 'Mantén promedio perfecto (10.0) durante todo el semestre',
            icono: '👑',
            rareza: 'legendario',
            progreso: 0,
            objetivo: 1,
            completado: false,
            recompensa: 2000,
        },
    ];

    const completados = logros.filter((l) => l.completado);
    const enProgreso = logros.filter((l) => !l.completado);

    const getRarezaColor = (rareza: string) => {
        switch (rareza) {
            case 'legendario':
                return 'from-yellow-400 to-orange-500 border-yellow-300';
            case 'epico':
                return 'from-purple-400 to-pink-500 border-purple-300';
            case 'raro':
                return 'from-blue-400 to-cyan-500 border-blue-300';
            default:
                return 'from-gray-400 to-gray-500 border-gray-300';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white md:p-8">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-12 w-12" />
                        <div>
                            <h1 className="text-3xl font-bold md:text-4xl">Mis Logros</h1>
                            <p className="mt-2 text-indigo-100">
                                {completados.length} de {logros.length} completados · Próximo: Estudiante Destacado
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-6 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Trophy className="h-10 w-10 text-yellow-600" />
                            <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">{completados.length}</div>
                                <div className="text-sm text-gray-600">Completados</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Target className="h-10 w-10 text-blue-600" />
                            <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">{enProgreso.length}</div>
                                <div className="text-sm text-gray-600">En Progreso</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Zap className="h-10 w-10 text-purple-600" />
                            <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">
                                    {completados.reduce((sum, l) => sum + l.recompensa, 0)}
                                </div>
                                <div className="text-sm text-gray-600">Coins Ganados</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Crown className="h-10 w-10 text-yellow-600" />
                            <div className="text-right">
                                <div className="text-3xl font-bold text-gray-900">
                                    {Math.round((completados.length / logros.length) * 100)}%
                                </div>
                                <div className="text-sm text-gray-600">Progreso Total</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                        En Progreso ({enProgreso.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {enProgreso.map((logro) => (
                            <div
                                key={logro.id}
                                className={`overflow-hidden rounded-xl border-2 bg-gradient-to-br shadow-sm transition-all hover:scale-105 hover:shadow-lg ${getRarezaColor(logro.rareza)}`}
                            >
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="text-4xl">{logro.icono}</div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${logro.rareza === 'legendario'
                                                    ? 'bg-yellow-100 text-yellow-900'
                                                    : logro.rareza === 'epico'
                                                        ? 'bg-purple-100 text-purple-900'
                                                        : 'bg-blue-100 text-blue-900'
                                                }`}
                                        >
                                            {logro.rareza}
                                        </span>
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-white">{logro.titulo}</h3>
                                    <p className="mb-4 text-sm text-white/90">{logro.descripcion}</p>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="mb-1 flex justify-between text-sm text-white">
                                            <span>Progreso</span>
                                            <span>
                                                {logro.progreso}/{logro.objetivo}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/30">
                                            <div
                                                className="h-full bg-white transition-all"
                                                style={{
                                                    width: `${(logro.progreso / logro.objetivo) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Reward */}
                                    <div className="flex items-center gap-2 text-white">
                                        <Trophy className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            Recompensa: {logro.recompensa} IA Coins
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Completed Achievements */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                        Completados ({completados.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {completados.map((logro) => (
                            <div
                                key={logro.id}
                                className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br p-6 shadow-sm ${getRarezaColor(logro.rareza)}`}
                            >
                                {/* Checkmark Badge */}
                                <div className="absolute right-4 top-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                                        <Award className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>

                                <div className="mb-4 text-4xl">{logro.icono}</div>
                                <h3 className="mb-2 text-lg font-bold text-white">{logro.titulo}</h3>
                                <p className="mb-3 text-sm text-white/90">{logro.descripcion}</p>
                                <div className="flex items-center gap-2 text-white">
                                    <Trophy className="h-4 w-4" />
                                    <span className="text-sm font-medium">+{logro.recompensa} IA Coins</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
