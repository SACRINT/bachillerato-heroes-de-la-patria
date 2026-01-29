ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS grupo_id INTEGER REFERENCES grupos(id);
CREATE INDEX IF NOT EXISTS idx_tareas_grupo ON tareas(grupo_id);