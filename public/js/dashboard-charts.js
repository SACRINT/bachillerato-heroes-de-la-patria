/**
 * ADMIN DASHBOARD CHARTS - Gráficas con Chart.js
 * Sistema de visualización de estadísticas del dashboard
 * Fecha: 18 de Octubre, 2025
 */

class DashboardCharts {
    constructor() {
        this.charts = {};
        this.chartInstances = {};
        this.colors = {
            primary: 'rgb(54, 162, 235)',
            success: 'rgb(75, 192, 192)',
            warning: 'rgb(255, 206, 86)',
            danger: 'rgb(255, 99, 132)',
            info: 'rgb(153, 102, 255)',
            secondary: 'rgb(201, 203, 207)'
        };
    }

    /**
     * Inicializar todas las gráficas del dashboard
     */
    async init() {
        try {
            console.log('📊 Inicializando gráficas del dashboard...');

            // Verificar que Chart.js esté cargado
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js no está cargado');
                return;
            }

            // Configuración global de Chart.js
            Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
            Chart.defaults.color = '#666';
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;

            // Cargar todas las gráficas en paralelo
            await Promise.all([
                this.loadNoticiasPorMes(),
                this.loadEventosPorCategoria(),
                this.loadQuejasPorTipo(),
                this.loadSuscriptoresCrecimiento()
            ]);

            console.log('✅ Gráficas inicializadas correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar gráficas:', error);
        }
    }

    /**
     * Gráfica de Línea: Noticias por Mes
     */
    async loadNoticiasPorMes() {
        try {
            const response = await fetch('/api/charts/noticias-por-mes');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            const ctx = document.getElementById('chartNoticiasPorMes');
            if (!ctx) {
                console.warn('⚠️ Canvas chartNoticiasPorMes no encontrado');
                return;
            }

            // Destruir gráfica anterior si existe
            if (this.chartInstances.noticiasPorMes) {
                this.chartInstances.noticiasPorMes.destroy();
            }

            this.chartInstances.noticiasPorMes = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Noticias Publicadas por Mes',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + ' noticias';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Number.isInteger(value) ? value : null;
                                }
                            },
                            title: {
                                display: true,
                                text: 'Cantidad de Noticias'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes'
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });

            console.log('✅ Gráfica de noticias por mes cargada');
        } catch (error) {
            console.error('❌ Error al cargar noticias por mes:', error);
        }
    }

    /**
     * Gráfica de Barras: Eventos por Categoría
     */
    async loadEventosPorCategoria() {
        try {
            const response = await fetch('/api/charts/eventos-por-categoria');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            const ctx = document.getElementById('chartEventosPorCategoria');
            if (!ctx) {
                console.warn('⚠️ Canvas chartEventosPorCategoria no encontrado');
                return;
            }

            // Destruir gráfica anterior si existe
            if (this.chartInstances.eventosPorCategoria) {
                this.chartInstances.eventosPorCategoria.destroy();
            }

            this.chartInstances.eventosPorCategoria = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Eventos por Categoría',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y + ' eventos';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Number.isInteger(value) ? value : null;
                                }
                            },
                            title: {
                                display: true,
                                text: 'Cantidad de Eventos'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Categoría'
                            }
                        }
                    }
                }
            });

            console.log('✅ Gráfica de eventos por categoría cargada');
        } catch (error) {
            console.error('❌ Error al cargar eventos por categoría:', error);
        }
    }

    /**
     * Gráfica de Pie: Quejas por Tipo
     */
    async loadQuejasPorTipo() {
        try {
            const response = await fetch('/api/charts/quejas-por-tipo');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            const ctx = document.getElementById('chartQuejasPorTipo');
            if (!ctx) {
                console.warn('⚠️ Canvas chartQuejasPorTipo no encontrado');
                return;
            }

            // Destruir gráfica anterior si existe
            if (this.chartInstances.quejasPorTipo) {
                this.chartInstances.quejasPorTipo.destroy();
            }

            this.chartInstances.quejasPorTipo = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de Quejas por Tipo',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });

            console.log('✅ Gráfica de quejas por tipo cargada');
        } catch (error) {
            console.error('❌ Error al cargar quejas por tipo:', error);
        }
    }

    /**
     * Gráfica de Área: Crecimiento de Suscriptores
     */
    async loadSuscriptoresCrecimiento() {
        try {
            const response = await fetch('/api/charts/suscriptores-crecimiento');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            const ctx = document.getElementById('chartSuscriptoresCrecimiento');
            if (!ctx) {
                console.warn('⚠️ Canvas chartSuscriptoresCrecimiento no encontrado');
                return;
            }

            // Destruir gráfica anterior si existe
            if (this.chartInstances.suscriptoresCrecimiento) {
                this.chartInstances.suscriptoresCrecimiento.destroy();
            }

            this.chartInstances.suscriptoresCrecimiento = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Crecimiento de Suscriptores',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + ' suscriptores';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Number.isInteger(value) ? value : null;
                                }
                            },
                            title: {
                                display: true,
                                text: 'Cantidad de Suscriptores'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes'
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });

            console.log('✅ Gráfica de crecimiento de suscriptores cargada');
        } catch (error) {
            console.error('❌ Error al cargar crecimiento de suscriptores:', error);
        }
    }

    /**
     * Actualizar todas las gráficas
     */
    async refreshAll() {
        console.log('🔄 Actualizando todas las gráficas...');
        await this.init();
    }

    /**
     * Destruir todas las gráficas (para limpiar al salir)
     */
    destroyAll() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.chartInstances = {};
        console.log('🗑️ Todas las gráficas destruidas');
    }
}

// Instancia global
const dashboardCharts = new DashboardCharts();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay para asegurar que Chart.js esté cargado
        setTimeout(() => dashboardCharts.init(), 500);
    });
} else {
    setTimeout(() => dashboardCharts.init(), 500);
}
