"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuthStore();

    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        passwordConfirm: "",
        role: "student",
        phone: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Password strength calculator
    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const passwordsMatch = formData.password === formData.passwordConfirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!passwordsMatch) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (passwordStrength < 2) {
            setError("La contraseña es demasiado débil");
            return;
        }

        setLoading(true);

        try {
            const { passwordConfirm, ...userData } = formData;
            await register(userData);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Error al registrarse");
        } finally {
            setLoading(false);
        }
    };

    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
    const strengthLabels = ["Débil", "Media", "Fuerte", "Muy Fuerte"];

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 p-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Logo Card */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                        <div className="text-3xl font-bold text-primary-600">BGE</div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Crear Cuenta</h1>
                    <p className="text-primary-100">Únete a nuestra comunidad educativa</p>
                </div>

                {/* Register Form Card */}
                <div className="rounded-2xl bg-white shadow-2xl">
                    <div className="p-8">
                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-gray-700">
                                        Nombre(s) *
                                    </label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="apellido" className="mb-2 block text-sm font-medium text-gray-700">
                                        Apellido(s) *
                                    </label>
                                    <input
                                        id="apellido"
                                        type="text"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                    Correo Electrónico *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                                    Contraseña *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="h-2 w-full rounded-full bg-gray-200">
                                            <div
                                                className={`h-full rounded-full transition-all ${strengthColors[passwordStrength - 1]}`}
                                                style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                            Fortaleza: {strengthLabels[passwordStrength - 1] || "Muy débil"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Password Confirm */}
                            <div>
                                <label htmlFor="passwordConfirm" className="mb-2 block text-sm font-medium text-gray-700">
                                    Confirmar Contraseña *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="passwordConfirm"
                                        type={showPasswordConfirm ? "text" : "password"}
                                        value={formData.passwordConfirm}
                                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Repite tu contraseña"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {formData.passwordConfirm && (
                                    <div className="mt-1 flex items-center text-sm">
                                        {passwordsMatch ? (
                                            <>
                                                <Check className="mr-1 h-4 w-4 text-green-500" />
                                                <span className="text-green-600">Las contraseñas coinciden</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="mr-1 h-4 w-4 text-red-500" />
                                                <span className="text-red-600">Las contraseñas no coinciden</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Role & Phone */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
                                        Tipo de Usuario *
                                    </label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    >
                                        <option value="student">Estudiante</option>
                                        <option value="parent">Padre/Tutor</option>
                                        <option value="teacher">Docente</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                                        Teléfono
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="(000) 000-0000"
                                    />
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                                    Acepto los{" "}
                                    <Link href="/terminos" className="text-primary-600 hover:text-primary-700">
                                        Términos y Condiciones
                                    </Link>{" "}
                                    y la{" "}
                                    <Link href="/privacidad" className="text-primary-600 hover:text-primary-700">
                                        Política de Privacidad
                                    </Link>
                                </label>
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
                                        Creando cuenta...
                                    </span>
                                ) : (
                                    "Crear Cuenta"
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <p className="mt-6 text-center text-sm text-gray-600">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                                Inicia sesión aquí
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
