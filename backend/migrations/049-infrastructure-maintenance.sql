-- =====================================================
-- MIGRACIÓN: Infrastructure Maintenance (Semana 40)
-- Mantenimiento Mayor de Infraestructura
-- Fecha: Enero 2026
-- Fase 6: Cierre, Análisis y Planificación Futura
-- =====================================================
-- Tabla de upgrades de base de datos
CREATE TABLE IF NOT EXISTS database_upgrades (
    id SERIAL PRIMARY KEY,
    upgrade_id VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    version_from VARCHAR(20),
    version_to VARCHAR(20),
    status VARCHAR(30) DEFAULT 'planned',
    downtime VARCHAR(50),
    data_integrity VARCHAR(20),
    backup_location VARCHAR(500),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_du_status ON database_upgrades(status);
-- Tabla de migraciones de sistemas
CREATE TABLE IF NOT EXISTS system_migrations (
    id SERIAL PRIMARY KEY,
    migration_id VARCHAR(100) UNIQUE NOT NULL,
    component VARCHAR(200) NOT NULL,
    version_from VARCHAR(100),
    version_to VARCHAR(100),
    status VARCHAR(30) DEFAULT 'planned',
    compatibility_notes TEXT,
    rollback_plan JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sm_status ON system_migrations(status);
-- Tabla de re-arquitecturas
CREATE TABLE IF NOT EXISTS component_rearchitectures (
    id SERIAL PRIMARY KEY,
    rearch_id VARCHAR(100) UNIQUE NOT NULL,
    component VARCHAR(200) NOT NULL,
    change_description TEXT,
    benefit TEXT,
    status VARCHAR(30) DEFAULT 'planned',
    api_changes JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cr_status ON component_rearchitectures(status);
-- Tabla de limpiezas de Data Warehouse
CREATE TABLE IF NOT EXISTS datawarehouse_cleanups (
    id SERIAL PRIMARY KEY,
    cleanup_id VARCHAR(100) UNIQUE NOT NULL,
    actions JSONB NOT NULL,
    space_reclaimed VARCHAR(50),
    performance_improvement VARCHAR(20),
    data_retention_policy JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de rotaciones de claves
CREATE TABLE IF NOT EXISTS key_rotations (
    id SERIAL PRIMARY KEY,
    rotation_id VARCHAR(100) UNIQUE NOT NULL,
    key_type VARCHAR(100) NOT NULL,
    algorithm VARCHAR(50),
    status VARCHAR(30) DEFAULT 'rotated',
    valid_until DATE,
    old_key_invalidated BOOLEAN DEFAULT true,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kr_type ON key_rotations(key_type);
-- Tabla de pruebas DRP
CREATE TABLE IF NOT EXISTS drp_tests (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(100) UNIQUE NOT NULL,
    scenario VARCHAR(200) NOT NULL,
    recovery_time_objective VARCHAR(50),
    actual_recovery_time VARCHAR(50),
    result VARCHAR(20),
    data_loss VARCHAR(50),
    notes TEXT,
    participants TEXT [],
    lessons_learned TEXT [],
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dt_result ON drp_tests(result);
-- Tabla de re-entrenamiento de modelos
CREATE TABLE IF NOT EXISTS model_retrainings (
    id SERIAL PRIMARY KEY,
    retrain_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    previous_accuracy DECIMAL(4, 3),
    new_accuracy DECIMAL(4, 3),
    improvement VARCHAR(20),
    training_data TEXT,
    training_cost DECIMAL(10, 2),
    status VARCHAR(30) DEFAULT 'deployed',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mr_model ON model_retrainings(model_name);
-- Tabla de optimizaciones de red
CREATE TABLE IF NOT EXISTS network_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    optimizations JSONB NOT NULL,
    endpoints_monitored INTEGER,
    latency_before INTEGER,
    latency_after INTEGER,
    improvement VARCHAR(20),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de actualizaciones de frameworks IA
CREATE TABLE IF NOT EXISTS ai_framework_updates (
    id SERIAL PRIMARY KEY,
    update_id VARCHAR(100) UNIQUE NOT NULL,
    framework_name VARCHAR(100) NOT NULL,
    version_from VARCHAR(20),
    version_to VARCHAR(20),
    new_features TEXT [],
    backward_compatible BOOLEAN DEFAULT true,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_afu_framework ON ai_framework_updates(framework_name);
-- Tabla de re-indexado vectorial
CREATE TABLE IF NOT EXISTS vector_reindexing (
    id SERIAL PRIMARY KEY,
    reindex_id VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    vector_count INTEGER,
    reindex_time VARCHAR(50),
    performance_improvement VARCHAR(20),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de validaciones de seguridad
CREATE TABLE IF NOT EXISTS security_validations (
    id SERIAL PRIMARY KEY,
    validation_id VARCHAR(100) UNIQUE NOT NULL,
    checks JSONB NOT NULL,
    overall_result VARCHAR(20),
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de tests de regresión
CREATE TABLE IF NOT EXISTS regression_test_runs (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(100) UNIQUE NOT NULL,
    suites JSONB NOT NULL,
    total_tests INTEGER,
    pass_rate DECIMAL(5, 4),
    duration VARCHAR(50),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de restauraciones de servicio
CREATE TABLE IF NOT EXISTS service_restorations (
    id SERIAL PRIMARY KEY,
    restoration_id VARCHAR(100) UNIQUE NOT NULL,
    services JSONB NOT NULL,
    system_status VARCHAR(30),
    monitoring_active BOOLEAN DEFAULT true,
    maintenance_ended TIMESTAMP,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de reportes de mantenimiento
CREATE TABLE IF NOT EXISTS maintenance_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    maintenance_window VARCHAR(100),
    total_tasks INTEGER,
    completed INTEGER,
    failed INTEGER,
    status VARCHAR(30),
    improvements JSONB,
    signoff JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Vista: Últimos mantenimientos
CREATE OR REPLACE VIEW v_recent_maintenance AS
SELECT report_id,
    maintenance_window,
    total_tasks,
    completed,
    failed,
    status,
    generated_at
FROM maintenance_reports
ORDER BY generated_at DESC
LIMIT 10;
-- Vista: Estado de DRP
CREATE OR REPLACE VIEW v_drp_status AS
SELECT scenario,
    result,
    actual_recovery_time,
    executed_at
FROM drp_tests
ORDER BY executed_at DESC;
-- Comentarios
COMMENT ON TABLE database_upgrades IS 'Registro de upgrades de BD';
COMMENT ON TABLE system_migrations IS 'Migraciones de sistemas';
COMMENT ON TABLE component_rearchitectures IS 'Re-arquitecturas de componentes';
COMMENT ON TABLE datawarehouse_cleanups IS 'Limpiezas de Data Warehouse';
COMMENT ON TABLE key_rotations IS 'Rotaciones de claves criptográficas';
COMMENT ON TABLE drp_tests IS 'Pruebas de recuperación ante desastres';
COMMENT ON TABLE model_retrainings IS 'Re-entrenamientos de modelos';
COMMENT ON TABLE network_optimizations IS 'Optimizaciones de red';
COMMENT ON TABLE ai_framework_updates IS 'Actualizaciones de frameworks IA';
COMMENT ON TABLE vector_reindexing IS 'Re-indexado de bases vectoriales';
COMMENT ON TABLE security_validations IS 'Validaciones de seguridad';
COMMENT ON TABLE regression_test_runs IS 'Ejecuciones de tests de regresión';
COMMENT ON TABLE service_restorations IS 'Restauraciones de servicio';
COMMENT ON TABLE maintenance_reports IS 'Reportes de mantenimiento';