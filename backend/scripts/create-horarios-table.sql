CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50),
    materia_id INTEGER REFERENCES materias(id),
    docente_id INTEGER REFERENCES docentes(id),
    grupo_id INTEGER REFERENCES grupos(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id INTEGER
);
CREATE INDEX IF NOT EXISTS idx_horarios_grupo ON horarios(grupo_id);
CREATE INDEX IF NOT EXISTS idx_horarios_docente ON horarios(docente_id);
CREATE INDEX IF NOT EXISTS idx_horarios_materia ON horarios(materia_id);