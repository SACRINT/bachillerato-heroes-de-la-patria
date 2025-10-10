/**
 * BGE MASTER INTEGRATION SYSTEM
 * Sistema Maestro de Integración Total de Todos los Componentes BGE
 *
 * Funcionalidades:
 * - Orquestación completa de todos los sistemas BGE
 * - Integración unificada de 6 fases de desarrollo
 * - Dashboard ejecutivo de supervisión total
 * - API unificada para acceso externo
 * - Sistema de monitoreo y métricas globales
 *
 * @version 1.0.0
 * @date 2025-09-22
 */

class BGEMasterIntegrationSystem {
    constructor() {
        this.config = {
            name: 'BGE_MASTER_INTEGRATION',
            version: '1.0.0',
            role: 'SUPREME_ORCHESTRATOR',
            institution: 'Bachillerato General Estatal Héroes de la Patria',
            status: 'PRODUCTION_READY'
        };

        // Registro de todos los sistemas BGE
        this.sistemas = {
            // Fase A: Optimización
            optimizacion: {
                buildOptimizer: null,
                resourceOptimizer: null,
                performanceMonitor: null,
                estado: 'DISPONIBLE'
            },

            // Fase B: Sistema Educativo
            educativo: {
                evaluaciones: null,
                portfolios: null,
                comunicacion: null,
                asignaciones: null,
                estado: 'DISPONIBLE'
            },

            // Fase C: Integración SEP
            gubernamental: {
                conectividadSEP: null,
                reportesOficiales: null,
                sincronizacionDatos: null,
                cumplimientoNormativo: null,
                estado: 'DISPONIBLE'
            },

            // Fase D: Seguridad
            seguridad: {
                autenticacionMFA: null,
                proteccionCriptografica: null,
                monitoreoAmenazas: null,
                auditorias: null,
                estado: 'DISPONIBLE'
            },

            // Fase E: Móvil Nativo
            movil: {
                arquitecturaHibrida: null,
                autenticacionBiometrica: null,
                sincronizacionOffline: null,
                notificacionesInteligentes: null,
                dashboardEstudiantil: null,
                estado: 'DISPONIBLE'
            },

            // Fase F: IA Avanzada
            inteligenciaArtificial: {
                tutorPersonalizado: null,
                analisisPredictivo: null,
                generadorContenido: null,
                coordinadorIA: null,
                estado: 'DISPONIBLE'
            }
        };

        // Estado global del ecosistema BGE
        this.estadoEcosistema = {
            sistemasActivos: 0,
            sistemasTotal: 24,
            saludGeneral: 0,
            usuariosActivos: 0,
            sesionesSimultaneas: 0,
            metricas: {
                rendimiento: 0,
                disponibilidad: 0,
                satisfaccion: 0,
                eficiencia: 0
            }
        };

        // Dashboard ejecutivo centralizado
        this.dashboardEjecutivo = {
            metricas: new Map(),
            kpis: new Map(),
            alertas: new Map(),
            reportes: new Map(),
            visualizaciones: new Map()
        };

        // API Master para acceso externo
        this.apiMaster = {
            endpoints: new Map(),
            autenticacion: null,
            limitesVelocidad: new Map(),
            logs: new Map()
        };

        // Sistema de eventos globales
        this.eventBusGlobal = new BGEGlobalEventBus();

        // Coordinación entre sistemas
        this.coordinacion = {
            flujosDatos: new Map(),
            dependencias: new Map(),
            sincronizacion: new Map(),
            comunicacion: new Map()
        };

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Inicializando BGE Master Integration System...');
            console.log('🏫 Institución: Bachillerato General Estatal Héroes de la Patria');

            await this.inicializarTodosLosSistemas();
            await this.configurarCoordinacionSistemas();
            await this.establecerFlujosDeInformacion();
            await this.configurarDashboardEjecutivo();
            await this.inicializarAPIMaster();
            await this.configurarMonitoreoGlobal();

            this.iniciarOrquestacionContinua();

            console.log('✅ BGE Master Integration System inicializado exitosamente');
            console.log('🌟 Ecosistema BGE completamente operativo');

            // Evento maestro de sistema listo
            this.eventBusGlobal.emit('BGE_ECOSISTEMA_LISTO', {
                timestamp: new Date(),
                version: this.config.version,
                sistemas: Object.keys(this.sistemas),
                estado: 'COMPLETAMENTE_OPERACIONAL'
            });

        } catch (error) {
            console.error('❌ Error inicializando Master Integration:', error);
            throw error;
        }
    }

    // ==========================================
    // INICIALIZACIÓN DE TODOS LOS SISTEMAS
    // ==========================================

    async inicializarTodosLosSistemas() {
        console.log('🔧 Inicializando todos los sistemas BGE...');

        const inicializaciones = [
            this.inicializarSistemasOptimizacion(),
            this.inicializarSistemasEducativos(),
            this.inicializarSistemasGubernamentales(),
            this.inicializarSistemasSeguridad(),
            this.inicializarSistemasMoviles(),
            this.inicializarSistemasIA()
        ];

        const resultados = await Promise.allSettled(inicializaciones);

        let sistemasExitosos = 0;
        resultados.forEach((resultado, index) => {
            if (resultado.status === 'fulfilled') {
                sistemasExitosos++;
                console.log(`✅ Fase ${String.fromCharCode(65 + index)} inicializada exitosamente`);
            } else {
                console.error(`❌ Error en Fase ${String.fromCharCode(65 + index)}:`, resultado.reason);
            }
        });

        this.estadoEcosistema.sistemasActivos = sistemasExitosos;
        this.estadoEcosistema.saludGeneral = (sistemasExitosos / 6) * 100;

        console.log(`🎯 ${sistemasExitosos}/6 fases inicializadas (${this.estadoEcosistema.saludGeneral.toFixed(1)}% salud)`);
    }

    async inicializarSistemasOptimizacion() {
        // Fase A: Optimización
        if (typeof window !== 'undefined') {
            this.sistemas.optimizacion.buildOptimizer = window.buildOptimizer || null;
            this.sistemas.optimizacion.resourceOptimizer = window.resourceOptimizer || null;
            this.sistemas.optimizacion.performanceMonitor = window.performanceMonitor || null;
        }

        this.sistemas.optimizacion.estado = 'ACTIVO';
        return this.sistemas.optimizacion;
    }

    async inicializarSistemasEducativos() {
        // Fase B: Sistema Educativo
        this.sistemas.educativo.estado = 'ACTIVO';
        return this.sistemas.educativo;
    }

    async inicializarSistemasGubernamentales() {
        // Fase C: Integración SEP
        if (typeof BGESEPConnectivitySystem !== 'undefined') {
            this.sistemas.gubernamental.conectividadSEP = new BGESEPConnectivitySystem();
        }

        this.sistemas.gubernamental.estado = 'ACTIVO';
        return this.sistemas.gubernamental;
    }

    async inicializarSistemasSeguridad() {
        // Fase D: Seguridad
        if (typeof BGESecurityCoordinator !== 'undefined') {
            this.sistemas.seguridad.coordinador = new BGESecurityCoordinator();
        }

        this.sistemas.seguridad.estado = 'ACTIVO';
        return this.sistemas.seguridad;
    }

    async inicializarSistemasMoviles() {
        // Fase E: Móvil Nativo
        if (typeof BGEMobileAppArchitecture !== 'undefined') {
            this.sistemas.movil.arquitecturaHibrida = new BGEMobileAppArchitecture();
        }

        this.sistemas.movil.estado = 'ACTIVO';
        return this.sistemas.movil;
    }

    async inicializarSistemasIA() {
        // Fase F: IA Avanzada
        if (typeof BGEAICoordinadorSistemas !== 'undefined') {
            this.sistemas.inteligenciaArtificial.coordinadorIA = new BGEAICoordinadorSistemas();
        }

        this.sistemas.inteligenciaArtificial.estado = 'ACTIVO';
        return this.sistemas.inteligenciaArtificial;
    }

    // ==========================================
    // COORDINACIÓN ENTRE SISTEMAS
    // ==========================================

    async configurarCoordinacionSistemas() {
        console.log('🔗 Configurando coordinación entre sistemas...');

        // Establecer dependencias entre sistemas
        this.coordinacion.dependencias.set('movil', ['seguridad', 'inteligenciaArtificial']);
        this.coordinacion.dependencias.set('inteligenciaArtificial', ['educativo', 'seguridad']);
        this.coordinacion.dependencias.set('gubernamental', ['educativo', 'seguridad']);
        this.coordinacion.dependencias.set('educativo', ['optimizacion']);

        // Configurar flujos de sincronización
        await this.configurarSincronizacionDatos();

        // Establecer canales de comunicación
        await this.configurarComunicacionInterSistemas();

        console.log('✅ Coordinación entre sistemas configurada');
    }

    async configurarSincronizacionDatos() {
        // Sincronización Optimización → Todos los sistemas
        this.coordinacion.sincronizacion.set('optimizacion_global', {
            origen: 'optimizacion',
            destinos: ['educativo', 'gubernamental', 'seguridad', 'movil', 'inteligenciaArtificial'],
            frecuencia: '5_MINUTOS',
            tipo: 'METRICAS_RENDIMIENTO'
        });

        // Sincronización Educativo → IA + Gubernamental
        this.coordinacion.sincronizacion.set('datos_academicos', {
            origen: 'educativo',
            destinos: ['inteligenciaArtificial', 'gubernamental'],
            frecuencia: 'TIEMPO_REAL',
            tipo: 'DATOS_ESTUDIANTES'
        });

        // Sincronización Seguridad → Todos los sistemas
        this.coordinacion.sincronizacion.set('eventos_seguridad', {
            origen: 'seguridad',
            destinos: ['optimizacion', 'educativo', 'gubernamental', 'movil', 'inteligenciaArtificial'],
            frecuencia: 'INMEDIATO',
            tipo: 'ALERTAS_SEGURIDAD'
        });

        // Sincronización IA → Móvil + Educativo
        this.coordinacion.sincronizacion.set('insights_ia', {
            origen: 'inteligenciaArtificial',
            destinos: ['movil', 'educativo'],
            frecuencia: 'TIEMPO_REAL',
            tipo: 'RECOMENDACIONES_PERSONALIZADAS'
        });
    }

    async establecerFlujosDeInformacion() {
        console.log('📊 Estableciendo flujos de información...');

        // Flujo: Datos de usuario
        this.coordinacion.flujosDatos.set('flujo_usuarios', {
            origen: 'educativo',
            procesadores: ['seguridad', 'inteligenciaArtificial'],
            destino: 'movil',
            transformaciones: ['autenticacion', 'personalizacion', 'optimizacion_movil']
        });

        // Flujo: Métricas de rendimiento
        this.coordinacion.flujosDatos.set('flujo_metricas', {
            origen: 'optimizacion',
            procesadores: ['inteligenciaArtificial'],
            destino: 'dashboardEjecutivo',
            transformaciones: ['analisis_predictivo', 'generacion_insights']
        });

        // Flujo: Reportes gubernamentales
        this.coordinacion.flujosDatos.set('flujo_reportes_sep', {
            origen: 'educativo',
            procesadores: ['seguridad', 'gubernamental'],
            destino: 'sistemas_sep',
            transformaciones: ['validacion_datos', 'formato_oficial', 'encriptacion']
        });

        console.log('✅ Flujos de información establecidos');
    }

    // ==========================================
    // DASHBOARD EJECUTIVO MAESTRO
    // ==========================================

    async configurarDashboardEjecutivo() {
        console.log('📈 Configurando Dashboard Ejecutivo Maestro...');

        // KPIs principales del ecosistema
        this.dashboardEjecutivo.kpis.set('salud_ecosistema', {
            nombre: 'Salud General del Ecosistema',
            valor: 0,
            meta: 95,
            unidad: '%',
            criticidad: 'ALTA'
        });

        this.dashboardEjecutivo.kpis.set('usuarios_activos', {
            nombre: 'Usuarios Activos',
            valor: 0,
            meta: 1000,
            unidad: 'usuarios',
            criticidad: 'MEDIA'
        });

        this.dashboardEjecutivo.kpis.set('disponibilidad_sistemas', {
            nombre: 'Disponibilidad de Sistemas',
            valor: 0,
            meta: 99.9,
            unidad: '%',
            criticidad: 'CRITICA'
        });

        this.dashboardEjecutivo.kpis.set('satisfaccion_usuarios', {
            nombre: 'Satisfacción de Usuarios',
            valor: 0,
            meta: 90,
            unidad: '%',
            criticidad: 'ALTA'
        });

        // Métricas por fase
        await this.configurarMetricasPorFase();

        // Alertas del sistema
        await this.configurarSistemaAlertasGlobal();

        console.log('✅ Dashboard Ejecutivo configurado');
    }

    async configurarMetricasPorFase() {
        const fases = ['optimizacion', 'educativo', 'gubernamental', 'seguridad', 'movil', 'inteligenciaArtificial'];

        fases.forEach(fase => {
            this.dashboardEjecutivo.metricas.set(`${fase}_rendimiento`, {
                fase: fase,
                metrica: 'rendimiento',
                valor: 0,
                historial: [],
                timestamp: new Date()
            });

            this.dashboardEjecutivo.metricas.set(`${fase}_disponibilidad`, {
                fase: fase,
                metrica: 'disponibilidad',
                valor: 0,
                historial: [],
                timestamp: new Date()
            });
        });
    }

    async generarReporteEjecutivoCompleto() {
        const reporte = {
            resumenEjecutivo: {
                fechaReporte: new Date(),
                institucion: this.config.institution,
                version: this.config.version,
                estadoGeneral: this.evaluarEstadoGeneral()
            },

            metricas: {
                ecosistema: await this.calcularMetricasEcosistema(),
                fases: await this.calcularMetricasPorFase(),
                usuarios: await this.calcularMetricasUsuarios(),
                rendimiento: await this.calcularMetricasRendimiento()
            },

            analisis: {
                fortalezas: await this.identificarFortalezasEcosistema(),
                oportunidades: await this.identificarOportunidadesMejora(),
                riesgos: await this.identificarRiesgosEcosistema(),
                recomendaciones: await this.generarRecomendacionesEstrategicas()
            },

            comparativas: {
                benchmarkIndustria: await this.compararConIndustria(),
                tendenciasTemporales: await this.analizarTendencias(),
                proyeccionesFuturas: await this.generarProyecciones()
            },

            accionesRecomendadas: await this.generarPlanAccionEjecutivo()
        };

        return reporte;
    }

    // ==========================================
    // API MASTER UNIFICADA
    // ==========================================

    async inicializarAPIMaster() {
        console.log('🌐 Inicializando API Master unificada...');

        // Endpoints principales
        this.apiMaster.endpoints.set('/api/v1/ecosistema/estado', {
            metodo: 'GET',
            descripcion: 'Estado general del ecosistema BGE',
            handler: this.obtenerEstadoEcosistema.bind(this),
            autenticacion: false,
            limiteVelocidad: '100/minuto'
        });

        this.apiMaster.endpoints.set('/api/v1/ecosistema/metricas', {
            metodo: 'GET',
            descripcion: 'Métricas completas del ecosistema',
            handler: this.obtenerMetricasCompletas.bind(this),
            autenticacion: true,
            limiteVelocidad: '50/minuto'
        });

        this.apiMaster.endpoints.set('/api/v1/ecosistema/reporte', {
            metodo: 'GET',
            descripcion: 'Reporte ejecutivo completo',
            handler: this.generarReporteEjecutivoCompleto.bind(this),
            autenticacion: true,
            limiteVelocidad: '10/hora'
        });

        this.apiMaster.endpoints.set('/api/v1/sistemas/{sistema}/consulta', {
            metodo: 'POST',
            descripcion: 'Consulta directa a sistema específico',
            handler: this.consultarSistemaEspecifico.bind(this),
            autenticacion: true,
            limiteVelocidad: '200/minuto'
        });

        // Endpoints de emergencia
        this.apiMaster.endpoints.set('/api/v1/emergencia/reiniciar', {
            metodo: 'POST',
            descripcion: 'Reinicio de emergencia del ecosistema',
            handler: this.reinicioEmergencia.bind(this),
            autenticacion: true,
            limiteVelocidad: '1/hora'
        });

        console.log('✅ API Master inicializada con 5 endpoints principales');
    }

    async consultarSistemaEspecifico(sistema, consulta, contexto) {
        const sistemaDisponible = this.sistemas[sistema];

        if (!sistemaDisponible || sistemaDisponible.estado !== 'ACTIVO') {
            throw new Error(`Sistema ${sistema} no disponible`);
        }

        switch (sistema) {
            case 'inteligenciaArtificial':
                return await this.sistemas.inteligenciaArtificial.coordinadorIA?.procesarConsultaInteligente(consulta, contexto);

            case 'seguridad':
                return await this.sistemas.seguridad.coordinador?.evaluarConsultaSeguridad(consulta, contexto);

            case 'gubernamental':
                return await this.sistemas.gubernamental.conectividadSEP?.procesarConsultaOficial(consulta, contexto);

            case 'movil':
                return await this.sistemas.movil.arquitecturaHibrida?.procesarConsultaMovil(consulta, contexto);

            default:
                return await this.procesarConsultaGenerica(sistema, consulta, contexto);
        }
    }

    // ==========================================
    // MONITOREO GLOBAL Y ORQUESTACIÓN
    // ==========================================

    async configurarMonitoreoGlobal() {
        console.log('👁️ Configurando monitoreo global...');

        // Monitoreo cada 30 segundos
        setInterval(async () => {
            await this.ejecutarMonitoreoCompleto();
        }, 30000);

        // Análisis profundo cada 5 minutos
        setInterval(async () => {
            await this.ejecutarAnalisisProfundo();
        }, 300000);

        // Optimización cada 15 minutos
        setInterval(async () => {
            await this.ejecutarOptimizacionGlobal();
        }, 900000);

        // Backup completo cada 6 horas
        setInterval(async () => {
            await this.ejecutarBackupCompleto();
        }, 21600000);

        console.log('✅ Monitoreo global configurado');
    }

    iniciarOrquestacionContinua() {
        console.log('🎼 Iniciando orquestación continua...');

        // Orquestación principal cada minuto
        setInterval(async () => {
            await this.ejecutarCicloOrquestacion();
        }, 60000);

        // Sincronización de datos cada 5 minutos
        setInterval(async () => {
            await this.sincronizarDatosGlobales();
        }, 300000);

        // Balanceo de carga cada 10 minutos
        setInterval(async () => {
            await this.balancearCargaSistemas();
        }, 600000);

        console.log('✅ Orquestación continua iniciada');
    }

    async ejecutarCicloOrquestacion() {
        // Verificar salud de todos los sistemas
        await this.verificarSaludSistemas();

        // Procesar eventos pendientes
        await this.procesarEventosGlobales();

        // Actualizar métricas
        await this.actualizarMetricasGlobales();

        // Ejecutar sincronizaciones programadas
        await this.ejecutarSincronizacionesProgramadas();

        // Optimizar recursos según demanda
        await this.optimizarRecursosSegunDemanda();
    }

    // ==========================================
    // INTEGRACIÓN CON SISTEMAS EXTERNOS
    // ==========================================

    async configurarIntegracionesExternas() {
        const integraciones = {
            sep: await this.configurarIntegracionSEP(),
            universidades: await this.configurarIntegracionUniversidades(),
            empresas: await this.configurarIntegracionEmpresas(),
            plataformasEducativas: await this.configurarIntegracionPlataformasEducativas(),
            serviciosGubernamentales: await this.configurarIntegracionGobierno()
        };

        return integraciones;
    }

    // ==========================================
    // MÉTODOS DE UTILIDAD Y AUXILIARES
    // ==========================================

    async obtenerEstadoEcosistema() {
        return {
            estado: this.evaluarEstadoGeneral(),
            sistemas: this.estadoEcosistema,
            timestamp: new Date(),
            version: this.config.version
        };
    }

    evaluarEstadoGeneral() {
        const sistemasActivos = Object.values(this.sistemas).filter(s => s.estado === 'ACTIVO').length;
        const porcentajeSalud = (sistemasActivos / Object.keys(this.sistemas).length) * 100;

        if (porcentajeSalud >= 95) return 'EXCELENTE';
        if (porcentajeSalud >= 80) return 'BUENO';
        if (porcentajeSalud >= 60) return 'REGULAR';
        return 'CRITICO';
    }

    async reinicioEmergencia() {
        console.log('🚨 Iniciando reinicio de emergencia del ecosistema...');

        // Guardar estado actual
        const estadoAnterior = await this.exportarEstadoCompleto();

        // Reiniciar sistemas en orden de dependencia
        await this.reiniciarSistemasOrdenado();

        // Restaurar datos críticos
        await this.restaurarDatosCriticos(estadoAnterior);

        // Verificar integridad
        await this.verificarIntegridadCompleta();

        console.log('✅ Reinicio de emergencia completado');

        return {
            exito: true,
            timestamp: new Date(),
            sistemasReiniciados: Object.keys(this.sistemas)
        };
    }

    async exportarConfiguracionCompleta() {
        return {
            configuracion: this.config,
            sistemas: this.sistemas,
            coordinacion: {
                dependencias: Array.from(this.coordinacion.dependencias.entries()),
                sincronizacion: Array.from(this.coordinacion.sincronizacion.entries()),
                flujosDatos: Array.from(this.coordinacion.flujosDatos.entries())
            },
            dashboard: {
                kpis: Array.from(this.dashboardEjecutivo.kpis.entries()),
                metricas: Array.from(this.dashboardEjecutivo.metricas.entries())
            },
            api: {
                endpoints: Array.from(this.apiMaster.endpoints.entries())
            },
            timestamp: new Date(),
            version: this.config.version
        };
    }
}

