-- =====================================================
-- ÍNDICES DE OPTIMIZACIÓN PARA BASE DE DATOS BGE
-- Fecha: 19 de Octubre, 2025
-- Descripción: Índices para mejorar el rendimiento de consultas frecuentes
-- =====================================================

-- =====================================================
-- TABLA: noticias
-- Consultas frecuentes: listado activo, por categoría, ordenado por fecha
-- =====================================================

-- Índice para consultas de noticias activas ordenadas por fecha
CREATE INDEX IF NOT EXISTS idx_noticias_activo_fecha
ON noticias(activo, fecha DESC);

-- Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_noticias_categoria
ON noticias(categoria)
WHERE activo = true;

-- Índice para noticias destacadas
CREATE INDEX IF NOT EXISTS idx_noticias_destacado
ON noticias(destacado)
WHERE activo = true;

-- Índice para búsqueda por autor
CREATE INDEX IF NOT EXISTS idx_noticias_autor
ON noticias(autor);

-- Índice de texto completo para búsqueda en título y contenido
CREATE INDEX IF NOT EXISTS idx_noticias_fulltext
ON noticias USING gin(to_tsvector('spanish', titulo || ' ' || contenido));

-- =====================================================
-- TABLA: eventos
-- Consultas frecuentes: eventos futuros, por categoría, por estado
-- =====================================================

-- Índice para eventos futuros activos
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_activo
ON eventos(fecha, activo);

-- Índice para eventos por estado
CREATE INDEX IF NOT EXISTS idx_eventos_estado
ON eventos(estado)
WHERE activo = true;

-- Índice para eventos por categoría
CREATE INDEX IF NOT EXISTS idx_eventos_categoria
ON eventos(categoria)
WHERE activo = true;

-- Índice para eventos por modalidad
CREATE INDEX IF NOT EXISTS idx_eventos_modalidad
ON eventos(modalidad);

-- Índice compuesto para consultas frecuentes (fecha futura + activo + estado)
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_activo_estado
ON eventos(fecha, activo, estado);

-- =====================================================
-- TABLA: avisos
-- Consultas frecuentes: activos vigentes, por prioridad, por tipo
-- =====================================================

-- Índice para avisos activos vigentes
CREATE INDEX IF NOT EXISTS idx_avisos_activo_vigente
ON avisos(activo, fecha_inicio, fecha_fin);

-- Índice para avisos por prioridad
CREATE INDEX IF NOT EXISTS idx_avisos_prioridad
ON avisos(prioridad)
WHERE activo = true;

-- Índice para avisos por tipo
CREATE INDEX IF NOT EXISTS idx_avisos_tipo
ON avisos(tipo);

-- Índice para búsqueda por fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_avisos_fecha_fin
ON avisos(fecha_fin)
WHERE activo = true AND fecha_fin IS NOT NULL;

-- =====================================================
-- TABLA: comunicados
-- Consultas frecuentes: por destinatario, por tipo, por fecha
-- =====================================================

-- Índice para comunicados activos por fecha
CREATE INDEX IF NOT EXISTS idx_comunicados_activo_fecha
ON comunicados(activo, fecha DESC);

-- Índice para comunicados por destinatario
CREATE INDEX IF NOT EXISTS idx_comunicados_destinatario
ON comunicados(destinatario)
WHERE activo = true;

-- Índice para comunicados por tipo
CREATE INDEX IF NOT EXISTS idx_comunicados_tipo
ON comunicados(tipo);

-- =====================================================
-- TABLA: egresados
-- Consultas frecuentes: búsqueda por nombre, email, año egreso
-- =====================================================

-- Índice para búsqueda por email (usado en login)
CREATE UNIQUE INDEX IF NOT EXISTS idx_egresados_email
ON egresados(email);

-- Índice para búsqueda por año de egreso
CREATE INDEX IF NOT EXISTS idx_egresados_anio_egreso
ON egresados(anio_egreso);

-- Índice para búsqueda por nombre completo
CREATE INDEX IF NOT EXISTS idx_egresados_nombre
ON egresados(nombre, apellido_paterno, apellido_materno);

-- Índice de texto completo para búsqueda en perfil
CREATE INDEX IF NOT EXISTS idx_egresados_fulltext
ON egresados USING gin(to_tsvector('spanish',
    nombre || ' ' || apellido_paterno || ' ' || COALESCE(apellido_materno, '') || ' ' || COALESCE(empresa_actual, '')
));

-- =====================================================
-- TABLA: bolsa_trabajo_cv
-- Consultas frecuentes: por área de interés, experiencia, estado
-- =====================================================

-- Índice para búsqueda por área de interés
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_area
ON bolsa_trabajo_cv(area_interes);

-- Índice para filtrar por años de experiencia
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_experiencia
ON bolsa_trabajo_cv(anios_experiencia);

-- Índice por estado de revisión
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_estado
ON bolsa_trabajo_cv(estado);

-- Índice de texto completo para búsqueda en perfil profesional
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_fulltext
ON bolsa_trabajo_cv USING gin(to_tsvector('spanish',
    nombre || ' ' || apellido_paterno || ' ' || profesion || ' ' || COALESCE(habilidades, '')
));

-- =====================================================
-- TABLA: suscriptores
-- Consultas frecuentes: por email, activos, por fecha
-- =====================================================

-- Índice único para email
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscriptores_email
ON suscriptores(email);

-- Índice para suscriptores activos
CREATE INDEX IF NOT EXISTS idx_suscriptores_activo
ON suscriptores(activo);

