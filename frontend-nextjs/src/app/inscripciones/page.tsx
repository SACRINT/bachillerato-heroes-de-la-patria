'use client';

import { useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, FileText, Upload, Send } from 'lucide-react';

export default function InscripcionesPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Datos personales
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        fechaNacimiento: '',
        curp: '',
        genero: '',
        // Contacto
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigoPostal: '',
        // Datos académicos
        nivelEducativo: '',
        gradoSolicitar: '',
        escuelaProcedencia: '',
        promedioGeneral: '',
        // Tutor
        nombreTutor: '',
        telefonoTutor: '',
        emailTutor: '',
        relacionTutor: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Connect to /api/inscriptions/register
        console.log('Form data:', formData);
        setSubmitted(true);
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    if (submitted) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container flex min-h-screen items-center justify-center">
                    <div className="max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Send className="h-10 w-10" />
                        </div>
                        <h2 className="mb-4 text-4xl font-bold text-emerald-900">
                            ¡Solicitud enviada!
                        </h2>
                        <p className="mb-8 text-lg text-emerald-700">
                            Hemos recibido tu solicitud de inscripción. En las próximas 48 horas
                            recibirás un correo con los siguientes pasos del proceso.
                        </p>
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-16 text-white">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="mb-4 text-5xl font-bold">Inscripciones</h1>
                        <p className="text-xl text-blue-100">
                            Inicia tu proceso de admisión a BGE Héroes de la Patria
                        </p>
                    </div>
                </div>
            </section>

            {/* Form */}
            <section className="py-12">
                <div className="container">
                    {/* Progress Steps */}
                    <div className="mb-12 flex justify-center">
                        <div className="flex items-center gap-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex items-center gap-4">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${s === step
                                            ? 'bg-blue-600 text-white'
                                            : s < step
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {s < step ? '✓' : s}
                                    </div>
                                    {s < 4 && (
                                        <div
                                            className={`h-1 w-16 ${s < step ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mx-auto max-w-3xl">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Step 1: Datos Personales */}
                            {step === 1 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                                        <User className="mb-2 inline h-6 w-6 text-blue-600" /> Datos
                                        Personales del Estudiante
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <label htmlFor="nombre" className="mb-2 block text-sm font-medium">
                                                Nombre(s)
                                            </label>
                                            <input
                                                id="nombre"
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                required
                                                autoComplete="given-name"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="apellidoPaterno" className="mb-2 block text-sm font-medium">
                                                Apellido Paterno
                                            </label>
                                            <input
                                                id="apellidoPaterno"
                                                type="text"
                                                name="apellidoPaterno"
                                                value={formData.apellidoPaterno}
                                                onChange={handleChange}
                                                required
                                                autoComplete="family-name"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="apellidoMaterno" className="mb-2 block text-sm font-medium">
                                                Apellido Materno
                                            </label>
                                            <input
                                                id="apellidoMaterno"
                                                type="text"
                                                name="apellidoMaterno"
                                                value={formData.apellidoMaterno}
                                                onChange={handleChange}
                                                required
                                                autoComplete="additional-name"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="fechaNacimiento" className="mb-2 block text-sm font-medium">
                                                Fecha de Nacimiento
                                            </label>
                                            <input
                                                id="fechaNacimiento"
                                                type="date"
                                                name="fechaNacimiento"
                                                value={formData.fechaNacimiento}
                                                onChange={handleChange}
                                                required
                                                autoComplete="bday"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="curp" className="mb-2 block text-sm font-medium">
                                                CURP
                                            </label>
                                            <input
                                                id="curp"
                                                type="text"
                                                name="curp"
                                                value={formData.curp}
                                                onChange={handleChange}
                                                required
                                                maxLength={18}
                                                autoComplete="off"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="genero" className="mb-2 block text-sm font-medium">
                                                Género
                                            </label>
                                            <select
                                                id="genero"
                                                name="genero"
                                                value={formData.genero}
                                                onChange={handleChange}
                                                required
                                                aria-label="Género"
                                                className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="masculino">Masculino</option>
                                                <option value="femenino">Femenino</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Contacto */}
                            {step === 2 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                                        <Mail className="mb-2 inline h-6 w-6 text-blue-600" /> Datos de
                                        Contacto
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium">
                                                Correo Electrónico
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Código Postal
                                            </label>
                                            <input
                                                type="text"
                                                name="codigoPostal"
                                                value={formData.codigoPostal}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium">
                                                Dirección Completa
                                            </label>
                                            <input
                                                type="text"
                                                name="direccion"
                                                value={formData.direccion}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Ciudad
                                            </label>
                                            <input
                                                type="text"
                                                name="ciudad"
                                                value={formData.ciudad}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Estado
                                            </label>
                                            <input
                                                type="text"
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            ← Atrás
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Académico */}
                            {step === 3 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                                        <FileText className="mb-2 inline h-6 w-6 text-blue-600" /> Datos
                                        Académicos
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Nivel Educativo
                                            </label>
                                            <select
                                                name="nivelEducativo"
                                                value={formData.nivelEducativo}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="secundaria">Secundaria</option>
                                                <option value="preparatoria">Preparatoria</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Grado a solicitar
                                            </label>
                                            <select
                                                name="gradoSolicitar"
                                                value={formData.gradoSolicitar}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="1">1° Grado/Semestre</option>
                                                <option value="2">2° Grado/Semestre</option>
                                                <option value="3">3° Grado/Semestre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Escuela de Procedencia
                                            </label>
                                            <input
                                                type="text"
                                                name="escuelaProcedencia"
                                                value={formData.escuelaProcedencia}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Promedio General
                                            </label>
                                            <input
                                                type="number"
                                                name="promedioGeneral"
                                                value={formData.promedioGeneral}
                                                onChange={handleChange}
                                                required
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            ← Atrás
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Siguiente →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Tutor */}
                            {step === 4 && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                                        <User className="mb-2 inline h-6 w-6 text-blue-600" /> Datos del
                                        Tutor
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium">
                                                Nombre Completo del Tutor
                                            </label>
                                            <input
                                                type="text"
                                                name="nombreTutor"
                                                value={formData.nombreTutor}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Teléfono del Tutor
                                            </label>
                                            <input
                                                type="tel"
                                                name="telefonoTutor"
                                                value={formData.telefonoTutor}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Email del Tutor
                                            </label>
                                            <input
                                                type="email"
                                                name="emailTutor"
                                                value={formData.emailTutor}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium">
                                                Relación con el estudiante
                                            </label>
                                            <select
                                                name="relacionTutor"
                                                value={formData.relacionTutor}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border px-4 py-2"
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="padre">Padre</option>
                                                <option value="madre">Madre</option>
                                                <option value="tutor">Tutor Legal</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            ← Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700"
                                        >
                                            <Send className="mr-2 inline h-5 w-5" />
                                            Enviar Solicitud
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
