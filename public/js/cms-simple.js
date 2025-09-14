/**
 * Sistema CMS Simple para Bachillerato Héroes de la Patria
 * Gestión de contenido básico local
 */

class SimpleCMS {
    constructor() {
        this.data = {
            noticias: [],
            eventos: [],
            testimonios: [],
            avisos: []
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
    }

    // Cargar datos del localStorage
    loadData() {
        const stored = localStorage.getItem('cms_data');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            // Datos de ejemplo si no hay nada guardado
            this.data = {
                noticias: [
                    {
                        id: 1,
                        titulo: "Inicio del Ciclo Escolar 2024-2025",
                        contenido: "Iniciamos un nuevo ciclo escolar con grandes expectativas...",
                        fecha: new Date().toISOString(),
                        activo: true
                    }
                ],
                eventos: [
                    {
                        id: 1,
                        titulo: "Ceremonia de Bienvenida",
                        descripcion: "Ceremonia de bienvenida para estudiantes de nuevo ingreso",
                        fecha: "2024-08-26",
                        activo: true
                    }
                ],
                testimonios: [
                    {
                        id: 1,
                        nombre: "María González",
                        testimonio: "Mi experiencia en el bachillerato fue extraordinaria...",
                        activo: true
                    }
                ],
                avisos: [
                    {
                        id: 1,
                        titulo: "Aviso Importante",
                        mensaje: "Recordamos a todos los estudiantes...",
                        fecha: new Date().toISOString(),
                        activo: true
                    }
                ]
            };
            this.saveData();
        }
    }

    // Guardar datos en localStorage
    saveData() {
        localStorage.setItem('cms_data', JSON.stringify(this.data));
    }

    // Configurar event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderDashboard();
        });
    }

    // CRUD para Noticias
    addNoticia(titulo, contenido) {
        const noticia = {
            id: Date.now(),
            titulo,
            contenido,
            fecha: new Date().toISOString(),
            activo: true
        };
        this.data.noticias.push(noticia);
        this.saveData();
        return noticia;
    }

    updateNoticia(id, titulo, contenido) {
        const index = this.data.noticias.findIndex(n => n.id == id);
        if (index !== -1) {
            this.data.noticias[index] = {
                ...this.data.noticias[index],
                titulo,
                contenido,
                fecha: new Date().toISOString()
            };
            this.saveData();
            return this.data.noticias[index];
        }
        return null;
    }

    deleteNoticia(id) {
        this.data.noticias = this.data.noticias.filter(n => n.id != id);
        this.saveData();
    }

    // CRUD para Eventos
    addEvento(titulo, descripcion, fecha) {
        const evento = {
            id: Date.now(),
            titulo,
            descripcion,
            fecha,
            activo: true
        };
        this.data.eventos.push(evento);
        this.saveData();
        return evento;
    }

    updateEvento(id, titulo, descripcion, fecha) {
        const index = this.data.eventos.findIndex(e => e.id == id);
        if (index !== -1) {
            this.data.eventos[index] = {
                ...this.data.eventos[index],
                titulo,
                descripcion,
                fecha
            };
            this.saveData();
            return this.data.eventos[index];
        }
        return null;
    }

    deleteEvento(id) {
        this.data.eventos = this.data.eventos.filter(e => e.id != id);
        this.saveData();
    }

    // Renderizar dashboard
    renderDashboard() {
        const dashboardStats = document.getElementById('dashboard-stats');
        if (dashboardStats) {
            dashboardStats.innerHTML = `
                <div class="row g-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-primary">${this.data.noticias.length}</h3>
                                <p class="mb-0">Noticias</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-success">${this.data.eventos.length}</h3>
                                <p class="mb-0">Eventos</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-warning">${this.data.testimonios.length}</h3>
                                <p class="mb-0">Testimonios</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-info">${this.data.avisos.length}</h3>
                                <p class="mb-0">Avisos</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Exportar datos para respaldo
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'cms-backup-' + new Date().toISOString().split('T')[0] + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Importar datos desde respaldo
    importData(fileInput) {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    this.data = importedData;
                    this.saveData();
                    this.renderDashboard();
                    alert('Datos importados exitosamente');
                } catch (error) {
                    alert('Error al importar datos: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }
}

// Inicializar CMS
window.simpleCMS = new SimpleCMS();