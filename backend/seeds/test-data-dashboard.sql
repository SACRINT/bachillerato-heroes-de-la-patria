-- =====================================================
-- DATOS DE PRUEBA PARA DASHBOARD ADMINISTRATIVO (CORREGIDO)
-- Bachillerato General Estatal "Héroes de la Patria"
-- Fecha: 27 Octubre 2025
-- Propósito: Poblar la base de datos con datos realistas para testing
-- =====================================================

-- ===========================================
-- NOTICIAS (15 registros)
-- ===========================================

INSERT INTO noticias (titulo, contenido, estado, fecha_publicacion, autor) VALUES
('Apertura de Inscripciones Ciclo 2025-2026', 'Nos complace anunciar que a partir del 1 de agosto de 2025 estarán abiertas las inscripciones para el nuevo ciclo escolar. Los interesados pueden acudir a Control Escolar con su documentación completa.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '15 days', 'Ing. Samuel Cruz Interial'),
('Ceremonia de Graduación Generación 2022-2025', 'Con gran orgullo celebramos la graduación de nuestra generación 2022-2025. Más de 85 estudiantes recibieron su certificado de bachillerato en una emotiva ceremonia.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '30 days', 'Lic. Humberta Flores Martínez'),
('Nuevo Laboratorio de Computación Inaugurado', 'Gracias al apoyo de la SEP, inauguramos un moderno laboratorio de cómputo con 30 equipos de última generación para beneficio de nuestros estudiantes.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '45 days', 'Ing. José Alain Rosales García'),
('Convocatoria: Concurso de Ciencias 2025', 'Invitamos a todos los estudiantes a participar en el Concurso Estatal de Ciencias 2025. Fecha límite de inscripción: 15 de noviembre.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '7 days', 'Lic. Roselia Estrada Lechuga'),
('Taller de Robótica: Nuevos Horarios', 'El taller de robótica amplía sus horarios. Ahora también disponible los sábados de 9:00 a 13:00 hrs.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Ing. Tulia Villadiego Blanco'),
('Becas Benito Juárez: Depósito de Octubre', 'Informamos que el depósito correspondiente a octubre de la Beca Benito Juárez se realizará entre el 25 y 30 del presente mes.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Ing. Samuel Cruz Interial'),
('Visita a Universidad Tecnológica', 'Estudiantes de 6to semestre visitarán la Universidad Tecnológica de Tehuacán el próximo viernes 8 de noviembre.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Lic. Humberta Flores Martínez'),
('Festival Cultural 2025: ¡No te lo pierdas!', 'Nuestro tradicional Festival Cultural se llevará a cabo el 20 de noviembre. Habrá presentaciones de danza, música, teatro y exposiciones de arte.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Prof. Toribio Bautista Hernández'),
('Torneo Deportivo Intermural 2025', 'Inicia el torneo deportivo intermural con competencias de fútbol, básquetbol y voleibol. Inscripciones abiertas hasta el viernes.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '8 days', 'Prof. Moisés Flores Vásquez'),
('Mantenimiento del Sistema de Cómputo', 'Se realizará mantenimiento preventivo a los sistemas de cómputo el sábado 4 de noviembre. Los servicios en línea estarán suspendidos temporalmente.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Ing. Tulia Villadiego Blanco'),
('Proyecto de Sustentabilidad en Marcha', 'Nuestro proyecto de recolección de residuos reciclables ha logrado reciclar más de 500 kg de materiales en el último mes.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '12 days', 'Lic. Roselia Estrada Lechuga'),
('Conferencia: Emprendimiento Juvenil', 'El próximo martes 7 de noviembre tendremos una conferencia sobre emprendimiento juvenil impartida por egresados exitosos.', 'borrador', CURRENT_TIMESTAMP + INTERVAL '5 days', 'Ing. José Alain Rosales García'),
('Resultados del Examen Diagnóstico', 'Ya están disponibles los resultados del examen diagnóstico de nuevo ingreso. Consulta con tu tutor de grupo.', 'borrador', NULL, 'Ing. Samuel Cruz Interial'),
('Día de Muertos: Exposición de Altares', 'Invitamos a toda la comunidad a visitar nuestra exposición de altares de Día de Muertos del 1 al 3 de noviembre.', 'archivada', CURRENT_TIMESTAMP - INTERVAL '25 days', 'Prof. Hercilia Aburto Nadales'),
('Cambios en el Horario de Biblioteca', 'A partir del lunes 6 de noviembre, la biblioteca extenderá su horario hasta las 15:00 hrs.', 'publicada', CURRENT_TIMESTAMP - INTERVAL '4 days', 'Ing. Samuel Cruz Interial');

-- ===========================================
-- EVENTOS (12 eventos)
-- ===========================================

INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, modalidad, estado) VALUES
('Ceremonia Cívica del Lunes', 'Ceremonia cívica semanal con honores a la bandera. Asistencia obligatoria para todos los grupos.', CURRENT_TIMESTAMP + INTERVAL '1 day' + TIME '08:00:00', CURRENT_TIMESTAMP + INTERVAL '1 day' + TIME '08:30:00', 'Patio Principal', 'presencial', 'publicado'),
('Taller: Diseño Gráfico con Adobe Illustrator', 'Taller práctico para estudiantes de Comunicación Gráfica. Aprende técnicas avanzadas de diseño vectorial.', CURRENT_TIMESTAMP + INTERVAL '3 days' + TIME '14:00:00', CURRENT_TIMESTAMP + INTERVAL '3 days' + TIME '16:00:00', 'Laboratorio de Cómputo', 'presencial', 'publicado'),
('Junta de Padres de Familia', 'Junta informativa para padres de familia de todos los semestres. Se tratarán temas académicos y administrativos importantes.', CURRENT_TIMESTAMP + INTERVAL '5 days' + TIME '17:00:00', CURRENT_TIMESTAMP + INTERVAL '5 days' + TIME '19:00:00', 'Auditorio Principal', 'híbrido', 'publicado'),
('Partido de Fútbol: Héroes vs COBAO 26', 'Partido amistoso de fútbol varonil contra COBAO 26. ¡Ven a apoyar a tu equipo!', CURRENT_TIMESTAMP + INTERVAL '7 days' + TIME '16:00:00', CURRENT_TIMESTAMP + INTERVAL '7 days' + TIME '18:00:00', 'Cancha de Fútbol Municipal', 'presencial', 'publicado'),
('Conferencia Virtual: Inteligencia Artificial', 'Conferencia en línea sobre IA y su impacto en la educación. Abierta para estudiantes de 4to a 6to semestre.', CURRENT_TIMESTAMP + INTERVAL '10 days' + TIME '10:00:00', CURRENT_TIMESTAMP + INTERVAL '10 days' + TIME '12:00:00', 'En Línea', 'virtual', 'publicado'),
('Expo Gastronomía Artesanal 2025', 'Exposición y degustación de platillos preparados por estudiantes de la especialidad de Alimentos Artesanales.', CURRENT_TIMESTAMP + INTERVAL '12 days' + TIME '11:00:00', CURRENT_TIMESTAMP + INTERVAL '12 days' + TIME '14:00:00', 'Taller de Alimentos', 'presencial', 'publicado'),
('Curso de Primeros Auxilios', 'Curso teórico-práctico de primeros auxilios impartido por la Cruz Roja. Certificación incluida.', CURRENT_TIMESTAMP + INTERVAL '15 days' + TIME '09:00:00', CURRENT_TIMESTAMP + INTERVAL '15 days' + TIME '13:00:00', 'Aula Magna', 'presencial', 'publicado'),
('Simulacro de Evacuación', 'Simulacro de evacuación por sismo. Participación obligatoria de todos los estudiantes y personal.', CURRENT_TIMESTAMP + INTERVAL '8 days' + TIME '11:00:00', CURRENT_TIMESTAMP + INTERVAL '8 days' + TIME '11:30:00', 'Todo el Plantel', 'presencial', 'publicado'),
('Presentación de Ballet Folklórico', 'Presentación del grupo de Ballet Folklórico con danzas tradicionales de Puebla y Oaxaca.', CURRENT_TIMESTAMP + INTERVAL '20 days' + TIME '18:00:00', CURRENT_TIMESTAMP + INTERVAL '20 days' + TIME '20:00:00', 'Auditorio Municipal', 'presencial', 'publicado'),
('Torneo de Ajedrez Interescolar', 'Torneo de ajedrez con participación de bachilleratos de la zona. Inscripciones abiertas.', CURRENT_TIMESTAMP + INTERVAL '18 days' + TIME '09:00:00', CURRENT_TIMESTAMP + INTERVAL '18 days' + TIME '15:00:00', 'Biblioteca', 'presencial', 'publicado'),
('Día Mundial de la Ciencia', 'Celebración del Día Mundial de la Ciencia con experimentos, demostraciones y actividades interactivas.', CURRENT_TIMESTAMP - INTERVAL '5 days' + TIME '10:00:00', CURRENT_TIMESTAMP - INTERVAL '5 days' + TIME '14:00:00', 'Laboratorio de Ciencias', 'presencial', 'finalizado'),
('Posada Navideña 2025', 'Tradicional posada navideña con villancicos, piñatas y convivencia. Evento familiar.', CURRENT_TIMESTAMP + INTERVAL '45 days' + TIME '17:00:00', CURRENT_TIMESTAMP + INTERVAL '45 days' + TIME '21:00:00', 'Patio Principal', 'presencial', 'borrador');

-- ===========================================
-- QUEJAS Y SUGERENCIAS (12 registros)
-- ===========================================

INSERT INTO quejas (nombre, email, subject, message, status, fecha_creacion) VALUES
('Ana Martínez López', 'ana.martinez@email.com', 'queja', 'El proceso de inscripción fue muy lento y confuso. Tuve que venir tres veces para completar el trámite.', 'respondida', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('Carlos Ramírez García', 'carlos.ramirez@email.com', 'sugerencia', 'Sería excelente tener una aplicación móvil para consultar calificaciones y avisos importantes.', 'en_revision', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Laura Hernández Ruiz', 'laura.hernandez@email.com', 'felicitacion', 'Excelente atención del personal de Control Escolar. Muy amables y eficientes.', 'cerrada', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('Pedro González Sánchez', 'pedro.gonzalez@email.com', 'queja', 'Los baños necesitan mantenimiento urgente. Faltan algunos lavabos y el agua no siempre funciona.', 'respondida', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('María Fernanda Torres', 'mf.torres@email.com', 'sugerencia', 'Propongo extender el horario de la biblioteca hasta las 16:00 hrs para poder estudiar después de clases.', 'respondida', CURRENT_TIMESTAMP - INTERVAL '12 days'),
('Jorge Luis Mendoza', 'jorge.mendoza@email.com', 'otro', '¿Cuándo van a publicar las fechas del examen de admisión para el siguiente ciclo?', 'respondida', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Sofía Jiménez Castro', 'sofia.jimenez@email.com', 'felicitacion', 'El taller de robótica es excelente. Mi hijo está muy motivado y ha aprendido muchísimo.', 'cerrada', CURRENT_TIMESTAMP - INTERVAL '18 days'),
('Roberto Flores Pérez', 'roberto.flores@email.com', 'queja', 'La conexión a internet en el laboratorio de cómputo es muy lenta y se corta constantemente.', 'en_revision', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('Diana Morales Luna', 'diana.morales@email.com', 'sugerencia', 'Deberían implementar un sistema de préstamo de libros digitales para la biblioteca.', 'pendiente', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('Miguel Ángel Reyes', 'miguel.reyes@email.com', 'felicitacion', 'La organización del Festival Cultural estuvo increíble. Felicidades a todos los involucrados.', 'cerrada', CURRENT_TIMESTAMP - INTERVAL '20 days'),
('Gabriela Ortiz Vega', 'gabriela.ortiz@email.com', 'queja', 'El comedor necesita más opciones de comida saludable. Solo hay frituras y refrescos.', 'pendiente', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('Fernando Castro Díaz', 'fernando.castro@email.com', 'sugerencia', 'Propongo crear un club de debate para desarrollar habilidades de oratoria y argumentación.', 'en_revision', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- ===========================================
-- COMUNICADOS (7 registros)
-- ===========================================

INSERT INTO comunicados (titulo, contenido, estado, fecha_publicacion, autor) VALUES
('Lineamientos de Uso del Uniforme Escolar', 'Se recuerda a los estudiantes que el uso del uniforme escolar es obligatorio de acuerdo al reglamento institucional. El uniforme deportivo solo se permite los días que tengan clase de Educación Física.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '20 days', 'Dirección General'),
('Protocolo de Seguridad e Higiene', 'Se establecen las medidas de seguridad e higiene que deben seguirse en todos los espacios del plantel, especialmente en laboratorios y talleres.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '15 days', 'Comité de Seguridad e Higiene'),
('Calendario de Actividades Noviembre-Diciembre', 'Se adjunta el calendario oficial de actividades académicas y culturales para los meses de noviembre y diciembre de 2025.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Subdirección Académica'),
('Modificación al Reglamento de Biblioteca', 'Se informa sobre las modificaciones realizadas al reglamento de uso de la biblioteca, incluyendo nuevos horarios y políticas de préstamo.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '8 days', 'Coordinación de Biblioteca'),
('Resultados de Evaluación Institucional', 'Se presentan los resultados de la evaluación institucional del primer semestre 2025, con análisis de fortalezas y áreas de oportunidad.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '25 days', 'Dirección General'),
('Convocatoria: Beca de Excelencia Académica', 'Se abre la convocatoria para la Beca de Excelencia Académica dirigida a estudiantes con promedio mínimo de 9.0. Fecha límite: 30 de noviembre.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Departamento de Becas'),
('Lineamientos para Proyectos de Fin de Curso', 'Se establecen los lineamientos y criterios de evaluación para los proyectos de fin de curso de las especialidades laborales.', 'borrador', CURRENT_TIMESTAMP - INTERVAL '12 days', 'Coordinación de Especialidades');

-- ===========================================
-- FIN DEL SCRIPT
-- ===========================================

-- Verificar datos insertados
SELECT 'NOTICIAS' as tabla, COUNT(*) as total FROM noticias
UNION ALL
SELECT 'EVENTOS', COUNT(*) FROM eventos
UNION ALL
SELECT 'QUEJAS', COUNT(*) FROM quejas
UNION ALL
SELECT 'COMUNICADOS', COUNT(*) FROM comunicados;
