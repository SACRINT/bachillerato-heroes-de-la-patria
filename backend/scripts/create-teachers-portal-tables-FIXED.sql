/**
 * 👨‍🏫 PORTAL DE DOCENTES - SCHEMA DE BASE DE DATOS
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Este script crea las tablas adicionales necesarias para el Portal de Docentes
 *
 * PREREQUISITOS:
 * - create-database.sql (tabla docentes)
 * - create-parents-portal-tables.sql (tablas students, grades, attendance)
 */

-- ============================================
-- TABLA: teacher_classes (Clases/Grupos de Docentes)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_classes (
    id SERIAL PRIMARY KEY,

    -- Docente
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,

    -- Información de la Clase
    materia VARCHAR(100) NOT NULL,
    nivel VARCHAR(50) NOT NULL, -- 'primero', 'segundo', 'tercero'
    grado INTEGER CHECK (grado BETWEEN 1 AND 3),
    grupo VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', etc.

    -- Periodo Académico
    ciclo_escolar VARCHAR(20) NOT NULL, -- '2025-2026'
    periodo VARCHAR(50), -- 'agosto-diciembre', 'enero-junio'

    -- Horario
    dia_semana VARCHAR(20)[], -- ['lunes', 'miercoles', 'viernes']
    hora_inicio TIME,
    hora_fin TIME,
    salon VARCHAR(50),

    -- Capacidad
    capacidad_maxima INTEGER DEFAULT 30,
    estudiantes_inscritos INTEGER DEFAULT 0,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    visible_estudiantes BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint para evitar duplicados
    CONSTRAINT unique_teacher_class UNIQUE (teacher_id, materia, grado, grupo, ciclo_escolar)
);

-- ============================================
-- TABLA: teacher_class_students (Estudiantes por Clase)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_class_students (
    id SERIAL PRIMARY KEY,

    -- Relación
    class_id INTEGER NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,

    -- Información de Inscripción
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    numero_lista INTEGER, -- Número en lista de asistencia

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint para evitar duplicados
    CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- ============================================
-- TABLA: teacher_resources (Recursos Educativos)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_resources (
    id SERIAL PRIMARY KEY,

    -- Docente y Clase
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE SET NULL,

    -- Información del Recurso
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL, -- 'documento', 'presentacion', 'video', 'enlace', 'otro'
    categoria VARCHAR(100), -- 'apuntes', 'ejercicios', 'examenes', 'tareas'

    -- Archivo
    archivo_nombre VARCHAR(255),
    archivo_url TEXT,
    archivo_tamano BIGINT, -- En bytes
    archivo_tipo_mime VARCHAR(100),

    -- Enlace externo (alternativa al archivo)
    enlace_externo TEXT,

    -- Visibilidad y Acceso
    visible_estudiantes BOOLEAN DEFAULT TRUE,
    visible_padres BOOLEAN DEFAULT FALSE,
    fecha_publicacion TIMESTAMP,
    fecha_expiracion TIMESTAMP,

    -- Descargas
    total_descargas INTEGER DEFAULT 0,
    ultima_descarga TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: teacher_assignments (Tareas/Trabajos)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id SERIAL PRIMARY KEY,

    -- Docente y Clase
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,

    -- Información de la Tarea
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50), -- 'tarea', 'proyecto', 'investigacion', 'examen'

    -- Fechas
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NOT NULL,
    permite_entrega_tardia BOOLEAN DEFAULT FALSE,
    fecha_limite_tardia TIMESTAMP,

    -- Calificación
    puntaje_maximo DECIMAL(5,2) DEFAULT 10.00,
    porcentaje_calificacion DECIMAL(5,2), -- Peso en la calificación final

    -- Recursos adjuntos
    archivo_instrucciones_url TEXT,

    -- Estado
    publicado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: teacher_assignment_submissions (Entregas de Tareas)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_assignment_submissions (
    id SERIAL PRIMARY KEY,

    -- Tarea y Estudiante
    assignment_id INTEGER NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,

    -- Entrega
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entrega_tardia BOOLEAN DEFAULT FALSE,

    -- Archivos entregados
    archivo_nombre VARCHAR(255),
    archivo_url TEXT,
    archivo_tamano BIGINT,

    -- Comentarios del estudiante
    comentarios TEXT,

    -- Calificación y Retroalimentación
    calificacion DECIMAL(5,2),
    feedback TEXT,
    fecha_calificacion TIMESTAMP,

    -- Estado
    revisado BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint para evitar entregas duplicadas
    CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id)
);

