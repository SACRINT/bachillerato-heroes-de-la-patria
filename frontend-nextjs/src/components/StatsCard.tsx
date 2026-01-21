import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    iconColor?: string;
    iconBgColor?: string;
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    iconColor = 'text-blue-600',
    iconBgColor = 'bg-blue-100',
}: StatsCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-105 hover:shadow-lg">
            {/* Background decoration */}
            <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 opacity-50 transition-transform group-hover:scale-150" />

            <div className="relative">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                        {trend && (
                            <div className="mt-2 flex items-center gap-1 text-sm">
                                <span
                                    className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                                        }`}
                                >
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                </span>
                                <span className="text-gray-500">vs mes anterior</span>
                            </div>
                        )}
                    </div>
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor} transition-transform group-hover:scale-110`}
                    >
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
