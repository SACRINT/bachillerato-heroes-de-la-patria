-- 📋 Script para insertar datos de prueba en solicitudes_documentos
-- Ejecutar en Neon Console

-- Tabla: solicitudes_documentos
-- Estructura esperada: id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, estado, fecha_solicitud, fecha_procesado, notas_admin, procesado_por, ip_address, user_agent

-- Verificar si la tabla existe, si no, crearla
CREATE TABLE IF NOT EXISTS solicitudes_documentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(100),
    documento_solicitado VARCHAR(255) NOT NULL,
    motivo TEXT,
    nivel_urgencia VARCHAR(20) DEFAULT 'normal',
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP,
    notas_admin TEXT,
    procesado_por VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de prueba - SOLICITUDES PENDIENTES (mostrarán botones de Aceptar/Rechazar)
INSERT INTO solicitudes_documentos (nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, estado)
VALUES
    ('Pedro Ramírez', 'pedro@test.com', 'estudiante', 'Certificado de Estudiante', 'Necesito el certificado para una beca', 'high', 'pendiente'),
    ('María González', 'maria@test.com', 'padre_familia', 'Constancia de Padre de Familia', 'Para trámite escolar', 'normal', 'pendiente'),
    ('Juan López', 'juan@test.com', 'docente', 'Constancia Laboral', 'Para solicitud de crédito bancario', 'urgent', 'pendiente'),
    ('Carmen Díaz', 'carmen@test.com', 'estudiante', 'Historial Académico', 'Para transferencia a otra escuela', 'normal', 'pendiente');

-- Insertar algunos datos ya procesados (mostrarán solo botón de Ver)
INSERT INTO solicitudes_documentos (nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, estado, fecha_procesado, procesado_por, notas_admin)
VALUES
    ('Luis Martínez', 'luis@test.com', 'estudiante', 'Certificado de Estudiante', 'Para trámite migratorio', 'high', 'aprobada', CURRENT_TIMESTAMP, 'admin@bge.mx', 'Aprobado - Documento generado'),
    ('Rosa Flores', 'rosa@test.com', 'padre_familia', 'Constancia de Padre de Familia', 'Documentación incompleta', 'normal', 'rechazada', CURRENT_TIMESTAMP, 'admin@bge.mx', 'Rechazado - Falta documento de identidad');

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_documentos(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes_documentos(email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes_documentos(fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON solicitudes_documentos(tipo_usuario);

-- Verificar que los datos se insertaron correctamente
SELECT * FROM solicitudes_documentos ORDER BY fecha_solicitud DESC;

-- Contar solicitudes pendientes
SELECT COUNT(*) as pendientes FROM solicitudes_documentos WHERE estado = 'pendiente';
