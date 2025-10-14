(function(window, document) {
'use strict';
const KNOWLEDGE_DATABASE = {
'horarios': {
keywords: ['horario', 'hora', 'tiempo', 'cuando', 'abre', 'cierra', 'atencion', 'clases', 'entrada', 'salida', 'schedule'],
response: {
title: '🕐 Horarios de Atención',
content: [
{ 
subtitle: '📚 Clases', 
text: 'Lunes a Viernes de 8:00 AM a 1:30 PM' 
},
{ 
subtitle: '🏢 Atención Administrativa', 
text: 'Lunes a Viernes de 8:00 AM a 1:30 PM' 
},
{ 
subtitle: '📅 Fines de Semana', 
text: 'Sábados y domingos: Cerrado' 
},
{ 
subtitle: '🆔 CCT', 
text: '2IEBH0200X' 
}
],
footer: 'Para consultas específicas, contáctanos durante nuestro horario de atención.'
}
},
'ubicacion': {
keywords: ['ubicacion', 'direccion', 'donde', 'lugar', 'ubicado', 'como llegar', 'domicilio', 'mapa', 'address', 'location'],
response: {
title: '📍 Nuestra Ubicación',
content: [
{ 
subtitle: '🏠 Dirección Completa', 
text: 'C. Manuel Ávila Camacho #7, Col. Centro<br>Coronel Tito Hernández (María Andrea)<br>Venustiano Carranza, Puebla<br>C.P. 73030' 
},
{ 
subtitle: '🗺️ Cómo llegar', 
text: 'Encuentra nuestro mapa interactivo en la sección de contacto de nuestra página web.' 
},
{ 
subtitle: '🚌 Transporte', 
text: 'Accesible por transporte público. Pregunta por las rutas que llegan a María Andrea.' 
}
],
footer: '¿Necesitas direcciones específicas? ¡Contáctanos!'
}
},
'contacto': {
keywords: ['telefono', 'contacto', 'comunicar', 'llamar', 'correo', 'email', 'escribir', 'facebook', 'redes'],
response: {
title: '📞 Información de Contacto',
content: [
{ 
subtitle: '📧 Email Oficial', 
text: '21ebh0200x.sep@gmail.com' 
},
{ 
subtitle: '📱 Redes Sociales', 
text: 'Facebook: Bachillerato General Estatal "Héroes de la Patria"' 
},
{ 
subtitle: '🕐 Horario de Respuesta', 
text: 'Lunes a Viernes: 8:00 AM - 1:30 PM' 
},
{ 
subtitle: '💬 Otras Opciones', 
text: 'También puedes usar nuestros formularios de contacto en línea o visitarnos personalmente.' 
}
],
footer: 'Estamos aquí para apoyarte en tu proceso educativo.'
}
},
'admisiones': {
keywords: ['admision', 'inscripcion', 'matricula', 'registro', 'ingreso', 'inscribir', 'cuando', 'proceso', 'nuevo ingreso'],
response: {
title: '📝 Proceso de Admisiones 2025-2026',
content: [
{ 
subtitle: '📅 Período de Inscripciones', 
text: 'Agosto 2025 (fechas exactas por confirmar)' 
},
{ 
subtitle: '✅ Tipo de Proceso', 
text: 'Automático para estudiantes que cumplan los requisitos básicos' 
},
{ 
subtitle: '📋 Documentos Principales', 
text: '• Certificado de secundaria<br>• CURP actualizada<br>• Acta de nacimiento original<br>• 6 fotos tamaño infantil<br>• Comprobante de domicilio reciente' 
},
{ 
subtitle: '⚠️ Casos Especiales', 
text: 'Si vienes de otro subsistema necesitas certificado parcial y equivalencia de la SEP.' 
}
],
footer: '¡La educación pública es gratuita y de calidad!'
}
},
'requisitos': {
keywords: ['requisito', 'documento', 'necesito', 'papeles', 'tramite', 'inscripcion', 'documentacion'],
response: {
title: '📋 Requisitos de Inscripción',
content: [
{ 
subtitle: '✅ Documentos Obligatorios', 
text: '• Certificado de Secundaria (original)<br>• Acta de Nacimiento (original)<br>• CURP actualizada<br>• 6 fotografías tamaño infantil<br>• Comprobante de domicilio reciente' 
},
{ 
subtitle: '📄 Documentos Adicionales (según caso)', 
text: '• <strong>Cambios del mismo subsistema:</strong> Kardex<br>• <strong>Otros subsistemas:</strong> Certificado parcial + equivalencia SEP<br>• <strong>De otro estado:</strong> Legalización de documentos' 
},
{ 
subtitle: '💡 Tips Importantes', 
text: 'Asegúrate de que todos los documentos estén en buen estado y sean legibles.' 
}
],
footer: 'Para dudas específicas sobre tu situación, visítanos en Control Escolar.'
}
},
'carreras': {
keywords: ['carrera', 'especialidad', 'programa', 'estudios', 'capacitacion', 'formacion', 'que ofrecen', 'opciones', 'laborales'],
response: {
title: '🎓 Nuestra Oferta Educativa',
content: [
{ 
subtitle: '🏫 Bachillerato General', 
text: 'Formación académica completa que te prepara para la universidad y el mundo laboral.' 
},
{ 
subtitle: '🎨 Comunicación Gráfica', 
text: '• Diseño gráfico y digital<br>• Fotografía y medios audiovisuales<br>• Sublimado y vectorización<br>• Composición, color y tipografía<br>• Herramientas profesionales Adobe' 
},
{ 
subtitle: '🍳 Preparación de Alimentos Artesanales', 
text: '• Cocina tradicional mexicana<br>• Higiene y seguridad alimentaria<br>• Conservas y fermentados<br>• Panadería y repostería<br>• Emprendimiento gastronómico' 
},
{ 
subtitle: '🔧 Instalaciones Residenciales', 
text: '• Electricidad básica y avanzada<br>• Plomería e instalaciones hidráulicas<br>• Instalaciones sanitarias<br>• Mantenimiento del hogar<br>• Proyectos sustentables' 
}
],
footer: 'Todas nuestras especialidades incluyen prácticas profesionales reales.'
}
},
'plan_estudios': {
keywords: ['plan', 'materias', 'asignaturas', 'curriculum', 'semestres', 'que estudian', 'malla curricular'],
response: {
title: '📚 Plan de Estudios - 6 Semestres',
content: [
{ 
subtitle: '🎯 Currículum Fundamental (1° - 6° semestre)', 
text: '• <strong>Lengua y Comunicación:</strong> Lectura, escritura y expresión oral<br>• <strong>Pensamiento Matemático:</strong> Álgebra, geometría, cálculo<br>• <strong>Conciencia Histórica:</strong> Historia de México y universal<br>• <strong>Cultura Digital:</strong> Tecnologías e informática<br>• <strong>Ciencias Naturales:</strong> Física, química, biología<br>• <strong>Ciencias Sociales:</strong> Geografía, sociología<br>• <strong>Humanidades:</strong> Filosofía, ética, estética' 
},
{ 
subtitle: '🔧 Currículum Laboral (3° - 6° semestre)', 
text: '• Especialización en el área elegida<br>• Prácticas profesionales supervisadas<br>• Desarrollo de proyectos CTIM<br>• Vinculación con el sector productivo' 
},
{ 
subtitle: '🌟 Currículum Ampliado', 
text: '• Responsabilidad Social y Ciudadana<br>• Educación para la Salud<br>• Actividades Artísticas y Culturales<br>• Educación Física y Deportiva' 
}
],
footer: 'Nuestro plan de estudios está actualizado según los lineamientos de la SEP 2023.'
}
},
'plataformas': {
keywords: ['plataforma', 'sicep', 'sistema', 'digital', 'online', 'portal', 'estudiantes', 'padres'],
response: {
title: '💻 Nuestras Plataformas Digitales',
content: [
{ 
subtitle: '🎓 Portal Estudiantes', 
text: 'Acceso a calificaciones, horarios, avisos y recursos académicos.' 
},
{ 
subtitle: '👨‍👩‍👧‍👦 Portal Padres', 
text: 'Seguimiento del progreso académico y comunicación directa con la institución.' 
},
{ 
subtitle: '📱 App Estudiantil', 
text: 'Aplicación móvil para consultas rápidas y notificaciones importantes.' 
},
{ 
subtitle: '💳 Sistema de Pagos', 
text: 'Aunque la educación es gratuita, para trámites especiales y materiales.' 
},
{ 
subtitle: '🤖 Asistente Virtual', 
text: '¡Soy yo! Tu chatbot inteligente disponible 24/7.' 
}
],
footer: 'La tecnología al servicio de tu educación.'
}
},
'boleta': {
keywords: ['boleta', 'calificaciones', 'sicep', 'notas', 'como descargar', 'consultar notas'],
response: {
title: '📊 Consultar Boleta de Calificaciones',
content: [
{ 
subtitle: '🔗 Portal SICEP', 
text: 'Ingresa a: <a href="http:
},
{ 
subtitle: '📝 Datos Necesarios', 
text: '• Tu CURP (18 caracteres)<br>• NIA (Número de Identificación del Alumno)<br>• Si no recuerdas tu NIA, pregunta en Control Escolar' 
},
{ 
subtitle: '❓ Problemas de Acceso', 
text: 'Si tienes dificultades para ingresar al sistema, solicita ayuda en Control Escolar del plantel.' 
},
{ 
subtitle: '📧 Soporte Técnico', 
text: 'Email: 21ebh0200x.sep@gmail.com' 
}
],
footer: 'Tu información académica está protegida y es confidencial.'
}
},
'becas': {
keywords: ['beca', 'apoyo', 'descuento', 'ayuda', 'economico', 'benito juarez', 'beca universal'],
response: {
title: '🏆 Becas y Apoyos Disponibles',
content: [
{ 
subtitle: '💰 Beca Universal Benito Juárez', 
text: '<strong>¡AUTOMÁTICA para TODOS!</strong><br>• Se asigna automáticamente al inscribirte<br>• Depósitos bimestrales directos<br>• Sin trámite adicional requerido<br>• Consultas: <a href="https:
},
{ 
subtitle: '🎯 Becas Institucionales', 
text: '• Para estudiantes de excelencia académica<br>• Apoyo para estudiantes en situación vulnerable<br>• Reconocimientos por participación destacada<br>• Consulta disponibilidad en Control Escolar' 
},
{ 
subtitle: '📚 Programas de Apoyo', 
text: '• Asesorías académicas gratuitas<br>• Talleres de regularización<br>• Apoyo psicopedagógico<br>• Orientación vocacional' 
}
],
footer: 'La educación de calidad debe ser accesible para todos.'
}
},
'costos': {
keywords: ['costo', 'precio', 'cuanto', 'pagar', 'mensualidad', 'cuota', 'gratis', 'gratuito', 'dinero'],
response: {
title: '💰 Información de Costos',
content: [
{ 
subtitle: '🎉 Educación GRATUITA', 
text: '<strong>¡La educación pública es 100% GRATUITA!</strong><br>No pagas colegiaturas ni mensualidades.' 
},
{ 
subtitle: '📝 Gastos Mínimos', 
text: '• Materiales escolares básicos (cuadernos, lápices)<br>• Uniforme escolar (sencillo y económico)<br>• Gastos menores de laboratorio y talleres<br>• Materiales específicos para tu especialidad' 
},
{ 
subtitle: '💡 Beneficio Extra', 
text: 'Recibes la Beca Benito Juárez automáticamente, que te ayuda con gastos personales.' 
},
{ 
subtitle: '📞 Información Detallada', 
text: 'Para costos específicos de materiales por especialidad, contacta Control Escolar.' 
}
],
footer: 'Educación pública de calidad sin barreras económicas.'
}
},
'director': {
keywords: ['director', 'samuel', 'cruz', 'responsable', 'quien dirige', 'lider', 'autoridad'],
response: {
title: '👨‍💼 Nuestro Director',
content: [
{ 
subtitle: '🎯 Ing. Samuel Cruz Interial', 
text: '<strong>Director General</strong><br>• Más de 23 años de experiencia en educación<br>• 7 años en liderazgo educativo<br>• Ingeniero en Electrónica y Comunicaciones<br>• Especialista en gestión educativa' 
},
{ 
subtitle: '📧 Contacto Directo', 
text: '21ebh0200x.sep@gmail.com' 
},
{ 
subtitle: '💭 Filosofía Educativa', 
text: '<em>"Formando líderes con propósito y preparando estudiantes integrales para los desafíos del siglo XXI"</em>' 
},
{ 
subtitle: '🎯 Visión de Liderazgo', 
text: 'Comprometido con la excelencia educativa y el desarrollo integral de cada estudiante.' 
}
],
footer: 'Un líder educativo comprometido con tu formación integral.'
}
},
'docentes': {
keywords: ['maestro', 'profesor', 'docente', 'personal', 'quien enseña', 'staff', 'profesores', 'plantilla'],
response: {
title: '👩‍🏫 Nuestro Equipo Docente',
content: [
{ 
subtitle: '🌟 Profesores Destacados', 
text: '• <strong>Lic. Humberta Flores Martínez</strong><br>&nbsp;&nbsp;Pedagogía - UV, 27 años de experiencia<br><br>• <strong>Ing. José Alain Rosales García</strong><br>&nbsp;&nbsp;Químico - UV, 16 años de experiencia<br><br>• <strong>Lic. Roselia Estrada Lechuga</strong><br>&nbsp;&nbsp;Pedagogía - ICEST, 22 años de experiencia<br><br>• <strong>Ing. Tulia Villadiego Blanco</strong><br>&nbsp;&nbsp;Sistemas - UANL, 25 años de experiencia' 
},
{ 
subtitle: '📊 Estadísticas del Equipo', 
text: '• <strong>Total:</strong> 12 docentes especializados<br>• <strong>Experiencia promedio:</strong> 23+ años<br>• <strong>Formación:</strong> Universitaria con especialización<br>• <strong>Actualización:</strong> Constante capacitación SEP' 
},
{ 
subtitle: '🎯 Especialidades', 
text: 'Nuestros docentes cubren todas las áreas del currículum y las especialidades laborales con experiencia profesional.' 
}
],
footer: 'Un equipo comprometido con tu éxito académico y personal.'
}
},
'historia': {
keywords: ['historia', 'fundacion', 'origen', 'cuando se fundo', 'inicio', 'antecedentes'],
response: {
title: '📜 Nuestra Historia Institucional',
content: [
{ 
subtitle: '🗓️ Fundación (1996-1997)', 
text: 'Nuestro bachillerato fue fundado por un grupo visionario de maestros del Bachillerato "Juan Rulfo" que soñaban con crear una institución pública oficial de calidad.' 
},
{ 
subtitle: '👥 Fundadores Pioneros', 
text: '• <strong>Profesora Hercilia Aburto Nadales</strong><br>• <strong>Profesor Toribio Bautista Hernández</strong><br>• <strong>Profesor Hidelgardo Montiel Aparicio</strong><br>• <strong>Profesor Moisés Flores Vásquez</strong>' 
},
{ 
subtitle: '🎓 Primera Generación (1997)', 
text: 'Iniciamos con 70 estudiantes valientes que confiaron en este nuevo proyecto educativo.' 
},
{ 
subtitle: '🌍 Impacto Regional', 
text: 'Servimos principalmente a la comunidad de María Andrea y comunidades circunvecinas, democratizando el acceso a la educación media superior.' 
}
],
footer: '28 años formando generaciones de estudiantes exitosos.'
}
},
'mision': {
keywords: ['mision', 'objetivo', 'proposito', 'para que', 'que hacemos'],
response: {
title: '🎯 Nuestra Misión Institucional',
content: [
{ 
subtitle: '🌟 Declaración de Misión', 
text: '<em>"Somos una institución educativa de nivel medio superior formadora de estudiantes integrales, analíticos, reflexivos y críticos con los conocimientos, habilidades y valores necesarios para poderse integrar al sector productivo o continuar sus estudios a nivel superior."</em>' 
},
{ 
subtitle: '🎓 Enfoque Educativo', 
text: '• <strong>Formación integral:</strong> Desarrollo académico, personal y social<br>• <strong>Pensamiento crítico:</strong> Capacidad de análisis y reflexión<br>• <strong>Competencias laborales:</strong> Preparación para el trabajo<br>• <strong>Preparación universitaria:</strong> Base sólida para educación superior' 
},
{ 
subtitle: '💪 Compromiso Social', 
text: 'Formar ciudadanos responsables, éticos y comprometidos con el desarrollo de su comunidad.' 
}
],
footer: 'Cada día trabajamos para cumplir nuestra misión contigo.'
}
},
'vision': {
keywords: ['vision', 'futuro', 'hacia donde', 'meta', 'aspiracion'],
response: {
title: '🌟 Nuestra Visión 2030',
content: [
{ 
subtitle: '🚀 Declaración de Visión', 
text: '<em>"Ser una institución educativa de excelencia que logre la formación de seres humanos integrales con valores y aprendizajes significativos contextualizados que permitan contribuir al desarrollo regional, estatal y nacional de nuestro país."</em>' 
},
{ 
subtitle: '🏆 Aspiraciones', 
text: '• <strong>Excelencia educativa:</strong> Reconocimiento como institución líder<br>• <strong>Impacto social:</strong> Graduados que transformen su entorno<br>• <strong>Innovación pedagógica:</strong> Metodologías de vanguardia<br>• <strong>Desarrollo integral:</strong> Estudiantes competentes y éticos' 
},
{ 
subtitle: '🌍 Alcance de Impacto', 
text: 'Contribuir al desarrollo sostenible desde lo local hasta lo nacional, formando ciudadanos del siglo XXI.' 
}
],
footer: 'Construyendo juntos el futuro de la educación en nuestra región.'
}
},
'valores': {
keywords: ['valores', 'principios', 'que promueven', 'filosofia', 'etica'],
response: {
title: '⭐ Nuestros Valores Fundamentales',
content: [
{ 
subtitle: '💪 Compromiso', 
text: 'Dedicación absoluta con la educación de calidad y el éxito de nuestros estudiantes.' 
},
{ 
subtitle: '🤝 Respeto', 
text: 'Valoración y reconocimiento de la diversidad, dignidad y derechos de todas las personas.' 
},
{ 
subtitle: '⚖️ Responsabilidad', 
text: 'Asumir las consecuencias de nuestras acciones y cumplir con nuestros deberes.' 
},
{ 
subtitle: '💎 Honestidad', 
text: 'Transparencia y sinceridad en todas nuestras relaciones y procesos.' 
},
{ 
subtitle: '🛡️ Lealtad', 
text: 'Fidelidad y compromiso con nuestra comunidad educativa y sus principios.' 
},
{ 
subtitle: '🤗 Confianza', 
text: 'Base sólida para todas nuestras interacciones y relaciones institucionales.' 
}
],
footer: 'Estos valores guían cada una de nuestras acciones y decisiones.'
}
},
'talleres': {
keywords: ['taller', 'extracurricular', 'actividades', 'que hay', 'deportes', 'arte', 'clubes'],
response: {
title: '🎭 Actividades Extracurriculares',
content: [
{ 
subtitle: '🎨 Arte y Cultura', 
text: '• <strong>Ballet Folklórico:</strong> Danza tradicional mexicana<br>• <strong>Danza Contemporánea:</strong> Expresión artística moderna<br>• <strong>Banda de Guerra:</strong> Marchas y ceremonias cívicas<br>• <strong>Bastoneras:</strong> Coreografías con bastones<br>• <strong>Artes Plásticas:</strong> Pintura, dibujo y escultura' 
},
{ 
subtitle: '⚽ Deportes', 
text: '• <strong>Fútbol:</strong> Equipos varonil y femenil<br>• <strong>Básquetbol:</strong> Torneos internos y externos<br>• <strong>Voleibol:</strong> Competencias regionales' 
},
{ 
subtitle: '🤖 Clubes Académicos', 
text: '• <strong>Robótica:</strong> Programación y construcción de robots<br>• <strong>Debate:</strong> Oratoria y argumentación<br>• <strong>Ciencia:</strong> Experimentos e investigación' 
},
{ 
subtitle: '🏆 Participaciones', 
text: '• Ferias académicas estatales y regionales<br>• Concursos de ciencia y tecnología<br>• Proyectos CTIM (Ciencia, Tecnología, Ingeniería, Matemáticas)<br>• Programa de Escuelas de Calidad (PEC)' 
}
],
footer: '¡Desarrolla todo tu potencial más allá del aula!'
}
},
'uniforme': {
keywords: ['uniforme', 'ropa', 'vestimenta', 'como vestirse', 'vestido'],
response: {
title: '👔 Uniforme Escolar',
content: [
{ 
subtitle: '👨 Uniforme Masculino', 
text: '<strong>🏃 Deportivo:</strong><br>• Playera blanca con logo institucional<br>• Pantalón azul mezclilla<br>• Tenis blancos o negros<br><br><strong>👔 Gala:</strong><br>• Camisa blanca con logo institucional<br>• Pantalón gris Oxford<br>• Zapatos negros formales' 
},
{ 
subtitle: '👩 Uniforme Femenino', 
text: '<strong>🏃 Deportivo:</strong><br>• Playera blanca con logo institucional<br>• Pantalón azul mezclilla<br>• Tenis blancos o negros<br><br><strong>👗 Gala:</strong><br>• Blusa blanca con logo institucional<br>• Falda gris Oxford<br>• Zapatos negros formales' 
},
{ 
subtitle: '💡 Información Práctica', 
text: 'El uniforme puede mandarse hacer en cualquier lugar o confeccionarse en casa. Solo debe cumplir con las especificaciones de color y llevar el logo institucional.' 
}
],
footer: 'Un uniforme digno que refleja nuestro orgullo institucional.'
}
},
'certificado': {
keywords: ['certificado', 'titulo', 'diploma', 'como tramitar', 'graduacion', 'egreso'],
response: {
title: '🎓 Certificado de Bachillerato',
content: [
{ 
subtitle: '📋 Requisitos para Tramitar', 
text: '• Identificación oficial vigente<br>• Comprobante de liberación de todas las materias<br>• 6 fotografías tamaño infantil (blanco y negro, papel mate)<br>• Pago de derechos correspondientes<br>• No tener adeudos con la institución' 
},
{ 
subtitle: '⏱️ Tiempo de Entrega', 
text: '<strong>30 días hábiles</strong> a partir de la fecha de entrega completa de documentos.' 
},
{ 
subtitle: '📞 Proceso de Seguimiento', 
text: 'Acude a Control Escolar para iniciar el trámite y recibir información sobre el estatus de tu certificado.' 
},
{ 
subtitle: '💡 Consejo Important', 
text: 'Inicia el trámite con tiempo suficiente si necesitas tu certificado para inscribirte a la universidad.' 
}
],
footer: 'Tu certificado es el respaldo oficial de tu formación académica.'
}
},
'cambio_escuela': {
keywords: ['cambio', 'transferencia', 'kardex', 'cambiar de escuela', 'traslado'],
response: {
title: '🔄 Cambio de Escuela',
content: [
{ 
subtitle: '📄 Mismo Subsistema (BGE)', 
text: '• Solicita tu <strong>Kardex</strong> en Control Escolar<br>• Debes estar al corriente en todas las materias<br>• El trámite es directo sin intermediarios<br>• Tiempo de procesamiento: 5-10 días hábiles' 
},
{ 
subtitle: '📄 Otro Subsistema', 
text: '• <strong>Certificado parcial</strong> es obligatorio<br>• Solicita <strong>equivalencia de estudios</strong> en la SEP<br>• Proceso más largo (30-45 días)<br>• Algunos trámites requieren gestión en la capital del estado' 
},
{ 
subtitle: '📄 Otro Estado', 
text: '• <strong>Legalización</strong> de certificado necesaria<br>• Apostille si es requerido por el estado destino<br>• Verificación de equivalencias entre estados<br>• Tiempo estimado: 45-60 días' 
},
{ 
subtitle: '💡 Recomendación', 
text: 'Inicia el trámite con al menos 2 meses de anticipación a la fecha que necesites el documento.' 
}
],
footer: 'Tu movilidad estudiantil es nuestro compromiso.'
}
},
'reprobacion': {
keywords: ['reprobar', 'repruebo', 'materia', 'extraordinario', 'recuperar', 'segunda oportunidad'],
response: {
title: '📚 Si Repruebas una Materia',
content: [
{ 
subtitle: '✅ Opciones de Recuperación', 
text: '• <strong>Exámenes Extraordinarios:</strong> En períodos establecidos por calendario escolar<br>• <strong>Proyectos Prácticos:</strong> Trabajos especiales para regularización<br>• <strong>Asesorías Gratuitas:</strong> Apoyo personalizado con profesores<br>• <strong>Cursos de Regularización:</strong> Refuerzo en áreas específicas' 
},
{ 
subtitle: '📅 Fechas Importantes', 
text: 'Consulta el calendario escolar oficial para conocer las fechas exactas de exámenes extraordinarios. Generalmente son 3 períodos por año.' 
},
{ 
subtitle: '👨‍🏫 Apoyo Académico', 
text: 'Las asesorías con profesores son <strong>completamente gratuitas</strong> y están diseñadas para asegurar tu éxito académico.' 
},
{ 
subtitle: '📧 ¿Necesitas ayuda?', 
text: 'Contacta inmediatamente a tu consejero académico o a Control Escolar: 21ebh0200x.sep@gmail.com' 
}
],
footer: 'No te rindas, estamos aquí para apoyarte en tu éxito académico.'
}
},
'reinscripcion': {
keywords: ['reinscripcion', 'cada año', 'anual', 'proceso', 'renovacion'],
response: {
title: '📝 Proceso de Reinscripción',
content: [
{ 
subtitle: '📅 Período (Agosto)', 
text: 'La reinscripción se realiza durante el mes de agosto de cada año escolar.' 
},
{ 
subtitle: '📋 Documentos Requeridos', 
text: '• <strong>CRAD:</strong> Cédula de Registro y Actualización de Datos<br>• Actualización de información personal y familiar<br>• Comprobante de domicilio actualizado<br>• CURP vigente' 
},
{ 
subtitle: '🔄 Proceso Simplificado', 
text: 'Para estudiantes regulares, el proceso es ágil y directo. Solo actualización de datos personales en Control Escolar.' 
},
{ 
subtitle: '⚠️ Casos Especiales', 
text: 'Si tienes materias reprobadas o situaciones especiales, el proceso puede requerir pasos adicionales.' 
}
],
footer: 'Mantén actualizados tus datos para un proceso sin complicaciones.'
}
},
'universidades': {
keywords: ['universidad', 'convenio', 'superior', 'continuar', 'despues', 'carrera universitaria'],
response: {
title: '🏛️ Convenios Universitarios',
content: [
{ 
subtitle: '✅ Beneficios para Nuestros Estudiantes', 
text: '• <strong>Acceso a laboratorios:</strong> Uso de instalaciones universitarias especializadas<br>• <strong>Talleres universitarios:</strong> Experiencia práctica en ambiente universitario<br>• <strong>Descuentos especiales:</strong> En inscripciones ITSVC y UTXJ<br>• <strong>Programas preferenciales:</strong> Para alumnos de excelencia académica' 
},
{ 
subtitle: '🎯 Oportunidades Especiales', 
text: '• <strong>Prácticas profesionales:</strong> En empresas e instituciones aliadas<br>• <strong>Proyectos colaborativos:</strong> Con estudiantes universitarios<br>• <strong>Mentorías académicas:</strong> Por parte de profesores universitarios<br>• <strong>Ferias vocacionales:</strong> Orientación para tu futuro profesional' 
},
{ 
subtitle: '🏆 Para Estudiantes Destacados', 
text: 'Los alumnos con promedio sobresaliente tienen oportunidades adicionales y programas especiales de apoyo para su transición universitaria.' 
},
{ 
subtitle: '📧 Más Información', 
text: 'Consulta con tu consejero académico sobre oportunidades específicas: 21ebh0200x.sep@gmail.com' 
}
],
footer: 'Tu bachillerato es el puente hacia tu futuro universitario.'
}
},
'porque_elegir': {
keywords: ['porque elegir', 'ventajas', 'beneficios', 'que ofrece', 'por que', 'razones'],
response: {
title: '🌟 ¿Por Qué Elegir "Héroes de la Patria"?',
content: [
{ 
subtitle: '🎯 Educación Práctica y Moderna', 
text: 'No solo teoría: desarrollas habilidades reales para el trabajo y la vida, con tecnología de vanguardia y metodologías innovadoras.' 
},
{ 
subtitle: '🤝 Inclusión Total', 
text: 'Sin barreras económicas, sociales o culturales. Todos tienen derecho a una educación de calidad.' 
},
{ 
subtitle: '🏆 Proyectos Reconocidos', 
text: 'Participamos en proyectos CTIM ganadores, ferias científicas y tenemos fuerte vinculación con la comunidad.' 
},
{ 
subtitle: '💪 Formación Integral', 
text: 'Desarrollas competencias académicas, laborales y personales, además de valores sólidos para la vida.' 
},
{ 
subtitle: '💰 Beca Automática', 
text: 'Todos nuestros estudiantes reciben la Beca Benito Juárez sin trámites adicionales.' 
},
{ 
subtitle: '👨‍🏫 Personal Experimentado', 
text: 'Profesores con más de 23 años de experiencia promedio, comprometidos con tu éxito.' 
},
{ 
subtitle: '💻 Tecnología Responsable', 
text: 'Usamos la tecnología como herramienta de crecimiento personal y académico, no como distractor.' 
}
],
footer: '¡Únete a nuestra familia educativa y transforma tu futuro!'
}
},
'biblioteca': {
keywords: ['biblioteca', 'libros', 'recursos', 'estudio', 'investigacion'],
response: {
title: '📚 Centro de Recursos Académicos',
content: [
{ 
subtitle: '📖 Colección Bibliográfica', 
text: 'Amplio acervo de libros especializados por materia y área de estudio, constantemente actualizado.' 
},
{ 
subtitle: '💻 Recursos Digitales', 
text: 'Acceso a bases de datos educativas, enciclopedias digitales y plataformas de investigación en línea.' 
},
{ 
subtitle: '🔬 Apoyo a la Investigación', 
text: 'Orientación especializada para proyectos escolares, investigaciones y trabajos académicos.' 
},
{ 
subtitle: '🏠 Espacios de Estudio', 
text: 'Áreas silenciosas y colaborativas diseñadas para diferentes tipos de aprendizaje y trabajo en equipo.' 
}
],
footer: 'Tu centro de recursos para el éxito académico.'
}
},
'laboratorios': {
keywords: ['laboratorio', 'ciencias', 'experimentos', 'practica', 'computo'],
response: {
title: '🔬 Nuestros Laboratorios',
content: [
{ 
subtitle: '🧪 Laboratorio de Ciencias', 
text: 'Equipado para prácticas de química, física y biología con materiales modernos y medidas de seguridad.' 
},
{ 
subtitle: '💻 Centro de Cómputo', 
text: 'Computadoras actualizadas con software especializado para todas las áreas académicas y laborales.' 
},
{ 
subtitle: '🔧 Talleres Especializados', 
text: 'Espacios equipados para cada especialidad: diseño gráfico, cocina profesional, instalaciones eléctricas.' 
},
{ 
subtitle: '🛡️ Normas de Seguridad', 
text: 'Todos nuestros espacios cumplen con las normas oficiales de seguridad y están supervisados por personal capacitado.' 
}
],
footer: 'Aprende haciendo en nuestros espacios especializados.'
}
}
};
function formatResponse(responseData) {
if (typeof responseData === 'string') {
return `<div class="response-simple">${responseData}</div>`;
}
let html = `<div class="response-professional">`;
if (responseData.title) {
html += `<div class="response-title">${responseData.title}</div>`;
}
if (responseData.content && Array.isArray(responseData.content)) {
html += `<div class="response-content">`;
responseData.content.forEach(item => {
html += `<div class="response-section">`;
if (item.subtitle) {
html += `<div class="response-subtitle">${item.subtitle}</div>`;
}
if (item.text) {
html += `<div class="response-text">${item.text}</div>`;
}
html += `</div>`;
});
html += `</div>`;
}
if (responseData.footer) {
html += `<div class="response-footer">${responseData.footer}</div>`;
}
html += `</div>`;
return html;
}
let currentSessionId = null;
let isAPIConnected = false;
function initializeChatSession() {
if (!currentSessionId) {
currentSessionId = window.apiClient ? window.apiClient.generateSessionId() : 
'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
if (window.apiClient) {
window.apiClient.checkConnection().then(connected => {
isAPIConnected = connected;
});
}
}
async function processMessage(message) {
const startTime = Date.now();
if (isAPIConnected && window.apiClient) {
try {
const userInfo = window.apiClient.getUserInfo();
const userType = userInfo ? userInfo.tipo_usuario : 'visitante';
const apiResponse = await window.apiClient.searchInformation(message, userType, 5);
if (apiResponse && apiResponse.success && apiResponse.results.length > 0) {
const dbResult = apiResponse.results[0];
const formattedResponse = formatDatabaseResponse(dbResult);
await window.apiClient.logMessage(
currentSessionId, 
message, 
formattedResponse, 
userType
);
return formattedResponse;
}
} catch (error) {
console.warn('🔄 API falló, usando respuestas locales:', error.message);
isAPIConnected = false;
}
}
return processMessageLocal(message);
}
function formatDatabaseResponse(dbResult) {
try {
const content = typeof dbResult.contenido === 'string' ? 
JSON.parse(dbResult.contenido) : dbResult.contenido;
return `
<div class="response-container">
<div class="response-header">
<h3 class="response-title">💡 ${dbResult.titulo}</h3>
<span class="response-category">${dbResult.categoria}</span>
</div>
<div class="response-content">
${formatResponseContent(content)}
</div>
<div class="response-footer">
<small>📅 Actualizado: ${formatDate(dbResult.updated_at)} | 🔄 Información dinámica</small>
</div>
</div>
`;
} catch (error) {
console.warn('Error formateando respuesta DB:', error);
return `
<div class="response-container">
<div class="response-header">
<h3 class="response-title">💡 ${dbResult.titulo}</h3>
</div>
<div class="response-content">
<p>${dbResult.contenido}</p>
</div>
</div>
`;
}
}
function processMessageLocal(message) {
const lowerMessage = message.toLowerCase();
const normalizedMessage = lowerMessage
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '');
let bestMatch = null;
let bestScore = 0;
for (const [topic, data] of Object.entries(KNOWLEDGE_DATABASE)) {
let score = 0;
const matchedKeywords = [];
for (const keyword of data.keywords) {
const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
if (normalizedMessage.includes(normalizedKeyword) || lowerMessage.includes(keyword)) {
score += 5;
matchedKeywords.push(keyword);
}
else if (normalizedMessage.includes(normalizedKeyword.substring(0, Math.min(normalizedKeyword.length, 4)))) {
score += 2;
matchedKeywords.push(keyword);
}
}
if (matchedKeywords.length > 1) {
score += matchedKeywords.length * 2;
}
if (score > bestScore) {
bestScore = score;
bestMatch = data;
}
}
if (bestMatch && bestScore >= 3) {
return formatResponse(bestMatch.response);
}
if (/\b(hola|buenos|buenas|hi|hello|saludo|que tal)\b/.test(lowerMessage)) {
const greetings = [
{
title: '👋 ¡Hola! Bienvenido/a',
content: [
{ text: 'Soy el asistente virtual del Bachillerato General Estatal "Héroes de la Patria". Estoy aquí para ayudarte con toda la información que necesites.' }
],
footer: '¿En qué puedo ayudarte hoy? Pregúntame sobre admisiones, carreras, horarios, o cualquier cosa del bachillerato.'
},
{
title: '🌅 ¡Buenos días!',
content: [
{ text: 'Me da mucho gusto saludarte. Tengo toda la información actualizada sobre nuestro bachillerato y estoy listo para resolver tus dudas.' }
],
footer: '¿Qué te gustaría saber sobre "Héroes de la Patria"?'
},
{
title: '😊 ¡Qué tal!',
content: [
{ text: 'Bienvenido/a a nuestro sistema de asistencia virtual. Puedo ayudarte con información sobre admisiones, carreras, becas, horarios y mucho más.' }
],
footer: 'Solo pregúntame lo que necesites saber.'
}
];
return formatResponse(greetings[Math.floor(Math.random() * greetings.length)]);
}
if (/\b(gracias|thank you|gracias|muchas gracias)\b/.test(lowerMessage)) {
const thanks = [
{
title: '😊 ¡De nada!',
content: [
{ text: 'Me alegra poder ayudarte. Si tienes más preguntas sobre nuestro bachillerato, no dudes en hacerlas.' }
],
footer: '¡Estoy aquí para apoyarte en tu proceso educativo!'
},
{
title: '🤗 ¡Un placer ayudarte!',
content: [
{ text: 'Para eso estoy aquí. Si necesitas más información sobre "Héroes de la Patria", solo pregúntame.' }
],
footer: 'Tu éxito educativo es nuestra prioridad.'
}
];
return formatResponse(thanks[Math.floor(Math.random() * thanks.length)]);
}
const defaultResponse = {
title: '🤔 No encontré información específica',
content: [
{ 
subtitle: '💡 Sugerencias de temas',
text: 'Puedo ayudarte con información sobre:<br><br>• <strong>Admisiones:</strong> proceso, requisitos, fechas<br>• <strong>Carreras:</strong> especialidades laborales disponibles<br>• <strong>Becas:</strong> Benito Juárez y apoyos institucionales<br>• <strong>Horarios:</strong> clases y atención administrativa<br>• <strong>Personal:</strong> director y docentes<br>• <strong>Historia:</strong> fundación y filosofía institucional'
},
{
subtitle: '📞 Contacto Directo',
text: 'Para consultas muy específicas: <strong>21ebh0200x.sep@gmail.com</strong>'
}
],
footer: 'Intenta reformular tu pregunta o usa palabras clave como "admisiones", "carreras", "becas", etc.'
};
return formatResponse(defaultResponse);
}
let chatbotOpen = false;
function toggleChatbot() {
const container = document.getElementById('chatbotContainer');
const toggle = document.getElementById('chatbotToggle');
if (!container || !toggle) {
return;
}
chatbotOpen = !chatbotOpen;
if (chatbotOpen) {
container.style.display = 'flex';
toggle.innerHTML = '<i class="fas fa-times"></i>';
const messagesContainer = document.getElementById('chatbotMessages');
if (messagesContainer && messagesContainer.children.length === 0) {
setTimeout(() => {
const welcomeMessage = {
title: '🎓 Asistente Virtual BGE',
content: [
{ 
subtitle: '¡Hola! Soy tu asistente inteligente',
text: 'Puedo ayudarte con información sobre admisiones, carreras, becas, horarios, y todo lo relacionado con nuestro bachillerato.' 
}
],
footer: '¿En qué puedo ayudarte hoy?'
};
addMessage('bot', formatResponse(welcomeMessage));
}, 500);
}
} else {
container.style.display = 'none';
toggle.innerHTML = '<i class="fas fa-comments"></i>';
}
}
window.toggleChatbot = toggleChatbot;
function addMessage(sender, message) {
const messagesContainer = document.getElementById('chatbotMessages');
const messageDiv = document.createElement('div');
messageDiv.className = `chatbot-message ${sender}`;
messageDiv.innerHTML = message;
messageDiv.style.opacity = '0';
messageDiv.style.transform = 'translateY(20px)';
messagesContainer.appendChild(messageDiv);
setTimeout(() => {
messageDiv.style.transition = 'all 0.4s ease';
messageDiv.style.opacity = '1';
messageDiv.style.transform = 'translateY(0)';
}, 50);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
async function sendMessage() {
const input = document.getElementById('chatbotInput');
const message = input.value.trim();
if (message) {
addMessage('user', message);
input.value = '';
showTypingIndicator();
try {
const response = await processMessage(message);
const minProcessingTime = 800;
const processingTime = Date.now() - (window.lastMessageTime || Date.now());
const delay = Math.max(0, minProcessingTime - processingTime);
setTimeout(() => {
hideTypingIndicator();
addMessage('bot', response);
if (isAPIConnected) {
addFeedbackButtons(message);
}
}, delay);
} catch (error) {
console.error('Error procesando mensaje:', error);
hideTypingIndicator();
const errorResponse = `
<div class="response-container error">
<div class="response-header">
<h3 class="response-title">⚠️ Error de Conexión</h3>
</div>
<div class="response-content">
<p>Disculpa, hubo un problema procesando tu mensaje. Por favor intenta de nuevo.</p>
<p><small>Modo offline activo - usando respuestas locales</small></p>
</div>
</div>
`;
addMessage('bot', errorResponse);
}
window.lastMessageTime = Date.now();
}
}
function formatDate(dateString) {
if (!dateString) return 'Fecha no disponible';
try {
const date = new Date(dateString);
return date.toLocaleDateString('es-MX', {
year: 'numeric',
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
});
} catch (error) {
return 'Fecha no disponible';
}
}
function formatResponseContent(content) {
if (typeof content === 'string') {
return `<p>${content}</p>`;
}
if (Array.isArray(content)) {
return content.map(item => {
if (typeof item === 'object' && item.subtitle && item.text) {
return `
<div class="content-section">
<h4 class="content-subtitle">${item.subtitle}</h4>
<p class="content-text">${item.text}</p>
</div>
`;
}
return `<p>${item}</p>`;
}).join('');
}
if (typeof content === 'object') {
return Object.keys(content).map(key => {
return `
<div class="content-section">
<h4 class="content-subtitle">${key}</h4>
<p class="content-text">${content[key]}</p>
</div>
`;
}).join('');
}
return `<p>${content}</p>`;
}
function addFeedbackButtons(originalMessage) {
const messagesContainer = document.getElementById('chatbotMessages');
const feedbackDiv = document.createElement('div');
feedbackDiv.className = 'feedback-container';
feedbackDiv.innerHTML = `
<div class="feedback-question">
<small>¿Te fue útil esta respuesta?</small>
</div>
<div class="feedback-buttons">
<button class="feedback-btn positive" onclick="submitFeedback(5, '${originalMessage}')">
👍 Sí
</button>
<button class="feedback-btn negative" onclick="submitFeedback(2, '${originalMessage}')">
👎 No
</button>
</div>
`;
messagesContainer.appendChild(feedbackDiv);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
async function submitFeedback(rating, originalMessage) {
if (window.apiClient && isAPIConnected) {
try {
await window.apiClient.submitFeedback(currentSessionId, rating, originalMessage);
const feedbackContainers = document.querySelectorAll('.feedback-container');
const lastFeedback = feedbackContainers[feedbackContainers.length - 1];
if (lastFeedback) {
lastFeedback.innerHTML = `
<div class="feedback-thanks">
<small>✅ ¡Gracias por tu feedback!</small>
</div>
`;
}
} catch (error) {
console.warn('Error enviando feedback:', error.message);
}
}
}
function showTypingIndicator() {
const indicator = document.getElementById('typingIndicator');
const messagesContainer = document.getElementById('chatbotMessages');
if (indicator) {
indicator.style.display = 'flex';
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
}
function hideTypingIndicator() {
const indicator = document.getElementById('typingIndicator');
if (indicator) {
indicator.style.display = 'none';
}
}
document.addEventListener('DOMContentLoaded', function() {
initializeChatSession();
const chatToggle = document.getElementById('chatbotToggle');
if (chatToggle) {
chatToggle.addEventListener('click', toggleChatbot);
} else {
}
const chatInput = document.getElementById('chatbotInput');
if (chatInput) {
chatInput.addEventListener('keypress', function(e) {
if (e.key === 'Enter') {
e.preventDefault();
sendMessage();
}
});
} else {
}
const container = document.getElementById('chatbotContainer');
if (container) {
container.style.display = 'none';
}
});
const professionalStyles = document.createElement('style');
professionalStyles.textContent = `
.response-professional {
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
line-height: 1.5;
color: #2c3e50;
width: 100%;
}
.response-title {
font-size: 1.1rem;
font-weight: 700;
color: #1976D2;
margin-bottom: 15px;
padding: 8px 12px;
background: linear-gradient(135deg, #e3f2fd, #f8f9fa);
border-left: 4px solid #1976D2;
border-radius: 6px;
}
.response-content {
margin-bottom: 12px;
}
.response-section {
margin-bottom: 12px;
padding: 4px 0;
}
.response-subtitle {
font-weight: 600;
color: #1565C0;
margin-bottom: 8px;
font-size: 0.95rem;
display: flex;
align-items: center;
gap: 6px;
}
.response-text {
color: #37474f;
font-size: 0.9rem;
line-height: 1.5;
margin-left: 4px;
padding: 4px 0;
}
[data-theme="dark"] .response-text,
body.dark-mode .response-text {
color: #ffffff !important;
}
[data-theme="dark"] .response-professional,
body.dark-mode .response-professional {
color: #ffffff !important;
}
[data-theme="dark"] .response-simple,
body.dark-mode .response-simple {
color: #ffffff !important;
}
[data-theme="dark"] .response-subtitle,
body.dark-mode .response-subtitle {
color: #ffd700 !important;
}
[data-theme="dark"] .response-text strong {
color: #64b5f6 !important;
}
[data-theme="dark"] .response-text a {
color: #64b5f6 !important;
}
[data-theme="dark"] .chatbot-message.bot {
background: #424242 !important;
border: 1px solid #616161 !important;
color: #ffffff !important;
}
[data-theme="dark"] .response-title,
body.dark-mode .response-title {
color: #ffd700 !important;
background: linear-gradient(135deg, #37474f, #424242) !important;
border-left: 4px solid #ffd700 !important;
}
[data-theme="dark"] .response-footer {
color: #a5d6a7 !important;
border-left: 3px solid #66bb6a !important;
}
[data-theme="dark"] .response-subtitle,
[data-theme="dark"] .subtitle,
body.dark-mode .response-subtitle,
body.dark-mode .subtitle {
color: #ffd700 !important;
font-weight: 600 !important;
}
[data-theme="dark"] .response-text,
[data-theme="dark"] .text,
body.dark-mode .response-text,
body.dark-mode .text {
color: #ffffff !important;
}
[data-theme="dark"] .response-professional,
body.dark-mode .response-professional {
color: #ffffff !important;
}
[data-theme="dark"] .response-section,
body.dark-mode .response-section {
color: #ffffff !important;
}
[data-theme="dark"] .response-content,
body.dark-mode .response-content {
color: #ffffff !important;
}
.response-text strong {
color: #1976D2;
font-weight: 600;
}
.response-text a {
color: #1976D2;
text-decoration: none;
font-weight: 500;
}
.response-text a:hover {
text-decoration: underline;
}
.response-footer {
margin-top: 16px;
padding: 10px 12px;
background: linear-gradient(135deg, #f0f4ff, #e8f5e8);
border-radius: 6px;
font-size: 0.85rem;
color: #2e7d32;
font-style: italic;
border-left: 3px solid #4caf50;
}
.response-simple {
color: #37474f;
font-size: 0.9rem;
line-height: 1.6;
}
.chatbot-message.bot {
background: #ffffff;
border: 1px solid #e0e0e0;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
padding: 16px;
margin-bottom: 12px;
border-radius: 12px;
width: 100%;
max-width: 100%;
}
.chatbot-message.user {
background: linear-gradient(135deg, #1976D2, #1565C0);
color: white;
border-radius: 12px;
padding: 12px 16px;
max-width: 85%;
margin-left: auto;
margin-bottom: 12px;
}
.typing-indicator {
padding: 10px 16px;
display: flex;
align-items: center;
gap: 8px;
color: #666;
font-size: 0.85rem;
}
.typing-dots {
display: flex;
gap: 3px;
}
.typing-dots div {
width: 6px;
height: 6px;
background: #1976D2;
border-radius: 50%;
animation: typingPulse 1.4s infinite both;
}
.typing-dots div:nth-child(2) {
animation-delay: 0.2s;
}
.typing-dots div:nth-child(3) {
animation-delay: 0.4s;
}
@keyframes typingPulse {
0%, 60%, 100% {
transform: scale(1);
opacity: 0.5;
}
30% {
transform: scale(1.2);
opacity: 1;
}
}
.response-category {
background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
color: #1565C0;
padding: 2px 8px;
border-radius: 12px;
font-size: 0.75rem;
font-weight: 500;
margin-left: 8px;
}
.content-section {
margin-bottom: 12px;
}
.content-subtitle {
color: #1976D2;
font-size: 0.9rem;
font-weight: 600;
margin: 8px 0 4px 0;
}
.content-text {
margin: 0 0 8px 0;
line-height: 1.5;
}
.response-footer {
margin-top: 12px;
padding-top: 8px;
border-top: 1px solid #f0f0f0;
color: #666;
font-size: 0.8rem;
}
.response-container.error {
border-left: 4px solid #f44336;
background-color: #ffebee;
}
.response-container.error .response-title {
color: #d32f2f;
}
.feedback-container {
margin: 8px 0;
padding: 8px 12px;
background: #f8f9fa;
border-radius: 8px;
border: 1px solid #e9ecef;
}
.feedback-question {
margin-bottom: 6px;
color: #666;
}
.feedback-buttons {
display: flex;
gap: 8px;
}
.feedback-btn {
padding: 4px 12px;
border: 1px solid #ddd;
border-radius: 16px;
background: white;
cursor: pointer;
font-size: 0.8rem;
transition: all 0.2s ease;
}
.feedback-btn:hover {
transform: translateY(-1px);
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.feedback-btn.positive:hover {
background: #e8f5e8;
border-color: #4caf50;
color: #2e7d32;
}
.feedback-btn.negative:hover {
background: #ffebee;
border-color: #f44336;
color: #d32f2f;
}
.feedback-thanks {
color: #4caf50;
font-weight: 500;
text-align: center;
padding: 4px 0;
}
`;;
document.head.appendChild(professionalStyles);
class DynamicContentLoader {constructor() {console.log('🔄 [LOADER] Inicializando cargador de contenido dinámico...');this.apiBase = 'data/';this.cache = new Map();this.init();}async init() {const path = window.location.pathname;if (path.includes('index.html') || path.endsWith('/')) {await this.loadHomepageContent();} else if (path.includes('comunidad.html')) {await this.loadCommunityContent();} else if (path.includes('calendario.html')) {await this.loadCalendarContent();}console.log('✅ [LOADER] Contenido dinámico cargado');}async fetchData(endpoint) {if (this.cache.has(endpoint)) {return this.cache.get(endpoint);}try {const response = await fetch(`${this.apiBase}${endpoint}`);if (!response.ok) {throw new Error(`Error ${response.status}: ${response.statusText}`);}const data = await response.json();this.cache.set(endpoint, data);return data;} catch (error) {console.error(`❌ [LOADER] Error cargando ${endpoint}:`, error);return null;}}async loadNoticias(limit = null) {const data = await this.fetchData('noticias.json');if (!data) return [];let noticias = data.noticias.filter(n => n.activo);if (limit) {noticias = noticias.slice(0, limit);}return noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));}async loadEventos(limit = null) {const data = await this.fetchData('eventos.json');if (!data) return [];let eventos = data.eventos ? data.eventos.filter(e => e.activo) : [];if (limit) {eventos = eventos.slice(0, limit);}return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));}async loadAvisos(limit = null) {const data = await this.fetchData('avisos.json');if (!data) return [];let avisos = data.avisos ? data.avisos.filter(a => a.activo) : [];const now = new Date();avisos = avisos.filter(aviso => {const fechaInicio = new Date(aviso.fechaInicio);const fechaFin = aviso.fechaFin ? new Date(aviso.fechaFin) : null;return fechaInicio <= now && (!fechaFin || fechaFin >= now);});if (limit) {avisos = avisos.slice(0, limit);}return avisos.sort((a, b) => {const prioridadOrder = { 'alta': 3, 'media': 2, 'baja': 1 };const prioridadDiff = prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];if (prioridadDiff !== 0) return prioridadDiff;return new Date(b.fechaInicio) - new Date(a.fechaInicio);});}async loadComunicados(limit = null) {const data = await this.fetchData('comunicados.json');if (!data) return [];let comunicados = data.comunicados ? data.comunicados.filter(c => c.activo) : [];if (limit) {comunicados = comunicados.slice(0, limit);}return comunicados.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));}async loadHomepageContent() {console.log('🏠 [LOADER] Cargando contenido de página principal...');const noticias = await this.loadNoticias(3);this.renderRecentNews(noticias);const eventos = await this.loadEventos(3);this.renderUpcomingEvents(eventos);}renderRecentNews(noticias) {const container = document.getElementById('recent-news');if (!container) {console.warn('⚠️ [LOADER] Contenedor recent-news no encontrado');return;}if (noticias.length === 0) {container.innerHTML = `<div class="col-12 text-center"><div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No hay noticias disponibles en este momento.</div></div>`;return;}let html = '';noticias.forEach(noticia => {const fechaFormateada = this.formatDate(noticia.fecha);const imagenSrc = noticia.imagen || 'images/default-news.jpg';html += `<div class="col-lg-4 col-md-6"><article class="card h-100 border-0 shadow-sm news-card" data-id="${noticia.id}"><div class="card-img-top position-relative overflow-hidden" style="height: 200px;"><img src="${imagenSrc}"alt="${noticia.titulo}"class="w-100 h-100 object-fit-cover"onerror="this.src='images/default.jpg'"loading="lazy">${noticia.destacado ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Destacada</span>' : ''}<div class="card-overlay position-absolute bottom-0 start-0 end-0 p-3 text-white"><span class="badge bg-primary">${noticia.categoria}</span></div></div><div class="card-body d-flex flex-column"><h5 class="card-title">${noticia.titulo}</h5><p class="card-text text-muted flex-grow-1">${noticia.resumen || noticia.contenido.substring(0, 150) + '...'}</p><div class="mt-auto"><div class="d-flex justify-content-between align-items-center"><small class="text-muted"><i class="fas fa-calendar me-1"></i>${fechaFormateada}</small><small class="text-muted"><i class="fas fa-user me-1"></i>${noticia.autor}</small></div><button class="btn btn-primary btn-sm mt-2 w-100" onclick="showNoticiaModal('${noticia.id}')">Leer más <i class="fas fa-arrow-right ms-1"></i></button></div></div></article></div>`;});container.innerHTML = html;console.log(`📰 [LOADER] ${noticias.length} noticias cargadas en homepage`);}renderUpcomingEvents(eventos) {let container = document.getElementById('upcoming-events');if (!container) {const newsSection = document.querySelector('#recent-news').closest('section');const eventsSection = document.createElement('section');eventsSection.className = 'py-5 bg-light';eventsSection.innerHTML = `<div class="container"><div class="row mb-5"><div class="col-lg-8 mx-auto text-center"><h2 class="fw-bold text-primary mb-3">Próximos Eventos</h2><p class="lead text-muted">No te pierdas las actividades programadas</p></div></div><div class="row g-4" id="upcoming-events"></div><div class="row mt-4"><div class="col-12 text-center"><a href="calendario.html" class="btn btn-outline-primary">Ver calendario completo <i class="fas fa-arrow-right ms-2"></i></a></div></div></div>`;newsSection.parentNode.insertBefore(eventsSection, newsSection.nextSibling);container = document.getElementById('upcoming-events');}if (eventos.length === 0) {container.innerHTML = `<div class="col-12 text-center"><div class="alert alert-info"><i class="fas fa-calendar-times me-2"></i>No hay eventos próximos programados.</div></div>`;return;}let html = '';eventos.forEach(evento => {const fechaFormateada = this.formatDate(evento.fecha);html += `<div class="col-lg-4 col-md-6"><div class="card h-100 border-0 shadow-sm event-card" data-id="${evento.id}"><div class="card-body"><div class="d-flex align-items-start mb-3"><div class="badge bg-success me-3 p-2"><i class="fas fa-calendar-alt fa-lg"></i></div><div class="flex-grow-1"><h5 class="card-title mb-1">${evento.titulo}</h5><p class="text-muted small mb-0">${evento.categoria}</p></div></div><p class="card-text">${evento.descripcion.substring(0, 120)}...</p><div class="mt-auto"><div class="row g-2 text-sm"><div class="col-6"><i class="fas fa-calendar text-primary me-1"></i><small>${fechaFormateada}</small></div><div class="col-6"><i class="fas fa-clock text-primary me-1"></i><small>${evento.hora}</small></div><div class="col-12"><i class="fas fa-map-marker-alt text-primary me-1"></i><small>${evento.lugar}</small></div></div><button class="btn btn-outline-success btn-sm mt-3 w-100" onclick="showEventoModal('${evento.id}')">Ver detalles <i class="fas fa-info-circle ms-1"></i></button></div></div></div></div>`;});container.innerHTML = html;console.log(`📅 [LOADER] ${eventos.length} eventos cargados en homepage`);}formatDate(dateString) {const date = new Date(dateString);return date.toLocaleDateString('es-ES', {day: 'numeric',month: 'long',year: 'numeric'});}formatDateTime(dateString, timeString) {const date = this.formatDate(dateString);return `${date} a las ${timeString}`;}async showNoticiaDetails(id) {const noticias = await this.loadNoticias();const noticia = noticias.find(n => n.id === id);if (!noticia) return;this.createDetailModal({title: noticia.titulo,content: noticia.contenido,author: noticia.autor,date: this.formatDate(noticia.fecha),image: noticia.imagen,category: noticia.categoria,tags: noticia.tags});}createDetailModal({ title, content, author, date, image, category, tags }) {const modalId = 'dynamicDetailModal';let modal = document.getElementById(modalId);if (modal) {modal.remove();}const modalHTML = `<div class="modal fade" id="${modalId}" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${title}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${image ? `<img src="${image}" class="img-fluid mb-3 rounded" alt="${title}">` : ''}<div class="mb-3"><span class="badge bg-primary me-2">${category}</span><small class="text-muted"><i class="fas fa-user me-1"></i>${author} •<i class="fas fa-calendar me-1"></i>${date}</small></div><div class="content">${content}</div>${tags ? `<div class="mt-3">${tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}</div>` : ''}</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div></div></div></div>`;document.body.insertAdjacentHTML('beforeend', modalHTML);const modalInstance = new bootstrap.Modal(document.getElementById(modalId));modalInstance.show();}}async function showNoticiaModal(id) {if (window.dynamicLoader) {await window.dynamicLoader.showNoticiaDetails(id);}}async function showEventoModal(id) {console.log('📅 Mostrar detalles del evento:', id);}document.addEventListener('DOMContentLoaded', function() {window.dynamicLoader = new DynamicContentLoader();});console.log('📝 [LOADER] dynamic-loader.js cargado exitosamente');
})();