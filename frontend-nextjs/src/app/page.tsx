import Link from "next/link";
import { ArrowRight, BookOpen, Users, Trophy, Sparkles } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                <div className="container py-24">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
                            Bienvenido a BGE
                            <br />
                            <span className="text-primary-200">Héroes de la Patria</span>
                        </h1>
                        <p className="mb-8 text-xl text-primary-100">
                            Plataforma educativa inteligente con gamificación, IA adaptativa y
                            aprendizaje personalizado
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-primary-600 transition hover:bg-primary-50"
                            >
                                Iniciar Sesión
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
                            >
                                Registrarse
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg
                        viewBox="0 0 1440 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full"
                    >
                        <path
                            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="container">
                    <h2 className="mb-12 text-center text-4xl font-bold">
                        Características de la Plataforma
                    </h2>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {/* Feature 1 */}
                        <div className="card group transition hover:shadow-lg">
                            <div className="mb-4 inline-block rounded-full bg-primary-100 p-3 transition group-hover:bg-primary-200">
                                <BookOpen className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">
                                Aprendizaje Adaptativo
                            </h3>
                            <p className="text-gray-600">
                                Rutas de aprendizaje personalizadas con IA que se adaptan a tu estilo y ritmo
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card group transition hover:shadow-lg">
                            <div className="mb-4 inline-block rounded-full bg-green-100 p-3 transition group-hover:bg-green-200">
                                <Trophy className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">Gamificación</h3>
                            <p className="text-gray-600">
                                Gana XP, desbloquea logros y compite en torneos mientras aprendes
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card group transition hover:shadow-lg">
                            <div className="mb-4 inline-block rounded-full bg-purple-100 p-3 transition group-hover:bg-purple-200">
                                <Sparkles className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">IA Tutor</h3>
                            <p className="text-gray-600">
                                Asistente inteligente disponible 24/7 para resolver tus dudas
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="card group transition hover:shadow-lg">
                            <div className="mb-4 inline-block rounded-full bg-orange-100 p-3 transition group-hover:bg-orange-200">
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">Comunidad</h3>
                            <p className="text-gray-600">
                                Colabora con compañeros y docentes en tiempo real
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gray-50 py-20">
                <div className="container">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="mb-4 text-4xl font-bold">
                            ¿Listo para comenzar tu viaje educativo?
                        </h2>
                        <p className="mb-8 text-xl text-gray-600">
                            Únete a miles de estudiantes que ya están transformando su forma de aprender
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-primary-700"
                        >
                            Comenzar Ahora
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-white py-12">
                <div className="container">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <h4 className="mb-4 font-semibold">BGE Héroes de la Patria</h4>
                            <p className="text-sm text-gray-600">
                                Educación de calidad con tecnología de vanguardia
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-4 font-semibold">Enlaces</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="/oferta-educativa" className="text-gray-600 hover:text-primary-600">
                                        Oferta Educativa
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contacto" className="text-gray-600 hover:text-primary-600">
                                        Contacto
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 font-semibold">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="/privacidad" className="text-gray-600 hover:text-primary-600">
                                        Política de Privacidad
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/terminos" className="text-gray-600 hover:text-primary-600">
                                        Términos y Condiciones
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
                        © 2026 BGE Héroes de la Patria. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
