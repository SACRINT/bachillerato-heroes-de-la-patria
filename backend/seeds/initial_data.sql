-- ========================================
-- DATOS INICIALES PARA LA BASE DE DATOS
-- Bachillerato General Estatal "Héroes de la Patria"
-- ========================================

USE heroes_patria_db;

-- ========================================
-- CONFIGURACIÓN DEL SISTEMA
-- ========================================
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria) VALUES
('nombre_institucion', 'Bachillerato General Estatal "Héroes de la Patria"', 'Nombre oficial de la institución', 'general'),
('cct', '21EBH0200X', 'Clave de Centro de Trabajo', 'general'),
('direccion', 'C. Manuel Ávila Camacho #7, Col. Centro, Coronel Tito Hernández (María Andrea), Venustiano Carranza, Puebla, C.P. 73030', 'Dirección oficial', 'general'),
('email_institucional', '21ebh0200x.sep@gmail.com', 'Email oficial de contacto', 'contacto'),
('telefono_institucional', '', 'Teléfono principal', 'contacto'),
('horario_atencion', 'Lunes a Viernes de 8:00 AM a 1:30 PM', 'Horario de atención al público', 'general'),
('año_fundacion', '1997', 'Año de fundación de la institución', 'historia'),
('director_actual', 'Ing. Samuel Cruz Interial', 'Director actual', 'personal'),
('ciclo_escolar_actual', '2024-2025', 'Ciclo escolar en curso', 'academico');

-- ========================================
-- INFORMACIÓN DINÁMICA PARA EL CHATBOT
-- ========================================

-- Información básica
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('horarios_atencion', 'horarios', 'Horarios de Atención', '{
    "clases": "Lunes a Viernes de 8:00 AM a 1:30 PM",
    "administracion": "Lunes a Viernes de 8:00 AM a 1:30 PM",
    "biblioteca": "Lunes a Viernes de 8:00 AM a 2:00 PM",
    "fines_semana": "Cerrado",
    "cct": "21EBH0200X"
}', 10, TRUE),

('informacion_contacto', 'contacto', 'Información de Contacto', '{
    "email": "21ebh0200x.sep@gmail.com",
    "facebook": "Bachillerato General Estatal Héroes de la Patria",
    "direccion": "C. Manuel Ávila Camacho #7, Col. Centro, Coronel Tito Hernández (María Andrea), Venustiano Carranza, Puebla, C.P. 73030",
    "horario_respuesta": "Lunes a Viernes: 8:00 AM - 1:30 PM",
    "como_llegar": "Accesible por transporte público. Pregunta por las rutas que llegan a María Andrea."
}', 10, TRUE),

('ubicacion_geografica', 'ubicacion', 'Nuestra Ubicación', '{
    "direccion_completa": "C. Manuel Ávila Camacho #7, Col. Centro",
    "localidad": "Coronel Tito Hernández (María Andrea)",
    "municipio": "Venustiano Carranza",
    "estado": "Puebla",
    "codigo_postal": "73030",
    "referencias": "Centro de la comunidad, cerca del palacio municipal",
    "transporte": "Rutas de transporte público disponibles desde Tehuacán"
}', 9, TRUE);

-- Personal directivo y docente
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('director_general', 'personal', 'Nuestro Director', '{
    "nombre": "Ing. Samuel Cruz Interial",
    "cargo": "Director General",
    "experiencia": "Más de 23 años en educación",
    "especializacion": "7 años en liderazgo educativo",
    "formacion": "Ingeniero en Electrónica y Comunicaciones",
    "areas_expertise": "Gestión educativa, innovación tecnológica",
    "email": "21ebh0200x.sep@gmail.com",
    "filosofia": "Formando líderes con propósito y preparando estudiantes integrales para los desafíos del siglo XXI"
}', 9, TRUE),

