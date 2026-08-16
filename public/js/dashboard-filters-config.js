/**
 * DASHBOARD FILTERS CONFIG
 * Configuración de filtros avanzados para el Admin Dashboard
 * Fecha: 19 de Octubre, 2025
 */

const dashboardFiltersConfig = {
    // ========================================
    // FILTROS PARA NOTICIAS
    // ========================================
    noticias: {
        containerId: 'noticiasFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Título o contenido...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'categoria',
                type: 'select',
                label: 'Categoría',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'académico', label: 'Académico' },
                    { value: 'administrativo', label: 'Administrativo' },
                    { value: 'cultural', label: 'Cultural' },
                    { value: 'deportivo', label: 'Deportivo' },
                    { value: 'social', label: 'Social' },
                    { value: 'general', label: 'General' }
                ]
            },
            {
                name: 'autor',
                type: 'text',
                label: 'Autor',
                placeholder: 'Nombre del autor',
                width: 'col-12 col-md-2'
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Rango de Fechas',
                width: 'col-12 col-md-3'
            },
            {
                name: 'destacado',
                type: 'checkbox',
                label: 'Solo Destacadas',
                placeholder: 'Solo mostrar destacadas',
                width: 'col-12 col-md-2'
            }
        ]
    },

    // ========================================
    // FILTROS PARA EVENTOS
    // ========================================
    eventos: {
        containerId: 'eventosFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Título o descripción...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'categoria',
                type: 'select',
                label: 'Categoría',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'académico', label: 'Académico' },
                    { value: 'cultural', label: 'Cultural' },
                    { value: 'deportivo', label: 'Deportivo' },
                    { value: 'social', label: 'Social' },
                    { value: 'institucional', label: 'Institucional' },
                    { value: 'otro', label: 'Otro' }
                ]
            },
            {
                name: 'estado',
                type: 'select',
                label: 'Estado',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'programado', label: 'Programado' },
                    { value: 'en_curso', label: 'En Curso' },
                    { value: 'finalizado', label: 'Finalizado' },
                    { value: 'cancelado', label: 'Cancelado' }
                ]
            },
            {
                name: 'modalidad',
                type: 'select',
                label: 'Modalidad',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'presencial', label: 'Presencial' },
                    { value: 'virtual', label: 'Virtual' },
                    { value: 'híbrido', label: 'Híbrido' }
                ]
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Rango de Fechas',
                width: 'col-12 col-md-3'
            }
        ]
    },

    // ========================================
    // FILTROS PARA AVISOS
    // ========================================
    avisos: {
        containerId: 'avisosFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Título o contenido...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'tipo',
                type: 'select',
                label: 'Tipo',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'informativo', label: 'Informativo' },
                    { value: 'advertencia', label: 'Advertencia' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'general', label: 'General' }
                ]
            },
            {
                name: 'prioridad',
                type: 'select',
                label: 'Prioridad',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'baja', label: 'Baja' },
                    { value: 'media', label: 'Media' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'urgente', label: 'Urgente' }
                ]
            },
            {
                name: 'vigente',
                type: 'checkbox',
                label: 'Solo Vigentes',
                placeholder: 'Solo mostrar avisos vigentes',
                width: 'col-12 col-md-2'
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Rango de Fechas',
                width: 'col-12 col-md-3'
            }
        ]
    },

    // ========================================
    // FILTROS PARA COMUNICADOS
    // ========================================
    comunicados: {
        containerId: 'comunicadosFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Título o contenido...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'tipo',
                type: 'select',
                label: 'Tipo',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'oficial', label: 'Oficial' },
                    { value: 'informativo', label: 'Informativo' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'circular', label: 'Circular' }
                ]
            },
            {
                name: 'destinatario',
                type: 'select',
                label: 'Destinatario',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'alumnos', label: 'Alumnos' },
                    { value: 'padres', label: 'Padres' },
                    { value: 'docentes', label: 'Docentes' },
                    { value: 'general', label: 'General' },
                    { value: 'administrativo', label: 'Administrativo' }
                ]
            },
            {
                name: 'remitente',
                type: 'text',
                label: 'Remitente',
                placeholder: 'Nombre del remitente',
                width: 'col-12 col-md-2'
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Rango de Fechas',
                width: 'col-12 col-md-3'
            }
        ]
    },

    // ========================================
    // FILTROS PARA EGRESADOS
    // ========================================
    egresados: {
        containerId: 'egresadosFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Nombre o email...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'anio_egreso',
                type: 'number',
                label: 'Año de Egreso',
                placeholder: '2020',
                min: 1990,
                max: new Date().getFullYear(),
                width: 'col-12 col-md-2'
            },
            {
                name: 'generacion',
                type: 'text',
                label: 'Generación',
                placeholder: '2018-2021',
                width: 'col-12 col-md-2'
            },
            {
                name: 'activo',
                type: 'checkbox',
                label: 'Solo Activos',
                placeholder: 'Solo mostrar egresados activos',
                width: 'col-12 col-md-2'
            }
        ]
    },

    // ========================================
    // FILTROS PARA BOLSA DE TRABAJO
    // ========================================
    bolsaTrabajo: {
        containerId: 'bolsaTrabajoFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Nombre o profesión...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'profesion',
                type: 'text',
                label: 'Profesión',
                placeholder: 'Ingeniero, Docente...',
                width: 'col-12 col-md-2'
            },
            {
                name: 'area_interes',
                type: 'select',
                label: 'Área de Interés',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'educacion', label: 'Educación' },
                    { value: 'tecnologia', label: 'Tecnología' },
                    { value: 'salud', label: 'Salud' },
                    { value: 'administracion', label: 'Administración' },
                    { value: 'servicios', label: 'Servicios' },
                    { value: 'otro', label: 'Otro' }
                ]
            },
            {
                name: 'experiencia_min',
                type: 'number',
                label: 'Experiencia Mínima (años)',
                placeholder: '0',
                min: 0,
                max: 50,
                width: 'col-12 col-md-2'
            },
            {
                name: 'estado',
                type: 'select',
                label: 'Estado',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'revisado', label: 'Revisado' },
                    { value: 'aprobado', label: 'Aprobado' },
                    { value: 'rechazado', label: 'Rechazado' }
                ]
            }
        ]
    },

    // ========================================
    // FILTROS PARA QUEJAS Y SUGERENCIAS
    // ========================================
    quejas: {
        containerId: 'quejasFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Asunto o descripción...',
                width: 'col-12 col-md-3'
            },
            {
                name: 'tipo',
                type: 'select',
                label: 'Tipo',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'queja', label: 'Queja' },
                    { value: 'sugerencia', label: 'Sugerencia' },
                    { value: 'felicitacion', label: 'Felicitación' }
                ]
            },
            {
                name: 'estado',
                type: 'select',
                label: 'Estado',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'en_revision', label: 'En Revisión' },
                    { value: 'resuelto', label: 'Resuelto' },
                    { value: 'cerrado', label: 'Cerrado' }
                ]
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Rango de Fechas',
                width: 'col-12 col-md-3'
            }
        ]
    },

    // ========================================
    // FILTROS PARA SUSCRIPTORES
    // ========================================
    suscriptores: {
        containerId: 'suscriptoresFiltersContainer',
        autoApply: false,
        filters: [
            {
                name: 'search',
                type: 'text',
                label: 'Buscar',
                placeholder: 'Email o nombre...',
                width: 'col-12 col-md-4'
            },
            {
                name: 'activo',
                type: 'select',
                label: 'Estado',
                width: 'col-12 col-md-2',
                options: [
                    { value: 'true', label: 'Activos' },
                    { value: 'false', label: 'Inactivos' }
                ]
            },
            {
                name: 'fecha',
                type: 'dateRange',
                label: 'Fecha de Suscripción',
                width: 'col-12 col-md-4'
            }
        ]
    }
};

/**
 * Inicializa filtros para un módulo específico
 * @param {string} moduleName - Nombre del módulo (noticias, eventos, etc.)
 * @param {Function} onFilterChange - Callback cuando cambian los filtros
 * @returns {AdvancedFilters} - Instancia del filtro
 */
function initDashboardFilters(moduleName, onFilterChange) {
    const config = dashboardFiltersConfig[moduleName];

    if (!config) {
        void 0;
        return null;
    }

    // Verificar que el contenedor existe
    const container = document.getElementById(config.containerId);
    if (!container) {
        void 0;
        return null;
    }

    // Crear instancia de filtros
    const filterInstance = createAdvancedFilters({
        ...config,
        onFilterChange: (filterValues) => {
            void 0;

            if (typeof onFilterChange === 'function') {
                onFilterChange(filterValues);
            }
        }
    });

    void 0;

    return filterInstance;
}

/**
 * Obtiene la configuración de filtros para un módulo
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object} - Configuración de filtros
 */
function getFilterConfig(moduleName) {
    return dashboardFiltersConfig[moduleName];
}
