/**
 * 📚 INSTITUTIONAL KNOWLEDGE BASE (CORPUS RAG)
 * Base de Conocimiento Oficial para Chatbot y Tutor IA
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión: 2025-2026 (FASE 5)
 */

const INSTITUTIONAL_DOCUMENTS = [
    {
        id: "doc_horarios_asistencia",
        category: "reglamento",
        title: "Reglamento Escolar BGE — Capítulo II: Horarios y Asistencia",
        source: "Reglamento General BGE, Art. 12-18",
        keywords: ["horario", "horarios", "entrada", "salida", "asistencia", "retardo", "tolerancia", "justificante", "falta", "turnos", "clases"],
        content: `El horario escolar oficial del Bachillerato General Estatal "Héroes de la Patria" para el Turno Matutino es de Lunes a Viernes de 07:00 a 14:00 hrs. 
La tolerancia máxima de ingreso al plantel es de 10 minutos (hasta las 07:10 hrs); después de este horario se registrará como retardo. Tres retardos equivalen a una falta injustificada.
El requisito indispensable para tener derecho a exámenes parciales y ordinarios es cumplir con un mínimo del 80% de asistencia global en cada materia.
Los justificantes por motivos de salud deben presentarse ante la Coordinación de Orientación Educativa dentro de las 48 horas hábiles siguientes a la inasistencia, acompañados de receta médica oficial.`
    },
    {
        id: "doc_evaluacion_calificaciones",
        category: "academico",
        title: "Criterios de Evaluación y Calificaciones Oficiales",
        source: "Normativa Académica SEP-BGE, Art. 24-30",
        keywords: ["calificaciones", "evaluacion", "promedio", "reprobado", "aprobado", "escala", "ordinario", "extraordinario", "acreditacion", "boleta"],
        content: `La escala oficial de calificaciones en el BGE es numérica del 5 al 10. La calificación mínima aprobatoria es 6.0 (seis punto cero).
El ciclo escolar comprende tres periodos parciales de evaluación y un examen final/ordinario. 
Los componentes de evaluación continua se distribuyen en: Examen escrito/práctico (40%), Proyectos y Tareas (30%), Actividades en plataforma y participación (20%), y Asistencia/Conducta (10%).
Las boletas de calificaciones oficiales se emiten al término de cada parcial y pueden ser consultadas y descargadas en formato PDF desde el Portal de Estudiantes o de Padres de Familia.`
    },
    {
        id: "doc_oferta_educativa",
        category: "academico",
        title: "Oferta Educativa y Plan de Estudios BGE",
        source: "Plan Curricular BGE SEP Puebla",
        keywords: ["oferta", "carreras", "capacitacion", "materias", "semestres", "bachillerato", "informatica", "contabilidad", "salud", "plan de estudios"],
        content: `El Bachillerato General Estatal "Héroes de la Patria" (CCT 21EBH0001X) ofrece educación media superior general de 3 años estructurada en 6 semestres lectivos.
Además del tronco común general (Matemáticas, Física, Química, Biología, Historia, Literatura, Filosofía e Inglés), a partir del tercer semestre los alumnos eligen una Capacitación para el Trabajo entre tres opciones:
1. Tecnologías de la Información y Comunicación (Informática y Programación Web).
2. Contabilidad y Administración de Empresas.
3. Higiene y Salud Comunitaria (Enfermería preventiva y primeros auxilios).
Al egresar, los estudiantes reciben su Certificado de Bachillerato y Diploma de Capacitación Laboral avalado por la SEP.`
    },
    {
        id: "doc_becas_convocatorias",
        category: "becas",
        title: "Programa de Becas y Apoyos Estudiantiles",
        source: "Coordinación de Becas BGE 2025-2026",
        keywords: ["beca", "becas", "benito juarez", "apoyo", "economico", "solicitud", "requisitos", "convocatoria", "excelencia"],
        content: `Todos los alumnos inscritos activamente en el BGE tienen derecho a solicitar y recibir la Beca Universal de Educación Media Superior "Benito Juárez".
Requisitos para tramitar la Beca Benito Juárez:
1. Estar formalmente inscrito y matriculado en el ciclo escolar actual.
2. Contar con CURP certificada y actualizada.
3. Registrar su expediente socioeconómico ante la oficina de Orientación Educativa al inicio del semestre.
4. No contar con otra beca federal concurrente para el mismo fin.
Adicionalmente, el plantel otorga la "Beca de Excelencia BGE" a los 3 mejores promedios de cada grado (promedio superior a 9.5), la cual incluye exención del 100% de cuotas voluntarias y acceso preferente a programas de tutoría avanzada.`
    },
    {
        id: "doc_inscripciones_admision",
        category: "admisiones",
        title: "Proceso de Admisión, Inscripción y Reinscripción",
        source: "Departamento de Control Escolar BGE",
        keywords: ["inscripcion", "inscripciones", "reinscripcion", "admision", "nuevo ingreso", "requisitos", "documentos", "costo", "fechas"],
        content: `El proceso de inscripción para nuevo ingreso se realiza en los meses de Julio y Agosto. Requisitos documentales obligatorios:
1. Certificado original de Secundaria y dos copias legibles.
2. Acta de Nacimiento reciente (original y copia).
3. CURP actualizada emitida por RENAPO.
4. Certificado médico reciente expedido por institución pública (con tipo de sangre).
5. Seis fotografías tamaño infantil blanco y negro, papel mate.
6. Comprobante domiciliario reciente (no mayor a 3 meses).
El trámite se puede iniciar en línea en la sección de Pre-Registro del portal web y se concluye de forma presencial con la entrega física de documentos en Control Escolar.`
    },
    {
        id: "doc_contacto_ubicacion",
        category: "contacto",
        title: "Directorio, Contacto y Ubicación del Plantel",
        source: "Administración General BGE",
        keywords: ["contacto", "telefono", "correo", "direccion", "ubicacion", "donde esta", "atencion", "oficinas", "mapa"],
        content: `Información de contacto y localización del Bachillerato General Estatal "Héroes de la Patria":
- Dirección: Calle 2 Poniente No. 303, Col. Centro, Heroica Puebla de Zaragoza, Puebla, C.P. 72000.
- Teléfonos de atención: (222) 232-4567 y (222) 232-4568.
- Correo de contacto general: contacto@bge-heroesdelapatria.edu.mx
- Correo de Control Escolar: controlescolar@bge-heroesdelapatria.edu.mx
- Horario de atención en ventanillas: Lunes a Viernes de 07:30 a 14:00 hrs.`
    }
];

module.exports = {
    INSTITUTIONAL_DOCUMENTS
};
