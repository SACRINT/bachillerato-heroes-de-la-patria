-- 📚 MIGRACIÓN 106: REAL-TIME ENGAGEMENT ANALYTICS
-- Propósito: Monitoreo en vivo de participación estudiantil (Fase 6 - Semana 47)
-- 1. Logs de Sesión Activa (Heartbeats)
CREATE TABLE IF NOT EXISTS active_sessions_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255),
    current_page VARCHAR(255),
    last_action_type VARCHAR(50),
    -- 'scroll', 'click', 'video_play'
    last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_type VARCHAR(50) -- 'mobile', 'desktop'
);
-- 2. Métricas Agregadas por Clase en Vivo
CREATE TABLE IF NOT EXISTS live_class_metrics (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    -- ID de grupo o sesión virtual
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active_students_count INTEGER DEFAULT 0,
    avg_attention_score DECIMAL(5, 2),
    -- 0-100 (basado en focus de ventana)
    interaction_rate DECIMAL(5, 2) -- Acciones por minuto promedio
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_active_sessions_time ON active_sessions_log(last_heartbeat_at);