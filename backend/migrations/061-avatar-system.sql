-- 061-avatar-system.sql
-- Sistema de Avatares y Personalización (Semana 4)
-- 1. Catálogo de items de avatar
CREATE TABLE IF NOT EXISTS avatar_items (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL,
    -- 'background', 'avatar_base', 'frame', 'accessory'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    -- Economía
    price_coins INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    -- Requiere nivel o logro especial
    req_level INTEGER DEFAULT 1,
    req_achievement_id INTEGER REFERENCES achievements(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 2. Inventario de Usuario (Items comprados/ganados)
CREATE TABLE IF NOT EXISTS user_avatar_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);
-- 3. Configuración de Avatar Activa (Resumen rápido para joins)
-- Opcional, pero útil si queremos evitar lógica compleja de "cuál está equipado" en cada query
CREATE TABLE IF NOT EXISTS user_avatar_config (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    current_base_id INTEGER REFERENCES avatar_items(id),
    current_frame_id INTEGER REFERENCES avatar_items(id),
    current_background_id INTEGER REFERENCES avatar_items(id),
    current_accessory_id INTEGER REFERENCES avatar_items(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Seed Data: Items Básicos (Gratis)
INSERT INTO avatar_items (
        item_type,
        name,
        description,
        image_url,
        price_coins,
        req_level
    )
VALUES -- Bases (Avatares por defecto)
    (
        'avatar_base',
        'Héroe Novato',
        'Avatar básico para nuevos estudiantes.',
        '/assets/avatars/base_novice.png',
        0,
        1
    ),
    (
        'avatar_base',
        'Estudiante Dedicado',
        'Para quienes toman en serio sus estudios.',
        '/assets/avatars/base_student.png',
        100,
        2
    ),
    (
        'avatar_base',
        'Robot BGE',
        'Mascota tecnológica.',
        '/assets/avatars/base_robot.png',
        500,
        5
    ),
    -- Marcos
    (
        'frame',
        'Marco de Madera',
        'Simple y rústico.',
        '/assets/frames/wood.png',
        0,
        1
    ),
    (
        'frame',
        'Marco Dorado',
        'Brilla como tus logros.',
        '/assets/frames/gold.png',
        1000,
        10
    ),
    (
        'frame',
        'Fuego',
        'Para rachas ardientes.',
        '/assets/frames/fire.png',
        0,
        1
    ),
    -- Podría requerir logro de racha
    -- Fondos
    (
        'background',
        'Aula Virtual',
        'El clásico salón de clases.',
        '/assets/bg/classroom.png',
        0,
        1
    ),
    (
        'background',
        'Espacio Exterior',
        'El límite es el cielo.',
        '/assets/bg/space.png',
        200,
        3
    ) ON CONFLICT DO NOTHING;
-- Trigger para auto-crear config al registrar usuario? 
-- Lo haremos lazy-load en el servicio.