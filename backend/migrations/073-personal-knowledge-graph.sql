-- Semama 16: Personal Knowledge Graph
-- Mapa de conocimiento personal e interconectado
-- Nodos del grafo de conocimiento (Temas/Conceptos)
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES adaptive_topics(id),
    -- Opcional, si ligamos con syllabus
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    -- 'math', 'history', etc.
    complexity_level INTEGER DEFAULT 1,
    coordinates_x DECIMAL(10, 2),
    -- Para layout inicial visual
    coordinates_y DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Relaciones entre nodos (Prerequisitos, Relacionados)
CREATE TABLE IF NOT EXISTS knowledge_links (
    id SERIAL PRIMARY KEY,
    source_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id),
    target_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id),
    relation_type VARCHAR(50) DEFAULT 'prerequisite',
    -- 'prerequisite', 'related', 'extends'
    weight DECIMAL(3, 2) DEFAULT 1.0,
    -- Fuerza de la relación
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_node_id, target_node_id, relation_type)
);
-- Estado de conocimiento del usuario por nodo
CREATE TABLE IF NOT EXISTS user_knowledge_state (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id),
    mastery_level DECIMAL(5, 2) DEFAULT 0.0,
    -- 0-100%
    confidence_level VARCHAR(20) DEFAULT 'low',
    -- low, medium, high
    last_interaction TIMESTAMP,
    decay_factor DECIMAL(3, 2) DEFAULT 1.0,
    -- Para olvido (spaced repetition)
    is_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);
-- Seed Data (Ejemplo Breve)
INSERT INTO knowledge_nodes (
        name,
        category,
        complexity_level,
        coordinates_x,
        coordinates_y
    )
VALUES ('Revolución Mexicana', 'history', 1, 0, 0),
    ('Porfiriato', 'history', 1, -100, 0),
    ('Constitución 1917', 'history', 2, 100, 0),
    ('Álgebra Básica', 'math', 1, 0, 100),
    ('Ecuaciones Lineales', 'math', 2, 0, 200),
    ('Factorización', 'math', 3, 100, 200) ON CONFLICT DO NOTHING;
INSERT INTO knowledge_links (source_node_id, target_node_id, relation_type)
SELECT n1.id,
    n2.id,
    'prerequisite'
FROM knowledge_nodes n1,
    knowledge_nodes n2
WHERE n1.name = 'Porfiriato'
    AND n2.name = 'Revolución Mexicana' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_links (source_node_id, target_node_id, relation_type)
SELECT n1.id,
    n2.id,
    'consequence'
FROM knowledge_nodes n1,
    knowledge_nodes n2
WHERE n1.name = 'Revolución Mexicana'
    AND n2.name = 'Constitución 1917' ON CONFLICT DO NOTHING;
INSERT INTO knowledge_links (source_node_id, target_node_id, relation_type)
SELECT n1.id,
    n2.id,
    'prerequisite'
FROM knowledge_nodes n1,
    knowledge_nodes n2
WHERE n1.name = 'Álgebra Básica'
    AND n2.name = 'Ecuaciones Lineales' ON CONFLICT DO NOTHING;