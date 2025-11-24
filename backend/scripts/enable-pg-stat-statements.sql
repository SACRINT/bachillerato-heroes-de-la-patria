-- 📊 Script para Habilitar pg_stat_statements en Neon PostgreSQL
-- FASE 30.5 TAREA 3 - Prerequisito para EXPLAIN ANALYZE

-- Crear extensión pg_stat_statements (requiere superuser)
-- En Neon, ejecutar en la consola de Neon con usuario admin
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Resetear estadísticas previas
SELECT pg_stat_statements_reset();

-- Verificar que la extensión está habilitada
SELECT * FROM pg_stat_statements LIMIT 1;
