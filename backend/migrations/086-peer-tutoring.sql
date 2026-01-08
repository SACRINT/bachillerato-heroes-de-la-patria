-- Tabla de Perfiles de Tutores (Estudiantes que enseñan)
CREATE TABLE IF NOT EXISTS peer_tutors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate INTEGER DEFAULT 0,
    -- Costo en IACoins
    rating DECIMAL(3, 2) DEFAULT 0.00,
    -- Promedio 0.00 a 5.00
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    -- Verificado por profesor/admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
-- Materias que imparte el tutor
CREATE TABLE IF NOT EXISTS tutor_subjects (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER REFERENCES peer_tutors(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    expertise_level VARCHAR(20) DEFAULT 'Intermediate',
    -- Beginner, Intermediate, Advanced, Expert
    is_validated BOOLEAN DEFAULT FALSE,
    -- Si un docente validó este conocimiento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Sesiones de Tutoría
CREATE TABLE IF NOT EXISTS tutoring_sessions (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER REFERENCES peer_tutors(id),
    student_id INTEGER REFERENCES usuarios(id),
    subject VARCHAR(100),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'requested',
    -- requested, accepted, rejected, completed, cancelled
    cost INTEGER DEFAULT 0,
    -- IACoins congelados/pagados
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Reseñas y Calificaciones
CREATE TABLE IF NOT EXISTS tutor_reviews (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tutoring_sessions(id),
    tutor_id INTEGER REFERENCES peer_tutors(id),
    student_id INTEGER REFERENCES usuarios(id),
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_peer_tutors_rating ON peer_tutors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_subjects_subject ON tutor_subjects(subject);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor ON tutoring_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON tutoring_sessions(student_id);