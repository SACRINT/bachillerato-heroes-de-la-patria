-- Perfiles de Mentor
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    specialties TEXT [],
    -- Areas de experteza
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    -- Requiere aprobación administrativa
    rating NUMERIC(3, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
-- Relaciones de Mentoría
CREATE TABLE IF NOT EXISTS mentorships (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES usuarios(id),
    mentee_id INTEGER REFERENCES usuarios(id),
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, active, completed, rejected
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Sesiones de Mentoría
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id SERIAL PRIMARY KEY,
    mentorship_id INTEGER REFERENCES mentorships(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    topic VARCHAR(200),
    meeting_link TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    -- scheduled, completed, cancelled, missed
    notes TEXT,
    -- Notas privadas del mentor o compartidas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Tareas/Objetivos del Programa (Structured Program)
CREATE TABLE IF NOT EXISTS mentorship_tasks (
    id SERIAL PRIMARY KEY,
    mentorship_id INTEGER REFERENCES mentorships(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_approved ON mentor_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON mentorships(status);