('plantilla_docente', 'personal', 'Nuestro Equipo Docente', '{
    "total_docentes": 12,
    "experiencia_promedio": "23+ años",
    "formacion": "Universitaria con especialización",
    "actualizacion": "Constante capacitación SEP",
    "docentes_destacados": [
        {
            "nombre": "Lic. Humberta Flores Martínez",
            "especialidad": "Pedagogía - UV",
            "experiencia": "27 años"
        },
        {
            "nombre": "Ing. José Alain Rosales García",
            "especialidad": "Químico - UV",
            "experiencia": "16 años"
        },
        {
            "nombre": "Lic. Roselia Estrada Lechuga",
            "especialidad": "Pedagogía - ICEST",
            "experiencia": "22 años"
        },
        {
            "nombre": "Ing. Tulia Villadiego Blanco",
            "especialidad": "Sistemas - UANL",
            "experiencia": "25 años"
        }
    ]
}', 8, TRUE);

-- Historia institucional
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('historia_fundacion', 'historia', 'Nuestra Historia Institucional', '{
    "año_fundacion": "1996-1997",
    "origen": "Fundado por un grupo visionario de maestros del Bachillerato Juan Rulfo que soñaban con crear una institución pública oficial de calidad",
    "fundadores_pioneros": [
        "Profesora Hercilia Aburto Nadales",
        "Profesor Toribio Bautista Hernández",
        "Profesor Hidelgardo Montiel Aparicio",
        "Profesor Moisés Flores Vásquez"
    ],
    "primera_generacion": "1997 - 70 estudiantes valientes que confiaron en este nuevo proyecto educativo",
    "impacto_regional": "Servimos principalmente a la comunidad de María Andrea y comunidades circunvecinas, democratizando el acceso a la educación media superior",
    "años_servicio": "28 años formando generaciones de estudiantes exitosos"
}', 7, TRUE),

('mision_vision', 'filosofia', 'Misión y Visión Institucional', '{
    "mision": "Somos una institución educativa de nivel medio superior formadora de estudiantes integrales, analíticos, reflexivos y críticos con los conocimientos, habilidades y valores necesarios para poderse integrar al sector productivo o continuar sus estudios a nivel superior.",
    "vision": "Ser una institución educativa de excelencia que logre la formación de seres humanos integrales con valores y aprendizajes significativos contextualizados que permitan contribuir al desarrollo regional, estatal y nacional de nuestro país.",
    "enfoque_educativo": {
        "formacion_integral": "Desarrollo académico, personal y social",
        "pensamiento_critico": "Capacidad de análisis y reflexión",
        "competencias_laborales": "Preparación para el trabajo",
        "preparacion_universitaria": "Base sólida para educación superior"
    },
    "vision_2030": "Reconocimiento como institución líder en innovación pedagógica y desarrollo integral"
}', 8, TRUE),

('valores_institucionales', 'filosofia', 'Nuestros Valores Fundamentales', '{
    "compromiso": "Dedicación absoluta con la educación de calidad y el éxito de nuestros estudiantes",
    "respeto": "Valoración y reconocimiento de la diversidad, dignidad y derechos de todas las personas",
    "responsabilidad": "Asumir las consecuencias de nuestras acciones y cumplir con nuestros deberes",
    "honestidad": "Transparencia y sinceridad en todas nuestras relaciones y procesos",
    "lealtad": "Fidelidad y compromiso con nuestra comunidad educativa y sus principios",
    "confianza": "Base sólida para todas nuestras interacciones y relaciones institucionales"
}', 7, TRUE);

-- Oferta educativa
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('oferta_academica', 'academico', 'Nuestra Oferta Educativa', '{
    "bachillerato_general": "Formación académica completa que te prepara para la universidad y el mundo laboral",
    "especialidades_laborales": [
        {
            "nombre": "Comunicación Gráfica",
            "descripcion": "Diseño gráfico y digital, fotografía y medios audiovisuales, sublimado y vectorización",
            "competencias": ["Composición, color y tipografía", "Herramientas profesionales Adobe", "Diseño para medios digitales"]
        },
        {
            "nombre": "Preparación de Alimentos Artesanales",
            "descripcion": "Cocina tradicional mexicana, higiene y seguridad alimentaria",
            "competencias": ["Conservas y fermentados", "Panadería y repostería", "Emprendimiento gastronómico"]
        },
        {
            "nombre": "Instalaciones Residenciales",
            "descripcion": "Electricidad básica y avanzada, plomería e instalaciones hidráulicas",
            "competencias": ["Instalaciones sanitarias", "Mantenimiento del hogar", "Proyectos sustentables"]
        }
    ],
    "duracion": "6 semestres",
    "modalidad": "Presencial",
    "practicas_profesionales": "Incluidas en todas las especialidades"
}', 10, TRUE),

