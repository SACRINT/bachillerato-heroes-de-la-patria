'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface Column<T> {
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    itemsPerPage?: number;
    searchable?: boolean;
    filterable?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    itemsPerPage = 10,
    searchable = false,
    filterable = false,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(
        null
    );

    // Filter data based on search
    const filteredData = searchQuery
        ? data.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : data;

    // Sort data
    const sortedData = sortConfig
        ? [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        })
        : filteredData;

    // Paginate
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (key: keyof T) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return {
                    key,
                    direction: current.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            {(searchable || filterable) && (
                <div className="flex items-center gap-4">
                    {searchable && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    )}
                    {filterable && (
                        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={String(column.key)}
                                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                                    >
                                        {column.sortable ? (
                                            <button
                                                onClick={() => handleSort(column.key)}
                                                className="flex items-center gap-2 hover:text-blue-600"
                                            >
                                                {column.label}
                                                {sortConfig?.key === column.key && (
                                                    <span className="text-blue-600">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </button>
                                        ) : (
                                            column.label
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                                        >
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                        <div className="text-sm text-gray-700">
                            Mostrando {startIndex + 1} a{' '}
                            {Math.min(startIndex + itemsPerPage, sortedData.length)} de{' '}
                            {sortedData.length} resultados
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
