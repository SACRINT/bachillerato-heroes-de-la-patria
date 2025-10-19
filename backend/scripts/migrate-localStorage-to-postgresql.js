/**
 * SCRIPT DE MIGRACIÓN DE LOCALSTORAGE A POSTGRESQL
 * Migra datos del CMS que puedan existir en localStorage a las tablas de PostgreSQL
 *
 * IMPORTANTE: Este script está diseñado para ejecutarse manualmente en el navegador
 * mediante la consola de desarrollador cuando un administrador tenga datos en localStorage
 * que necesiten ser migrados.
 *
 * USO:
 * 1. Abrir la consola de desarrollador en el navegador
 * 2. Copiar y pegar este código
 * 3. Ejecutar la función: migrateLocalStorageToPG()
 *
 * Fecha: 18 de Octubre, 2025
 */

async function migrateLocalStorageToPG() {
    console.log('🔄 [MIGRACIÓN] Iniciando migración de localStorage a PostgreSQL...');

    const apiBase = '/api/';
    let stats = {
        noticias: { encontradas: 0, migradas: 0, errores: 0 },
        eventos: { encontradas: 0, migradas: 0, errores: 0 },
        avisos: { encontradas: 0, migradas: 0, errores: 0 },
        comunicados: { encontradas: 0, migradas: 0, errores: 0 }
    };

    // ==========================================
    // FUNCIÓN AUXILIAR PARA HACER LLAMADAS API
    // ==========================================
    async function fetchAPI(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${apiBase}${endpoint}`, options);
            const result = await response.json();

            if (!result.success && !response.ok) {
                throw new Error(result.error || result.message || `Error ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error(`❌ [MIGRACIÓN] Error en API ${endpoint}:`, error);
            throw error;
        }
    }

    // ==========================================
    // MIGRAR NOTICIAS
    // ==========================================
    try {
        const noticiasData = localStorage.getItem('noticias');
        if (noticiasData) {
            const noticias = JSON.parse(noticiasData);
            stats.noticias.encontradas = noticias.length;
            console.log(`📰 [MIGRACIÓN] Encontradas ${noticias.length} noticias en localStorage`);

            for (const noticia of noticias) {
                try {
                    // Mapear datos de localStorage al esquema PostgreSQL
                    const noticiaData = {
                        titulo: noticia.titulo || noticia.title,
                        contenido: noticia.contenido || noticia.content || '',
                        resumen: noticia.resumen || noticia.excerpt || null,
                        imagen_url: noticia.imagen || noticia.image || noticia.imagen_url || null,
                        categoria: noticia.categoria || noticia.category || 'General',
                        etiquetas: noticia.etiquetas || noticia.tags || [],
                        estado: noticia.estado === 'activo' || noticia.active ? 'publicada' : 'borrador',
                        autor: noticia.autor || noticia.author || 'Migración localStorage',
                        destacada: noticia.destacado || noticia.featured || false
                    };

                    await fetchAPI('noticias', 'POST', noticiaData);
                    stats.noticias.migradas++;
                    console.log(`✅ [MIGRACIÓN] Noticia migrada: "${noticiaData.titulo}"`);
                } catch (error) {
                    stats.noticias.errores++;
                    console.error(`❌ [MIGRACIÓN] Error migrando noticia:`, error);
                }
            }
        } else {
            console.log('ℹ️ [MIGRACIÓN] No se encontraron noticias en localStorage');
        }
    } catch (error) {
        console.error('❌ [MIGRACIÓN] Error procesando noticias:', error);
    }

    // ==========================================
    // MIGRAR EVENTOS
    // ==========================================
    try {
        const eventosData = localStorage.getItem('eventos');
        if (eventosData) {
            const eventos = JSON.parse(eventosData);
            stats.eventos.encontradas = eventos.length;
            console.log(`📅 [MIGRACIÓN] Encontrados ${eventos.length} eventos en localStorage`);

            for (const evento of eventos) {
                try {
                    // Mapear datos de localStorage al esquema PostgreSQL
                    const eventoData = {
                        titulo: evento.titulo || evento.title,
                        descripcion: evento.descripcion || evento.description || evento.detalles || '',
                        imagen_url: evento.imagen || evento.image || evento.imagen_url || null,
                        fecha_inicio: evento.fecha || evento.fecha_inicio || evento.date || new Date().toISOString(),
                        ubicacion: evento.lugar || evento.ubicacion || evento.location || 'No especificado',
                        modalidad: evento.modalidad || 'presencial',
                        categoria: evento.categoria || evento.category || 'General',
                        capacidad_maxima: evento.cupo || evento.capacidad || evento.capacity || null,
                        requiere_inscripcion: evento.inscripcion || evento.requiresRegistration || false,
                        estado: evento.estado === 'activo' || evento.active ? 'publicado' : 'borrador',
                        destacado: evento.destacado || evento.featured || false,
                        organizador: evento.organizador || evento.organizer || 'Migración localStorage',
                        contacto_email: evento.contacto || evento.contact || null
                    };

                    // Asegurar formato correcto de fecha
                    if (eventoData.fecha_inicio && !eventoData.fecha_inicio.includes('T')) {
                        eventoData.fecha_inicio += 'T00:00:00';
                    }

                    await fetchAPI('eventos', 'POST', eventoData);
                    stats.eventos.migradas++;
                    console.log(`✅ [MIGRACIÓN] Evento migrado: "${eventoData.titulo}"`);
                } catch (error) {
                    stats.eventos.errores++;
                    console.error(`❌ [MIGRACIÓN] Error migrando evento:`, error);
                }
            }
        } else {
            console.log('ℹ️ [MIGRACIÓN] No se encontraron eventos en localStorage');
        }
    } catch (error) {
        console.error('❌ [MIGRACIÓN] Error procesando eventos:', error);
    }

    // ==========================================
    // MIGRAR AVISOS
    // ==========================================
    try {
        const avisosData = localStorage.getItem('avisos');
        if (avisosData) {
            const avisos = JSON.parse(avisosData);
            stats.avisos.encontradas = avisos.length;
            console.log(`📢 [MIGRACIÓN] Encontrados ${avisos.length} avisos en localStorage`);

            for (const aviso of avisos) {
                try {
                    const avisoData = {
                        titulo: aviso.titulo || aviso.title,
                        contenido: aviso.contenido || aviso.content || aviso.mensaje || '',
                        resumen: aviso.resumen || null,
                        imagen_url: aviso.imagen || aviso.image || null,
                        categoria: aviso.categoria || aviso.category || aviso.tipo || 'General',
                        estado: aviso.estado === 'activo' || aviso.active ? 'publicada' : 'borrador',
                        autor: aviso.autor || aviso.author || 'Migración localStorage',
                        destacada: aviso.destacado || aviso.important || false
                    };

                    await fetchAPI('avisos', 'POST', avisoData);
                    stats.avisos.migradas++;
                    console.log(`✅ [MIGRACIÓN] Aviso migrado: "${avisoData.titulo}"`);
                } catch (error) {
                    stats.avisos.errores++;
                    console.error(`❌ [MIGRACIÓN] Error migrando aviso:`, error);
                }
            }
        } else {
            console.log('ℹ️ [MIGRACIÓN] No se encontraron avisos en localStorage');
        }
    } catch (error) {
        console.error('❌ [MIGRACIÓN] Error procesando avisos:', error);
    }

    // ==========================================
    // MIGRAR COMUNICADOS
    // ==========================================
    try {
        const comunicadosData = localStorage.getItem('comunicados');
        if (comunicadosData) {
            const comunicados = JSON.parse(comunicadosData);
            stats.comunicados.encontradas = comunicados.length;
            console.log(`📨 [MIGRACIÓN] Encontrados ${comunicados.length} comunicados en localStorage`);

            for (const comunicado of comunicados) {
                try {
                    const comunicadoData = {
                        titulo: comunicado.titulo || comunicado.title,
                        contenido: comunicado.contenido || comunicado.content || comunicado.mensaje || '',
                        resumen: comunicado.resumen || null,
                        imagen_url: comunicado.imagen || comunicado.image || null,
                        categoria: comunicado.categoria || comunicado.category || 'General',
                        estado: comunicado.estado === 'activo' || comunicado.active ? 'publicada' : 'borrador',
                        autor: comunicado.autor || comunicado.author || 'Migración localStorage',
                        destacada: comunicado.destacado || comunicado.important || false
                    };

                    await fetchAPI('comunicados', 'POST', comunicadoData);
                    stats.comunicados.migradas++;
                    console.log(`✅ [MIGRACIÓN] Comunicado migrado: "${comunicadoData.titulo}"`);
                } catch (error) {
                    stats.comunicados.errores++;
                    console.error(`❌ [MIGRACIÓN] Error migrando comunicado:`, error);
                }
            }
        } else {
            console.log('ℹ️ [MIGRACIÓN] No se encontraron comunicados en localStorage');
        }
    } catch (error) {
        console.error('❌ [MIGRACIÓN] Error procesando comunicados:', error);
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n📊 [MIGRACIÓN] RESUMEN FINAL:');
    console.log('=====================================');
    console.log('📰 NOTICIAS:');
    console.log(`   Encontradas: ${stats.noticias.encontradas}`);
    console.log(`   Migradas: ${stats.noticias.migradas}`);
    console.log(`   Errores: ${stats.noticias.errores}`);
    console.log('');
    console.log('📅 EVENTOS:');
    console.log(`   Encontrados: ${stats.eventos.encontradas}`);
    console.log(`   Migrados: ${stats.eventos.migradas}`);
    console.log(`   Errores: ${stats.eventos.errores}`);
    console.log('');
    console.log('📢 AVISOS:');
    console.log(`   Encontrados: ${stats.avisos.encontradas}`);
    console.log(`   Migrados: ${stats.avisos.migradas}`);
    console.log(`   Errores: ${stats.avisos.errores}`);
    console.log('');
    console.log('📨 COMUNICADOS:');
    console.log(`   Encontrados: ${stats.comunicados.encontradas}`);
    console.log(`   Migrados: ${stats.comunicados.migradas}`);
    console.log(`   Errores: ${stats.comunicados.errores}`);
    console.log('=====================================');

    const totalEncontradas = stats.noticias.encontradas + stats.eventos.encontradas + stats.avisos.encontradas + stats.comunicados.encontradas;
    const totalMigradas = stats.noticias.migradas + stats.eventos.migradas + stats.avisos.migradas + stats.comunicados.migradas;
    const totalErrores = stats.noticias.errores + stats.eventos.errores + stats.avisos.errores + stats.comunicados.errores;

    console.log(`\n✅ TOTAL: ${totalMigradas}/${totalEncontradas} registros migrados exitosamente`);
    if (totalErrores > 0) {
        console.log(`⚠️ ${totalErrores} errores durante la migración`);
    }

    console.log('\n💡 NOTA: Los datos originales en localStorage NO han sido eliminados.');
    console.log('Si la migración fue exitosa y deseas limpiar localStorage, ejecuta:');
    console.log('cleanupLocalStorage()');

    return stats;
}

