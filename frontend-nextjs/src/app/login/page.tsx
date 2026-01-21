"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo Card */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                        <div className="text-3xl font-bold text-primary-600">BGE</div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Bienvenido de vuelta</h1>
                    <p className="text-primary-100">Inicia sesión para continuar</p>
                </div>

                {/* Login Form Card */}
                <div className="rounded-2xl bg-white shadow-2xl">
                    <div className="p-8">
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    "Iniciar Sesión"
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-sm text-gray-500">o</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Register Link */}
                        <p className="text-center text-sm text-gray-600">
                            ¿No tienes cuenta?{" "}
                            <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="border-t bg-gray-50 p-4 text-center">
                        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
