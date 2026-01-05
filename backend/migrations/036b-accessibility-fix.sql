-- =====================================================
-- FIX COMPLETO: Agregar columnas faltantes a bias_evaluations
-- Ejecutar para corregir errores de migración 036
-- La tabla original viene de 031-qa-testing.sql
-- =====================================================
-- 1. Agregar columna overall_score si no existe
ALTER TABLE bias_evaluations
ADD COLUMN IF NOT EXISTS overall_score DECIMAL(4, 3);
-- 2. Agregar columna overall_status si no existe (diferente de 'status' existente)
ALTER TABLE bias_evaluations
ADD COLUMN IF NOT EXISTS overall_status VARCHAR(30);
-- 3. evaluated_at ya existe en la tabla original de 031
-- 4. Crear índices si no existen (algunos pueden ya existir)
CREATE INDEX IF NOT EXISTS idx_bias_overall_status ON bias_evaluations(overall_status);
-- 5. Recrear vista de estadísticas de accesibilidad
-- Usando COALESCE para manejar valores NULL
CREATE OR REPLACE VIEW v_accessibility_stats AS
SELECT COALESCE(
        (
            SELECT COUNT(*)
            FROM wcag_audits
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        0
    ) as audits_30d,
    COALESCE(
        (
            SELECT AVG(overall_score)
            FROM wcag_audits
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        0
    ) as avg_wcag_score,
    COALESCE(
        (
            SELECT COUNT(*)
            FROM user_accessibility_preferences
            WHERE visual_mode != 'default'
        ),
        0
    ) as custom_visual_users,
    COALESCE(
        (
            SELECT COUNT(*)
            FROM accessibility_translations
            WHERE is_indigenous = true
        ),
        0
    ) as indigenous_translations,
    COALESCE(
        (
            SELECT AVG(overall_score)
            FROM bias_evaluations
            WHERE evaluated_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        0
    ) as avg_bias_score;
-- 6. Comentario actualizado
COMMENT ON TABLE bias_evaluations IS 'Evaluaciones de sesgo de modelos IA - extendida con overall_score y overall_status';