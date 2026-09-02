"use strict";
/**
 * 🌱 SCRIPT DE POBLACIÓN v2.1.0 - Secciones por defecto para todos los tenants
 * 
 * Ejecutar con: node backend/scripts/seed-page-sections.js [tenant_id]
 * Si no se provee tenant_id, usa tenant_id = 1
 * 
 * Este script crea:
 * 1. Configuración de todas las páginas (activas por defecto)
 * 2. Secciones con contenido general pre-poblado
 * 3. Items para secciones que los requieren
 * 
 * CAMBIOS v2.1.0:
 * - conocenos: Secciones vacías (el director llena desde su dashboard)
 * - oferta-educativa: Incluye secciones SEP generales (sin Currículum Laboral)
 * - Se agregó plan_estudios. capacitacion_trabajo EXCLUIDA del seed (cada plantel tiene diferentes especialidades)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

// Configuración de BD
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/sipweb-bg',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ============================================
// DATOS GENERALES PRE-POBLADOS
// ============================================

const PAGE_CONFIGS = [
    { slug: 'inicio', title: 'Inicio', active: true, order: 1 },
    { slug: 'conocenos', title: 'Conócenos', active: true, order: 2 },
    { slug: 'oferta-educativa', title: 'Oferta Educativa', active: true, order: 3 },
    { slug: 'comunidad', title: 'Comunidad', active: true, order: 4 },
    { slug: 'estudiantes', title: 'Estudiantes', active: true, order: 5 },
    { slug: 'docentes', title: 'Docentes', active: true, order: 6 },
    { slug: 'padres', title: 'Padres de Familia', active: true, order: 7 },
    { slug: 'egresados', title: 'Egresados', active: true, order: 8 },
    { slug: 'servicios', title: 'Servicios', active: true, order: 9 },
    { slug: 'contacto', title: 'Contacto', active: true, order: 10 },
    { slug: 'convocatorias', title: 'Convocatorias', active: true, order: 11 },
    { slug: 'calendario', title: 'Calendario', active: true, order: 12 },
    { slug: 'transparencia', title: 'Transparencia', active: true, order: 13 },
    { slug: 'normatividad', title: 'Normatividad', active: true, order: 14 },
    { slug: 'reglamento', title: 'Reglamento', active: true, order: 15 },
    { slug: 'biblioteca', title: 'Biblioteca', active: true, order: 16 },
    { slug: 'bolsa-trabajo', title: 'Bolsa de Trabajo', active: true, order: 17 },
    { slug: 'citas', title: 'Citas', active: true, order: 18 },
    { slug: 'pagos', title: 'Pagos', active: true, order: 19 },
    { slug: 'descargas', title: 'Descargas', active: true, order: 20 },
    { slug: 'sitios-interes', title: 'Sitios de Interés', active: true, order: 21 },
    { slug: 'aviso-privacidad', title: 'Aviso de Privacidad', active: true, order: 22 },
    { slug: 'terminos', title: 'Términos', active: true, order: 23 },
    { slug: 'gamification-center', title: 'Centro de Gamificación', active: true, order: 24 },
    { slug: 'ar-vr-lab', title: 'Laboratorio AR/VR', active: true, order: 25 },
    { slug: 'chatbot', title: 'Chatbot', active: true, order: 26 },
    { slug: 'encuestas', title: 'Encuestas', active: true, order: 27 },
];

// Secciones pre-pobladas por página
const DEFAULT_SECTIONS = {
    // ============================================
    // CONOCENOS: Secciones VACÍAS (el director llena)
    // ============================================
    'conocenos': [
        {
            key: 'mision',
            title: 'Nuestra Misión',
            subtitle: '',
            content: '',  // Vacío - el director llena desde su dashboard
            icon: 'fa-bullseye',
            order: 1
        },
        {
            key: 'vision',
            title: 'Nuestra Visión',
            subtitle: '',
            content: '',  // Vacío - el director llena desde su dashboard
            icon: 'fa-eye',
            order: 2
        },
        {
            key: 'historia',
            title: 'Nuestra Historia',
            subtitle: '',
            content: '',  // Vacío - el director llena desde su dashboard
            icon: 'fa-history',
            order: 3
        },
        {
            key: 'valores',
            title: 'Nuestros Valores',
            subtitle: '',
            content: '',
            icon: 'fa-heart',
            order: 4,
            items: []  // Vacío - el director agrega valores desde su dashboard
        },
        {
            key: 'infraestructura',
            title: 'Nuestra Infraestructura',
            subtitle: '',
            content: '',
            icon: 'fa-building',
            order: 5,
            items: []  // Vacío - el director agrega instalaciones desde su dashboard
        },
        {
            key: 'video_institucional',
            title: 'Video Institucional',
            subtitle: '',
            content: '',  // URL del video - el director llena
            icon: 'fa-video',
            order: 6
        },
        {
            key: 'mensaje_director',
            title: 'Mensaje del Director',
            subtitle: '',
            content: '',  // Vacío - el director llena
            icon: 'fa-user-tie',
            order: 7
        },
        {
            key: 'organigrama',
            title: 'Nuestro Equipo',
            subtitle: '',
            content: '',
            icon: 'fa-sitemap',
            order: 8,
            items: []  // Vacío - el director agrega personal desde su dashboard
        }
    ],

    // ============================================
    // OFERTA EDUCATIVA: Secciones SEP generales + Capacitación vacía
    // ============================================
    'oferta-educativa': [
        {
            key: 'modelo_educativo',
            title: 'Modelo Educativo',
            subtitle: 'Formación integral basada en competencias para el desarrollo del estudiante del siglo XXI',
            content: `<div class="row g-4 mb-5">
                <div class="col-lg-6">
                    <h4 class="text-primary mb-3"><i class="fas fa-brain me-2"></i>Enfoque por Competencias</h4>
                    <p class="text-muted mb-4">Nuestro modelo educativo se fundamenta en el desarrollo de competencias genéricas, disciplinares y profesionales que preparan a los estudiantes para los retos del mundo actual.</p>
                </div>
                <div class="col-lg-6">
                    <div class="bg-primary bg-opacity-10 rounded p-4 h-100 d-flex align-items-center">
                        <div class="text-center w-100">
                            <i class="fas fa-graduation-cap fa-4x text-primary mb-3"></i>
                            <h5 class="text-primary">Bachillerato General Estatal</h5>
                            <p class="text-muted mb-0">Plan de estudios oficial SEP Puebla</p>
                        </div>
                    </div>
                </div>
            </div>`,
            icon: 'fa-lightbulb',
            order: 1
        },
        {
            key: 'plan_estudios',
            title: 'Plan de Estudios',
            subtitle: 'Malla curricular de 6 semestres con enfoque por competencias',
            content: `<div class="accordion" id="planEstudiosAccordion">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#semestre1">
                            <i class="fas fa-graduation-cap me-2 text-primary"></i> <strong>1er Semestre</strong>
                        </button>
                    </h2>
                    <div id="semestre1" class="accordion-collapse collapse show" data-bs-parent="#planEstudiosAccordion">
                        <div class="accordion-body">
                            <ul class="mb-0">
                                <li>Formación Básica I</li>
                                <li>Lengua y Comunicación I</li>
                                <li>Matemáticas I</li>
                                <li>Ciencias Experimentales I</li>
                                <li>Ciencias Sociales I</li>
                                <li>Inglés I</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`,
            icon: 'fa-book-open',
            order: 2
        },
        {
            key: 'perfil_egreso',
            title: 'Perfil de Egreso',
            subtitle: 'Egresados con competencias para la vida universitaria y laboral',
            content: '<p class="text-muted">El egresado de nuestro bachillerato cuenta con las competencias necesarias para continuar sus estudios superiores o incorporarse al mercado laboral con una formación integral que incluye conocimientos, habilidades y valores.</p>',
            icon: 'fa-user-graduate',
            order: 3
        },
        {
            key: 'proceso_admision',
            title: 'Proceso de Admisión',
            subtitle: 'Requisitos y fechas para incorporarse a nuestra comunidad',
            content: '<p class="text-muted">Consulta los requisitos, fechas y procedimientos para el proceso de admisión del ciclo escolar vigente.</p>',
            icon: 'fa-clipboard-check',
            order: 4
        }
    ],

    // ============================================
    // BOLSA DE TRABAJO: Plantilla virgen para ofertas locales
    // ============================================
    'bolsa-trabajo': [
        {
            key: 'oportunidades_laborales',
            title: 'Oportunidades Laborales',
            subtitle: 'Encuentra vacantes y oportunidades vinculadas con el sector productivo',
            content: '',
            icon: 'fa-briefcase',
            order: 1
        },
        {
            key: 'empleos_destacados',
            title: 'Empleos Destacados',
            subtitle: 'Vacantes preferenciales para egresados y alumnos de últimos semestres',
            content: '',
            icon: 'fa-star',
            order: 2
        },
        {
            key: 'empresas_aliadas',
            title: 'Empresas Aliadas',
            subtitle: 'Convenios y vinculación con el sector empresarial e institucional',
            content: '',
            icon: 'fa-handshake',
            order: 3
        },
        {
            key: 'recursos_exito',
            title: 'Consejos y Recursos de Empleabilidad',
            subtitle: 'Guías para elaboración de CV, entrevistas y desarrollo profesional',
            content: '',
            icon: 'fa-graduation-cap',
            order: 4
        }
    ],

    // ============================================
    // COMUNIDAD
    // ============================================
    'comunidad': [
        {
            key: 'noticias',
            title: 'Noticias y Avisos',
            subtitle: 'Mantente informado de las actividades y avisos del plantel',
            content: '',
            icon: 'fa-newspaper',
            order: 1
        },
        {
            key: 'eventos',
            title: 'Próximos Eventos',
            subtitle: 'Calendario de actividades cívicas, culturales y académicas',
            content: '',
            icon: 'fa-calendar-alt',
            order: 2
        },
        {
            key: 'vida_estudiantil',
            title: 'Vida Estudiantil',
            subtitle: 'Conoce nuestra comunidad educativa',
            content: '<p class="text-muted">Una comunidad vibrante donde los estudiantes desarrollan su máximo potencial.</p>',
            icon: 'fa-users',
            order: 3
        },
        {
            key: 'actividades_extracurriculares',
            title: 'Actividades Extracurriculares',
            subtitle: 'Más allá del aula',
            content: '<p class="text-muted">Ofrecemos diversas actividades deportivas y culturales para el desarrollo integral.</p>',
            icon: 'fa-trophy',
            order: 4
        }
    ],

    // ============================================
    // ESTUDIANTES
    // ============================================
    'estudiantes': [
        {
            key: 'info_importante',
            title: 'Información Importante para Estudiantes',
            subtitle: 'Avisos escolares, reglamentos y fechas clave',
            content: '<p class="text-muted">Consulta información relevante para tu vida estudiantil cotidiana.</p>',
            icon: 'fa-info-circle',
            order: 1
        },
        {
            key: 'acceso_rapido',
            title: 'Acceso Rápido',
            subtitle: 'Accesos directos a plataformas oficiales y recursos escolares',
            content: '',
            icon: 'fa-bolt',
            order: 2
        },
        {
            key: 'recursos_academicos',
            title: 'Recursos Académicos & Plan Inteligente',
            subtitle: 'Materiales didácticos, guías de estudio y apoyo académico',
            content: '<p class="text-muted">Accede a recursos de apoyo, guías y biblioteca digital.</p>',
            icon: 'fa-book-open',
            order: 3
        }
    ],

    // ============================================
    // EGRESADOS
    // ============================================
    'egresados': [
        {
            key: 'historias_exito',
            title: 'Historias de Éxito',
            subtitle: 'Orgullo de nuestra comunidad: conoce los logros de nuestros egresados',
            content: '',
            icon: 'fa-star',
            order: 1
        },
        {
            key: 'seguimiento',
            title: 'Seguimiento a Egresados',
            subtitle: 'Programa de vinculación y acompañamiento continuo',
            content: '<p class="text-muted">Fomentamos el vínculo continuo con nuestros graduados para retroalimentar nuestros programas educativos.</p>',
            icon: 'fa-chart-line',
            order: 2
        },
        {
            key: 'red_contactos',
            title: 'Red de Contactos',
            subtitle: 'Conexión profesional y académica entre generaciones',
            content: '<p class="text-muted">Forma parte de la comunidad de graduados para networking y oportunidades.</p>',
            icon: 'fa-users',
            order: 3
        },
        {
            key: 'testimonios_egresados',
            title: 'Testimonios de Egresados',
            subtitle: 'Experiencias de vida y superación de exalumnos',
            content: '',
            icon: 'fa-quote-left',
            order: 4
        },
        {
            key: 'actualizar_datos',
            title: 'Actualización de Datos de Egresados',
            subtitle: 'Mantén tus datos de contacto actualizados',
            content: '<p class="text-muted">Permítenos mantenerte al tanto de eventos, convocatorias y proyectos del bachillerato.</p>',
            icon: 'fa-user-edit',
            order: 5
        }
    ],

    // ============================================
    // CONTACTO
    // ============================================
    'contacto': [
        {
            key: 'info_contacto',
            title: 'Información de Contacto',
            subtitle: 'Canales oficiales de atención e información',
            content: '<p class="text-muted">Comunícate con las oficinas del plantel para cualquier trámite o información.</p>',
            icon: 'fa-address-card',
            order: 1
        },
        {
            key: 'ubicacion',
            title: 'Mapa y Ubicación',
            subtitle: 'Cómo llegar a nuestro plantel educativo',
            content: '<p class="text-muted">Ubicación geográfica e instalaciones del bachillerato.</p>',
            icon: 'fa-map-marked-alt',
            order: 2
        },
        {
            key: 'directorio',
            title: 'Directorio Escolar',
            subtitle: 'Personal directivo, administrativo y docente',
            content: '',
            icon: 'fa-address-book',
            order: 3
        }
    ],

    // ============================================
    // SERVICIOS
    // ============================================
    'servicios': [
        {
            key: 'servicios_principales',
            title: 'Servicios Escolares Principales',
            subtitle: 'Trámites, constancias, credenciales y orientación educativa',
            content: '<p class="text-muted">Servicios y trámites escolares disponibles para alumnos y padres de familia.</p>',
            icon: 'fa-concierge-bell',
            order: 1
        },
        {
            key: 'horarios',
            title: 'Horarios de Atención',
            subtitle: 'Atención en ventanilla y oficinas administrativas',
            content: '<p class="text-muted">Lunes a Viernes en horario escolar del turno matutino y vespertino.</p>',
            icon: 'fa-clock',
            order: 2
        },
        {
            key: 'requisitos',
            title: 'Requisitos y Procedimientos',
            subtitle: 'Guía paso a paso para la realización de trámites escolares',
            content: '<p class="text-muted">Consulta la documentación requerida para cada uno de los trámites oficiales.</p>',
            icon: 'fa-list-check',
            order: 3
        }
    ],

    // ============================================
    // MÓDULOS ACTIVABLES: GAMIFICACIÓN Y AR/VR
    // ============================================
    'gamification-center': [
        {
            key: 'ranking',
            title: 'Ranking y Clasificación',
            subtitle: 'Tabla de liderazgo académico y participación',
            content: '',
            icon: 'fa-trophy',
            order: 1
        },
        {
            key: 'logros',
            title: 'Logros y Recompensas',
            subtitle: 'Insignias y reconocimientos otorgados a estudiantes',
            content: '',
            icon: 'fa-medal',
            order: 2
        }
    ],
    'ar-vr-lab': [
        {
            key: 'header_ar_vr',
            title: 'Laboratorio AR/VR',
            subtitle: 'Experiencias de aprendizaje inmersivas para el Bachillerato General Estatal',
            content: '<p class="text-muted">Módulo tecnológico de realidad aumentada y realidad virtual aplicada al aprendizaje.</p>',
            icon: 'fa-vr-cardboard',
            order: 1
        },
        {
            key: 'experiencias_ar_vr',
            title: 'Experiencias AR/VR Disponibles',
            subtitle: 'Simuladores y laboratorios virtuales para ciencias, matemáticas e historia',
            content: '',
            icon: 'fa-cubes',
            order: 2
        }
    ],

    // ============================================
    // BLOQUE 2: PÁGINAS INSTITUCIONALES
    // ============================================
    'inicio': [
        {
            key: 'por_que_elegirnos',
            title: '¿Por Qué Elegirnos?',
            subtitle: 'Razones que nos hacen único en educación',
            content: '',
            icon: 'fa-star',
            order: 1
        },
        {
            key: 'acceso_rapido',
            title: 'Acceso Rápido',
            subtitle: 'Encuentra rápidamente la información que necesitas',
            content: '',
            icon: 'fa-bolt',
            order: 2
        },
        {
            key: 'noticias_recientes',
            title: 'Noticias Recientes',
            subtitle: 'Mantente al día con las últimas novedades',
            content: '',
            icon: 'fa-newspaper',
            order: 3
        },
        {
            key: 'proximos_eventos',
            title: 'Próximos Eventos',
            subtitle: 'No te pierdas las fechas importantes',
            content: '',
            icon: 'fa-calendar-alt',
            order: 4
        },
        {
            key: 'cta_inscripcion',
            title: '¿Listo para formar parte?',
            subtitle: 'Conoce nuestro proceso de admisión',
            content: '',
            icon: 'fa-user-plus',
            order: 5
        }
    ],
    'padres': [
        {
            key: 'info_padres',
            title: 'Información para Padres',
            subtitle: 'Recursos y herramientas para las familias',
            content: '<p class="text-muted">Accede a información importante para el seguimiento académico de tus hijos.</p>',
            icon: 'fa-users',
            order: 1
        },
        {
            key: 'primera_vez',
            title: 'Primera Vez en la Plataforma',
            subtitle: 'Guía de registro y primeros pasos',
            content: '',
            icon: 'fa-user-plus',
            order: 2
        },
        {
            key: 'preguntas_frecuentes',
            title: 'Preguntas Frecuentes',
            subtitle: 'Resolvemos tus dudas más comunes',
            content: '',
            icon: 'fa-question-circle',
            order: 3
        }
    ],
    'convocatorias': [
        {
            key: 'inscripciones',
            title: 'Inscripciones 2025',
            subtitle: 'Proceso de admisión y requisitos',
            content: '',
            icon: 'fa-clipboard-list',
            order: 1
        },
        {
            key: 'convocatorias_activas',
            title: 'Convocatorias Activas',
            subtitle: 'Oportunidades vigentes para nuestra comunidad',
            content: '',
            icon: 'fa-bullhorn',
            order: 2
        },
        {
            key: 'proximas_convocatorias',
            title: 'Próximas Convocatorias',
            subtitle: 'Eventos y oportunidades próximas',
            content: '',
            icon: 'fa-clock',
            order: 3
        }
    ],
    'calendario': [
        {
            key: 'ciclo_escolar',
            title: 'Ciclo Escolar Vigente',
            subtitle: 'Fechas oficiales del calendario SEP',
            content: '',
            icon: 'fa-calendar-check',
            order: 1
        },
        {
            key: 'periodos_academicos',
            title: 'Periodos Académicos',
            subtitle: 'Semestres, cortes y vacaciones',
            content: '',
            icon: 'fa-clock',
            order: 2
        },
        {
            key: 'tipos_eventos',
            title: 'Tipos de Eventos',
            subtitle: 'Calendario cívicos, culturales y deportivos',
            content: '',
            icon: 'fa-calendar',
            order: 3
        }
    ],
    'transparencia': [
        {
            key: 'informacion_general',
            title: 'Información General',
            subtitle: 'Datos institucionales de transparencia',
            content: '',
            icon: 'fa-info-circle',
            order: 1
        },
        {
            key: 'documentos_transparencia',
            title: 'Documentos de Transparencia',
            subtitle: 'Informes y documentos oficiales',
            content: '',
            icon: 'fa-file-alt',
            order: 2
        },
        {
            key: 'solicitudes_informacion',
            title: 'Solicitudes de Información',
            subtitle: 'Procedimiento para solicitar información pública',
            content: '',
            icon: 'fa-file-signature',
            order: 3
        },
        {
            key: 'documentos_financieros',
            title: 'Documentos Financieros',
            subtitle: 'Presupuesto, rendición de cuentas',
            content: '',
            icon: 'fa-dollar-sign',
            order: 4
        }
    ],
    'normatividad': [
        {
            key: 'reglamento_escolar',
            title: 'Reglamento Escolar',
            subtitle: 'Normatividad interna del plantel',
            content: '',
            icon: 'fa-gavel',
            order: 1
        },
        {
            key: 'resumen_reglamento',
            title: 'Resumen del Reglamento',
            subtitle: 'Puntos más importantes del reglamento',
            content: '',
            icon: 'fa-list-ol',
            order: 2
        },
        {
            key: 'normatividad_externa',
            title: 'Normatividad Externa',
            subtitle: 'Leyes y lineamientos de la SEP',
            content: '',
            icon: 'fa-landmark',
            order: 3
        }
    ],
    'reglamento': [
        {
            key: 'medidas_disciplinarias',
            title: 'Medidas Disciplinarias',
            subtitle: 'Faltas y consecuencias establecidas',
            content: '',
            icon: 'fa-exclamation-triangle',
            order: 1
        },
        {
            key: 'notas_explicativas',
            title: 'Notas Explicativas',
            subtitle: 'Aclaraciones y observaciones al reglamento',
            content: '',
            icon: 'fa-sticky-note',
            order: 2
        }
    ],
    'descargas': [
        {
            key: 'documentos_destacados',
            title: 'Documentos Destacados',
            subtitle: 'Formatos y solicitudes más descargados',
            content: '',
            icon: 'fa-file-download',
            order: 1
        },
        {
            key: 'categorias_documentos',
            title: 'Categorías de Documentos',
            subtitle: 'Explora por tipo de documento',
            content: '',
            icon: 'fa-folder-open',
            order: 2
        },
        {
            key: 'guia_usuario',
            title: 'Guía del Usuario',
            subtitle: 'Cómo descargar y utilizar los formatos',
            content: '',
            icon: 'fa-book',
            order: 3
        }
    ],

    // ============================================
    // BLOQUE 3: ÚLTIMAS PÁGINAS
    // ============================================
    'citas': [
        {
            key: 'departamentos_servicios',
            title: 'Departamentos y Servicios',
            subtitle: 'Conoce los departamentos disponibles para agendar tu cita',
            content: '',
            icon: 'fa-building',
            order: 1
        },
        {
            key: 'como_funciona',
            title: 'Cómo Funciona',
            subtitle: 'Pasos para agendar tu cita escolar',
            content: '',
            icon: 'fa-list-ol',
            order: 2
        },
        {
            key: 'preguntas_frecuentes',
            title: 'Preguntas Frecuentes',
            subtitle: 'Dudas comunes sobre el sistema de citas',
            content: '',
            icon: 'fa-question-circle',
            order: 3
        }
    ],
    'pagos': [
        {
            key: 'servicios_disponibles',
            title: 'Servicios Disponibles',
            subtitle: 'Trámites y servicios que requieren pago',
            content: '',
            icon: 'fa-concierge-bell',
            order: 1
        },
        {
            key: 'metodos_pago',
            title: 'Métodos de Pago',
            subtitle: 'Formas de pago aceptadas',
            content: '',
            icon: 'fa-credit-card',
            order: 2
        },
        {
            key: 'ventajas',
            title: 'Ventajas',
            subtitle: 'Beneficios del pago en línea',
            content: '',
            icon: 'fa-check-circle',
            order: 3
        }
    ],
    'sitios-interes': [
        {
            key: 'recursos_educativos',
            title: 'Recursos Educativos',
            subtitle: 'Plataformas y herramientas de aprendizaje',
            content: '',
            icon: 'fa-graduation-cap',
            order: 1
        },
        {
            key: 'universidades',
            title: 'Universidades',
            subtitle: 'Instituciones de educación superior',
            content: '',
            icon: 'fa-university',
            order: 2
        },
        {
            key: 'herramientas_productividad',
            title: 'Herramientas de Productividad',
            subtitle: 'Aplicaciones y recursos digitales',
            content: '',
            icon: 'fa-tools',
            order: 3
        },
        {
            key: 'sitios_gubernamentales',
            title: 'Sitios Gubernamentales',
            subtitle: 'Portales oficiales de la SEP y gobierno',
            content: '',
            icon: 'fa-landmark',
            order: 4
        }
    ],
    'aviso-privacidad': [
        {
            key: 'aviso_privacidad',
            title: 'Aviso de Privacidad',
            subtitle: 'Términos y condiciones de protección de datos',
            content: '',
            icon: 'fa-shield-alt',
            order: 1
        }
    ],
    'terminos': [
        {
            key: 'terminos_condiciones',
            title: 'Términos y Condiciones',
            subtitle: 'Lineamientos de uso de la plataforma',
            content: '',
            icon: 'fa-file-contract',
            order: 1
        }
    ],
    'chatbot': [
        {
            key: 'como_usar',
            title: 'Cómo Usar el Chatbot',
            subtitle: 'Guía para interactuar con nuestro asistente virtual',
            content: '',
            icon: 'fa-robot',
            order: 1
        },
        {
            key: 'funciones_disponibles',
            title: 'Funciones Disponibles',
            subtitle: 'Todo lo que puedes hacer con el chatbot',
            content: '',
            icon: 'fa-cogs',
            order: 2
        },
        {
            key: 'preguntas_frecuentes',
            title: 'Preguntas Frecuentes',
            subtitle: 'Resolvemos tus dudas sobre el chatbot',
            content: '',
            icon: 'fa-question-circle',
            order: 3
        }
    ],
    'encuestas': [
        {
            key: 'encuestas_activas',
            title: 'Encuestas Activas',
            subtitle: 'Participa en nuestras encuestas escolares',
            content: '',
            icon: 'fa-poll',
            order: 1
        },
        {
            key: 'info_encuestas',
            title: 'Información de Encuestas',
            subtitle: 'Cómo participar y por qué tu opinión importa',
            content: '',
            icon: 'fa-info-circle',
            order: 2
        }
    ],
    'docentes': [
        {
            key: 'recursos_docentes',
            title: 'Recursos Docentes',
            subtitle: 'Materiales y herramientas para el personal docente',
            content: '',
            icon: 'fa-chalkboard-teacher',
            order: 1
        },
        {
            key: 'comunicados_academia',
            title: 'Comunicados de Academia',
            subtitle: 'Avisos oficiales del departamento académico',
            content: '',
            icon: 'fa-bullhorn',
            order: 2
        }
    ]
};

async function seedPageSections(tenantId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log(`\n🌱 Poblando secciones para tenant_id = ${tenantId}...\n`);

        // 1. Crear configuración de páginas
        for (const page of PAGE_CONFIGS) {
            await client.query(
                `INSERT INTO tenant_page_configs (tenant_id, page_slug, page_title, is_active, sort_order)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (tenant_id, page_slug) DO NOTHING`,
                [tenantId, page.slug, page.title, page.active, page.order]
            );
            console.log(`  ✅ Página: ${page.slug}`);
        }

        // 2. Crear secciones pre-pobladas
        for (const [pageSlug, sections] of Object.entries(DEFAULT_SECTIONS)) {
            for (const section of sections) {
                // Crear sección
                const sectionResult = await client.query(
                    `INSERT INTO tenant_page_sections
                     (tenant_id, page_slug, section_key, section_title, section_subtitle, section_content, section_icon, is_active, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
                     ON CONFLICT (tenant_id, page_slug, section_key) DO NOTHING
                     RETURNING id`,
                    [tenantId, pageSlug, section.key, section.title, section.subtitle || '', section.content || '', section.icon || '', section.order]
                );

                // Crear items si existen
                if (section.items && sectionResult.rows.length > 0) {
                    const sectionId = sectionResult.rows[0].id;
                    for (const item of section.items) {
                        await client.query(
                            `INSERT INTO tenant_section_items
                             (section_id, tenant_id, item_key, item_title, item_content, item_icon, is_active, sort_order)
                             VALUES ($1, $2, $3, $4, $5, $6, true, $7)
                             ON CONFLICT DO NOTHING`,
                            [sectionId, tenantId, item.key, item.title, item.content, item.icon || '', 0]
                        );
                    }
                }

                console.log(`  ✅ Sección: ${pageSlug}/${section.key}`);
            }
        }

        await client.query('COMMIT');
        console.log('\n✅ ¡Población completada exitosamente!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error durante la población:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Ejecutar
const tenantId = process.argv[2] ? parseInt(process.argv[2]) : 1;

seedPageSections(tenantId)
    .then(() => {
        console.log('🎉 Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error:', error.message);
        process.exit(1);
    });
