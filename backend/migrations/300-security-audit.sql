-- 🛡️ MIGRACIÓN 300: SECURITY AUDIT & OPTIMIZATION (FINAL)
-- Propósito: Endurecimiento de la base de datos y auditoría final (Fase 6 - Semana 48)
-- 1. Crear usuario de solo lectura para Analytics (Principio de menor privilegio)
-- NOTA: En Neon/Vercel esto puede requerir superusuario, se deja comentado como referencia o ejecución manual.
-- CREATE ROLE analytics_viewer WITH LOGIN PASSWORD 'secure_pass';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_viewer;
-- 2. Auditoría de Índices Faltantes (Creación preventiva)
-- Se asegura que todas las claves foráneas tengan índice para evitar bloqueos en DELETE CASCADE
CREATE INDEX IF NOT EXISTS idx_fk_user_learning_paths_path_id ON user_learning_paths(path_id);
CREATE INDEX IF NOT EXISTS idx_fk_path_opt_user_path_id ON path_optimizations_log(user_path_id);
CREATE INDEX IF NOT EXISTS idx_fk_sentiment_logs_user_id ON sentiment_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_essay_submissions_question_id ON essay_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_fk_automated_grades_submission_id ON automated_grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_fk_tutor_messages_session_id ON tutor_chat_messages(session_id);
-- 3. Tabla de Auditoría de Accesos Sensibles
CREATE TABLE IF NOT EXISTS security_access_audit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100),
    -- 'export_grades', 'view_sensitive_profile'
    resource_accessed VARCHAR(255),
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4. Limpieza de Logs Antiguos (Política de Retención)
-- Función para purgar logs de más de 1 año (GDPR compliance)
CREATE OR REPLACE FUNCTION text_cleanup_old_logs() RETURNS void AS $$ BEGIN
DELETE FROM user_interaction_logs
WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM active_sessions_log
WHERE last_heartbeat_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;