-- Script para asegurar que la tabla estudiantes existe
-- Necesaria para que el Dashboard funcione correctamente sin mocks
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    nia VARCHAR(50),
    especialidad VARCHAR(100) DEFAULT 'Tronco Común',
    semestre INTEGER DEFAULT 1,
    grupo VARCHAR(10) DEFAULT 'A',
    turno VARCHAR(20) DEFAULT 'Matutino',
    generacion VARCHAR(20),
    estatus VARCHAR(20) DEFAULT 'activo',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario ON estudiantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_matricula ON estudiantes(matricula);