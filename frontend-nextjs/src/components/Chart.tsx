'use client';

import { Line, Bar, Pie } from 'recharts';
import {
    LineChart,
    BarChart,
    PieChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartProps {
    data: any[];
    type: 'line' | 'bar' | 'pie';
    xKey?: string;
    yKey?: string;
    title?: string;
    height?: number;
    colors?: string[];
}

const defaultColors = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function Chart({
    data,
    type,
    xKey = 'name',
    yKey = 'value',
    title,
    height = 300,
    colors = defaultColors,
}: ChartProps) {
    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey={xKey} stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={yKey}
                            stroke={colors[0]}
                            strokeWidth={2}
                            dot={{ fill: colors[0], r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                );

            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey={xKey} stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Bar dataKey={yKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={yKey}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill={colors[0]}
                            label
                        />
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );

            default:
                return <div />;
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {title && <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
}
