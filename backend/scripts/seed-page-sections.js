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
 * - Se agregó plan_estudios y capacitacion_trabajo (excluida del seed)
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
            key: 'capacitacion_trabajo',
            title: 'Capacitación para el Trabajo',
            subtitle: 'Desarrolla habilidades técnicas específicas para el ámbito laboral',
            content: '',  // Vacío - cada bachillerato configura sus talleres y especialidades
            icon: 'fa-tools',
            order: 3
        },
        {
            key: 'perfil_egreso',
            title: 'Perfil de Egreso',
            subtitle: 'Egresados con competencias para la vida universitaria y laboral',
            content: '<p class="text-muted">El egresado de nuestro bachillerato cuenta con las competencias necesarias para continuar sus estudios superiores o incorporarse al mercado laboral con una formación integral que incluye conocimientos, habilidades y valores.</p>',
            icon: 'fa-user-graduate',
            order: 4
        },
        {
            key: 'proceso_admision',
            title: 'Proceso de Admisión',
            subtitle: 'Requisitos y fechas para incorporarse a nuestra comunidad',
            content: '<p class="text-muted">Consulta los requisitos, fechas y procedimientos para el proceso de admisión del ciclo escolar vigente.</p>',
            icon: 'fa-clipboard-check',
            order: 5
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
