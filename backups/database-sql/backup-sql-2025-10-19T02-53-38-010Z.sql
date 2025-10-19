-- PostgreSQL Database Backup
-- Generated: 2025-10-19T02:53:37.858Z
-- Database: Connected
-- Tables: 21

-- ========================================
-- DISABLE TRIGGERS (for faster restore)
-- ========================================

-- Table: avisos
DROP TABLE IF EXISTS avisos CASCADE;

CREATE TABLE avisos (
  id integer DEFAULT nextval('avisos_id_seq'::regclass) NOT NULL,
  titulo character varying(255) NOT NULL,
  contenido text NOT NULL,
  resumen character varying(500),
  imagen_url character varying(500),
  categoria character varying(100),
  etiquetas ARRAY,
  estado character varying(20) DEFAULT 'borrador'::character varying,
  fecha_publicacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  autor character varying(255) NOT NULL,
  autor_id character varying(100),
  slug character varying(300),
  meta_descripcion character varying(160),
  vistas integer DEFAULT 0,
  destacada boolean DEFAULT false,
  ip_address character varying(50),
  user_agent text
);


-- Data for avisos (2 rows)
INSERT INTO avisos (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (3, 'Aviso Test API EDITADO', 'Contenido editado', NULL, NULL, 'General', '[]', 'archivada', '2025-10-18T09:24:25.517Z', '2025-10-18T09:24:25.517Z', '2025-10-18T09:24:36.902Z', 'Claude Testing', NULL, 'aviso-test-api', 'Contenido del aviso', 0, false, '::1', 'curl/8.15.0');
INSERT INTO avisos (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (4, 'Aviso Test E2E', 'Contenido del aviso', NULL, NULL, 'Pruebas', '[]', 'publicada', '2025-10-18T09:47:28.559Z', '2025-10-18T09:47:28.563Z', '2025-10-18T09:47:28.563Z', 'Test E2E', NULL, 'aviso-test-e2e', 'Contenido del aviso', 0, false, '::1', NULL);


-- ========================================

-- Table: bolsa_trabajo
DROP TABLE IF EXISTS bolsa_trabajo CASCADE;

CREATE TABLE bolsa_trabajo (
  id integer DEFAULT nextval('bolsa_trabajo_id_seq'::regclass) NOT NULL,
  nombre_completo character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  telefono character varying(20),
  generacion character varying(10),
  cv_url character varying(500),
  habilidades text,
  experiencia text,
  estado character varying(20) DEFAULT 'nuevo'::character varying,
  notas text,
  fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- Data for bolsa_trabajo (1 rows)
INSERT INTO bolsa_trabajo (id, nombre_completo, email, telefono, generacion, cv_url, habilidades, experiencia, estado, notas, fecha_registro, fecha_actualizacion) VALUES (1, 'Ana GarcÃ­a MartÃ­nez', 'ana.garcia@example.com', '5551112233', '2022', NULL, 'JavaScript, React, Node.js, MySQL, PostgreSQL', NULL, 'nuevo', NULL, '2025-10-14T23:44:44.669Z', '2025-10-14T23:44:44.669Z');


-- ========================================

-- Table: bolsa_trabajo_cv
DROP TABLE IF EXISTS bolsa_trabajo_cv CASCADE;

CREATE TABLE bolsa_trabajo_cv (
  id integer DEFAULT nextval('bolsa_trabajo_cv_id_seq'::regclass) NOT NULL,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  telefono character varying(50) NOT NULL,
  anio_egreso character varying(10) NOT NULL,
  area_interes character varying(500) NOT NULL,
  resumen_profesional text NOT NULL,
  habilidades text,
  status character varying(50) DEFAULT 'activo'::character varying,
  cv_url character varying(500),
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now(),
  ip_address character varying(50),
  user_agent text,
  verificado boolean DEFAULT false,
  consentimiento boolean DEFAULT true
);


-- Data for bolsa_trabajo_cv (4 rows)
INSERT INTO bolsa_trabajo_cv (id, nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status, cv_url, fecha_creacion, fecha_actualizacion, ip_address, user_agent, verificado, consentimiento) VALUES (1, 'Roberto Sánchez', 'roberto@test.com', '2221234567', '2023', 'Comunicación Gráfica', 'Egresado con experiencia en diseño digital y marketing', 'Photoshop, Illustrator, Marketing Digital', 'activo', NULL, '2025-10-17T22:16:08.141Z', '2025-10-17T22:16:08.141Z', NULL, NULL, true, true);
INSERT INTO bolsa_trabajo_cv (id, nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status, cv_url, fecha_creacion, fecha_actualizacion, ip_address, user_agent, verificado, consentimiento) VALUES (2, 'Diana López', 'diana@test.com', '2229876543', '2022', 'Instalaciones Eléctricas', 'Técnico electricista con certificación CFE', 'Instalaciones residenciales, Mantenimiento preventivo', 'activo', NULL, '2025-10-17T22:16:08.141Z', '2025-10-17T22:16:08.141Z', NULL, NULL, true, true);
INSERT INTO bolsa_trabajo_cv (id, nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status, cv_url, fecha_creacion, fecha_actualizacion, ip_address, user_agent, verificado, consentimiento) VALUES (3, 'Miguel Hernández', 'miguel@test.com', '2225551234', '2024', 'Alimentos y Bebidas', 'Cocinero profesional con conocimiento en cocina mexicana', 'Cocina internacional, Repostería, Higiene alimentaria', 'activo', NULL, '2025-10-17T22:16:08.141Z', '2025-10-17T22:16:08.141Z', NULL, NULL, false, true);
INSERT INTO bolsa_trabajo_cv (id, nombre, email, telefono, anio_egreso, area_interes, resumen_profesional, habilidades, status, cv_url, fecha_creacion, fecha_actualizacion, ip_address, user_agent, verificado, consentimiento) VALUES (4, 'Test Candidato', 'test.cv@example.com', '2221234567', '2024', 'Comunicaci�n Gr�fica', 'Egresado con experiencia en dise�o digital. Manejo de Adobe Creative Suite, experiencia en social media marketing y dise�o de branding. Busco oportunidades en agencias de publicidad o departamentos creativos.', 'Photoshop, Illustrator, Marketing Digital, Redes Sociales', 'activo', NULL, '2025-10-17T22:17:54.343Z', '2025-10-17T22:17:54.343Z', '::1', 'curl/8.15.0', false, true);


-- ========================================

-- Table: citas
DROP TABLE IF EXISTS citas CASCADE;

CREATE TABLE citas (
  id integer DEFAULT nextval('citas_id_seq'::regclass) NOT NULL,
  cita_id character varying(50) NOT NULL,
  nombre_completo character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  telefono character varying(20),
  tipo_persona character varying(50) NOT NULL,
  motivo character varying(100) NOT NULL,
  descripcion text,
  fecha_solicitada date NOT NULL,
  hora_solicitada time without time zone NOT NULL,
  estado character varying(20) DEFAULT 'pendiente'::character varying,
  fecha_aprobada timestamp with time zone,
  fecha_rechazada timestamp with time zone,
  motivo_rechazo text,
  confirmada boolean DEFAULT false,
  token_confirmacion character varying(64),
  notas_admin text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- Data for citas (3 rows)
INSERT INTO citas (id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, fecha_aprobada, fecha_rechazada, motivo_rechazo, confirmada, token_confirmacion, notas_admin, metadata, created_at, updated_at) VALUES (1, 'CITA-2025-0001', 'Juan Pérez García', 'juan.perez@example.com', '2221234567', 'padre', 'Asesoría Académica', 'Consulta sobre el desempeño académico de mi hijo en matemáticas', '2025-10-19T06:00:00.000Z', '10:00:00', 'pendiente', NULL, NULL, NULL, false, 'e5e6ba983f008f0e7d28ef91e6af4d29d548f9ca5ed06254c72aca26a35946ff', NULL, '{}', '2025-10-17T05:22:01.395Z', '2025-10-17T05:22:01.395Z');
INSERT INTO citas (id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, fecha_aprobada, fecha_rechazada, motivo_rechazo, confirmada, token_confirmacion, notas_admin, metadata, created_at, updated_at) VALUES (2, 'CITA-2025-0002', 'María López Hernández', 'maria.lopez@example.com', '2229876543', 'madre', 'Inscripción', 'Información sobre el proceso de inscripción para el próximo ciclo', '2025-10-21T06:00:00.000Z', '11:00:00', 'aprobada', NULL, NULL, NULL, true, 'f2969e52a22bdc4c664fe1d844672e2d12e29405828848e51ca955fe8767da2a', NULL, '{}', '2025-10-17T05:22:01.395Z', '2025-10-17T05:22:01.395Z');
INSERT INTO citas (id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, fecha_aprobada, fecha_rechazada, motivo_rechazo, confirmada, token_confirmacion, notas_admin, metadata, created_at, updated_at) VALUES (3, 'CITA-2025-0003', 'Carlos Rodríguez', 'carlos.rodriguez@example.com', '2225551234', 'estudiante', 'Orientación Vocacional', 'Necesito orientación sobre opciones de carrera universitaria', '2025-10-17T06:00:00.000Z', '14:00:00', 'aprobada', NULL, NULL, NULL, true, 'c250e21a55f130ec48ff14dabb38fe2b165893268d9d5cc22c56656882127e67', NULL, '{}', '2025-10-17T05:22:01.395Z', '2025-10-17T05:22:01.395Z');


-- ========================================

-- Table: comunicados
DROP TABLE IF EXISTS comunicados CASCADE;

CREATE TABLE comunicados (
  id integer DEFAULT nextval('comunicados_id_seq'::regclass) NOT NULL,
  titulo character varying(255) NOT NULL,
  contenido text NOT NULL,
  resumen character varying(500),
  imagen_url character varying(500),
  categoria character varying(100),
  etiquetas ARRAY,
  estado character varying(20) DEFAULT 'borrador'::character varying,
  fecha_publicacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  autor character varying(255) NOT NULL,
  autor_id character varying(100),
  slug character varying(300),
  meta_descripcion character varying(160),
  vistas integer DEFAULT 0,
  destacada boolean DEFAULT false,
  ip_address character varying(50),
  user_agent text
);


-- Data for comunicados (2 rows)
INSERT INTO comunicados (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (2, 'Comunicado Test API EDITADO', 'Contenido editado', NULL, NULL, 'General', '[]', 'archivada', '2025-10-18T09:24:26.402Z', '2025-10-18T09:24:26.402Z', '2025-10-18T09:24:37.827Z', 'Claude Testing', NULL, 'comunicado-test-api', 'Contenido del comunicado', 0, false, '::1', 'curl/8.15.0');
INSERT INTO comunicados (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (3, 'Comunicado Test E2E', 'Contenido del comunicado', NULL, NULL, 'Pruebas', '[]', 'publicada', '2025-10-18T09:47:28.566Z', '2025-10-18T09:47:28.570Z', '2025-10-18T09:47:28.570Z', 'Test E2E', NULL, 'comunicado-test-e2e', 'Contenido del comunicado', 0, false, '::1', NULL);


-- ========================================

-- Table: contactos
DROP TABLE IF EXISTS contactos CASCADE;

CREATE TABLE contactos (
  id integer DEFAULT nextval('contactos_id_seq'::regclass) NOT NULL,
  form_type character varying(100) DEFAULT 'Contacto General'::character varying,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  telefono character varying(50),
  tipo_consulta character varying(100),
  asunto character varying(500) NOT NULL,
  mensaje text NOT NULL,
  status character varying(50) DEFAULT 'pendiente'::character varying,
  respuesta text,
  respondido_por character varying(255),
  fecha_respuesta timestamp with time zone,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now(),
  ip_address character varying(50),
  user_agent text,
  email_sent boolean DEFAULT false,
  verificado boolean DEFAULT false
);


-- Data for contactos (3 rows)
INSERT INTO contactos (id, form_type, nombre, email, telefono, tipo_consulta, asunto, mensaje, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent, email_sent, verificado) VALUES (1, 'Contacto General', 'Ana Martínez', 'ana@test.com', '2221234567', 'Información General', 'Consulta sobre horarios', 'Quisiera saber los horarios de atención', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:12:14.766Z', '2025-10-17T22:12:14.766Z', NULL, NULL, false, true);
INSERT INTO contactos (id, form_type, nombre, email, telefono, tipo_consulta, asunto, mensaje, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent, email_sent, verificado) VALUES (2, 'Contacto General', 'Carlos Gómez', 'carlos@test.com', NULL, 'Admisiones e Inscripciones', 'Proceso de inscripción', '¿Cuál es el proceso para inscribir a mi hijo?', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:12:14.766Z', '2025-10-17T22:12:14.766Z', NULL, NULL, false, true);
INSERT INTO contactos (id, form_type, nombre, email, telefono, tipo_consulta, asunto, mensaje, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent, email_sent, verificado) VALUES (3, 'Contacto General', 'Laura Torres', 'laura@test.com', '2229876543', 'Becas y Apoyos', 'Información de becas', 'Me gustaría conocer las becas disponibles', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:12:14.766Z', '2025-10-17T22:12:14.766Z', NULL, NULL, false, false);


-- ========================================

-- Table: egresados
DROP TABLE IF EXISTS egresados CASCADE;

CREATE TABLE egresados (
  id integer DEFAULT nextval('egresados_id_seq'::regclass) NOT NULL,
  egresado_id character varying(50) NOT NULL,
  nombre_completo character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  telefono character varying(20),
  fecha_nacimiento date,
  anio_egreso integer NOT NULL,
  carrera_tecnica character varying(255) NOT NULL,
  generacion character varying(50),
  experiencia_laboral text,
  habilidades jsonb DEFAULT '[]'::jsonb,
  idiomas jsonb DEFAULT '[]'::jsonb,
  cv_url text,
  disponibilidad character varying(50) DEFAULT 'inmediata'::character varying,
  pretension_salarial character varying(100),
  ciudad character varying(100),
  estado character varying(100),
  linkedin_url text,
  portafolio_url text,
  referencias jsonb DEFAULT '[]'::jsonb,
  estado_perfil character varying(20) DEFAULT 'pendiente'::character varying,
  confirmado boolean DEFAULT false,
  token_confirmacion character varying(64),
  fecha_confirmacion timestamp with time zone,
  fecha_aprobacion timestamp with time zone,
  fecha_rechazo timestamp with time zone,
  motivo_rechazo text,
  notas_admin text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- Data for egresados (3 rows)
INSERT INTO egresados (id, egresado_id, nombre_completo, email, telefono, fecha_nacimiento, anio_egreso, carrera_tecnica, generacion, experiencia_laboral, habilidades, idiomas, cv_url, disponibilidad, pretension_salarial, ciudad, estado, linkedin_url, portafolio_url, referencias, estado_perfil, confirmado, token_confirmacion, fecha_confirmacion, fecha_aprobacion, fecha_rechazo, motivo_rechazo, notas_admin, metadata, created_at, updated_at) VALUES (1, 'EGR-2025-0001', 'Juan Carlos Pérez García', 'juan.perez@example.com', '2221234567', NULL, 2023, 'Técnico en Programación', '2020-2023', 'Desarrollador Junior en Tech Solutions - 1 año de experiencia en desarrollo web con React y Node.js', '["JavaScript","React","Node.js","PostgreSQL","Git"]', '["Español (Nativo)","Inglés (Intermedio)"]', NULL, 'inmediata', NULL, 'Puebla', 'Puebla', 'https://linkedin.com/in/juanperez', NULL, '[]', 'pendiente', false, 'test_token_001', NULL, NULL, NULL, NULL, NULL, '{}', '2025-10-17T07:03:31.001Z', '2025-10-17T07:03:31.001Z');
INSERT INTO egresados (id, egresado_id, nombre_completo, email, telefono, fecha_nacimiento, anio_egreso, carrera_tecnica, generacion, experiencia_laboral, habilidades, idiomas, cv_url, disponibilidad, pretension_salarial, ciudad, estado, linkedin_url, portafolio_url, referencias, estado_perfil, confirmado, token_confirmacion, fecha_confirmacion, fecha_aprobacion, fecha_rechazo, motivo_rechazo, notas_admin, metadata, created_at, updated_at) VALUES (2, 'EGR-2025-0002', 'María Fernanda López Ramírez', 'maria.lopez@example.com', '2229876543', NULL, 2022, 'Técnico en Contabilidad', '2019-2022', 'Auxiliar Contable en Contadores Asociados - 2 años de experiencia en contabilidad general y nómina', '["Contabilidad","Excel Avanzado","CONTPAQi","Facturación Electrónica","SAT"]', '["Español (Nativo)","Inglés (Básico)"]', NULL, 'inmediata', NULL, 'Puebla', 'Puebla', 'https://linkedin.com/in/marialopez', NULL, '[]', 'aprobado', true, 'test_token_002', NULL, NULL, NULL, NULL, NULL, '{}', '2025-10-17T07:03:31.001Z', '2025-10-17T07:03:31.001Z');
INSERT INTO egresados (id, egresado_id, nombre_completo, email, telefono, fecha_nacimiento, anio_egreso, carrera_tecnica, generacion, experiencia_laboral, habilidades, idiomas, cv_url, disponibilidad, pretension_salarial, ciudad, estado, linkedin_url, portafolio_url, referencias, estado_perfil, confirmado, token_confirmacion, fecha_confirmacion, fecha_aprobacion, fecha_rechazo, motivo_rechazo, notas_admin, metadata, created_at, updated_at) VALUES (3, 'EGR-2025-0003', 'Carlos Eduardo Hernández Sánchez', 'carlos.hernandez@example.com', '2223456789', NULL, 2024, 'Técnico en Mecatrónica', '2021-2024', 'Recién egresado con proyecto final en automatización industrial', '["Arduino","PLC","AutoCAD","Electrónica","Mantenimiento Industrial"]', '["Español (Nativo)","Inglés (Avanzado)"]', NULL, 'inmediata', NULL, 'Puebla', 'Puebla', 'https://linkedin.com/in/carloshernandez', NULL, '[]', 'pendiente', true, 'test_token_003', NULL, NULL, NULL, NULL, NULL, '{}', '2025-10-17T07:03:31.001Z', '2025-10-17T07:03:31.001Z');


-- ========================================

-- Table: eventos
DROP TABLE IF EXISTS eventos CASCADE;

CREATE TABLE eventos (
  id integer DEFAULT nextval('eventos_id_seq'::regclass) NOT NULL,
  titulo character varying(255) NOT NULL,
  descripcion text NOT NULL,
  imagen_url character varying(500),
  fecha_inicio timestamp without time zone NOT NULL,
  fecha_fin timestamp without time zone,
  ubicacion character varying(300),
  modalidad character varying(50) DEFAULT 'presencial'::character varying,
  link_virtual character varying(500),
  categoria character varying(100),
  tipo character varying(100),
  etiquetas ARRAY,
  estado character varying(20) DEFAULT 'borrador'::character varying,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  organizador character varying(255),
  organizador_id character varying(100),
  contacto_email character varying(255),
  contacto_telefono character varying(50),
  capacidad_maxima integer,
  inscripciones_abiertas boolean DEFAULT true,
  requiere_inscripcion boolean DEFAULT false,
  slug character varying(300),
  destacado boolean DEFAULT false,
  ip_address character varying(50),
  user_agent text
);


-- Data for eventos (6 rows)
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (1, 'Evento Prueba', 'Descripcion prueba', NULL, '2025-11-01T16:00:00.000Z', NULL, NULL, 'presencial', NULL, 'General', NULL, '[]', 'publicado', '2025-10-18T07:54:39.144Z', '2025-10-18T07:54:39.144Z', NULL, NULL, NULL, NULL, NULL, true, false, 'evento-prueba', false, '::1', 'curl/8.15.0');
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (2, 'Evento Test API', 'Descripci�n del evento de prueba', NULL, '2025-11-15T16:00:00.000Z', NULL, 'Auditorio', 'presencial', NULL, 'Pruebas', NULL, '[]', 'cancelado', '2025-10-18T09:23:27.788Z', '2025-10-18T09:24:48.686Z', 'Claude Testing', NULL, NULL, NULL, NULL, true, false, 'evento-test-api', false, '::1', 'curl/8.15.0');
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (3, 'Evento Test EDITADO 2', 'Descripción editada', NULL, '2025-11-20T20:00:00.000Z', NULL, 'Auditorio Nuevo', 'virtual', NULL, 'Pruebas', NULL, '[]', 'publicado', '2025-10-18T09:25:28.055Z', '2025-10-18T09:25:53.507Z', 'Claude Testing Updated', NULL, NULL, NULL, NULL, true, false, 'evento-test-para-update', false, '::1', 'curl/8.15.0');
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (4, 'Conferencia Virtual Test', 'Conferencia de prueba en modalidad virtual', NULL, '2025-12-01T21:00:00.000Z', NULL, 'Plataforma Zoom', 'virtual', NULL, 'acad�mico', NULL, '[]', 'publicado', '2025-10-18T09:28:29.170Z', '2025-10-18T09:28:29.170Z', 'Departamento Acad�mico', NULL, NULL, NULL, NULL, true, false, 'conferencia-virtual-test', false, '::1', 'curl/8.15.0');
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (7, 'Seminario Híbrido Test', 'Seminario en modalidad híbrida', NULL, '2025-12-05T15:00:00.000Z', NULL, 'Auditorio Principal y Zoom', 'híbrido', NULL, 'académico', NULL, '[]', 'publicado', '2025-10-18T09:28:52.234Z', '2025-10-18T09:28:52.234Z', 'Coordinación Académica', NULL, NULL, NULL, NULL, true, false, 'seminario-hibrido-test', false, '::1', NULL);
INSERT INTO eventos (id, titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, fecha_creacion, fecha_modificacion, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, slug, destacado, ip_address, user_agent) VALUES (8, 'Evento Test E2E', 'Descripción del evento de prueba', NULL, '2025-12-01T16:00:00.000Z', NULL, 'Auditorio', 'presencial', NULL, 'Pruebas', NULL, '[]', 'publicado', '2025-10-18T09:47:28.556Z', '2025-10-18T09:47:28.556Z', 'Test E2E', NULL, NULL, NULL, NULL, true, false, 'evento-test-e2e', false, '::1', NULL);


-- ========================================

-- Table: inscripciones_actividades
DROP TABLE IF EXISTS inscripciones_actividades CASCADE;

CREATE TABLE inscripciones_actividades (
  id integer DEFAULT nextval('inscripciones_actividades_id_seq'::regclass) NOT NULL,
  activity_id character varying(100) NOT NULL,
  activity_name character varying(255) NOT NULL,
  student_id character varying(50) NOT NULL,
  student_name character varying(255) NOT NULL,
  student_email character varying(255) NOT NULL,
  student_group character varying(100),
  emergency_contact character varying(50),
  additional_info text,
  status character varying(20) DEFAULT 'pending'::character varying,
  processed_by character varying(255),
  admin_notes text,
  fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_procesado timestamp without time zone,
  ip_address character varying(50),
  user_agent text
);


-- No data in inscripciones_actividades


-- ========================================

-- Table: logs_sistema
DROP TABLE IF EXISTS logs_sistema CASCADE;

CREATE TABLE logs_sistema (
  id integer DEFAULT nextval('logs_sistema_id_seq'::regclass) NOT NULL,
  nivel character varying(20) DEFAULT 'info'::character varying,
  mensaje text NOT NULL,
  contexto jsonb,
  usuario_id integer,
  ip_address character varying(45),
  user_agent character varying(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- No data in logs_sistema


-- ========================================

-- Table: newsletter_envios
DROP TABLE IF EXISTS newsletter_envios CASCADE;

CREATE TABLE newsletter_envios (
  id integer DEFAULT nextval('newsletter_envios_id_seq'::regclass) NOT NULL,
  newsletter_id integer NOT NULL,
  subscriber_id integer,
  email character varying(255) NOT NULL,
  status character varying(20) NOT NULL,
  error_message text,
  sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  opened boolean DEFAULT false,
  opened_at timestamp with time zone,
  clicked boolean DEFAULT false,
  clicked_at timestamp with time zone
);


-- Data for newsletter_envios (2 rows)
INSERT INTO newsletter_envios (id, newsletter_id, subscriber_id, email, status, error_message, sent_at, opened, opened_at, clicked, clicked_at) VALUES (1, 1, 1, 'ejemplo1@gmail.com', 'sent', NULL, '2025-10-17T05:21:44.031Z', false, NULL, false, NULL);
INSERT INTO newsletter_envios (id, newsletter_id, subscriber_id, email, status, error_message, sent_at, opened, opened_at, clicked, clicked_at) VALUES (2, 1, 2, 'ejemplo2@gmail.com', 'sent', NULL, '2025-10-17T05:21:44.031Z', false, NULL, false, NULL);


-- ========================================

-- Table: newsletters
DROP TABLE IF EXISTS newsletters CASCADE;

CREATE TABLE newsletters (
  id integer DEFAULT nextval('newsletters_id_seq'::regclass) NOT NULL,
  newsletter_id character varying(50) NOT NULL,
  subject character varying(500) NOT NULL,
  content text NOT NULL,
  target_category character varying(50) DEFAULT 'all'::character varying,
  sent_to integer DEFAULT 0 NOT NULL,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb DEFAULT '{}'::jsonb
);


-- Data for newsletters (1 rows)
INSERT INTO newsletters (id, newsletter_id, subject, content, target_category, sent_to, success_count, failure_count, sent_at, metadata) VALUES (1, 'NEWS-2025-0001', 'Bienvenida al BGE Héroes de la Patria', '<h2>Bienvenida</h2><p>Gracias por suscribirte a nuestras noticias.</p>', 'all', 2, 2, 0, '2025-10-17T05:21:44.031Z', '{}');


-- ========================================

-- Table: noticias
DROP TABLE IF EXISTS noticias CASCADE;

CREATE TABLE noticias (
  id integer DEFAULT nextval('noticias_id_seq'::regclass) NOT NULL,
  titulo character varying(255) NOT NULL,
  contenido text NOT NULL,
  resumen character varying(500),
  imagen_url character varying(500),
  categoria character varying(100),
  etiquetas ARRAY,
  estado character varying(20) DEFAULT 'borrador'::character varying,
  fecha_publicacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  autor character varying(255) NOT NULL,
  autor_id character varying(100),
  slug character varying(300),
  meta_descripcion character varying(160),
  vistas integer DEFAULT 0,
  destacada boolean DEFAULT false,
  ip_address character varying(50),
  user_agent text
);


-- Data for noticias (3 rows)
INSERT INTO noticias (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (1, 'Noticia de Prueba', 'Esta es una noticia de prueba para verificar el funcionamiento del sistema CMS.', NULL, NULL, 'Pruebas', '[]', 'archivada', '2025-10-18T07:01:36.499Z', '2025-10-18T07:01:36.500Z', '2025-10-18T07:01:49.500Z', 'Sistema', NULL, 'noticia-de-prueba', 'Esta es una noticia de prueba para verificar el funcionamiento del sistema CMS.', 0, true, '::1', 'curl/8.15.0');
INSERT INTO noticias (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (2, 'Prueba API Noticia EDITADA', 'Contenido editado.', 'Resumen editado', NULL, 'Pruebas API', '[]', 'archivada', '2025-10-18T09:23:08.184Z', '2025-10-18T09:23:08.184Z', '2025-10-18T09:23:17.858Z', 'Claude Testing', NULL, 'prueba-api-noticia', 'Resumen de prueba', 0, false, '::1', 'curl/8.15.0');
INSERT INTO noticias (id, titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, fecha_publicacion, fecha_creacion, fecha_modificacion, autor, autor_id, slug, meta_descripcion, vistas, destacada, ip_address, user_agent) VALUES (3, 'Noticia Test E2E', 'Contenido de prueba', 'Resumen de prueba', NULL, 'Pruebas', '[]', 'publicada', '2025-10-18T09:47:28.542Z', '2025-10-18T09:47:28.546Z', '2025-10-18T09:47:28.546Z', 'Test E2E', NULL, 'noticia-test-e2e', 'Resumen de prueba', 0, false, '::1', NULL);


-- ========================================

-- Table: notificaciones_convocatorias
DROP TABLE IF EXISTS notificaciones_convocatorias CASCADE;

CREATE TABLE notificaciones_convocatorias (
  id integer DEFAULT nextval('notificaciones_convocatorias_id_seq'::regclass) NOT NULL,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  tipo_interes character varying(100),
  status character varying(50) DEFAULT 'activo'::character varying,
  fecha_suscripcion timestamp with time zone DEFAULT now(),
  fecha_baja timestamp with time zone,
  ip_address character varying(50),
  user_agent text,
  verificado boolean DEFAULT false
);


-- Data for notificaciones_convocatorias (5 rows)
INSERT INTO notificaciones_convocatorias (id, nombre, email, tipo_interes, status, fecha_suscripcion, fecha_baja, ip_address, user_agent, verificado) VALUES (1, 'Luis Ramírez', 'luis@test.com', 'Becas', 'activo', '2025-10-17T22:26:51.711Z', NULL, NULL, NULL, true);
INSERT INTO notificaciones_convocatorias (id, nombre, email, tipo_interes, status, fecha_suscripcion, fecha_baja, ip_address, user_agent, verificado) VALUES (2, 'Carmen Flores', 'carmen@test.com', 'Todas las convocatorias', 'activo', '2025-10-17T22:26:51.711Z', NULL, NULL, NULL, true);
INSERT INTO notificaciones_convocatorias (id, nombre, email, tipo_interes, status, fecha_suscripcion, fecha_baja, ip_address, user_agent, verificado) VALUES (3, 'Jorge Méndez', 'jorge@test.com', 'Concursos', 'activo', '2025-10-17T22:26:51.711Z', NULL, NULL, NULL, false);
INSERT INTO notificaciones_convocatorias (id, nombre, email, tipo_interes, status, fecha_suscripcion, fecha_baja, ip_address, user_agent, verificado) VALUES (4, 'Prueba Suscriptor', 'test@notificaciones.com', 'Becas', 'activo', '2025-10-17T22:31:40.986Z', NULL, '::1', 'curl/8.15.0', false);
INSERT INTO notificaciones_convocatorias (id, nombre, email, tipo_interes, status, fecha_suscripcion, fecha_baja, ip_address, user_agent, verificado) VALUES (5, 'Usuario', 'notif@test.com', 'Todas las convocatorias', 'activo', '2025-10-18T09:46:16.453Z', NULL, '::1', 'curl/8.15.0', false);


-- ========================================

-- Table: password_recovery_requests
DROP TABLE IF EXISTS password_recovery_requests CASCADE;

CREATE TABLE password_recovery_requests (
  id integer DEFAULT nextval('password_recovery_requests_id_seq'::regclass) NOT NULL,
  email character varying(255) NOT NULL,
  student_id character varying(100),
  status character varying(50) DEFAULT 'pending'::character varying,
  fecha_solicitud timestamp with time zone DEFAULT now(),
  fecha_procesado timestamp with time zone,
  procesado_por character varying(255),
  notas_admin text,
  ip_address character varying(50),
  user_agent text,
  token character varying(255),
  token_expires_at timestamp with time zone
);


-- Data for password_recovery_requests (4 rows)
INSERT INTO password_recovery_requests (id, email, student_id, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent, token, token_expires_at) VALUES (1, 'padre1@test.com', 'BGE-2024-001', 'pending', '2025-10-17T22:36:51.241Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO password_recovery_requests (id, email, student_id, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent, token, token_expires_at) VALUES (2, 'padre2@test.com', 'BGE-2024-002', 'pending', '2025-10-17T22:36:51.241Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO password_recovery_requests (id, email, student_id, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent, token, token_expires_at) VALUES (3, 'test@example.com', NULL, 'pending', '2025-10-18T09:46:49.232Z', NULL, NULL, NULL, '::1', 'curl/8.15.0', '9073b64267532eecdfe788bc6f5166205e903aba6077e23ddf59be8bd242b7c3', '2025-10-19T09:46:49.231Z');
INSERT INTO password_recovery_requests (id, email, student_id, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent, token, token_expires_at) VALUES (4, 'test@example.com', NULL, 'pending', '2025-10-18T09:47:27.097Z', NULL, NULL, NULL, '::1', NULL, 'd308b81e5dbffbc7f096b3d19626d4d2d588233005d18a5b608002b2623c3d46', '2025-10-19T09:47:27.095Z');


-- ========================================

-- Table: pending_submissions
DROP TABLE IF EXISTS pending_submissions CASCADE;

CREATE TABLE pending_submissions (
  id integer DEFAULT nextval('pending_submissions_id_seq'::regclass) NOT NULL,
  form_type character varying(50) NOT NULL,
  submission_data jsonb NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying,
  verification_token character varying(255),
  email_verified boolean DEFAULT false,
  verification_email character varying(255),
  reviewed_by character varying(255),
  review_notes text,
  rejection_reason text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  verified_at timestamp without time zone,
  reviewed_at timestamp without time zone,
  ip_address character varying(50),
  user_agent text
);


-- No data in pending_submissions


-- ========================================

-- Table: quejas
DROP TABLE IF EXISTS quejas CASCADE;

CREATE TABLE quejas (
  id integer DEFAULT nextval('quejas_id_seq'::regclass) NOT NULL,
  form_type character varying(50) DEFAULT 'quejas'::character varying,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  subject character varying(100) NOT NULL,
  message text NOT NULL,
  status character varying(50) DEFAULT 'pendiente'::character varying,
  respuesta text,
  respondido_por character varying(255),
  fecha_respuesta timestamp with time zone,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now(),
  ip_address character varying(50),
  user_agent text
);


-- Data for quejas (7 rows)
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (1, 'quejas', 'Juan Pérez', 'juan@test.com', 'queja', 'El proceso de inscripción es muy lento', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:06:29.550Z', '2025-10-17T22:06:29.550Z', NULL, NULL);
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (2, 'quejas', 'María García', 'maria@test.com', 'sugerencia', 'Sería bueno tener una app móvil', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:06:29.550Z', '2025-10-17T22:06:29.550Z', NULL, NULL);
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (3, 'quejas', 'Pedro López', 'pedro@test.com', 'felicitacion', 'Excelente atención del personal', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:06:29.550Z', '2025-10-17T22:06:29.550Z', NULL, NULL);
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (4, 'quejas', 'Test Usuario', 'test@example.com', 'queja', 'Prueba de formulario de quejas', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:08:50.994Z', '2025-10-17T22:08:50.994Z', '::1', 'curl/8.15.0');
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (5, 'quejas', 'Test Usuario', 'test@example.com', 'queja', 'Prueba de formulario de quejas', 'pendiente', NULL, NULL, NULL, '2025-10-17T22:10:51.711Z', '2025-10-17T22:10:51.711Z', '::1', 'curl/8.15.0');
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (6, 'quejas', 'Test E2E', 'test@example.com', 'queja', 'Mensaje de prueba E2E', 'pendiente', NULL, NULL, NULL, '2025-10-18T09:46:13.676Z', '2025-10-18T09:46:13.676Z', '::1', 'curl/8.15.0');
INSERT INTO quejas (id, form_type, nombre, email, subject, message, status, respuesta, respondido_por, fecha_respuesta, fecha_creacion, fecha_actualizacion, ip_address, user_agent) VALUES (7, 'quejas', 'Test E2E Quejas', 'quejas@test.com', 'queja', 'Mensaje de prueba E2E', 'pendiente', NULL, NULL, NULL, '2025-10-18T09:47:27.089Z', '2025-10-18T09:47:27.089Z', '::1', NULL);


-- ========================================

-- Table: solicitudes_documentos
DROP TABLE IF EXISTS solicitudes_documentos CASCADE;

CREATE TABLE solicitudes_documentos (
  id integer DEFAULT nextval('solicitudes_documentos_id_seq'::regclass) NOT NULL,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  tipo_usuario character varying(50) NOT NULL,
  documento_solicitado character varying(500) NOT NULL,
  motivo text,
  nivel_urgencia character varying(20) DEFAULT 'normal'::character varying,
  status character varying(50) DEFAULT 'pendiente'::character varying,
  fecha_solicitud timestamp with time zone DEFAULT now(),
  fecha_procesado timestamp with time zone,
  procesado_por character varying(255),
  notas_admin text,
  ip_address character varying(50),
  user_agent text
);


-- Data for solicitudes_documentos (4 rows)
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent) VALUES (1, 'María González', 'maria@test.com', 'student', 'Constancia de estudios', 'Para trámite de beca universitaria', 'high', 'pendiente', '2025-10-17T22:33:03.177Z', NULL, NULL, NULL, NULL, NULL);
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent) VALUES (2, 'Pedro Ramírez', 'pedro@test.com', 'parent', 'Certificado de calificaciones', 'Solicitud de universidad', 'normal', 'pendiente', '2025-10-17T22:33:03.177Z', NULL, NULL, NULL, NULL, NULL);
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent) VALUES (3, 'Ana Torres', 'ana@test.com', 'teacher', 'Constancia laboral', 'Trámite personal', 'low', 'pendiente', '2025-10-17T22:33:03.177Z', NULL, NULL, NULL, NULL, NULL);
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud, fecha_procesado, procesado_por, notas_admin, ip_address, user_agent) VALUES (4, 'Juan P�rez', 'juan@test.com', 'student', 'Certificado de estudios', 'Para solicitud de beca', 'high', 'pendiente', '2025-10-17T22:35:01.915Z', NULL, NULL, NULL, '::1', 'curl/8.15.0');


-- ========================================

-- Table: suscriptores
DROP TABLE IF EXISTS suscriptores CASCADE;

CREATE TABLE suscriptores (
  id integer DEFAULT nextval('suscriptores_id_seq'::regclass) NOT NULL,
  subscription_id character varying(50) NOT NULL,
  email character varying(255) NOT NULL,
  nombre character varying(255) DEFAULT 'Suscriptor'::character varying,
  categories ARRAY DEFAULT ARRAY['all'::text],
  source character varying(50) DEFAULT 'newsletter'::character varying,
  active boolean DEFAULT true,
  unsubscribe_token character varying(64) NOT NULL,
  emails_sent integer DEFAULT 0,
  last_email_sent timestamp with time zone,
  subscribed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);


-- Data for suscriptores (3 rows)
INSERT INTO suscriptores (id, subscription_id, email, nombre, categories, source, active, unsubscribe_token, emails_sent, last_email_sent, subscribed_at, unsubscribed_at, metadata) VALUES (3, 'SUB-2025-0003', 'ejemplo3@gmail.com', 'Carlos López', '["all"]', 'newsletter', false, '2a87b96608d09d287721d80bb03c820021bdfa5551614ad7afe477a6d66ae141', 0, NULL, '2025-10-17T05:21:44.031Z', NULL, '{}');
INSERT INTO suscriptores (id, subscription_id, email, nombre, categories, source, active, unsubscribe_token, emails_sent, last_email_sent, subscribed_at, unsubscribed_at, metadata) VALUES (1, 'SUB-2025-0001', 'ejemplo1@gmail.com', 'Juan Pérez', '["all","noticias","eventos"]', 'newsletter', true, 'eeb3f9717ccdf7b78b49fb90a5832347f10a8e886ff25297ed7053f82fa505f5', 1, '2025-10-17T05:21:44.031Z', '2025-10-17T05:21:44.031Z', NULL, '{}');
INSERT INTO suscriptores (id, subscription_id, email, nombre, categories, source, active, unsubscribe_token, emails_sent, last_email_sent, subscribed_at, unsubscribed_at, metadata) VALUES (2, 'SUB-2025-0002', 'ejemplo2@gmail.com', 'María García', '["becas","convocatorias"]', 'newsletter', true, 'd0f450ea3b42655d57be3723b9707e658b01bf4e1b6829196d97720e70a9ba9f', 1, '2025-10-17T05:21:44.031Z', '2025-10-17T05:21:44.031Z', NULL, '{}');


-- ========================================

-- Table: user_sessions
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
  sid character varying NOT NULL,
  sess json NOT NULL,
  expire timestamp without time zone NOT NULL
);


-- No data in user_sessions


-- ========================================

-- Table: usuarios
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id integer DEFAULT nextval('usuarios_id_seq'::regclass) NOT NULL,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  password character varying(255) NOT NULL,
  rol character varying(20) DEFAULT 'estudiante'::character varying,
  activo boolean DEFAULT true,
  verificado boolean DEFAULT false,
  ultimo_acceso timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- Data for usuarios (1 rows)
INSERT INTO usuarios (id, nombre, email, password, rol, activo, verificado, ultimo_acceso, created_at, updated_at) VALUES (1, 'Administrador Sistema', 'admin@heroesdelapatria.edu.mx', '$2b$10$rZ7YQKqV8jKGZXxqVqZ3uu7v7qY7QK7v7Y7qY7qY7qY7qY7qY7qY', 'admin', true, true, NULL, '2025-10-14T23:44:44.666Z', '2025-10-14T23:44:44.666Z');


-- ========================================

-- ========================================
-- ENABLE TRIGGERS
-- ========================================

