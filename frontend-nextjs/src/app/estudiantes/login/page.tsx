'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentApiClient } from '@/lib/student-api-client';
import { GraduationCap, Lock, User, AlertCircle } from 'lucide-react';

export default function StudentLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        matricula: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await studentApiClient.login(
                formData.matricula,
                formData.password
            );

            if (response.token) {
                // Login exitoso, redirigir al dashboard
                router.push('/estudiantes/dashboard');
            }
        } catch (err: any) {
            console.error('[Login] Error:', err);
            setError(
                err.response?.data?.message ||
                'Error al iniciar sesión. Verifica tus credenciales.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-600 px-4">
            <div className="w-full max-w-md">
                {/* Logo y título */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                        <GraduationCap className="h-10 w-10 text-blue-600" />
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-white">
                        Portal de Estudiantes
                    </h1>
                    <p className="text-blue-100">
                        BGE Héroes de la Patria
                    </p>
                </div>

                {/* Formulario de login */}
                <div className="rounded-2xl bg-white p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Matrícula */}
                        <div>
                            <label
                                htmlFor="matricula"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Matrícula
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="matricula"
                                    type="text"
                                    value={formData.matricula}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            matricula: e.target.value,
                                        })
                                    }
                                    required
                                    autoComplete="username"
                                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ingresa tu matrícula"
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ingresa tu contraseña"
                                />
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="text-right">
                            <a
                                href="/estudiantes/recuperar-password"
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>
                            ¿Primera vez aquí?{' '}
                            <a href="/estudiantes/ayuda" className="text-blue-600 hover:text-blue-700">
                                Ver guía de acceso
                            </a>
                        </p>
                    </div>
                </div>

                {/* Info adicional */}
                <div className="mt-6 text-center text-sm text-blue-100">
                    <p>
                        Si tienes problemas para acceder, contacta a tu coordinador.
                    </p>
                </div>
            </div>
        </div>
    );
}
