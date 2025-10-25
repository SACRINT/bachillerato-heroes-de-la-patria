-- SQL Script to seed the Neon database for ProyectoHP Dashboard (Version 2)

-- Step 1: Create missing tables to prevent errors.
-- The student_parents table was identified as missing.
CREATE TABLE IF NOT EXISTS student_parents (
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- Step 2: Clean up existing data to avoid conflicts and ensure a fresh start.
-- Note: We delete from tables with foreign key dependencies first.
DELETE FROM student_parents;
DELETE FROM docentes;
DELETE FROM estudiantes;
DELETE FROM parents;
-- We only delete the users created for testing purposes, not all users.
DELETE FROM usuarios WHERE email LIKE '%@heroesdelapatria.edu.mx' OR email LIKE '%@example.com';
DELETE FROM bolsa_trabajo;
DELETE FROM suscriptores;
DELETE FROM pending_submissions;

-- Step 3: Reset sequences for SERIAL columns to start from 1
-- This ensures that the hardcoded IDs in the INSERT statements match.
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;
ALTER SEQUENCE docentes_id_seq RESTART WITH 1;
ALTER SEQUENCE estudiantes_id_seq RESTART WITH 1;
ALTER SEQUENCE parents_id_seq RESTART WITH 1;
ALTER SEQUENCE bolsa_trabajo_id_seq RESTART WITH 1;
ALTER SEQUENCE suscriptores_id_seq RESTART WITH 1;
ALTER SEQUENCE pending_submissions_id_seq RESTART WITH 1;


-- Step 4: Insert new data

-- Insert users with different roles
INSERT INTO usuarios (username, email, password_hash, role, status) VALUES
('admin', 'admin@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'admin', 'activo'),
('teacher1', 'teacher1@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'docente', 'activo'),
('student1', 'student1@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'estudiante', 'activo'),
('student2', 'student2@heroesdelapatria.edu.mx', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'estudiante', 'activo'),
('parent1', 'parent1@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'padre', 'activo'),
('parent2', 'parent2@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.gG3Jc.F.3.g/N.zY.f.9.zY.f.9', 'padre', 'activo');

-- Insert teachers, linking them to a user ID
-- Assuming 'teacher1' gets usuario_id = 2
INSERT INTO docentes (usuario_id, nombre_completo, especialidad) VALUES
(2, 'Profesor Oak', 'Pokémonology');

-- Insert students, linking them to user IDs
-- Assuming 'student1' gets usuario_id = 3 and 'student2' gets usuario_id = 4
INSERT INTO estudiantes (usuario_id, matricula, nombre_completo, grado, grupo) VALUES
(3, '20250001', 'Ash Ketchum', 1, 'A'),
(4, '20250002', 'Misty Waterflower', 1, 'B');

-- Insert parents
-- Assuming 'parent1' gets usuario_id = 5 and 'parent2' gets usuario_id = 6
INSERT INTO parents (id, email, password_hash, nombre) VALUES
(5, 'parent1@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.g3Jc.F.3.g/N.zY.f.9.zY.f.9', 'Delia Ketchum'),
(6, 'parent2@example.com', '$2a$10$Y.eg9.V9a/f69J5E5S9.Fei/c5v.gG3Jc.F.3.g/N.zY.f.9.zY.f.9', 'Daisy Waterflower');


-- Link parents to students
-- Assuming student Ash has id=3 and Misty has id=4, and parent Delia has id=5, Daisy has id=6
INSERT INTO student_parents (parent_id, student_id) VALUES
(5, 3),
(6, 4);

-- Insert job applications
INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, cv_url, habilidades, experiencia, estado, notas) VALUES
('Brock Pewter', 'brock@example.com', '555-1234', '2022', 'http://example.com/brock.pdf', 'Cooking, Rock-type Pokemon', 'Gym Leader', 'nuevo', 'Good with rock types'),
('Tracey Sketchit', 'tracey@example.com', '555-5678', '2023', 'http://example.com/tracey.pdf', 'Pokemon Watching, Drawing', 'Pokemon Watcher', 'revisado', 'Good artist');

-- Insert newsletter subscribers
INSERT INTO suscriptores (subscription_id, email, nombre, categories, source, active, unsubscribe_token) VALUES
('sub_1', 'jessie@example.com', 'Jessie', ARRAY['all'], 'newsletter', true, 'token_jessie'),
('sub_2', 'james@example.com', 'James', ARRAY['all'], 'newsletter', true, 'token_james');

-- Insert pending submissions for approval
INSERT INTO pending_submissions (form_type, submission_data) VALUES
('bolsa_trabajo', '{"nombre_completo": "Meowth", "email": "meowth@example.com", "telefono": "555-9999", "generacion": "2024", "habilidades": "Talking", "experiencia": "Team Rocket"}'),
('egresados', '{"nombre": "Gary Oak", "email": "gary@example.com", "generacion": "2022"}');

