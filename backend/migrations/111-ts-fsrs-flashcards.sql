-- Migration 111: ts-fsrs spaced repetition flashcards engine
-- Fase 6 - Objetivo 4: Flashcards Mnemotécnicas de Estudio con Algoritmo FSRS v4
-- Bachillerato General Estatal Héroes de la Patria

-- 1. Tabla de Mazos Curriculares
CREATE TABLE IF NOT EXISTS flashcard_decks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    subject VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    card_count INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'General',
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Tarjetas Mnemotécnicas
CREATE TABLE IF NOT EXISTS flashcard_cards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,          -- Pregunta / concepto clave / fórmula
    back TEXT NOT NULL,           -- Respuesta / explicación pedagógica
    hints TEXT,                   -- Pistas o mnemotecnia opcional
    difficulty INTEGER DEFAULT 3, -- Dificultad inicial estimada (1-5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Revisiones y Parámetros FSRS v4 por Estudiante
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES flashcard_cards(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    stability REAL NOT NULL DEFAULT 2.0,       -- S en días (FSRS v4)
    difficulty REAL NOT NULL DEFAULT 5.0,      -- D 1-10 (FSRS v4)
    elapsed_days REAL NOT NULL DEFAULT 0,
    scheduled_days REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,           -- Número de repasos acumulados
    lapses INTEGER NOT NULL DEFAULT 0,         -- Número de olvidos (calificación Again)
    state INTEGER NOT NULL DEFAULT 0,          -- 0=New, 1=Learning, 2=Review, 3=Relearning
    due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_review TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_flashcard_reviews_card_user UNIQUE (card_id, user_id)
);

-- 4. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_subject ON flashcard_decks(subject);
CREATE INDEX IF NOT EXISTS idx_flashcard_cards_deck ON flashcard_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due ON flashcard_reviews(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_card_user ON flashcard_reviews(card_id, user_id);

-- 5. Seed Data: 7 Mazos Curriculares (uno por materia) × 5 Tarjetas = 35 Tarjetas de Ejemplo

-- Mazo 1: Matemáticas
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (1, 1, 'matematicas', 'Álgebra y Ecuaciones Cuadráticas', 'Fundamentos de álgebra, factorización y fórmulas esenciales de segundo grado.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 2: Física
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (2, 1, 'fisica', 'Mecánica Clásica y Leyes de Newton', 'Cinemática, dinámica, trabajo mecánico y principios de conservación de la energía.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 3: Química
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (3, 1, 'quimica', 'Estructura Atómica y Enlace Químico', 'Modelos atómicos, tabla periódica, enlaces iónico/covalente y estequiometría básica.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 4: Biología
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (4, 1, 'biologia', 'Biología Celular y Genética', 'Estructura y organelos celulares, leyes de Mendel, replicación del ADN y fotosíntesis.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 5: Historia
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (5, 1, 'historia', 'Historia de México Contemporánea', 'Independencia, Reforma Liberal, Revolución de 1910 e instituciones clave.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 6: Lenguaje
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (6, 1, 'lenguaje', 'Lengua y Comunicación Escrita', 'Reglas de acentuación, funciones de la lengua, figuras retóricas y estructura de ensayos.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Mazo 7: Filosofía
INSERT INTO flashcard_decks (id, tenant_id, subject, name, description, card_count, category)
VALUES (7, 1, 'filosofia', 'Filosofía y Ética Ciudadana', 'Método socrático, alegoría de la caverna, ética kantiana y falacias argumentativas.', 5, 'Ejemplo')
ON CONFLICT (id) DO UPDATE SET 
    subject = EXCLUDED.subject, 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    card_count = EXCLUDED.card_count, 
    category = EXCLUDED.category;

-- Tarjetas Mazo 1 (Matemáticas)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(1, 1, '¿Cuál es la fórmula general para resolver una ecuación cuadrática ax² + bx + c = 0?', 'x = (-b ± √(b² - 4ac)) / (2a)', 'Recuerda el discriminante b² - 4ac dentro del radical', 3),
(2, 1, '¿Qué indica un discriminante Δ = b² - 4ac mayor que cero (Δ > 0)?', 'La ecuación cuadrática tiene dos soluciones reales y distintas.', 'Si es igual a 0 hay una raíz; si es menor a 0 son complejas', 2),
(3, 1, 'Enuncie el Teorema de Pitágoras para un triángulo rectángulo.', 'a² + b² = c², donde c es la hipotenusa y a, b son los catetos.', 'La suma de los cuadrados de los catetos es igual al cuadrado de la hipotenusa', 1),
(4, 1, '¿Cuál es la derivada de la función f(x) = xⁿ según la regla de la potencia?', 'f''(x) = n · xⁿ⁻¹', 'Baja el exponente a multiplicar y resta 1 a la potencia', 2),
(5, 1, '¿Cómo se calcula la pendiente (m) de una recta dados dos puntos (x₁, y₁) y (x₂, y₂)?', 'm = (y₂ - y₁) / (x₂ - x₁)', 'Es la razón de cambio vertical entre el cambio horizontal', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 2 (Física)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(6, 2, '¿Qué postula la Segunda Ley de Newton?', 'La fuerza neta aplicada sobre un cuerpo es proporcional a su aceleración: F = m · a.', 'Fuerza = masa × aceleración (Unidades en Newtons: kg·m/s²)', 2),
(7, 2, 'Ecuación de velocidad final en MRUA sin depender del tiempo:', 'v_f² = v_0² + 2 · a · d', 'Relaciona velocidad inicial, aceleración y distancia recorrida', 3),
(8, 2, '¿Qué establece el Principio de Conservación de la Energía Mecánica?', 'En un sistema aislado sin fricción, la energía mecánica total permanece constante: Ec + Ep = Constante.', 'La energía no se crea ni se destruye, solo se transforma', 2),
(9, 2, '¿Cuál es la ecuación de la Primera Ley de la Termodinámica?', 'ΔU = Q - W (La variación de energía interna es igual al calor absorbido menos el trabajo realizado).', 'Q es calor transferido, W es trabajo hecho por el sistema', 3),
(10, 2, '¿Cómo se define el trabajo mecánico (W) realizado por una fuerza constante?', 'W = F · d · cos(θ), medido en Joules (J = N·m).', 'θ es el ángulo entre el vector fuerza y el vector desplazamiento', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 3 (Química)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(11, 3, '¿Qué representa el número atómico (Z) de un elemento?', 'El número de protones presentes en el núcleo de cada átomo del elemento.', 'En un átomo neutro, también equivale al número de electrones', 1),
(12, 3, '¿Cuál es la diferencia fundamental entre un enlace iónico y uno covalente?', 'En el enlace iónico se transfieren electrones (metal + no metal); en el covalente se comparten pares de electrones (entre no metales).', 'Iónico genera iones cargados; covalente comparte orbitales', 2),
(13, 3, '¿En qué consiste la Regla del Octeto formulada por Gilbert Lewis?', 'Los átomos tienden a ganar, perder o compartir electrones hasta completar 8 electrones en su capa de valencia (adquiriendo configuración de gas noble).', 'Aspiran a la estabilidad del octeto periférico', 2),
(14, 3, '¿Qué es el Número de Avogadro y cuál es su valor aproximado?', 'Es el número de partículas elementales contenidas en un mol de sustancia: 6.022 × 10²³ partículas/mol.', 'Constante fundamental para cálculos estequiométricos', 2),
(15, 3, '¿Cómo se define matemáticamente el potencial de hidrógeno (pH)?', 'pH = -log₁₀[H⁺], es la medida de la concentración de iones hidronio en solución.', 'pH < 7 es ácido, pH = 7 es neutro, pH > 7 es básico o alcalino', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 4 (Biología)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(16, 4, '¿Cuál es la principal diferencia estructural entre células procariotas y eucariotas?', 'Las procariotas carecen de núcleo delimitado por membrana y organelos membranosos; las eucariotas poseen núcleo verdadero y organelos complejos.', 'Bacterias son procariotas; plantas, animales y hongos son eucariotas', 2),
(17, 4, '¿Cuál es la función primordial de la mitocondria en la célula eucariota?', 'Sintetizar ATP (energía celular) a través de la respiración celular aeróbica y fosforilación oxidativa.', 'Considerada la central energética celular', 1),
(18, 4, '¿Qué postula la Primera Ley de Mendel (Ley de la Segregación de Caracteres)?', 'Durante la formación de los gametos, los dos alelos de un mismo gen se separan (segregan), de modo que cada gameto lleva solo un alelo.', 'Cada progenitor hereda solo una copia al azar a su descendiente', 3),
(19, 4, '¿Cuáles son las cuatro bases nitrogenadas del ADN y cómo se aparean?', 'Adenina (A) se une con Timina (T); Citosina (C) se une con Guanina (G).', 'Regla de Chargaff: A=T (2 puentes de H) y C≡G (3 puentes de H)', 2),
(20, 4, '¿Cuál es la ecuación química general y balanceada de la fotosíntesis oxigénica?', '6 CO₂ + 6 H₂O + Energía Lumínica → C₆H₁₂O₆ (Glucosa) + 6 O₂', 'Convierte dióxido de carbono y agua en carbohidratos y oxígeno', 3)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 5 (Historia)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(21, 5, '¿Qué proclamó el Plan de Iguala en 1821 y cuáles fueron sus tres garantías?', 'Proclamó la consumación de la Independencia de México bajo tres garantías: Religión católica única, Independencia absoluta de España y Unión de todos los habitantes.', 'Pacto firmado entre Agustín de Iturbide y Vicente Guerrero', 2),
(22, 5, '¿Cuál fue el objetivo central de las Leyes de Reforma promulgadas en México (1855-1863)?', 'Consolidar la separación entre la Iglesia y el Estado, desamortizar bienes eclesiásticos y establecer el registro civil secular.', 'Lideradas por Benito Juárez y la facción liberal', 2),
(23, 5, '¿En qué fecha inició la Revolución Mexicana y bajo qué plan político?', 'El 20 de noviembre de 1910, convocada por Francisco I. Madero mediante el Plan de San Luis con el lema "Sufragio efectivo, no reelección".', 'Movimiento armado para derrocar al régimen de Porfirio Díaz', 2),
(24, 5, '¿Qué principio garantiza el Artículo 3° de la Constitución Mexicana de 1917?', 'El derecho a una educación pública, laica, obligatoria, gratuita y de excelencia impartida por el Estado.', 'Pilar educativo del pacto social posrevolucionario', 1),
(25, 5, '¿Cuándo y quién decretó la Expropiación Petrolera en México?', 'El 18 de marzo de 1938, por el presidente general Lázaro Cárdenas del Río.', 'Nacionalizó los bienes e hidrocarburos de empresas extranjeras', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 6 (Lenguaje)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(26, 6, '¿Cómo se clasifican las palabras según la posición de su sílaba tónica?', 'Agudas (última sílaba), Graves o llanas (penúltima), Esdrújulas (antepenúltima) y Sobresdrújulas (anterior a la antepenúltima).', 'Determina las reglas ortográficas del uso de tildes', 2),
(27, 6, '¿Cuál es la diferencia entre lenguaje denotativo y lenguaje connotativo?', 'Denotativo: significado literal y objetivo según el diccionario. Connotativo: significado subjetivo, contextual, emocional o figurado.', 'Denotación informa; connotación evoca o sugiere', 2),
(28, 6, '¿En qué consiste la función apelativa o conativa del lenguaje?', 'Su objetivo es influir en la conducta, pensamiento o decisión del receptor mediante órdenes, ruegos o argumentos persuasivos.', 'Típica en textos publicitarios, discursos políticos y órdenes directas', 2),
(29, 6, '¿Cuáles son las tres partes estructurales básicas de un ensayo argumentativo?', 'Introducción (planteamiento y tesis central), Desarrollo o cuerpo argumentativo (argumentos y contraargumentos) y Conclusión (síntesis y cierre).', 'Estructura lógica de persuasión académica', 2),
(30, 6, '¿Qué es una metáfora como figura literaria?', 'Es la identificación y transferencia semántica entre dos realidades distintas que comparten una semejanza o analogía tácita, sin usar nexo comparativo.', 'A diferencia del símil, no usa "como" ni "parece"', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Tarjetas Mazo 7 (Filosofía)
INSERT INTO flashcard_cards (id, deck_id, front, back, hints, difficulty) VALUES
(31, 7, '¿En qué consiste el método de la mayéutica atribuido a Sócrates?', 'En el arte de interrogar dialógicamente al interlocutor para que este descubra la verdad por sí mismo mediante el examen de sus propias contradicciones.', 'Literalmente significa "dar a luz ideas"', 2),
(32, 7, '¿Qué simboliza la Alegoría o Mito de la Caverna de Platón en "La República"?', 'El tránsito del alma desde la ignorancia y el mundo de las apariencias sensibles (sombras) hacia el conocimiento verdadero de las Ideas y el Bien (la luz del Sol).', 'Distingue entre doxa (opinión) y episteme (ciencia/saber)', 3),
(33, 7, '¿Cuál es la formulación principal del Imperativo Categórico kantiano?', '"Obra solo según aquella máxima por la cual puedas querer al mismo tiempo que se convierta en ley universal".', 'Ética deontológica autónoma basada en el deber puro', 3),
(34, 7, 'En la metafísica de Aristóteles, ¿cuál es la diferencia entre potencia y acto?', 'Potencia (dynamis) es la capacidad o posibilidad de ser o cambiar; Acto (energeia) es la realización efectiva y consumada de esa posibilidad.', 'Una semilla es un árbol en potencia; el árbol maduro es el acto', 3),
(35, 7, '¿Qué es la falacia lógica "Ad Hominem"?', 'Consiste en descalificar un argumento atacando directamente las características, persona o circunstancias de quien lo emite en vez de refutar la validez del razonamiento.', 'Ataque a la persona y no a la premisa lógica', 2)
ON CONFLICT (id) DO UPDATE SET 
    deck_id = EXCLUDED.deck_id, 
    front = EXCLUDED.front, 
    back = EXCLUDED.back, 
    hints = EXCLUDED.hints, 
    difficulty = EXCLUDED.difficulty;

-- Ajustar secuencias de IDs para futuros registros
SELECT setval(pg_get_serial_sequence('flashcard_decks', 'id'), COALESCE(MAX(id), 1)) FROM flashcard_decks;
SELECT setval(pg_get_serial_sequence('flashcard_cards', 'id'), COALESCE(MAX(id), 1)) FROM flashcard_cards;