-- Índice para fecha de suscripción
CREATE INDEX IF NOT EXISTS idx_suscriptores_fecha
ON suscriptores(fecha_suscripcion DESC);

-- =====================================================
-- TABLA: quejas_sugerencias
-- Consultas frecuentes: por estado, por tipo, por fecha
-- =====================================================

-- Índice para consultas por estado
CREATE INDEX IF NOT EXISTS idx_quejas_estado
ON quejas_sugerencias(estado);

-- Índice para consultas por tipo
CREATE INDEX IF NOT EXISTS idx_quejas_tipo
ON quejas_sugerencias(tipo);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_quejas_fecha
ON quejas_sugerencias(fecha_creacion DESC);

-- Índice compuesto para consultas frecuentes (tipo + estado)
CREATE INDEX IF NOT EXISTS idx_quejas_tipo_estado
ON quejas_sugerencias(tipo, estado);

-- =====================================================
-- TABLA: contactos
-- Consultas frecuentes: por estado, por fecha
-- =====================================================

-- Índice para mensajes por estado
CREATE INDEX IF NOT EXISTS idx_contactos_estado
ON contactos(estado);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_contactos_fecha
ON contactos(fecha_creacion DESC);

-- =====================================================
-- TABLA: inscripciones_actividades
-- Consultas frecuentes: por estudiante, por actividad, por estado
-- =====================================================

-- Índice para búsqueda por email de estudiante
CREATE INDEX IF NOT EXISTS idx_inscripciones_email
ON inscripciones_actividades(email_estudiante);

-- Índice para búsqueda por actividad
CREATE INDEX IF NOT EXISTS idx_inscripciones_actividad
ON inscripciones_actividades(actividad);

-- Índice para búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_inscripciones_estado
ON inscripciones_actividades(estado);

-- Índice compuesto para verificar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscripciones_unique
ON inscripciones_actividades(email_estudiante, actividad, ciclo_escolar);

-- =====================================================
-- TABLA: notificaciones_convocatorias
-- Consultas frecuentes: por email, por tipo, por estado
-- =====================================================

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_notificaciones_email
ON notificaciones_convocatorias(email);

-- Índice para búsqueda por tipo de convocatoria
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo
ON notificaciones_convocatorias(tipo_convocatoria);

-- Índice para notificaciones activas
CREATE INDEX IF NOT EXISTS idx_notificaciones_activo
ON notificaciones_convocatorias(activo);

-- =====================================================
-- TABLA: citas
-- Consultas frecuentes: por email, por fecha, por estado
-- =====================================================

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_citas_email
ON citas(email);

-- Índice para búsqueda por fecha
CREATE INDEX IF NOT EXISTS idx_citas_fecha
ON citas(fecha_cita);

-- Índice para búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_citas_estado
ON citas(estado);

-- Índice compuesto para consultas frecuentes (fecha + estado)
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado
ON citas(fecha_cita, estado);

-- =====================================================
-- TABLA: solicitudes_documentos
-- Consultas frecuentes: por email, por tipo, por estado
-- =====================================================

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_solicitudes_email
ON solicitudes_documentos(email);

-- Índice para búsqueda por tipo de documento
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo
ON solicitudes_documentos(tipo_documento);

-- Índice para búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
ON solicitudes_documentos(estado);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo_estado
ON solicitudes_documentos(tipo_documento, estado);

-- =====================================================
-- TABLA: password_recovery_requests
-- Consultas frecuentes: por email, por token, por expiración
-- =====================================================

-- Índice único para tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_recovery_token
ON password_recovery_requests(token);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_password_recovery_email
ON password_recovery_requests(email);

-- Índice para limpieza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_recovery_expires
ON password_recovery_requests(expires_at)
WHERE used = false;

-- =====================================================
-- ÍNDICES DE AUDITORÍA Y TIMESTAMPS
-- Mejoran el rendimiento de consultas de auditoría
-- =====================================================

-- Índices para campos created_at (auditoría)
CREATE INDEX IF NOT EXISTS idx_noticias_created_at ON noticias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_created_at ON avisos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comunicados_created_at ON comunicados(created_at DESC);

-- Índices para campos updated_at (seguimiento de cambios)
CREATE INDEX IF NOT EXISTS idx_noticias_updated_at ON noticias(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_updated_at ON eventos(updated_at DESC);

-- =====================================================
-- ESTADÍSTICAS Y MANTENIMIENTO
-- =====================================================

-- Actualizar estadísticas de las tablas para el optimizador de consultas
ANALYZE noticias;
ANALYZE eventos;
ANALYZE avisos;
ANALYZE comunicados;
ANALYZE egresados;
ANALYZE bolsa_trabajo_cv;
ANALYZE suscriptores;
ANALYZE quejas_sugerencias;
ANALYZE contactos;
ANALYZE inscripciones_actividades;
ANALYZE notificaciones_convocatorias;
ANALYZE citas;
ANALYZE solicitudes_documentos;
ANALYZE password_recovery_requests;

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Consulta para ver todos los índices creados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- NOTAS DE OPTIMIZACIÓN
-- =====================================================

/*
IMPACTO ESPERADO:
- Consultas de listado: 70-90% más rápidas
- Búsquedas por fecha: 80-95% más rápidas
- Búsquedas de texto: 60-85% más rápidas (con GIN)
- Búsquedas por email: 95%+ más rápidas (índices únicos)

MANTENIMIENTO:
- Ejecutar VACUUM ANALYZE mensualmente
- Monitorear uso de índices con pg_stat_user_indexes
- Eliminar índices no utilizados

VERIFICACIÓN DE USO:
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
*/
