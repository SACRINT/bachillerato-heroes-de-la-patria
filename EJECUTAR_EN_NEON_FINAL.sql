-- SQL Script to seed the Neon database for ProyectoHP Dashboard (FINAL Version)

-- Step 1: Create missing tables to prevent errors.
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_parents (
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- Step 2: Clean up existing data to avoid conflicts.
DELETE FROM student_parents;
DELETE FROM docentes;
DELETE FROM estudiantes;
DELETE FROM parents;
DELETE FROM usuarios WHERE email LIKE '%@heroesdelapatria.edu.mx' OR email LIKE '%@example.com';
DELETE FROM bolsa_trabajo;
DELETE FROM suscriptores_notificaciones;
DELETE FROM pending_submissions;

-- Step 3: Reset sequences for SERIAL columns to start from 1.
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;
ALTER SEQUENCE docentes_id_seq RESTART WITH 1;
ALTER SEQUENCE estudiantes_id_seq RESTART WITH 1;
ALTER SEQUENCE parents_id_seq RESTART WITH 1;
ALTER SEQUENCE bolsa_trabajo_id_seq RESTART WITH 1;
ALTER SEQUENCE suscriptores_notificaciones_id_seq RESTART WITH 1;
ALTER SEQUENCE pending_submissions_id_seq RESTART WITH 1;

-- Step 4: Insert new data.

INSERT INTO usuarios (username, email, password_hash, role, status) VALUES
('admin', 'admin@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'admin', 'activo'),
('teacher1', 'teacher1@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'docente', 'activo'),
('student1', 'student1@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'estudiante', 'activo'),
('student2', 'student2@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'estudiante', 'activo'),
('parent1', 'parent1@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'padre', 'activo'),
('parent2', 'parent2@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.gG3Jc.F.3.g/N.zY.f.9.zY.f.9', 'padre', 'activo');

INSERT INTO docentes (usuario_id, nombre_completo, especialidad) VALUES
((SELECT id FROM usuarios WHERE email = 'teacher1@heroesdelapatria.edu.mx'), 'Profesor Oak', 'Pokémonology');

INSERT INTO estudiantes (usuario_id, matricula, nombre_completo, grado, grupo) VALUES
((SELECT id FROM usuarios WHERE email = 'student1@heroesdelapatria.edu.mx'), '20250001', 'Ash Ketchum', 1, 'A'),
((SELECT id FROM usuarios WHERE email = 'student2@heroesdelapatria.edu.mx'), '20250002', 'Misty Waterflower', 1, 'B');

INSERT INTO parents (id, email, password_hash, nombre) VALUES
((SELECT id FROM usuarios WHERE email = 'parent1@example.com'), 'parent1@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'Delia Ketchum'),
((SELECT id FROM usuarios WHERE email = 'parent2@example.com'), 'parent2@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.gG3Jc.F.3.g/N.zY.f.9.zY.f.9', 'Daisy Waterflower');

INSERT INTO student_parents (parent_id, student_id) VALUES
((SELECT id FROM parents WHERE email = 'parent1@example.com'), (SELECT id FROM estudiantes WHERE matricula = '20250001')),
((SELECT id FROM parents WHERE email = 'parent2@example.com'), (SELECT id FROM estudiantes WHERE matricula = '20250002'));

INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, cv_url, habilidades, experiencia, estado, notas) VALUES
('Brock Pewter', 'brock@example.com', '555-1234', '2022', 'http://example.com/brock.pdf', 'Cooking, Rock-type Pokemon', 'Gym Leader', 'nuevo', 'Good with rock types'),
('Tracey Sketchit', 'tracey@example.com', '555-5678', '2023', 'http://example.com/tracey.pdf', 'Pokemon Watching, Drawing', 'Pokemon Watcher', 'revisado', 'Good artist');

INSERT INTO suscriptores_notificaciones (email, nombre, estado, verificado) VALUES
('jessie@example.com', 'Jessie', 'activo', true),
('james@example.com', 'James', 'activo', true);

INSERT INTO pending_submissions (form_type, submission_data) VALUES
('bolsa_trabajo', '{"nombre_completo": "Meowth", "email": "meowth@example.com", "telefono": "555-9999", "generacion": "2024", "habilidades": "Talking", "experiencia": "Team Rocket"}'),
('egresados', '{"nombre": "Gary Oak", "email": "gary@example.com", "generacion": "2022"}');
