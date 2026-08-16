/**
 * SISTEMA DE GESTIÓN DE CONTENIDO DINÁMICO (CMS)
 * window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria') - 2024
 *
 * Este sistema permite la gestión completa de contenido dinámico:
 * - Noticias
 * - Eventos
 * - Avisos
 * - Comunicados
 */

class ContentManager {
    constructor() {
        void 0;
        this.dynamicContent = null;
        this.apiEndpoint = 'data/dynamic-content.json';
        this.init();
    }

    async init() {
        await this.loadContent();
        this.setupEventListeners();
        void 0;
    }

    // ==========================================
    // CARGA Y GUARDADO DE DATOS
    // ==========================================

    async loadContent() {
        try {
            void 0;

            // Intentar cargar desde localStorage primero (cambios no guardados)
            const localContent = localStorage.getItem('dynamicContent');
            if (localContent) {
                this.dynamicContent = JSON.parse(localContent);
                void 0;
                return;
            }

            // Si no hay datos locales, cargar desde archivo JSON
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) {
                throw new Error(`Error al cargar contenido: ${response.status}`);
            }

            this.dynamicContent = await response.json();
            void 0;

        } catch (error) {
            console.error('❌ [CMS] Error al cargar contenido:', error);
            this.initializeEmptyContent();
        }
    }

    initializeEmptyContent() {
        void 0;
        this.dynamicContent = {
            noticias: [],
            eventos: [],
            avisos: [],
            comunicados: [],
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: '1.0',
                totalElementos: { noticias: 0, eventos: 0, avisos: 0, comunicados: 0 }
            }
        };
    }

    saveToLocalStorage() {
        try {
            this.dynamicContent.configuracion.ultimaActualizacion = new Date().toISOString();
            localStorage.setItem('dynamicContent', JSON.stringify(this.dynamicContent));
            void 0;
            return true;
        } catch (error) {
            console.error('❌ [CMS] Error al guardar en localStorage:', error);
            return false;
        }
    }

    // ==========================================
    // GESTIÓN DE NOTICIAS
    // ==========================================

    createNoticia(data) {
        const noticia = {
            id: `noticia-${Date.now()}`,
            titulo: data.titulo,
            contenido: data.contenido,
            fecha: data.fecha || new Date().toISOString().split('T')[0],
            autor: data.autor || 'Administrador',
            imagen: data.imagen || '',
            categoria: data.categoria || 'general',
            destacado: data.destacado || false,
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        this.dynamicContent.noticias.unshift(noticia);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return noticia;
    }

    updateNoticia(id, data) {
        const index = this.dynamicContent.noticias.findIndex(n => n.id === id);
        if (index === -1) return false;

        this.dynamicContent.noticias[index] = { ...this.dynamicContent.noticias[index], ...data };
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    deleteNoticia(id) {
        const index = this.dynamicContent.noticias.findIndex(n => n.id === id);
        if (index === -1) return false;

        this.dynamicContent.noticias.splice(index, 1);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    getNoticias(filtros = {}) {
        let noticias = this.dynamicContent.noticias.filter(n => n.activo);

        if (filtros.categoria) {
            noticias = noticias.filter(n => n.categoria === filtros.categoria);
        }

        if (filtros.destacado !== undefined) {
            noticias = noticias.filter(n => n.destacado === filtros.destacado);
        }

        if (filtros.limite) {
            noticias = noticias.slice(0, filtros.limite);
        }

        return noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // ==========================================
    // GESTIÓN DE EVENTOS
    // ==========================================

    createEvento(data) {
        const evento = {
            id: `evento-${Date.now()}`,
            titulo: data.titulo,
            descripcion: data.descripcion,
            fecha: data.fecha,
            hora: data.hora,
            lugar: data.lugar || '',
            organizador: data.organizador || 'BGE Héroes de la Patria',
            cupoMaximo: data.cupoMaximo || null,
            inscripcionRequerida: data.inscripcionRequerida || false,
            categoria: data.categoria || 'general',
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        this.dynamicContent.eventos.unshift(evento);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return evento;
    }

    updateEvento(id, data) {
        const index = this.dynamicContent.eventos.findIndex(e => e.id === id);
        if (index === -1) return false;

        this.dynamicContent.eventos[index] = { ...this.dynamicContent.eventos[index], ...data };
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    deleteEvento(id) {
        const index = this.dynamicContent.eventos.findIndex(e => e.id === id);
        if (index === -1) return false;

        this.dynamicContent.eventos.splice(index, 1);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    getEventos(filtros = {}) {
        let eventos = this.dynamicContent.eventos.filter(e => e.activo);

        if (filtros.categoria) {
            eventos = eventos.filter(e => e.categoria === filtros.categoria);
        }

        if (filtros.proximosEventos) {
            const hoy = new Date().toISOString().split('T')[0];
            eventos = eventos.filter(e => e.fecha >= hoy);
        }

        if (filtros.limite) {
            eventos = eventos.slice(0, filtros.limite);
        }

        return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }

    // ==========================================
    // GESTIÓN DE AVISOS
    // ==========================================

    createAviso(data) {
        const aviso = {
            id: `aviso-${Date.now()}`,
            titulo: data.titulo,
            contenido: data.contenido,
            tipo: data.tipo || 'informativo',
            fechaInicio: data.fechaInicio || new Date().toISOString().split('T')[0],
            fechaFin: data.fechaFin,
            dirigidoA: data.dirigidoA || 'toda la comunidad',
            prioridad: data.prioridad || 'media',
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        this.dynamicContent.avisos.unshift(aviso);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return aviso;
    }

    updateAviso(id, data) {
        const index = this.dynamicContent.avisos.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.dynamicContent.avisos[index] = { ...this.dynamicContent.avisos[index], ...data };
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    deleteAviso(id) {
        const index = this.dynamicContent.avisos.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.dynamicContent.avisos.splice(index, 1);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    getAvisos(filtros = {}) {
        let avisos = this.dynamicContent.avisos.filter(a => a.activo);

        if (filtros.vigentes) {
            const hoy = new Date().toISOString().split('T')[0];
            avisos = avisos.filter(a => {
                return (!a.fechaFin || a.fechaFin >= hoy) && a.fechaInicio <= hoy;
            });
        }

        if (filtros.prioridad) {
            avisos = avisos.filter(a => a.prioridad === filtros.prioridad);
        }

        if (filtros.limite) {
            avisos = avisos.slice(0, filtros.limite);
        }

        return avisos.sort((a, b) => {
            const prioridadOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
            return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
        });
    }

    // ==========================================
    // GESTIÓN DE COMUNICADOS
    // ==========================================

    createComunicado(data) {
        const comunicado = {
            id: `comunicado-${Date.now()}`,
            titulo: data.titulo,
            contenido: data.contenido,
            emisor: data.emisor || 'Dirección General',
            fechaEmision: data.fechaEmision || new Date().toISOString().split('T')[0],
            vigencia: data.vigencia || 'temporal',
            tipo: data.tipo || 'informativo',
            destinatarios: data.destinatarios || ['toda la comunidad'],
            adjuntos: data.adjuntos || [],
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        this.dynamicContent.comunicados.unshift(comunicado);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return comunicado;
    }

    updateComunicado(id, data) {
        const index = this.dynamicContent.comunicados.findIndex(c => c.id === id);
        if (index === -1) return false;

        this.dynamicContent.comunicados[index] = { ...this.dynamicContent.comunicados[index], ...data };
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    deleteComunicado(id) {
        const index = this.dynamicContent.comunicados.findIndex(c => c.id === id);
        if (index === -1) return false;

        this.dynamicContent.comunicados.splice(index, 1);
        this.updateTotalElementos();
        this.saveToLocalStorage();

        void 0;
        return true;
    }

    getComunicados(filtros = {}) {
        let comunicados = this.dynamicContent.comunicados.filter(c => c.activo);

        if (filtros.tipo) {
            comunicados = comunicados.filter(c => c.tipo === filtros.tipo);
        }

        if (filtros.limite) {
            comunicados = comunicados.slice(0, filtros.limite);
        }

        return comunicados.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
    }

    // ==========================================
    // UTILIDADES Y HELPERS
    // ==========================================

    updateTotalElementos() {
        this.dynamicContent.configuracion.totalElementos = {
            noticias: this.dynamicContent.noticias.filter(n => n.activo).length,
            eventos: this.dynamicContent.eventos.filter(e => e.activo).length,
            avisos: this.dynamicContent.avisos.filter(a => a.activo).length,
            comunicados: this.dynamicContent.comunicados.filter(c => c.activo).length
        };
    }

    getEstadisticas() {
        return {
            total: this.dynamicContent.configuracion.totalElementos,
            ultimaActualizacion: this.dynamicContent.configuracion.ultimaActualizacion,
            proximosEventos: this.getEventos({ proximosEventos: true, limite: 3 }).length,
            avisosVigentes: this.getAvisos({ vigentes: true }).length
        };
    }

    exportarTodo() {
        const dataStr = JSON.stringify(this.dynamicContent, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `contenido-dinamico-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        void 0;
    }

    setupEventListeners() {
        // Aquí se configurarán los event listeners para los formularios
        void 0;
    }
}

// Instancia global del Content Manager
let contentManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    contentManager = new ContentManager();
});

void 0;