('plan_estudios', 'academico', 'Plan de Estudios - 6 Semestres', '{
    "curriculum_fundamental": {
        "duracion": "1° - 6° semestre",
        "areas": [
            "Lengua y Comunicación: Lectura, escritura y expresión oral",
            "Pensamiento Matemático: Álgebra, geometría, cálculo",
            "Conciencia Histórica: Historia de México y universal",
            "Cultura Digital: Tecnologías e informática",
            "Ciencias Naturales: Física, química, biología",
            "Ciencias Sociales: Geografía, sociología",
            "Humanidades: Filosofía, ética, estética"
        ]
    },
    "curriculum_laboral": {
        "duracion": "3° - 6° semestre",
        "componentes": [
            "Especialización en el área elegida",
            "Prácticas profesionales supervisadas",
            "Desarrollo de proyectos CTIM",
            "Vinculación con el sector productivo"
        ]
    },
    "curriculum_ampliado": [
        "Responsabilidad Social y Ciudadana",
        "Educación para la Salud",
        "Actividades Artísticas y Culturales",
        "Educación Física y Deportiva"
    ],
    "actualizacion": "Plan actualizado según lineamientos SEP 2023"
}', 9, TRUE);

-- Admisiones y proceso de inscripción
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('proceso_admision', 'admisiones', 'Proceso de Admisiones 2025-2026', '{
    "periodo_inscripciones": "Agosto 2025 (fechas exactas por confirmar)",
    "tipo_proceso": "Automático para estudiantes que cumplan los requisitos básicos",
    "documentos_principales": [
        "Certificado de secundaria",
        "CURP actualizada", 
        "Acta de nacimiento original",
        "6 fotos tamaño infantil",
        "Comprobante de domicilio reciente"
    ],
    "casos_especiales": "Si vienes de otro subsistema necesitas certificado parcial y equivalencia de la SEP",
    "costo": "La educación pública es 100% GRATUITA",
    "contacto": "Para información específica, visita Control Escolar"
}', 10, TRUE),

('requisitos_inscripcion', 'admisiones', 'Requisitos de Inscripción', '{
    "documentos_obligatorios": [
        "Certificado de Secundaria (original)",
        "Acta de Nacimiento (original)",
        "CURP actualizada",
        "6 fotografías tamaño infantil",
        "Comprobante de domicilio reciente"
    ],
    "documentos_adicionales": {
        "cambios_mismo_subsistema": "Kardex",
        "otros_subsistemas": "Certificado parcial + equivalencia SEP",
        "otro_estado": "Legalización de documentos"
    },
    "tips_importantes": "Asegúrate de que todos los documentos estén en buen estado y sean legibles",
    "asesoría": "Para dudas específicas sobre tu situación, visítanos en Control Escolar"
}', 9, TRUE);

-- Becas y apoyos
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('becas_disponibles', 'becas', 'Becas y Apoyos Disponibles', '{
    "beca_benito_juarez": {
        "nombre": "Beca Universal Benito Juárez",
        "automatica": "¡AUTOMÁTICA para TODOS!",
        "proceso": "Se asigna automáticamente al inscribirte",
        "depositos": "Depósitos bimestrales directos",
        "tramite": "Sin trámite adicional requerido",
        "consultas": "https://gob.mx/becasbenitojuarez"
    },
    "becas_institucionales": [
        "Para estudiantes de excelencia académica",
        "Apoyo para estudiantes en situación vulnerable", 
        "Reconocimientos por participación destacada",
        "Consulta disponibilidad en Control Escolar"
    ],
    "programas_apoyo": [
        "Asesorías académicas gratuitas",
        "Talleres de regularización",
        "Apoyo psicopedagógico",
        "Orientación vocacional"
    ]
}', 10, TRUE),