-- ============================================
-- TABLA: teacher_notifications (Notificaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_notifications (
    id SERIAL PRIMARY KEY,

    -- Docente
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,

    -- Tipo de Notificación
    tipo VARCHAR(50) NOT NULL, -- 'tarea_pendiente', 'reunion', 'mensaje', 'evento', 'alerta'
    prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'

    -- Contenido
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Enlace relacionado
    enlace_url TEXT,
    entidad_tipo VARCHAR(50), -- 'assignment', 'class', 'message', etc.
    entidad_id INTEGER,

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    archivada BOOLEAN DEFAULT FALSE,

    -- Expiración
    expira BOOLEAN DEFAULT FALSE,
    fecha_expiracion TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: teacher_messages (Mensajería)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_messages (
    id SERIAL PRIMARY KEY,

    -- Remitente (siempre el docente en este caso)
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,

    -- Destinatario
    recipient_type VARCHAR(20) NOT NULL, -- 'parent', 'student', 'admin'
    recipient_id INTEGER NOT NULL, -- ID del padre, estudiante o admin

    -- Relacionado con estudiante (si aplica)
    related_student_id INTEGER REFERENCES estudiantes(id) ON DELETE SET NULL,

    -- Contenido
    asunto VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Hilo de conversación
    parent_message_id INTEGER REFERENCES teacher_messages(id) ON DELETE SET NULL,
    es_respuesta BOOLEAN DEFAULT FALSE,

    -- Estado
    leido BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    importante BOOLEAN DEFAULT FALSE,
    archivado BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: teacher_attendance_sessions (Sesiones de Asistencia)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_attendance_sessions (
    id SERIAL PRIMARY KEY,

    -- Clase y Fecha
    class_id INTEGER NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,

    -- Información de la Sesión
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,

    -- Tema de la clase
    tema VARCHAR(255),
    observaciones TEXT,

    -- Estado
    cerrada BOOLEAN DEFAULT FALSE, -- Una vez cerrada, no se puede modificar
    fecha_cierre TIMESTAMP,

    -- Estadísticas
    total_estudiantes INTEGER DEFAULT 0,
    total_asistencias INTEGER DEFAULT 0,
    total_faltas INTEGER DEFAULT 0,
    total_retardos INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraint para evitar sesiones duplicadas
    CONSTRAINT unique_class_session UNIQUE (class_id, fecha)
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Teacher Classes
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_materia ON teacher_classes(materia);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_grado_grupo ON teacher_classes(grado, grupo);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_activo ON teacher_classes(activo) WHERE activo = TRUE;

-- Teacher Class Students
CREATE INDEX IF NOT EXISTS idx_teacher_class_students_class ON teacher_class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_students_student ON teacher_class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_students_activo ON teacher_class_students(activo) WHERE activo = TRUE;

-- Teacher Resources
CREATE INDEX IF NOT EXISTS idx_teacher_resources_teacher ON teacher_resources(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_class ON teacher_resources(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_tipo ON teacher_resources(tipo);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_visible ON teacher_resources(visible_estudiantes) WHERE visible_estudiantes = TRUE;

-- Teacher Assignments
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_fecha_entrega ON teacher_assignments(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_publicado ON teacher_assignments(publicado) WHERE publicado = TRUE;

-- Teacher Assignment Submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON teacher_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON teacher_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_revisado ON teacher_assignment_submissions(revisado);

-- Teacher Notifications
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher ON teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_leida ON teacher_notifications(leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_prioridad ON teacher_notifications(prioridad);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_created ON teacher_notifications(created_at DESC);

-- Teacher Messages
CREATE INDEX IF NOT EXISTS idx_teacher_messages_teacher ON teacher_messages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_recipient ON teacher_messages(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_student ON teacher_messages(related_student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_leido ON teacher_messages(leido) WHERE leido = FALSE;

-- Teacher Attendance Sessions
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON teacher_attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON teacher_attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_fecha ON teacher_attendance_sessions(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_cerrada ON teacher_attendance_sessions(cerrada);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de clases por docente
CREATE OR REPLACE VIEW v_teacher_classes_summary AS
SELECT
    tc.teacher_id,
    tc.id as class_id,
    tc.materia,
    tc.grado,
    tc.grupo,
    tc.ciclo_escolar,
    COUNT(DISTINCT tcs.student_id) as total_estudiantes,
    tc.capacidad_maxima,
    tc.salon,
    tc.activo
FROM teacher_classes tc
LEFT JOIN teacher_class_students tcs ON tc.id = tcs.class_id AND tcs.activo = TRUE
WHERE tc.activo = TRUE
GROUP BY tc.id, tc.teacher_id, tc.materia, tc.grado, tc.grupo, tc.ciclo_escolar, tc.capacidad_maxima, tc.salon, tc.activo;

-- Vista: Tareas pendientes de revisión
CREATE OR REPLACE VIEW v_pending_assignment_reviews AS
SELECT
    ta.id as assignment_id,
    ta.teacher_id,
    ta.class_id,
    ta.titulo as assignment_titulo,
    ta.fecha_entrega,
    COUNT(tas.id) as total_entregas,
    COUNT(CASE WHEN tas.revisado = FALSE THEN 1 END) as pendientes_revision,
    COUNT(CASE WHEN tas.revisado = TRUE THEN 1 END) as revisadas
FROM teacher_assignments ta
LEFT JOIN teacher_assignment_submissions tas ON ta.id = tas.assignment_id
WHERE ta.activo = TRUE
GROUP BY ta.id, ta.teacher_id, ta.class_id, ta.titulo, ta.fecha_entrega;

-- Vista: Mensajes no leídos por docente
CREATE OR REPLACE VIEW v_teacher_unread_messages AS
SELECT
    teacher_id,
    COUNT(*) as total_no_leidos,
    COUNT(CASE WHEN importante = TRUE THEN 1 END) as importantes_no_leidos
FROM teacher_messages
WHERE leido = FALSE AND archivado = FALSE
GROUP BY teacher_id;

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_teacher_classes_updated_at ON teacher_classes;
CREATE TRIGGER update_teacher_classes_updated_at
    BEFORE UPDATE ON teacher_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_resources_updated_at ON teacher_resources;
CREATE TRIGGER update_teacher_resources_updated_at
    BEFORE UPDATE ON teacher_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_assignments_updated_at ON teacher_assignments;
CREATE TRIGGER update_teacher_assignments_updated_at
    BEFORE UPDATE ON teacher_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_assignment_submissions_updated_at ON teacher_assignment_submissions;
CREATE TRIGGER update_teacher_assignment_submissions_updated_at
    BEFORE UPDATE ON teacher_assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_attendance_sessions_updated_at ON teacher_attendance_sessions;
CREATE TRIGGER update_teacher_attendance_sessions_updated_at
    BEFORE UPDATE ON teacher_attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contador de estudiantes en clase
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE teacher_classes
        SET estudiantes_inscritos = estudiantes_inscritos + 1
        WHERE id = NEW.class_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE teacher_classes
        SET estudiantes_inscritos = GREATEST(0, estudiantes_inscritos - 1)
        WHERE id = OLD.class_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.activo <> OLD.activo THEN
        IF NEW.activo = TRUE THEN
            UPDATE teacher_classes
            SET estudiantes_inscritos = estudiantes_inscritos + 1
            WHERE id = NEW.class_id;
        ELSE
            UPDATE teacher_classes
            SET estudiantes_inscritos = GREATEST(0, estudiantes_inscritos - 1)
            WHERE id = NEW.class_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_class_student_count ON teacher_class_students;
CREATE TRIGGER trigger_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON teacher_class_students
    FOR EACH ROW
    EXECUTE FUNCTION update_class_student_count();

-- ============================================
-- DATOS DE EJEMPLO (DESARROLLO)
-- ============================================

-- Insertar clase de ejemplo (asumiendo que docente con id=1 existe)
INSERT INTO teacher_classes (teacher_id, materia, nivel, grado, grupo, ciclo_escolar, dia_semana, hora_inicio, hora_fin, salon)
VALUES (1, 'Matemáticas', 'segundo', 2, 'A', '2025-2026', ARRAY['lunes', 'miercoles', 'viernes'], '08:00', '09:30', 'Aula 201')
ON CONFLICT (teacher_id, materia, grado, grupo, ciclo_escolar) DO NOTHING;

-- ============================================
-- COMENTARIOS DE TABLAS
-- ============================================

COMMENT ON TABLE teacher_classes IS 'Clases/Grupos que imparte cada docente';
COMMENT ON TABLE teacher_class_students IS 'Estudiantes inscritos en cada clase';
COMMENT ON TABLE teacher_resources IS 'Recursos educativos subidos por docentes';
COMMENT ON TABLE teacher_assignments IS 'Tareas y trabajos asignados por docentes';
COMMENT ON TABLE teacher_assignment_submissions IS 'Entregas de tareas por estudiantes';
COMMENT ON TABLE teacher_notifications IS 'Notificaciones para docentes';
COMMENT ON TABLE teacher_messages IS 'Mensajería entre docentes y padres/estudiantes';
COMMENT ON TABLE teacher_attendance_sessions IS 'Sesiones de asistencia para control diario';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
