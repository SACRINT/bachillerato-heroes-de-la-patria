-- ============================================================================
-- 📋 DSAR (DATA SUBJECT ACCESS REQUEST) TABLES
-- SEMANA 16 - GDPR Compliance
--
-- Implementa GDPR Articles:
-- - Article 15: Right of Access
-- - Article 20: Right to Data Portability
-- - Article 16: Right to Rectification
-- - Article 17: Right to Erasure
--
-- Fecha: 17 Noviembre 2025
-- Estado: ✅ PRODUCTION-READY
-- ============================================================================

-- ============================================================================
-- TABLA: dsar_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS dsar_requests (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,

  -- Tipo de solicitud
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'access',           -- Article 15: Derecho de acceso
    'portability',      -- Article 20: Portabilidad
    'rectification',    -- Article 16: Rectificación
    'erasure'           -- Article 17: Derecho al olvido
  )),

  -- Información de contacto
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' CHECK (status IN (
    'pending_verification',  -- Esperando verificación email
    'verified',             -- Verificado, esperando procesamiento
    'processing',           -- En proceso
    'completed',            -- Completado
    'failed',               -- Fallo
    'rejected'              -- Rechazado (identidad no verificada)
  )),

  -- Verificación de identidad
  verification_token VARCHAR(255) UNIQUE,
  verified_at TIMESTAMP,

  -- Procesamiento
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Exportación
  export_path TEXT,               -- Path al archivo ZIP generado
  export_expires_at TIMESTAMP,    -- Expira después de 30 días

  -- Metadata
  metadata JSONB,                 -- Metadata adicional (razón, notas)
  error_message TEXT,             -- Mensaje de error si falla

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,    -- 30 días desde creación (GDPR requirement)

  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES usuarios(uuid) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_dsar_requests_user_id ON dsar_requests(user_id);
CREATE INDEX idx_dsar_requests_status ON dsar_requests(status);
CREATE INDEX idx_dsar_requests_created_at ON dsar_requests(created_at DESC);
CREATE INDEX idx_dsar_requests_due_date ON dsar_requests(due_date);

-- ============================================================================
-- TABLA: user_consents (Gestión de consentimientos - GDPR Article 7)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_consents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,

  -- Tipo de consentimiento
  consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing_emails',
    'marketing_sms',
    'data_sharing',
    'cookies_analytics',
    'cookies_marketing',
    'third_party_sharing'
  )),

  -- Estado del consentimiento
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP,

  -- Revocación (GDPR Article 7(3) - derecho a retirar consentimiento)
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP,

  -- Version del documento (privacy policy v1.0, v1.1, etc)
  document_version VARCHAR(50),

  -- Método de obtención del consentimiento
  consent_method VARCHAR(50) CHECK (consent_method IN (
    'explicit_checkbox',
    'signature',
    'email_confirmation',
    'sms_confirmation'
  )),

  -- IP y user agent (prueba de consentimiento)
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES usuarios(uuid) ON DELETE CASCADE,

  -- Un usuario puede tener múltiples versiones de cada consentimiento
  UNIQUE(user_id, consent_type, document_version)
);

-- Índices
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_granted ON user_consents(granted);
CREATE INDEX idx_user_consents_created_at ON user_consents(created_at DESC);