('costos_educacion', 'becas', 'Información de Costos', '{
    "educacion_gratuita": "¡La educación pública es 100% GRATUITA! No pagas colegiaturas ni mensualidades",
    "gastos_minimos": [
        "Materiales escolares básicos (cuadernos, lápices)",
        "Uniforme escolar (sencillo y económico)",
        "Gastos menores de laboratorio y talleres",
        "Materiales específicos para tu especialidad"
    ],
    "beneficio_extra": "Recibes la Beca Benito Juárez automáticamente, que te ayuda con gastos personales",
    "informacion_detallada": "Para costos específicos de materiales por especialidad, contacta Control Escolar"
}', 9, TRUE);

-- Servicios y actividades extracurriculares
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('actividades_extracurriculares', 'servicios', 'Actividades Extracurriculares', '{
    "arte_cultura": [
        "Ballet Folklórico: Danza tradicional mexicana",
        "Danza Contemporánea: Expresión artística moderna",
        "Banda de Guerra: Marchas y ceremonias cívicas",
        "Bastoneras: Coreografías con bastones",
        "Artes Plásticas: Pintura, dibujo y escultura"
    ],
    "deportes": [
        "Fútbol: Equipos varonil y femenil",
        "Básquetbol: Torneos internos y externos", 
        "Voleibol: Competencias regionales"
    ],
    "clubes_academicos": [
        "Robótica: Programación y construcción de robots",
        "Debate: Oratoria y argumentación",
        "Ciencia: Experimentos e investigación"
    ],
    "participaciones": [
        "Ferias académicas estatales y regionales",
        "Concursos de ciencia y tecnología",
        "Proyectos CTIM (Ciencia, Tecnología, Ingeniería, Matemáticas)",
        "Programa de Escuelas de Calidad (PEC)"
    ]
}', 8, TRUE),

('uniforme_escolar', 'servicios', 'Uniforme Escolar', '{
    "masculino": {
        "deportivo": [
            "Playera blanca con logo institucional",
            "Pantalón azul mezclilla",
            "Tenis blancos o negros"
        ],
        "gala": [
            "Camisa blanca con logo institucional",
            "Pantalón gris Oxford",
            "Zapatos negros formales"
        ]
    },
    "femenino": {
        "deportivo": [
            "Playera blanca con logo institucional",
            "Pantalón azul mezclilla", 
            "Tenis blancos o negros"
        ],
        "gala": [
            "Blusa blanca con logo institucional",
            "Falda gris Oxford",
            "Zapatos negros formales"
        ]
    },
    "informacion_practica": "El uniforme puede mandarse hacer en cualquier lugar o confeccionarse en casa. Solo debe cumplir con las especificaciones de color y llevar el logo institucional"
}', 6, TRUE);

-- Información académica avanzada
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('plataforma_sicep', 'academico', 'Consultar Boleta de Calificaciones', '{
    "portal_sicep": "http://sisep.seppue.gob.mx/sicepconsulta/",
    "datos_necesarios": [
        "Tu CURP (18 caracteres)",
        "NIA (Número de Identificación del Alumno)",
        "Si no recuerdas tu NIA, pregunta en Control Escolar"
    ],
    "problemas_acceso": "Si tienes dificultades para ingresar al sistema, solicita ayuda en Control Escolar del plantel",
    "soporte_tecnico": "21ebh0200x.sep@gmail.com",
    "confidencialidad": "Tu información académica está protegida y es confidencial"
}', 9, TRUE),

('certificado_bachillerato', 'tramites', 'Certificado de Bachillerato', '{
    "requisitos_tramitar": [
        "Identificación oficial vigente",
        "Comprobante de liberación de todas las materias",
        "6 fotografías tamaño infantil (blanco y negro, papel mate)",
        "Pago de derechos correspondientes",
        "No tener adeudos con la institución"
    ],
    "tiempo_entrega": "30 días hábiles a partir de la fecha de entrega completa de documentos",
    "proceso_seguimiento": "Acude a Control Escolar para iniciar el trámite y recibir información sobre el estatus",
    "consejo_importante": "Inicia el trámite con tiempo suficiente si necesitas tu certificado para inscribirte a la universidad"
}', 8, TRUE);

