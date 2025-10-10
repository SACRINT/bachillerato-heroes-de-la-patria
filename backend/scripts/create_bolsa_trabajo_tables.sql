-- ============================================
-- 📄 SCRIPT: Crear tablas para Bolsa de Trabajo y Suscriptores
-- Fecha: 09 Octubre 2025
-- Propósito: Almacenar CVs recibidos y suscripciones a notificaciones
-- ============================================

USE bge_database;

-- ============================================
-- TABLA: bolsa_trabajo
-- Almacena información de candidatos que suben su CV
-- ============================================

CREATE TABLE IF NOT EXISTS bolsa_trabajo (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Información Personal
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),

    -- Información Académica
    generacion VARCHAR(4),
    area_interes TEXT COMMENT 'Áreas de especialidad separadas por comas',

    -- Perfil Profesional
    resumen_profesional TEXT,
    habilidades TEXT COMMENT 'Habilidades separadas por comas',

    -- Archivo CV
    cv_filename VARCHAR(255) COMMENT 'Nombre del archivo CV subido',
    cv_path VARCHAR(500) COMMENT 'Ruta del archivo en servidor',
    cv_url VARCHAR(500) COMMENT 'URL pública del CV',

    -- Estado y Gestión
    estado ENUM('nuevo', 'revisado', 'contactado', 'contratado', 'rechazado', 'archivado') DEFAULT 'nuevo',
    notas_admin TEXT COMMENT 'Notas internas del administrador',
    empresas_compartido TEXT COMMENT 'Lista de empresas con las que se compartió (IDs o nombres separados por comas)',

    -- Metadatos
    ip_registro VARCHAR(45),
    user_agent VARCHAR(500),
    form_type VARCHAR(100) DEFAULT 'Registro Bolsa de Trabajo',

    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_ultimo_contacto TIMESTAMP NULL,

    -- Índices
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_generacion (generacion),
    INDEX idx_fecha_registro (fecha_registro)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Almacena CVs y datos de candidatos de la bolsa de trabajo';

-- ============================================
-- TABLA: suscriptores_notificaciones
-- Almacena suscriptores a notificaciones del sitio
-- ============================================

CREATE TABLE IF NOT EXISTS suscriptores_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Información del Suscriptor
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NULL COMMENT 'Opcional: nombre del suscriptor',

    -- Preferencias de Notificaciones (basado en checkboxes del formulario)
    notif_convocatorias BOOLEAN DEFAULT FALSE,
    notif_becas BOOLEAN DEFAULT FALSE,
    notif_eventos BOOLEAN DEFAULT FALSE,
    notif_noticias BOOLEAN DEFAULT FALSE,
    notif_todas BOOLEAN DEFAULT TRUE COMMENT 'Recibir todas las notificaciones',

    -- Estado
    estado ENUM('activo', 'inactivo', 'cancelado') DEFAULT 'activo',
    verificado BOOLEAN DEFAULT FALSE COMMENT 'Email verificado',
    token_verificacion VARCHAR(100) COMMENT 'Token para verificar email',
    fecha_verificacion TIMESTAMP NULL,

    -- Estadísticas
    total_enviados INT DEFAULT 0 COMMENT 'Total de notificaciones enviadas',
    total_abiertos INT DEFAULT 0 COMMENT 'Total de emails abiertos',
    ultimo_envio TIMESTAMP NULL,

    -- Metadatos
    ip_registro VARCHAR(45),
    user_agent VARCHAR(500),
    fuente VARCHAR(100) DEFAULT 'Formulario Web' COMMENT 'Origen de la suscripción',

    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP NULL,

    -- Índices
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_verificado (verificado),
    INDEX idx_fecha_registro (fecha_registro)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Almacena suscriptores a notificaciones del sitio';

-- ============================================
-- TABLA: empresas_asociadas (OPCIONAL - para futuro)
-- Almacena empresas que pueden acceder a la bolsa de trabajo
-- ============================================

CREATE TABLE IF NOT EXISTS empresas_asociadas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Información de la Empresa
    nombre_empresa VARCHAR(255) NOT NULL,
    rfc VARCHAR(13),
    sector VARCHAR(100),
    tamanio ENUM('micro', 'pequeña', 'mediana', 'grande'),

    -- Contacto
    nombre_contacto VARCHAR(255),
    email_contacto VARCHAR(255) NOT NULL,
    telefono_contacto VARCHAR(20),
    sitio_web VARCHAR(255),

    -- Ubicación
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    direccion TEXT,

    -- Acceso al Sistema
    activa BOOLEAN DEFAULT TRUE,
    puede_ver_cvs BOOLEAN DEFAULT FALSE,
    puede_descargar_cvs BOOLEAN DEFAULT FALSE,

    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_email (email_contacto),
    INDEX idx_activa (activa)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Empresas asociadas con acceso a la bolsa de trabajo';