-- ============================================================================
-- TABLA: data_processing_activities (GDPR Article 30 - Records of Processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_processing_activities (
  id SERIAL PRIMARY KEY,

  -- Identificación de la actividad
  activity_name VARCHAR(255) NOT NULL,
  activity_description TEXT NOT NULL,

  -- Controlador de datos
  controller_name VARCHAR(255) NOT NULL,
  controller_contact TEXT NOT NULL,

  -- Delegado de Protección de Datos (DPO)
  dpo_name VARCHAR(255),
  dpo_contact TEXT,

  -- Propósitos del procesamiento (GDPR Article 13(1)(c))
  purposes TEXT[] NOT NULL,

  -- Base legal (GDPR Article 6)
  legal_basis VARCHAR(100) NOT NULL CHECK (legal_basis IN (
    'consent',                  -- Article 6(1)(a)
    'contract',                 -- Article 6(1)(b)
    'legal_obligation',         -- Article 6(1)(c)
    'vital_interests',          -- Article 6(1)(d)
    'public_task',              -- Article 6(1)(e)
    'legitimate_interests'      -- Article 6(1)(f)
  )),

  -- Categorías de datos
  data_categories TEXT[] NOT NULL,  -- 'name', 'email', 'grades', etc

  -- Categorías de sujetos
  subject_categories TEXT[] NOT NULL,  -- 'students', 'parents', 'teachers'

  -- Destinatarios (GDPR Article 13(1)(e))
  recipients TEXT[],  -- 'SEP', 'email providers', etc

  -- Transferencias internacionales
  international_transfers BOOLEAN DEFAULT false,
  transfer_safeguards TEXT,  -- 'Standard Contractual Clauses', 'Privacy Shield', etc

  -- Período de retención
  retention_period TEXT NOT NULL,  -- '7 years', 'Until graduation + 5 years', etc
  retention_criteria TEXT,

  -- Medidas de seguridad técnicas y organizativas
  security_measures TEXT[] NOT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  next_review_date DATE,

  -- Status
  active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX idx_data_processing_activities_active ON data_processing_activities(active);
CREATE INDEX idx_data_processing_activities_next_review ON data_processing_activities(next_review_date);

-- ============================================================================
-- TABLA: data_breach_incidents (GDPR Article 33/34 - Breach Notification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_breach_incidents (
  id SERIAL PRIMARY KEY,

  -- Identificación del incidente
  incident_reference VARCHAR(100) UNIQUE NOT NULL,
  incident_date TIMESTAMP NOT NULL,
  discovered_date TIMESTAMP NOT NULL,

  -- Descripción
  description TEXT NOT NULL,

  -- Categorías de datos afectadas
  affected_data_categories TEXT[] NOT NULL,

  -- Número aproximado de sujetos afectados
  affected_subjects_count INTEGER,
  affected_records_count INTEGER,

  -- Consecuencias probables
  likely_consequences TEXT NOT NULL,

  -- Medidas tomadas
  measures_taken TEXT NOT NULL,

  -- Notificación a autoridad (GDPR Article 33 - 72 horas)
  authority_notified BOOLEAN DEFAULT false,
  authority_notified_at TIMESTAMP,
  authority_reference VARCHAR(255),

  -- Notificación a sujetos (GDPR Article 34)
  subjects_notified BOOLEAN DEFAULT false,
  subjects_notified_at TIMESTAMP,
  notification_method VARCHAR(100),

  -- DPO informado
  dpo_informed BOOLEAN DEFAULT false,
  dpo_informed_at TIMESTAMP,

  -- Severidad
  severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Status
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN (
    'open',
    'investigating',
    'contained',
    'resolved',
    'closed'
  )),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_data_breach_incidents_date ON data_breach_incidents(incident_date DESC);
CREATE INDEX idx_data_breach_incidents_severity ON data_breach_incidents(severity);
CREATE INDEX idx_data_breach_incidents_status ON data_breach_incidents(status);

-- ============================================================================
-- TABLA: privacy_policy_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS privacy_policy_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,

  -- Metadata
  changes_summary TEXT,
  requires_reconsent BOOLEAN DEFAULT false
);

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_activities_updated_at
    BEFORE UPDATE ON data_processing_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_breach_incidents_updated_at
    BEFORE UPDATE ON data_breach_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS INICIALES (EJEMPLO)
-- ============================================================================

-- Actividades de procesamiento de datos
INSERT INTO data_processing_activities (
  activity_name,
  activity_description,
  controller_name,
  controller_contact,
  purposes,
  legal_basis,
  data_categories,
  subject_categories,
  recipients,
  retention_period,
  security_measures
) VALUES
(
  'Student Enrollment and Academic Management',
  'Processing of student personal data for enrollment, academic tracking, and educational services delivery',
  'Bachillerato General por Competencias - Heroes de la Patria',
  'privacy@bge-heroes.edu.mx',
  ARRAY['Educational services delivery', 'Academic performance tracking', 'Compliance with educational regulations'],
  'contract',
  ARRAY['name', 'email', 'date_of_birth', 'address', 'phone', 'grades', 'attendance'],
  ARRAY['students', 'parents'],
  ARRAY['Authorized school staff', 'SEP (Secretaría de Educación Pública)'],
  '7 years after graduation',
  ARRAY['Data encryption at rest and in transit', 'Access control (RBAC)', 'Audit logging', 'Regular security audits']
),
(
  'Marketing Communications',
  'Processing of contact data for sending newsletters and promotional materials',
  'Bachillerato General por Competencias - Heroes de la Patria',
  'privacy@bge-heroes.edu.mx',
  ARRAY['Marketing communications', 'Event notifications'],
  'consent',
  ARRAY['name', 'email', 'preferences'],
  ARRAY['students', 'parents', 'prospective students'],
  ARRAY['Email service provider (SendGrid)'],
  'Until consent is withdrawn',
  ARRAY['Encryption', 'Access control', 'Unsubscribe mechanism']
);

-- Versión inicial de Privacy Policy
INSERT INTO privacy_policy_versions (
  version,
  content,
  effective_date,
  created_by,
  changes_summary
) VALUES
(
  '1.0.0',
  'Privacy Policy content placeholder...',
  CURRENT_DATE,
  'system',
  'Initial privacy policy'
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
SELECT 'dsar_requests' AS table_name, COUNT(*) AS count FROM dsar_requests
UNION ALL
SELECT 'user_consents', COUNT(*) FROM user_consents
UNION ALL
SELECT 'data_processing_activities', COUNT(*) FROM data_processing_activities
UNION ALL
SELECT 'data_breach_incidents', COUNT(*) FROM data_breach_incidents
UNION ALL
SELECT 'privacy_policy_versions', COUNT(*) FROM privacy_policy_versions;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