-- Convenios y oportunidades
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('convenios_universitarios', 'oportunidades', 'Convenios Universitarios', '{
    "beneficios_estudiantes": [
        "Acceso a laboratorios: Uso de instalaciones universitarias especializadas",
        "Talleres universitarios: Experiencia práctica en ambiente universitario",
        "Descuentos especiales: En inscripciones ITSVC y UTXJ",
        "Programas preferenciales: Para alumnos de excelencia académica"
    ],
    "oportunidades_especiales": [
        "Prácticas profesionales: En empresas e instituciones aliadas",
        "Proyectos colaborativos: Con estudiantes universitarios",
        "Mentorías académicas: Por parte de profesores universitarios",
        "Ferias vocacionales: Orientación para tu futuro profesional"
    ],
    "estudiantes_destacados": "Los alumnos con promedio sobresaliente tienen oportunidades adicionales y programas especiales de apoyo para su transición universitaria",
    "mas_informacion": "Consulta con tu consejero académico: 21ebh0200x.sep@gmail.com"
}', 7, TRUE);

-- Razones para elegir la escuela
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('por_que_elegirnos', 'promocional', 'Por Qué Elegir "Héroes de la Patria"', '{
    "educacion_practica": "No solo teoría: desarrollas habilidades reales para el trabajo y la vida, con tecnología de vanguardia y metodologías innovadoras",
    "inclusion_total": "Sin barreras económicas, sociales o culturales. Todos tienen derecho a una educación de calidad",
    "proyectos_reconocidos": "Participamos en proyectos CTIM ganadores, ferias científicas y tenemos fuerte vinculación con la comunidad",
    "formacion_integral": "Desarrollas competencias académicas, laborales y personales, además de valores sólidos para la vida",
    "beca_automatica": "Todos nuestros estudiantes reciben la Beca Benito Juárez sin trámites adicionales",
    "personal_experimentado": "Profesores con más de 23 años de experiencia promedio, comprometidos con tu éxito",
    "tecnologia_responsable": "Usamos la tecnología como herramienta de crecimiento personal y académico, no como distractor"
}', 9, TRUE);

-- Servicios adicionales
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, prioridad, is_active) VALUES
('biblioteca_recursos', 'servicios', 'Centro de Recursos Académicos', '{
    "coleccion_bibliografica": "Amplio acervo de libros especializados por materia y área de estudio, constantemente actualizado",
    "recursos_digitales": "Acceso a bases de datos educativas, enciclopedias digitales y plataformas de investigación en línea",
    "apoyo_investigacion": "Orientación especializada para proyectos escolares, investigaciones y trabajos académicos",
    "espacios_estudio": "Áreas silenciosas y colaborativas diseñadas para diferentes tipos de aprendizaje y trabajo en equipo"
}', 6, TRUE),

('laboratorios_talleres', 'servicios', 'Nuestros Laboratorios', '{
    "laboratorio_ciencias": "Equipado para prácticas de química, física y biología con materiales modernos y medidas de seguridad",
    "centro_computo": "Computadoras actualizadas con software especializado para todas las áreas académicas y laborales",
    "talleres_especializados": "Espacios equipados para cada especialidad: diseño gráfico, cocina profesional, instalaciones eléctricas",
    "normas_seguridad": "Todos nuestros espacios cumplen con las normas oficiales de seguridad y están supervisados por personal capacitado"
}', 6, TRUE);

-- ========================================
-- MATERIAS DEL PLAN DE ESTUDIOS
-- ========================================

