-- Semilla de datos para Contenido Adaptativo (Semana 10)
-- Asegura que existan datos de prueba para la demo
-- 1. Asegurar Topic
INSERT INTO adaptive_topics (title, description, subject)
VALUES (
        'Revolución Mexicana',
        'Causas y desarrollo del conflicto armado de 1910',
        'Historia'
    ) ON CONFLICT DO NOTHING;
-- 2. Asegurar Node (usando DO block para variables o subqueries directos)
DO $$
DECLARE v_topic_id INTEGER;
v_node_id INTEGER;
BEGIN -- Obtener Topic ID
SELECT id INTO v_topic_id
FROM adaptive_topics
WHERE title = 'Revolución Mexicana'
LIMIT 1;
-- Insertar Node si no existe
IF NOT EXISTS (
    SELECT 1
    FROM adaptive_nodes
    WHERE topic_id = v_topic_id
        AND title = 'El Porfiriato'
) THEN
INSERT INTO adaptive_nodes (topic_id, title, order_index)
VALUES (v_topic_id, 'El Porfiriato', 1)
RETURNING id INTO v_node_id;
ELSE
SELECT id INTO v_node_id
FROM adaptive_nodes
WHERE topic_id = v_topic_id
    AND title = 'El Porfiriato';
END IF;
-- 3. Insertar Adaptaciones
-- Visual (Video)
INSERT INTO content_adaptations (
        node_id,
        content_type,
        target_style,
        difficulty_level,
        content_body
    )
SELECT v_node_id,
    'video',
    'visual',
    5,
    'https://www.youtube.com/embed/p1z5vP9lTng' -- Video real de ejemplo
WHERE NOT EXISTS (
        SELECT 1
        FROM content_adaptations
        WHERE node_id = v_node_id
            AND target_style = 'visual'
            AND content_type = 'video'
    );
-- Auditory (Audio Script)
INSERT INTO content_adaptations (
        node_id,
        content_type,
        target_style,
        difficulty_level,
        content_body
    )
SELECT v_node_id,
    'audio',
    'auditory',
    5,
    'Durante más de 30 años, Porfirio Díaz gobernó México con mano de hierro. Aunque trajo modernización y ferrocarriles, la desigualdad social creció desmedidamente...'
WHERE NOT EXISTS (
        SELECT 1
        FROM content_adaptations
        WHERE node_id = v_node_id
            AND target_style = 'auditory'
    );
-- Kinesthetic (Interactive JSON)
INSERT INTO content_adaptations (
        node_id,
        content_type,
        target_style,
        difficulty_level,
        content_body
    )
SELECT v_node_id,
    'interactive',
    'kinesthetic',
    5,
    '{"type": "timeline_drag_drop", "events": ["1876: Díaz asume el poder", "1908: Entrevista Díaz-Creelman", "1910: Plan de San Luis"]}'
WHERE NOT EXISTS (
        SELECT 1
        FROM content_adaptations
        WHERE node_id = v_node_id
            AND target_style = 'kinesthetic'
    );
-- Text (Neutral/Reading)
INSERT INTO content_adaptations (
        node_id,
        content_type,
        target_style,
        difficulty_level,
        content_body
    )
SELECT v_node_id,
    'text',
    'neutral',
    5,
    '<h3>El Porfiriato: Luces y Sombras</h3><p>El periodo conocido como el Porfiriato (1876-1911) se caracterizó por una estabilidad política sin precedentes y un rápido crecimiento económico...</p>'
WHERE NOT EXISTS (
        SELECT 1
        FROM content_adaptations
        WHERE node_id = v_node_id
            AND target_style = 'neutral'
    );
END $$;