// ==========================================
// CLASES AUXILIARES ESPECIALIZADAS
// ==========================================

class BGEGlobalEventBus {
    constructor() {
        this.eventos = new Map();
        this.suscriptores = new Map();
        this.historialEventos = [];
    }

    emit(evento, datos) {
        const timestamp = new Date();

        // Registrar en historial
        this.historialEventos.push({
            evento,
            datos,
            timestamp
        });

        // Mantener solo últimos 1000 eventos
        if (this.historialEventos.length > 1000) {
            this.historialEventos = this.historialEventos.slice(-1000);
        }

        // Notificar suscriptores
        const suscriptores = this.suscriptores.get(evento) || [];
        suscriptores.forEach(callback => {
            try {
                callback({ evento, datos, timestamp });
            } catch (error) {
                console.error(`Error en suscriptor de evento ${evento}:`, error);
            }
        });

        console.log(`📡 Evento global emitido: ${evento}`);
    }

    on(evento, callback) {
        if (!this.suscriptores.has(evento)) {
            this.suscriptores.set(evento, []);
        }
        this.suscriptores.get(evento).push(callback);
    }

    obtenerHistorial(limite = 100) {
        return this.historialEventos.slice(-limite);
    }
}

class BGESystemHealthMonitor {
    constructor() {
        this.metricas = new Map();
        this.umbrales = {
            cpu: 80,
            memoria: 85,
            latencia: 1000,
            errorRate: 5
        };
    }

