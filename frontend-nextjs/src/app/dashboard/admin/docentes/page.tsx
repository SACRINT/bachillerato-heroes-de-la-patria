'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Users, Download } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import { useAdminTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function DocentesAdminPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<any>(null);

    const { data: teachersData, isLoading } = useAdminTeachers({
        search: searchTerm,
    });

    const createTeacher = useCreateTeacher();
    const updateTeacher = useUpdateTeacher();
    const deleteTeacher = useDeleteTeacher();

    const teachers = teachersData?.data || [];

    const handleCreateOrUpdate = async (formData: any) => {
        try {
            if (editingTeacher) {
                await updateTeacher.mutateAsync({
                    id: editingTeacher.id,
                    data: formData,
                });
                toast.success('Docente actualizado correctamente');
            } else {
                await createTeacher.mutateAsync(formData);
                toast.success('Docente creado correctamente');
            }
            setIsModalOpen(false);
            setEditingTeacher(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar docente');
        }
    };

    const handleDelete = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await deleteTeacher.mutateAsync(id);
                toast.success('Docente eliminado correctamente');
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error al eliminar docente');
            }
        }
    };

    const handleEdit = (teacher: any) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingTeacher(null);
        setIsModalOpen(true);
    };

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Docentes</h1>
                        <p className="text-gray-500">Administra el catálogo de docentes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Docente
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Docentes</p>
                                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <Users className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Docentes Activos</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {teachers.filter((t: any) => t.activo).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Docentes Inactivos</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {teachers.filter((t: any) => !t.activo).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">Cargando docentes...</div>
                    ) : teachers.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No se encontraron docentes</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Docente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Especialidad
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Materias
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {teachers.map((teacher: any) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white">
                                                        {teacher.nombre?.charAt(0)}{teacher.apellido_paterno?.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {teacher.nombre} {teacher.apellido_paterno} {teacher.apellido_materno}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {teacher.email}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {teacher.especialidad || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900">
                                                {teacher.materias_count || 0}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${teacher.activo
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {teacher.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(teacher)}
                                                    className="mr-3 text-emerald-600 hover:text-emerald-900"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(teacher.id, `${teacher.nombre} ${teacher.apellido_paterno}`)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <TeacherModal
                        teacher={editingTeacher}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingTeacher(null);
                        }}
                        onSave={handleCreateOrUpdate}
                        isSaving={createTeacher.isPending || updateTeacher.isPending}
                    />
                )}
            </div>
        </AdminDashboardLayout>
    );
}

// Teacher Modal Component
function TeacherModal({ teacher, onClose, onSave, isSaving }: any) {
    const [formData, setFormData] = useState({
        nombre: teacher?.nombre || '',
        apellido_paterno: teacher?.apellido_paterno || '',
        apellido_materno: teacher?.apellido_materno || '',
        email: teacher?.email || '',
        especialidad: teacher?.especialidad || '',
        telefono: teacher?.telefono || '',
        activo: teacher?.activo ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
                <div className="border-b border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {teacher ? 'Editar Docente' : 'Nuevo Docente'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Apellido Paterno *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.apellido_paterno}
                                onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Apellido Materno
                            </label>
                            <input
                                type="text"
                                value={formData.apellido_materno}
                                onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Especialidad
                            </label>
                            <input
                                type="text"
                                value={formData.especialidad}
                                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Activo</span>
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
