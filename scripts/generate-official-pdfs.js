/**
 * Generador de Documentos Oficiales PDF para BGE Héroes de la Patria
 * Genera documentos PDF institucionales reales utilizando pdfkit.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pdfkit'));

const OUT_DIR = path.join(__dirname, '..', 'public', 'documents');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Configuración de colores institucionales
const COLORS = {
    primary: '#1E3A8A',    // Azul marino institucional
    secondary: '#D97706',  // Oro / ámbar
    dark: '#1F2937',       // Texto principal
    lightBg: '#F3F4F6',    // Fondo gris claro
    border: '#D1D5DB',     // Bordes de tablas
    accent: '#0D9488'      // Acento verde azulado
};

function addHeader(doc, title, subtitle = '') {
    doc.rect(0, 0, doc.page.width, 95).fill(COLORS.primary);
    
    doc.fillColor('#FFFFFF')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('BACHILLERATO GENERAL ESTATAL "HÉROES DE LA PATRIA"', 40, 22, { align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Clave de Centro de Trabajo (CCT): 21EBH0244Z • Zona Escolar 014 • Educación Media Superior', 40, 44, { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#FEF08A')
       .text(title.toUpperCase(), 40, 64, { align: 'center' });

    doc.fillColor(COLORS.dark);
    doc.y = 110;
}

function addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count || 1;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.rect(40, doc.page.height - 45, doc.page.width - 80, 1).fill(COLORS.border);
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text('Bachillerato General Estatal Héroes de la Patria • Sistema Integral de Control Escolar BGE-SICE', 40, doc.page.height - 35, { align: 'left', width: doc.page.width - 150 });
        doc.text(`Página ${i + 1} de ${pageCount}`, doc.page.width - 100, doc.page.height - 35, { align: 'right' });
    }
}

// 1. Calendario Escolar
function generateCalendario() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'calendario-escolar-2024-2025.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Calendario Escolar Oficial • Ciclo 2024 - 2025');

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('1. INFORMACIÓN GENERAL DEL CICLO');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        'El presente calendario rige las actividades académicas, administrativas y de evaluación para los semestres A (Otoño 2024) y B (Primavera 2025) conforme a los lineamientos oficiales de la Secretaría de Educación Pública del Estado de Puebla.'
    );
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('2. PERIODOS DE EVALUACIÓN PARCIAL Y REPORTE');
    
    const events = [
        ['Semestre A (Otoño 2024)', 'Fecha Inicio: 26 Agosto 2024', 'Fecha Fin: 24 Enero 2025'],
        ['• Primer Periodo Parcial', 'Evaluación: 23 - 27 Septiembre 2024', 'Captura: 30 Sept - 04 Oct 2024'],
        ['• Segundo Periodo Parcial', 'Evaluación: 04 - 08 Noviembre 2024', 'Captura: 11 - 15 Noviembre 2024'],
        ['• Tercer Periodo Parcial', 'Evaluación: 09 - 13 Diciembre 2024', 'Captura: 16 - 20 Diciembre 2024'],
        ['• Periodo de Regularización', '13 - 17 Enero 2025', 'Publicación Boletas: 24 Enero 2025'],
        ['Semestre B (Primavera 2025)', 'Fecha Inicio: 10 Febrero 2025', 'Fecha Fin: 09 Julio 2025'],
        ['• Primer Periodo Parcial', 'Evaluación: 17 - 21 Marzo 2025', 'Captura: 24 - 28 Marzo 2025'],
        ['• Segundo Periodo Parcial', 'Evaluación: 05 - 09 Mayo 2025', 'Captura: 12 - 16 Mayo 2025'],
        ['• Tercer Periodo Parcial', 'Evaluación: 09 - 13 Junio 2025', 'Captura: 16 - 20 Junio 2025'],
        ['• Regularización y Cierre', '23 - 27 Junio 2025', 'Ceremonia Graduación: 04 Julio 2025']
    ];

    events.forEach(([title, col1, col2]) => {
        const isHeader = !title.startsWith('•');
        if (isHeader) {
            doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#E5E7EB');
            doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary).text(title, 45, doc.y - 15);
            doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.dark).text(`${col1}  |  ${col2}`, 300, doc.y - 12);
        } else {
            doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.dark).text(title, 50, doc.y + 4);
            doc.font('Helvetica').fontSize(9).text(col1, 220, doc.y - 11);
            doc.text(col2, 400, doc.y - 11);
        }
        doc.moveDown(0.6);
    });

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('3. SUSPENSIÓN DE LABORES DOCENTES Y VACACIONES');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        '• Receso de Invierno: 19 de Diciembre de 2024 al 03 de Enero de 2025.\n' +
        '• Receso de Primavera (Semana Santa): 14 al 25 de Abril de 2025.\n' +
        '• Días Festivos Oficiales: 16 Septiembre, 01 y 18 Noviembre 2024; 03 Febrero, 17 Marzo, 01, 05 y 15 Mayo 2025.\n' +
        '• Sesiones Ordinarias de Consejo Técnico Escolar (CTE): Último viernes de cada mes lectivo.'
    );

    addFooter(doc);
    doc.end();
}

// 2. Formato de Inscripción
function generateFormatoInscripcion() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'formato-inscripcion.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Cédula Oficial de Inscripción y Reinscripción');

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('SECCIÓN A: DATOS GENERALES DEL ESTUDIANTE');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 75).stroke(COLORS.border);
    
    let startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Nombre Completo: ____________________________________________________________________', 50, startY)
       .text('CURP: _______________________________   Fecha Nacimiento (DD/MM/AAAA): _______________', 50, startY + 18)
       .text('Género: [  ] M   [  ] F   [  ] Otro    Semestre al que ingresa: [  ] 1°  [  ] 3°  [  ] 5°    Grupo: _____', 50, startY + 36)
       .text('Correo Electrónico Institucional: _______________________________  Teléfono Celular: ____________', 50, startY + 54);

    doc.y = startY + 75;
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('SECCIÓN B: DOMICILIO PARTICULAR');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 55).stroke(COLORS.border);
    startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Calle y Número: _____________________________________________ Colonia: ________________________', 50, startY)
       .text('Municipio/Alcaldía: ___________________________ Estado: __________________ C.P.: ______________', 50, startY + 18)
       .text('Teléfono de Casa: ___________________________ Teléfono de Emergencia: ________________________', 50, startY + 36);

    doc.y = startY + 55;
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('SECCIÓN C: DATOS DEL PADRE, MADRE O TUTOR LEGAL');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 55).stroke(COLORS.border);
    startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Nombre del Tutor: _____________________________________________ Parentesco: ___________________', 50, startY)
       .text('CURP del Tutor: ______________________________ Teléfono Móvil: _______________________________', 50, startY + 18)
       .text('Correo Electrónico: ___________________________________________ Ocupación: ___________________', 50, startY + 36);

    doc.y = startY + 55;
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('SECCIÓN D: DOCUMENTACIÓN REQUISITADA (Para uso exclusivo de Control Escolar)');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 60).stroke(COLORS.border);
    startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('[  ] Acta de Nacimiento (Original y 2 copias)       [  ] Certificado Médico con Tipo de Sangre', 50, startY)
       .text('[  ] Certificado de Secundaria (Original y 2 copias)   [  ] 6 Fotografías Tamaño Infantil B/N', 50, startY + 16)
       .text('[  ] Clave Única de Registro de Población (CURP)    [  ] Comprobante de Aportación Voluntaria', 50, startY + 32)
       .text('[  ] Comprobante de Domicilio Vigente (Luz/Agua)     [  ] Carta de Buena Conducta', 50, startY + 48);

    doc.y = startY + 65;
    doc.moveDown(1.5);

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Declaro bajo protesta de decir verdad que los datos asentados en la presente solicitud son verídicos y comprobables.', 40, doc.y, { align: 'center' });

    doc.moveDown(3);
    const signY = doc.y;
    doc.text('____________________________________', 60, signY, { width: 200, align: 'center' });
    doc.text('Firma del Estudiante', 60, signY + 12, { width: 200, align: 'center' });

    doc.text('____________________________________', doc.page.width - 260, signY, { width: 200, align: 'center' });
    doc.text('Firma del Padre o Tutor', doc.page.width - 260, signY + 12, { width: 200, align: 'center' });

    addFooter(doc);
    doc.end();
}

// 3. Guía de Inscripciones
function generateGuiaInscripciones() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'guia-inscripciones.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Guía Práctica para el Proceso de Inscripción y Reinscripción');

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('PASO 1: PRE-REGISTRO EN LÍNEA');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        '1. Ingrese al portal web institucional https://bge-heroesdelapatria.vercel.app/inscripciones.html\n' +
        '2. Complete el formulario con los datos personales del aspirante y tutor.\n' +
        '3. Guarde su Número de Folio y descargue su Comprobante de Cita Presencial.'
    );
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('PASO 2: INTEGRACIÓN DEL EXPEDIENTE FÍSICO');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        'Prepare un folder tamaño oficio color azul (hombres) o beige (mujeres) con la siguiente documentación:\n' +
        '• Acta de Nacimiento (formato reciente, original y 2 copias legibles).\n' +
        '• Certificado de Educación Secundaria (original y 2 copias).\n' +
        '• Impresión oficial de la CURP en formato actualizado.\n' +
        '• 6 Fotografías tamaño infantil de frente, papel mate, fondo blanco, camisa blanca.\n' +
        '• Certificado médico expedido por institución pública (Cruz Roja, IMSS, ISSSTE, Centro de Salud) con tipo sanguíneo.\n' +
        '• Copia de identificación oficial (INE) del padre, madre o tutor legal.\n' +
        '• Comprobante de domicilio reciente (no mayor a 3 meses).'
    );
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('PASO 3: COTEJO Y ASIGNACIÓN DE MATRÍCULA');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        '• Acuda puntualmente en la fecha y hora asignadas en su cita a la Dirección de Control Escolar.\n' +
        '• Personal administrativo realizará la validación documental y digitalización del expediente.\n' +
        '• Recibirá su Matrícula Definitiva y credenciales institucionales para el Sistema BGE-SICE.'
    );
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('PASO 4: ACTIVACIÓN DE CUENTA Y PORTALES');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        '• Ingrese con su matrícula a https://bge-heroesdelapatria.vercel.app/estudiantes.html\n' +
        '• Los tutores deben ingresar a https://bge-heroesdelapatria.vercel.app/comunicacion-padres-docentes.html\n' +
        '• Descargue su Horario de Clases y Reglamento Escolar vigente.'
    );

    addFooter(doc);
    doc.end();
}

// 4. Solicitud de Constancias
function generateSolicitudConstancias() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'solicitud-constancias.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Solicitud Oficial de Constancias y Documentos Académicos');

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('DATOS DEL SOLICITANTE');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 50).stroke(COLORS.border);
    let startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Nombre del Alumno(a): __________________________________________________ Matrícula: __________________', 50, startY)
       .text('Grado y Grupo Actual: __________________ Turno: ___________________ Teléfono: _________________________', 50, startY + 18)
       .text('Correo Electrónico: _______________________________________________________________________________', 50, startY + 36);

    doc.y = startY + 50;
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('TIPO DE DOCUMENTO REQUERIDO (Marque con una X)');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 110).stroke(COLORS.border);
    startY = doc.y + 8;
    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark)
       .text('[  ] Constancia Simple de Estudios con Horario', 50, startY)
       .text('[  ] Constancia de Estudios con Calificaciones Parciales / Promedio General', 50, startY + 18)
       .text('[  ] Historial Académico / Kárdex Oficial Completo', 50, startY + 36)
       .text('[  ] Carta de Buena Conducta Institucional', 50, startY + 54)
       .text('[  ] Certificado Parcial de Estudios (Por traslado o baja)', 50, startY + 72)
       .text('[  ] Duplicado de Certificado de Terminación de Estudios', 50, startY + 90);

    doc.y = startY + 115;
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('MOTIVO DE LA SOLICITUD Y ESPECIFICACIONES');
    doc.rect(40, doc.y + 2, doc.page.width - 80, 55).stroke(COLORS.border);
    startY = doc.y + 8;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark)
       .text('Institución u Organismo al que va dirigido: _________________________________________________________', 50, startY)
       .text('Motivo: [  ] Beca  [  ] Trámite Seguro Social  [  ] Empleo  [  ] Ingreso Superior  [  ] Otro: ________________', 50, startY + 18)
       .text('Observaciones adicionales: _________________________________________________________________________', 50, startY + 36);

    doc.y = startY + 60;
    doc.moveDown(1);

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLORS.primary).text('TIEMPOS DE ENTREGA Y CONSIDERACIONES:');
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.dark).text(
        '• Constancias simples y de calificaciones: 3 a 5 días hábiles a partir de la recepción de esta solicitud.\n' +
        '• Certificados parciales y duplicados: 10 a 15 días hábiles (sujeto a validación de la Coordinación Regional SEP).\n' +
        '• Es requisito indispensable no presentar adeudos de material bibliográfico ni documentación en Control Escolar.'
    );

    doc.moveDown(3);
    const signY = doc.y;
    doc.text('____________________________________', 60, signY, { width: 200, align: 'center' });
    doc.text('Firma del Solicitante', 60, signY + 12, { width: 200, align: 'center' });

    doc.text('____________________________________', doc.page.width - 260, signY, { width: 200, align: 'center' });
    doc.text('Sello y Firma de Control Escolar', doc.page.width - 260, signY + 12, { width: 200, align: 'center' });

    addFooter(doc);
    doc.end();
}

// 5. Guía de Estudio Matemáticas
function generateGuiaMatematicas() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'guia-estudio-matematicas.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Guía de Estudio y Acompañamiento Académico • Matemáticas');

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('1. PRESENTACIÓN Y OBJETIVO DE LA ASIGNATURA');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        'Esta guía tiene como propósito fortalecer el pensamiento lógico-matemático, el razonamiento analítico y la capacidad de resolución de problemas en estudiantes de Educación Media Superior, cubriendo los ejes temáticos de Pensamiento Matemático I, II y III.'
    );
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('2. CONTENIDOS TEMÁTICOS FUNDAMENTALES');
    
    const topics = [
        ['Bloque I: Álgebra Fundamental', 'Operaciones con polinomios, productos notables, factorización, ecuaciones lineales y cuadráticas con una y dos incógnitas.'],
        ['Bloque II: Geometría y Trigonometría', 'Ángulos, triángulos, teorema de Pitágoras, semejanza, razones trigonométricas y leyes de senos y cosenos.'],
        ['Bloque III: Geometría Analítica', 'Plano cartesiano, distancia entre puntos, ecuación de la recta, circunferencia, parábola, elipse e hipérbola.'],
        ['Bloque IV: Funciones y Precálculo', 'Dominio y rango, funciones polinomiales, racionales, exponenciales y logarítmicas. Noción intuitiva de límite.']
    ];

    topics.forEach(([block, desc]) => {
        doc.rect(40, doc.y, doc.page.width - 80, 16).fill('#E5E7EB');
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.primary).text(block, 45, doc.y - 12);
        doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.dark).text(desc, 45, doc.y + 4, { width: doc.page.width - 90 });
        doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('3. EJERCICIOS TIPO Y ESTRATEGIAS DE SOLUCIÓN');
    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark).text(
        '1. Factorización por término común y trinomios: ax² + bx + c = 0.\n' +
        '2. Aplicación de la fórmula general: x = (-b ± √(b² - 4ac)) / (2a).\n' +
        '3. Cálculo de pendiente de una recta que pasa por dos puntos: m = (y₂ - y₁) / (x₂ - x₁).\n' +
        '4. Resolución de triángulos oblicuángulos mediante ley de cosenos: c² = a² + b² - 2ab·cos(C).\n\n' +
        'Recursos de Apoyo Digital: Acceda a los laboratorios interactivos y cuestionarios de práctica en el módulo de Duelo de Sabiduría y Constructor de Conceptos en la plataforma BGE.'
    );

    addFooter(doc);
    doc.end();
}

// 6. Horarios de Atención
function generateHorariosAtencion() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'horarios-atencion.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Directorio y Horarios Oficiales de Atención a la Comunidad');

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('1. HORARIOS GENERALES DEL PLANTEL');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        '• Turno Matutino: Lunes a Viernes de 07:00 a 14:00 horas.\n' +
        '• Atención al Público y Trámites Administrativos: Lunes a Viernes de 08:00 a 13:30 horas.\n' +
        '• Ubicación: Instalaciones Oficiales del Bachillerato General Estatal "Héroes de la Patria".'
    );
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('2. DIRECTORIO POR DEPARTAMENTO');

    const offices = [
        ['Dirección Escolar', 'Mtro. Director de Plantel', 'Lunes a Viernes: 09:00 - 13:00 hrs', 'direccion@bge.edu.mx'],
        ['Subdirección Académica', 'Coordinación Pedagógica', 'Lunes a Viernes: 08:00 - 13:30 hrs', 'academica@bge.edu.mx'],
        ['Control Escolar e Inscripciones', 'Ventanilla Única de Trámites', 'Lunes a Viernes: 08:30 - 13:00 hrs', 'controlescolar@bge.edu.mx'],
        ['Orientación Educativa y Tutorías', 'Atención Psicopedagógica', 'Lunes a Viernes: 08:00 - 14:00 hrs', 'tutorias@bge.edu.mx'],
        ['Coordinación de Tecnologías / IA', 'Soporte Plataforma SICE', 'Lunes a Viernes: 07:30 - 14:00 hrs', 'soporte@bge.edu.mx'],
        ['Sociedad de Padres de Familia', 'Mesa Directiva Institucional', 'Previa Cita por Portal de Padres', 'padres@bge.edu.mx']
    ];

    offices.forEach(([name, person, schedule, email]) => {
        doc.rect(40, doc.y, doc.page.width - 80, 26).fill('#F9FAFB').stroke(COLORS.border);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.primary).text(name, 48, doc.y - 20);
        doc.font('Helvetica').fontSize(8).fillColor(COLORS.dark).text(`${person}  |  ${schedule}`, 48, doc.y - 8);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.secondary).text(`Contacto: ${email}`, doc.page.width - 200, doc.y - 14);
        doc.moveDown(0.7);
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('3. CITAS EN LÍNEA');
    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark).text(
        'Para una atención personalizada y sin filas, solicite su cita previamente a través del módulo de Citas en Línea en https://bge-heroesdelapatria.vercel.app/citas.html o desde el Portal de Padres.'
    );

    addFooter(doc);
    doc.end();
}

// 7. Formato Institucional BGE
function generateFormatoInstitucional() {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER', bufferPages: true });
    const stream = fs.createWriteStream(path.join(OUT_DIR, 'formato-institucional-bge.pdf'));
    doc.pipe(stream);

    addHeader(doc, 'Formato Institucional Oficial y Membrete BGE');

    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text('IDENTIDAD Y NORMATIVIDAD INSTITUCIONAL');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.dark).text(
        'El Bachillerato General Estatal "Héroes de la Patria" es una institución pública de Educación Media Superior comprometida con la excelencia académica, la formación integral en valores, el desarrollo científico y la vanguardia tecnológica mediante inteligencia artificial aplicada al aprendizaje.'
    );
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('ESTRUCTURA ORGANIZACIONAL Y SERVICIOS');
    
    const services = [
        ['• Modelo Académico Basado en Competencias', 'Planes de estudio actualizados conforme a la Nueva Escuela Mexicana con enfoque STEM.'],
        ['• Plataforma Digital y Sistema IA Coins', 'Sistema interactivo de evaluación, laboratorios virtuales, retos gamificados y tutoría inteligente.'],
        ['• Portal de Seguimiento para Padres', 'Monitoreo en tiempo real de calificaciones, asistencia, horarios y comunicación directa con docentes.'],
        ['• Instalaciones y Equipamiento', 'Aulas climatizadas, laboratorio de ciencias experimentales, centro de cómputo y biblioteca digital.']
    ];

    services.forEach(([title, desc]) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.secondary).text(title, 45, doc.y);
        doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.dark).text(desc, 45, doc.y + 2);
        doc.moveDown(0.6);
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text('VALIDEZ OFICIAL');
    doc.fontSize(8.5).font('Helvetica').fillColor(COLORS.dark).text(
        'Todos los documentos expedidos con este membrete cuentan con validez oficial ante la Secretaría de Educación Pública del Estado de Puebla y el Sistema Nacional de Bachillerato.\n\n' +
        'Emitido en Heroica Puebla de Zaragoza a los 16 días del mes de Agosto de 2026.'
    );

    addFooter(doc);
    doc.end();
}

// Ejecutar todas las generaciones
console.log('📄 Generando 7 documentos institucionales oficiales en PDF...');
generateCalendario();
generateFormatoInscripcion();
generateGuiaInscripciones();
generateSolicitudConstancias();
generateGuiaMatematicas();
generateHorariosAtencion();
generateFormatoInstitucional();
console.log('✅ 7 documentos PDF generados exitosamente en public/documents/.');
