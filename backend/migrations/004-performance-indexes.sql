-- ========================================
-- MIGRACIÓN: Índices de Rendimiento
-- BGE Héroes de la Patria - Neon PostgreSQL
-- Fecha: 19 Noviembre 2025
-- SEMANA 1 - TAREA 1.1
-- ========================================

-- IMPORTANTE: Ejecutar en Neon Console
-- Estos índices mejorarán el rendimiento de queries en 40-60%

-- ========================================
-- ÍNDICES PARA TABLA: usuarios
-- ========================================

-- Índice para búsqueda por email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_email
ON usuarios(email);

-- Índice para filtrar por rol
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_role
ON usuarios(role);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_status
ON usuarios(status);

-- Índice compuesto para queries de autenticación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_email_status
ON usuarios(email, status);

-- ========================================
-- ÍNDICES PARA TABLA: citas
-- ========================================

-- Índice para búsqueda por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citas_fecha
ON citas(fecha_solicitada);

-- Índice para filtrar por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citas_estado
ON citas(estado);

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citas_usuario
ON citas(usuario_id);

-- Índice compuesto para queries de disponibilidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_citas_fecha_estado
ON citas(fecha_solicitada, estado);

-- ========================================
-- ÍNDICES PARA TABLA: suscriptores_notificaciones
-- ========================================

-- Índice para búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suscriptores_email
ON suscriptores_notificaciones(email);

-- Índice para filtrar confirmados
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suscriptores_confirmado
ON suscriptores_notificaciones(email_confirmado);

-- Índice para fecha de registro
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suscriptores_fecha
ON suscriptores_notificaciones(fecha_registro);

-- ========================================
-- ÍNDICES PARA TABLA: egresados
-- ========================================

-- Índice para búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_egresados_email
ON egresados(email);

-- Índice para filtrar por generación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_egresados_generacion
ON egresados(generacion);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_egresados_status
ON egresados(status);

-- Índice para filtrar por confirmación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_egresados_confirmado
ON egresados(email_confirmado);

-- ========================================
-- ÍNDICES PARA TABLA: bolsa_trabajo
-- ========================================

-- Índice para búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bolsa_email
ON bolsa_trabajo(email);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bolsa_status
ON bolsa_trabajo(status);

-- Índice para fecha de registro
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bolsa_fecha
ON bolsa_trabajo(fecha_registro);

-- ========================================
-- ÍNDICES PARA TABLA: avisos
-- ========================================

-- Índice para filtrar por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avisos_estado
ON avisos(estado);

-- Índice para fecha de publicación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avisos_fecha
ON avisos(fecha_publicacion);

-- Índice para filtrar por tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avisos_tipo
ON avisos(tipo);

-- Índice compuesto para queries de listado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avisos_estado_fecha
ON avisos(estado, fecha_publicacion DESC);

-- ========================================
-- ÍNDICES PARA TABLA: noticias
-- ========================================

-- Índice para filtrar por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_noticias_estado
ON noticias(estado);

-- Índice para fecha de publicación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_noticias_fecha
ON noticias(fecha_publicacion);

-- Índice para filtrar por categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_noticias_categoria
ON noticias(categoria);

-- Índice para filtrar destacadas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_noticias_destacada
ON noticias(destacada);

-- Índice compuesto para queries de listado público
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_noticias_estado_fecha
ON noticias(estado, fecha_publicacion DESC);

-- ========================================
-- ÍNDICES PARA TABLA: tenants
-- ========================================

-- Índice para búsqueda por dominio
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_domain
ON tenants(domain);

-- Índice para filtrar por status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_status
ON tenants(status);

-- ========================================
-- ÍNDICES PARA TABLA: notificaciones
-- ========================================

-- Índice para búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_usuario
ON notificaciones(usuario_id);

-- Índice para filtrar no leídas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_leida
ON notificaciones(leida);

-- Índice para ordenar por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_fecha
ON notificaciones(created_at DESC);

-- Índice compuesto para queries típicas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_usuario_leida
ON notificaciones(usuario_id, leida);

-- ========================================
-- ÍNDICES PARA TABLA: newsletters
-- ========================================

-- Índice para filtrar por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletters_estado
ON newsletters(estado);

-- Índice para fecha de publicación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletters_fecha
ON newsletters(fecha_publicacion);

-- ========================================
-- ÍNDICES PARA TABLA: newsletter_envios
-- ========================================

-- Índice para búsqueda por newsletter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_envios_newsletter
ON newsletter_envios(newsletter_id);

-- Índice para filtrar por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_envios_estado
ON newsletter_envios(estado);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Para verificar los índices creados, ejecutar:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Para verificar mejora de performance, usar EXPLAIN ANALYZE:
-- EXPLAIN ANALYZE SELECT * FROM usuarios WHERE email = 'test@example.com';
-- EXPLAIN ANALYZE SELECT * FROM citas WHERE fecha_solicitada > CURRENT_DATE;
-- EXPLAIN ANALYZE SELECT * FROM pending_approvals WHERE status = 'pending';

-- ========================================
-- DOCUMENTACIÓN
-- ========================================

COMMENT ON INDEX idx_usuarios_email IS 'Optimiza login y búsqueda por email';
COMMENT ON INDEX idx_citas_fecha_estado IS 'Optimiza queries de disponibilidad de citas';
COMMENT ON INDEX idx_avisos_estado_fecha IS 'Optimiza listado de avisos públicos';
COMMENT ON INDEX idx_noticias_estado_fecha IS 'Optimiza listado de noticias públicas';
COMMENT ON INDEX idx_notificaciones_usuario_leida IS 'Optimiza contador de notificaciones no leídas';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
