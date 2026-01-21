'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactoPage() {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Connect to /api/contact/send
        console.log('Form data:', formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
        }, 3000);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-gradient-to-r from-blue-700 to-cyan-700 py-20 text-white">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="mb-6 text-5xl font-bold">Contacto</h1>
                        <p className="text-xl text-blue-100">
                            Estamos aquí para ayudarte. Contáctanos y resolveremos tus dudas
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-20">
                <div className="container">
                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Contact Form */}
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-gray-900">
                                Envíanos un mensaje
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="nombre"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="telefono"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            id="telefono"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="asunto"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Asunto
                                    </label>
                                    <select
                                        id="asunto"
                                        name="asunto"
                                        value={formData.asunto}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Selecciona un asunto</option>
                                        <option value="informacion">Información general</option>
                                        <option value="inscripciones">Inscripciones</option>
                                        <option value="colegiaturas">Colegiaturas</option>
                                        <option value="soporte">Soporte técnico</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="mensaje"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Mensaje
                                    </label>
                                    <textarea
                                        id="mensaje"
                                        name="mensaje"
                                        value={formData.mensaje}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitted}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-emerald-600"
                                >
                                    {submitted ? (
                                        <>✓ Mensaje enviado</>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Enviar mensaje
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h2 className="mb-6 text-3xl font-bold text-gray-900">
                                Información de contacto
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                        <Phone className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Teléfono</div>
                                        <div className="text-gray-600">(555) 123-4567</div>
                                        <div className="text-gray-600">(555) 765-4321</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                        <Mail className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Email</div>
                                        <div className="text-gray-600">
                                            info@heroesdelapatria.edu.mx
                                        </div>
                                        <div className="text-gray-600">
                                            admisiones@heroesdelapatria.edu.mx
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
                                        <MapPin className="h-6 w-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Dirección</div>
                                        <div className="text-gray-600">
                                            Av. Héroes de la Patria #123
                                            <br />
                                            Col. Centro, C.P. 12345
                                            <br />
                                            Ciudad de México, México
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
                                <div className="flex h-64 items-center justify-center bg-slate-100 text-gray-400">
                                    <MapPin className="h-12 w-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