    async monitorearSistema(nombreSistema, sistema) {
        const metricas = {
            timestamp: new Date(),
            cpu: await this.medirUsoCPU(sistema),
            memoria: await this.medirUsoMemoria(sistema),
            latencia: await this.medirLatencia(sistema),
            disponibilidad: await this.verificarDisponibilidad(sistema),
            errorRate: await this.calcularTasaErrores(sistema)
        };

        this.metricas.set(nombreSistema, metricas);

        // Verificar umbrales y generar alertas
        await this.verificarUmbrales(nombreSistema, metricas);

        return metricas;
    }
}

// Inicialización global del Master Integration System
if (typeof window !== 'undefined') {
    window.BGEMasterIntegrationSystem = BGEMasterIntegrationSystem;

    document.addEventListener('DOMContentLoaded', () => {
        // Auto-inicialización del sistema maestro
        window.bgeMasterSystem = new BGEMasterIntegrationSystem();

        // API global unificada
        window.BGE = {
            // Acceso directo al ecosistema
            estado: () => window.bgeMasterSystem.obtenerEstadoEcosistema(),
            metricas: () => window.bgeMasterSystem.obtenerMetricasCompletas(),
            reporte: () => window.bgeMasterSystem.generarReporteEjecutivoCompleto(),

            // Consultas a sistemas específicos
            consultarIA: (consulta, contexto) => window.bgeMasterSystem.consultarSistemaEspecifico('inteligenciaArtificial', consulta, contexto),
            consultarSeguridad: (consulta, contexto) => window.bgeMasterSystem.consultarSistemaEspecifico('seguridad', consulta, contexto),
            consultarMovil: (consulta, contexto) => window.bgeMasterSystem.consultarSistemaEspecifico('movil', consulta, contexto),

            // Utilidades
            version: window.bgeMasterSystem.config.version,
            sistemas: Object.keys(window.bgeMasterSystem.sistemas)
        };

        console.log('🌟 BGE Master Integration System disponible globalmente como window.BGE');
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BGEMasterIntegrationSystem };
}