'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Clock } from 'lucide-react';
import { useStudentSchedule } from '@/hooks/use-api';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

export default function HorarioPage() {
    const { data: schedule, isLoading } = useStudentSchedule();

    // Organize schedule by day and hour
    const getClassAt = (day: string, hour: string) => {
        if (!schedule) return null;
        return schedule.find((c: any) => c.dia === day && c.hora === hour);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-10 w-10" />
                        <div>
                            <h1 className="text-3xl font-bold">Mi Horario</h1>
                            <p className="mt-1 text-indigo-100">Semestre Actual - 2026</p>
                        </div>
                    </div>
                </div>

                {/* Schedule Grid */}
                {isLoading ? (
                    <div className="py-12 text-center text-gray-500">Cargando horario...</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <Clock className="inline h-4 w-4 mr-2" />
                                        Hora
                                    </th>
                                    {days.map((day) => (
                                        <th
                                            key={day}
                                            className="px-4 py-3 text-center text-sm font-semibold text-gray-900"
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {hours.map((hour) => (
                                    <tr key={hour} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-600">
                                            {hour}
                                        </td>
                                        {days.map((day) => {
                                            const classItem = getClassAt(day, hour);
                                            return (
                                                <td key={`${day}-${hour}`} className="p-2">
                                                    {classItem ? (
                                                        <div
                                                            className={`rounded-lg p-3 text-center ${classItem.tipo === 'Teoría'
                                                                    ? 'bg-blue-100 text-blue-900'
                                                                    : classItem.tipo === 'Laboratorio'
                                                                        ? 'bg-purple-100 text-purple-900'
                                                                        : 'bg-emerald-100 text-emerald-900'
                                                                }`}
                                                        >
                                                            <div className="text-sm font-semibold">
                                                                {classItem.materia}
                                                            </div>
                                                            <div className="mt-1 text-xs">
                                                                {classItem.profesor}
                                                            </div>
                                                            <div className="mt-1 text-xs opacity-75">
                                                                {classItem.salon}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-20"></div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Legend */}
                <div className="flex gap-4 rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-blue-500"></div>
                        <span className="text-sm text-gray-700">Teoría</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-purple-500"></div>
                        <span className="text-sm text-gray-700">Laboratorio</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-emerald-500"></div>
                        <span className="text-sm text-gray-700">Práctica</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