-- ============================================
-- TABLA: historial_compartidos (OPCIONAL - para auditoría)
-- Registra cuando se comparte un CV con una empresa
-- ============================================

CREATE TABLE IF NOT EXISTS historial_compartidos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidato_id INT NOT NULL,
    empresa_id INT NULL,
    empresa_nombre VARCHAR(255) COMMENT 'Nombre si no está en tabla empresas',

    compartido_por INT COMMENT 'ID del admin que compartió',
    metodo ENUM('email', 'descarga', 'enlace', 'manual') DEFAULT 'email',

    notas TEXT,

    fecha_compartido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (candidato_id) REFERENCES bolsa_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas_asociadas(id) ON DELETE SET NULL,

    INDEX idx_candidato (candidato_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_fecha (fecha_compartido)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de CVs compartidos con empresas';

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Estadísticas de Bolsa de Trabajo
CREATE OR REPLACE VIEW v_stats_bolsa_trabajo AS
SELECT
    COUNT(*) as total_candidatos,
    COUNT(CASE WHEN estado = 'nuevo' THEN 1 END) as nuevos,
    COUNT(CASE WHEN estado = 'revisado' THEN 1 END) as revisados,
    COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactados,
    COUNT(CASE WHEN estado = 'contratado' THEN 1 END) as contratados,
    COUNT(CASE WHEN DATE(fecha_registro) = CURDATE() THEN 1 END) as hoy,
    COUNT(CASE WHEN YEARWEEK(fecha_registro) = YEARWEEK(CURDATE()) THEN 1 END) as esta_semana,
    COUNT(CASE WHEN MONTH(fecha_registro) = MONTH(CURDATE()) THEN 1 END) as este_mes
FROM bolsa_trabajo;

-- Vista: Estadísticas de Suscriptores
CREATE OR REPLACE VIEW v_stats_suscriptores AS
SELECT
    COUNT(*) as total_suscriptores,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
    COUNT(CASE WHEN verificado = TRUE THEN 1 END) as verificados,
    COUNT(CASE WHEN notif_todas = TRUE THEN 1 END) as todas_notif,
    COUNT(CASE WHEN notif_convocatorias = TRUE THEN 1 END) as convocatorias,
    COUNT(CASE WHEN notif_becas = TRUE THEN 1 END) as becas,
    COUNT(CASE WHEN notif_eventos = TRUE THEN 1 END) as eventos,
    COUNT(CASE WHEN DATE(fecha_registro) = CURDATE() THEN 1 END) as hoy,
    COUNT(CASE WHEN YEARWEEK(fecha_registro) = YEARWEEK(CURDATE()) THEN 1 END) as esta_semana
FROM suscriptores_notificaciones;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar candidato de prueba
INSERT INTO bolsa_trabajo (
    nombre, email, telefono, ciudad, generacion,
    area_interes, resumen_profesional, habilidades, estado
) VALUES (
    'Samuel Cruz Interal',
    'samuelcis377@gmail.com',
    '744-123-4567',
    'Guerrero',
    '2020',
    'Comunicacion grafica',
    'Egresado con experiencia en diseño gráfico y manejo de Adobe Creative Suite. Buscando oportunidad en agencia creativa.',
    'Photoshop, Illustrator, InDesign, Excel avanzado, Inglés intermedio, Atención al cliente',
    'nuevo'
);

-- Insertar suscriptor de prueba
INSERT INTO suscriptores_notificaciones (
    email, nombre, notif_todas, estado, verificado
) VALUES (
    'samuelcis377@gmail.com',
    'Samuel Cruz',
    TRUE,
    'activo',
    TRUE
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Tabla bolsa_trabajo creada:' as mensaje, COUNT(*) as registros FROM bolsa_trabajo;
SELECT 'Tabla suscriptores_notificaciones creada:' as mensaje, COUNT(*) as registros FROM suscriptores_notificaciones;
SELECT 'Tabla empresas_asociadas creada:' as mensaje, COUNT(*) as registros FROM empresas_asociadas;
SELECT 'Tabla historial_compartidos creada:' as mensaje, COUNT(*) as registros FROM historial_compartidos;

SELECT * FROM v_stats_bolsa_trabajo;
SELECT * FROM v_stats_suscriptores;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
