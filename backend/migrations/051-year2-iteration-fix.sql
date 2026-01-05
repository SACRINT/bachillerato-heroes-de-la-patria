-- CORRECCION Year 2 Iteration (051)
-- Eliminar vistas existentes y recrearlas
DROP VIEW IF EXISTS v_production_models CASCADE;
DROP VIEW IF EXISTS v_active_experiments CASCADE;
DROP VIEW IF EXISTS v_latest_benchmarks CASCADE;
-- Recrear vistas
CREATE OR REPLACE VIEW v_production_models AS
SELECT model_name,
    version,
    accuracy,
    deployed_at
FROM model_versions
WHERE status = 'production'
ORDER BY deployed_at DESC;
CREATE OR REPLACE VIEW v_active_experiments AS
SELECT experiment_id,
    name,
    control_version,
    treatment_version,
    started_at
FROM ab_experiments
WHERE status = 'running';
CREATE OR REPLACE VIEW v_latest_benchmarks AS
SELECT DISTINCT ON (model_name) model_name,
    accuracy,
    f1_score,
    latency_p50,
    executed_at
FROM model_benchmarks
ORDER BY model_name,
    executed_at DESC;
-- Comentarios
COMMENT ON TABLE model_versions IS 'Versiones de modelos ML';
COMMENT ON TABLE ab_experiments IS 'Experimentos AB';
COMMENT ON TABLE experiment_variants IS 'Variantes de experimentos';
COMMENT ON TABLE hyperparameter_searches IS 'Busquedas de hiperparametros';
COMMENT ON TABLE feature_importance_analysis IS 'Analisis de importancia de features';
COMMENT ON TABLE continuous_learning_configs IS 'Configuracion de aprendizaje continuo';
COMMENT ON TABLE retrain_history IS 'Historial de reentrenamiento';
COMMENT ON TABLE model_ensembles IS 'Ensembles de modelos';
COMMENT ON TABLE drift_detection_configs IS 'Configuracion de deteccion de drift';
COMMENT ON TABLE drift_reports IS 'Reportes de drift';
COMMENT ON TABLE model_benchmarks IS 'Benchmarks de modelos';