/**
 * Función para limpiar localStorage después de una migración exitosa
 * USAR CON PRECAUCIÓN - Esto eliminará permanentemente los datos de localStorage
 */
function cleanupLocalStorage() {
    const confirmacion = confirm(
        '⚠️ ADVERTENCIA: Esta acción eliminará permanentemente los datos del CMS de localStorage.\n\n' +
        '¿Estás seguro de que la migración fue exitosa y deseas continuar?'
    );

    if (confirmacion) {
        localStorage.removeItem('noticias');
        localStorage.removeItem('eventos');
        localStorage.removeItem('avisos');
        localStorage.removeItem('comunicados');

        console.log('✅ [LIMPIEZA] Datos del CMS eliminados de localStorage');
        console.log('ℹ️ Los datos ahora solo existen en PostgreSQL');
    } else {
        console.log('ℹ️ [LIMPIEZA] Operación cancelada');
    }
}

// Mensaje de bienvenida
console.log('=====================================');
console.log('📦 SCRIPT DE MIGRACIÓN CMS');
console.log('localStorage → PostgreSQL');
console.log('=====================================');
console.log('\n🚀 Para iniciar la migración, ejecuta:');
console.log('   migrateLocalStorageToPG()');
console.log('\n🧹 Para limpiar localStorage después de migrar, ejecuta:');
console.log('   cleanupLocalStorage()');
console.log('=====================================\n');
