/**
 * 📅 CITAS ENHANCER
 * Funciones mejoradas para la gestión de citas
 * Fecha: 4 Noviembre 2025
 */

console.log('📅 [CITAS ENHANCER] Cargando funciones mejoradas de citas...');

/**
 * Actualizar las citas (refresh)
 */
function refreshCitas() {
    console.log('🔄 [CITAS] Actualizando datos de citas...');
    if (window.citasManager) {
        window.citasManager.loadCitas().then(() => {
            console.log('✅ [CITAS] Datos actualizados correctamente');
            showNotification('✅ Citas actualizadas', 'success');
        }).catch(error => {
            console.error('❌ [CITAS] Error al actualizar:', error);
            showNotification('❌ Error al actualizar citas', 'error');
        });
    } else {
        console.warn('⚠️ [CITAS] CitasManager no disponible');
        showNotification('⚠️ El gestor de citas no está listo', 'warning');
    }
}

/**
 * Exportar citas a CSV
 */
function exportCitasToCSV() {
    console.log('📊 [CITAS] Exportando a CSV...');

    try {
        const table = document.getElementById('citasTable');
        if (!table || table.rows.length === 0) {
            showNotification('⚠️ No hay datos para exportar', 'warning');
            return;
        }

        // Crear contenido CSV
        let csv = 'Nombre,Email,Teléfono,Motivo,Fecha,Hora,Estado\n';

        table.querySelectorAll('tr').forEach(row => {
            const cells = [];
            row.querySelectorAll('td').forEach((cell, index) => {
                if (index < 7) { // Solo las columnas de datos
                    cells.push('"' + cell.textContent.trim().replace(/"/g, '""') + '"');
                }
            });
            if (cells.length > 0) {
                csv += cells.join(',') + '\n';
            }
        });

        // Crear descarga
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `citas_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('✅ [CITAS] CSV exportado exitosamente');
        showNotification('✅ CSV exportado exitosamente', 'success');

    } catch (error) {
        console.error('❌ [CITAS] Error al exportar CSV:', error);
        showNotification('❌ Error al exportar CSV', 'error');
    }
}

/**
 * Imprimir reporte de citas
 */
function printCitasReport() {
    console.log('🖨️ [CITAS] Preparando reporte para impresión...');

    try {
        const table = document.getElementById('citasTable');
        if (!table || table.rows.length === 0) {
            showNotification('⚠️ No hay datos para imprimir', 'warning');
            return;
        }

        // Crear ventana de impresión
        const printWindow = window.open('', '', 'height=600,width=900');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Citas - BGE Héroes de la Patria</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: white;
                    }
                    header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #007bff;
                        padding-bottom: 15px;
                    }
                    h1 {
                        color: #007bff;
                        margin: 0;
                    }
                    .subtitle {
                        color: #666;
                        margin-top: 5px;
                    }
                    .report-date {
                        text-align: right;
                        color: #999;
                        font-size: 12px;
                        margin-top: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background: #f0f0f0;
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                        font-weight: bold;
                        color: #333;
                    }
                    td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-size: 12px;
                    }
                    tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                        color: #999;
                        font-size: 11px;
                    }
                    @media print {
                        body { margin: 0; }
                        header { border: none; }
                    }
                </style>
            </head>
            <body>
                <header>
                    <h1>📅 Reporte de Solicitudes de Citas</h1>
                    <p class="subtitle">BGE Héroes de la Patria</p>
                    <p class="report-date">Generado: ${new Date().toLocaleString('es-ES')}</p>
                </header>

                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Motivo</th>
                            <th>Fecha y Hora</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from(table.querySelectorAll('tr')).map(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 6) {
                                return `
                                    <tr>
                                        <td>${cells[0].textContent.trim()}</td>
                                        <td>${cells[1].textContent.trim()}</td>
                                        <td>${cells[2].textContent.trim()}</td>
                                        <td>${cells[3].textContent.trim()}</td>
                                        <td>${cells[4].textContent.trim()}</td>
                                        <td>${cells[5].textContent.trim()}</td>
                                    </tr>
                                `;
                            }
                            return '';
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Este reporte ha sido generado automáticamente desde el Sistema de Gestión Integral</p>
                    <p>© 2025 Bachillerato General Estatal "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')"</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Esperar a que se cargue y luego imprimir
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        console.log('✅ [CITAS] Reporte enviado a impresión');
        showNotification('✅ Reporte enviado a impresora', 'success');

    } catch (error) {
        console.error('❌ [CITAS] Error al generar reporte:', error);
        showNotification('❌ Error al generar reporte', 'error');
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    // Crear contenedor si no existe
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const colors = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${colors[type] || colors.info} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = sanitizeHTML(`
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `);

    container.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

console.log('✅ [CITAS ENHANCER] Funciones de citas mejoradas cargadas');
