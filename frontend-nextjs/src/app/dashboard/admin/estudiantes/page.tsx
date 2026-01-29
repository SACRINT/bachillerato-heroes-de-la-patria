'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, GraduationCap, Download, Filter } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import { useAdminStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function EstudiantesAdminPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGrado, setSelectedGrado] = useState('');
    const [selectedGrupo, setSelectedGrupo] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);

    const { data: studentsData, isLoading } = useAdminStudents({
        search: searchTerm,
        grado: selectedGrado,
        grupo: selectedGrupo,
    });

    const createStudent = useCreateStudent();
    const updateStudent = useUpdateStudent();
    const deleteStudent = useDeleteStudent();

    const students = studentsData?.data || [];

    const handleCreateOrUpdate = async (formData: any) => {
        try {
            if (editingStudent) {
                await updateStudent.mutateAsync({
                    id: editingStudent.id,
                    data: formData,
                });
                toast.success('Estudiante actualizado correctamente');
            } else {
                await createStudent.mutateAsync(formData);
                toast.success('Estudiante creado correctamente');
            }
            setIsModalOpen(false);
            setEditingStudent(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar estudiante');
        }
    };

    const handleDelete = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await deleteStudent.mutateAsync(id);
                toast.success('Estudiante eliminado correctamente');
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error al eliminar estudiante');
            }
        }
    };

    const handleEdit = (student: any) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Estudiantes</h1>
                        <p className="text-gray-500">Administra el catálogo de estudiantes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Estudiante
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, matrícula o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedGrado}
                                onChange={(e) => setSelectedGrado(e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Todos los grados</option>
                                <option value="1">1er Semestre</option>
                                <option value="2">2do Semestre</option>
                                <option value="3">3er Semestre</option>
                                <option value="4">4to Semestre</option>
                                <option value="5">5to Semestre</option>
                                <option value="6">6to Semestre</option>
                            </select>
                            <select
                                value={selectedGrupo}
                                onChange={(e) => setSelectedGrupo(e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Todos los grupos</option>
                                <option value="A">Grupo A</option>
                                <option value="B">Grupo B</option>
                                <option value="C">Grupo C</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">Cargando estudiantes...</div>
                    ) : students.length === 0 ? (
                        <div className="py-12 text-center">
                            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No se encontraron estudiantes</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Estudiante
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Matrícula
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Grado
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Grupo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Email
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
                                    {students.map((student: any) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                                        {student.nombre?.charAt(0)}{student.apellido_paterno?.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.nombre} {student.apellido_paterno} {student.apellido_materno}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {student.matricula}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900">
                                                {student.grado}°
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                    {student.grupo}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {student.email || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${student.activo
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id, `${student.nombre} ${student.apellido_paterno}`)}
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
                    <StudentModal
                        student={editingStudent}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingStudent(null);
                        }}
                        onSave={handleCreateOrUpdate}
                        isSaving={createStudent.isPending || updateStudent.isPending}
                    />
                )}
            </div>
        </AdminDashboardLayout>
    );
}

// Student Modal Component
function StudentModal({ student, onClose, onSave, isSaving }: any) {
    const [formData, setFormData] = useState({
        nombre: student?.nombre || '',
        apellido_paterno: student?.apellido_paterno || '',
        apellido_materno: student?.apellido_materno || '',
        email: student?.email || '',
        matricula: student?.matricula || '',
        grado: student?.grado || '',
        grupo: student?.grupo || '',
        turno: student?.turno || 'matutino',
        activo: student?.activo ?? true,
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
                        {student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Matrícula
                            </label>
                            <input
                                type="text"
                                value={formData.matricula}
                                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Grado *
                            </label>
                            <select
                                required
                                value={formData.grado}
                                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="1">1er Semestre</option>
                                <option value="2">2do Semestre</option>
                                <option value="3">3er Semestre</option>
                                <option value="4">4to Semestre</option>
                                <option value="5">5to Semestre</option>
                                <option value="6">6to Semestre</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Grupo *
                            </label>
                            <select
                                required
                                value={formData.grupo}
                                onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Turno
                            </label>
                            <select
                                value={formData.turno}
                                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="matutino">Matutino</option>
                                <option value="vespertino">Vespertino</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