INSERT INTO materias (clave, nombre, descripcion, semestre, creditos, horas_semana, especialidad, tipo_curriculm) VALUES
-- Primer Semestre
('MAT-I', 'Matemáticas I', 'Álgebra y funciones básicas', 1, 5, 5, 'general', 'fundamental'),
('LEO-I', 'Lectura, Expresión Oral y Escrita I', 'Desarrollo de habilidades comunicativas', 1, 4, 4, 'general', 'fundamental'),
('QUI-I', 'Química I', 'Fundamentos de química general', 1, 4, 4, 'general', 'fundamental'),
('HMX-I', 'Historia de México I', 'México prehispánico y colonial', 1, 3, 3, 'general', 'fundamental'),
('TIC-I', 'Tecnologías de la Información y Comunicación I', 'Informática básica', 1, 3, 3, 'general', 'fundamental'),
('EDF-I', 'Educación Física I', 'Desarrollo físico y deportivo', 1, 2, 2, 'general', 'ampliado'),

-- Segundo Semestre  
('MAT-II', 'Matemáticas II', 'Geometría y trigonometría', 2, 5, 5, 'general', 'fundamental'),
('LEO-II', 'Lectura, Expresión Oral y Escrita II', 'Comunicación avanzada', 2, 4, 4, 'general', 'fundamental'),
('QUI-II', 'Química II', 'Química orgánica e inorgánica', 2, 4, 4, 'general', 'fundamental'),
('HMX-II', 'Historia de México II', 'México independiente y moderno', 2, 3, 3, 'general', 'fundamental'),
('TIC-II', 'Tecnologías de la Información y Comunicación II', 'Herramientas digitales avanzadas', 2, 3, 3, 'general', 'fundamental'),
('EDF-II', 'Educación Física II', 'Deportes y actividad física', 2, 2, 2, 'general', 'ampliado'),

-- Tercer Semestre
('MAT-III', 'Matemáticas III', 'Geometría analítica', 3, 5, 5, 'general', 'fundamental'),
('LIT-I', 'Literatura I', 'Literatura universal y nacional', 3, 4, 4, 'general', 'fundamental'),
('FIS-I', 'Física I', 'Mecánica clásica', 3, 4, 4, 'general', 'fundamental'),
('BIO-I', 'Biología I', 'Biología celular y molecular', 3, 4, 4, 'general', 'fundamental'),
('GEO-I', 'Geografía', 'Geografía física y humana', 3, 3, 3, 'general', 'fundamental'),

-- Materias de especialidad (Comunicación Gráfica)
('CG-01', 'Fundamentos del Diseño', 'Principios básicos del diseño gráfico', 3, 6, 6, 'comunicacion_grafica', 'laboral'),
('CG-02', 'Dibujo Técnico', 'Técnicas de dibujo y representación', 3, 4, 4, 'comunicacion_grafica', 'laboral'),

-- Materias de especialidad (Alimentos Artesanales)
('AA-01', 'Fundamentos Gastronómicos', 'Bases de la cocina tradicional', 3, 6, 6, 'alimentos_artesanales', 'laboral'),
('AA-02', 'Higiene y Manipulación de Alimentos', 'Normas de seguridad alimentaria', 3, 4, 4, 'alimentos_artesanales', 'laboral'),

-- Materias de especialidad (Instalaciones Residenciales)
('IR-01', 'Fundamentos de Electricidad', 'Principios eléctricos básicos', 3, 6, 6, 'instalaciones_residenciales', 'laboral'),
('IR-02', 'Herramientas y Seguridad', 'Uso seguro de herramientas', 3, 4, 4, 'instalaciones_residenciales', 'laboral');

-- ========================================
-- USUARIO ADMINISTRADOR INICIAL
-- ========================================

-- Crear usuario administrador (contraseña: admin123456)
INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario) VALUES
('admin@heroespatria.edu.mx', '$2b$12$LQv3c1yqBwlVHpPn62YDLOHgoqX5xvK7Q9Zq9JQhVIK5nN5x8wJ8a', 'Administrador', 'Sistema', 'BGE', 'administrativo');

-- Crear registro de docente para el director
INSERT INTO docentes (usuario_id, numero_empleado, especialidad, anos_experiencia, formacion_academica, grado_estudios, fecha_ingreso_plantel, tipo_contrato) VALUES
(1, 'DIR001', 'Administración Educativa', 23, 'Ingeniero en Electrónica y Comunicaciones', 'maestria', '2017-01-01', 'base');

COMMIT;