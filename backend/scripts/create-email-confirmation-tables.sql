/**
 * 📧 CREAR TABLAS PARA FLUJO DE CONFIRMACIÓN DE EMAIL - BOLSA DE TRABAJO
 * Ejecutar esta script en Neon Console para completar la funcionalidad
 *
 * Fecha: 5 Noviembre 2025
 */

-- =====================================================================
-- 1. CREAR TABLA: bolsa_trabajo_pending_confirmation
-- =====================================================================
-- Esta tabla almacena registros temporales de formularios pendientes
-- de confirmación de email. Se usan tokens que expiran en 24 horas.

CREATE TABLE IF NOT EXISTS bolsa_trabajo_pending_confirmation (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,

    -- Información de contacto
    email VARCHAR(255) NOT NULL UNIQUE,

    -- Token de confirmación
    confirmation_token VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP NOT NULL,

    -- Datos del formulario (almacenados como JSON)
    form_data JSONB NOT NULL,

    -- Información de la solicitud
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Seguimiento de emails
    email_sent_count INT DEFAULT 1,
    last_email_sent_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,  -- NULL hasta que se confirme

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmation_token
    ON bolsa_trabajo_pending_confirmation(confirmation_token);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmation_email
    ON bolsa_trabajo_pending_confirmation(email);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmation_expires
    ON bolsa_trabajo_pending_confirmation(token_expires_at);

CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmation_confirmed
    ON bolsa_trabajo_pending_confirmation(confirmed_at);

-- Crear índice compuesto para búsquedas por estado de confirmación
CREATE INDEX IF NOT EXISTS idx_bolsa_trabajo_pending_confirmation_status
    ON bolsa_trabajo_pending_confirmation(confirmed_at, token_expires_at);

-- =====================================================================
-- 2. VALIDAR/CREAR TABLA: pendientes_aprobacion
-- =====================================================================
-- Esta tabla almacena solicitudes que han confirmado su email
-- y están en espera de aprobación del administrador

CREATE TABLE IF NOT EXISTS pendientes_aprobacion (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,

    -- Tipo de solicitud
    tipo_solicitud VARCHAR(50) NOT NULL,  -- 'bolsa_trabajo', 'noticias', etc

    -- Email y datos
    email_usuario VARCHAR(255) NOT NULL,
    datos_json JSONB,

    -- Estado del proceso
    estado VARCHAR(50) DEFAULT 'pendiente',  -- 'pendiente', 'aprobada', 'rechazada'
    email_confirmado BOOLEAN DEFAULT false,

    -- Información de aprobación
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    admin_id INT,
    admin_notas TEXT,
    fecha_procesado TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_tipo
    ON pendientes_aprobacion(tipo_solicitud);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_estado
    ON pendientes_aprobacion(estado);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_email_confirmado
    ON pendientes_aprobacion(email_confirmado);

CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_fecha
    ON pendientes_aprobacion(fecha_solicitud);

-- Crear índice compuesto para búsquedas por tipo y estado
CREATE INDEX IF NOT EXISTS idx_pendientes_aprobacion_tipo_estado
    ON pendientes_aprobacion(tipo_solicitud, estado);

-- =====================================================================
-- 3. VERIFICAR ESTRUCTURA
-- =====================================================================

-- Verificar que las tablas se crearon correctamente
-- Ejecutar esta consulta para confirmar:

SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'bolsa_trabajo_pending_confirmation',
    'pendientes_aprobacion'
)
ORDER BY table_name;

-- Resultado esperado: 2 filas (1 para cada tabla)

-- =====================================================================
-- 4. LIMPIAR TOKENS EXPIRADOS (OPCIONAL - EJECUTAR PERIÓDICAMENTE)
-- =====================================================================

-- Eliminar registros con tokens expirados que no fueron confirmados
-- (Ejecutar manualmente o configurar como tarea programada)

DELETE FROM bolsa_trabajo_pending_confirmation
WHERE token_expires_at < NOW()
AND confirmed_at IS NULL;

-- =====================================================================
-- INFORMACIÓN PARA EL USUARIO
-- =====================================================================
/*

PASOS PARA IMPLEMENTAR:

1. Copiar TODO este script (desde el principio hasta aquí)

2. Ir a Neon Console: https://console.neon.tech

3. Seleccionar la base de datos BGE

4. Hacer clic en "SQL Editor"

5. Pegar TODO el script aquí

6. Hacer clic en "Execute" (botón verde)

7. Esperar a que se complete (debe decir "Executed successfully")

8. Verificar en terminal del servidor Node.js que aparecen logs de éxito

9. Probar el flujo de bolsa de trabajo nuevamente

VERIFICACIÓN:

Para confirmar que se crearon las tablas correctamente:

SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%bolsa_trabajo_pending%';

SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'pendientes_aprobacion';

*/
