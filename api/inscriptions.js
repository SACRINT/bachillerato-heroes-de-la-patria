import { body, validationResult } from 'express-validator';
import fs from 'fs'.promises;
import path from 'path';
import { URL } from 'url';

// 📁 Rutas de archivos (ajustadas para Vercel)
const INSCRIPTIONS_FILE = path.join(process.cwd(), 'data/inscriptions.json');
const ACTIVITIES_FILE = path.join(process.cwd(), 'data/activities.json');

// ============================================
// HELPERS (Adaptados para Serverless)
// ============================================

async function ensureDataDirectory() {
    // En Vercel, el sistema de archivos es de solo lectura para el código desplegado.
    // No se pueden crear directorios o escribir archivos en tiempo de ejecución.
    // Esta función es principalmente para desarrollo local.
    const dataDir = path.join(process.cwd(), 'data');
    try {
        await fs.access(dataDir);
    } catch {
        // console.warn('⚠️ Directorio de datos no encontrado en Serverless. No se creará.');
    }
}

async function readInscriptions() {
    try {
        const data = await fs.readFile(INSCRIPTIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error leyendo inscriptions.json:', error);
        // En Serverless, si el archivo no existe, no podemos crearlo.
        // Devolver datos vacíos o un valor por defecto.
        return { inscriptions: [], lastId: 0 };
    }
}

async function saveInscriptions(data) {
    // ⚠️ ADVERTENCIA: En Serverless, escribir en el sistema de archivos NO es persistente.
    // Los cambios se perderán entre invocaciones. Esto debería ir a una base de datos.
    console.warn('⚠️ Intentando guardar inscripciones en archivo JSON. Esto NO persistirá en Serverless.');
    try {
        await fs.writeFile(INSCRIPTIONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error guardando inscripciones en JSON:', error);
    }
}

async function readActivities() {
    try {
        const data = await fs.readFile(ACTIVITIES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error leyendo activities.json:', error);
        // Actividades demo por defecto
        const defaultActivities = {
            activities: [
                {
                    id: 'feria-ciencias-2025',
                    name: 'Feria de Ciencias',
                    fullName: 'Feria de Ciencias 2025',
                    date: '2025-02-15',
                    maxCapacity: 50,
                    status: 'open',
                    closeDate: '2025-02-10',
                    description: 'Presenta tu proyecto científico en nuestra feria anual'
                },
                {
                    id: 'torneo-matematicas-2025',
                    name: 'Torneo de Matemáticas',
                    fullName: 'Torneo de Matemáticas 2025',
                    date: '2025-01-25',
                    maxCapacity: 40,
                    status: 'closed',
                    closeDate: '2025-01-20',
                    description: 'Demuestra tus habilidades matemáticas'
                },
                {
                    id: 'taller-liderazgo-2025',
                    name: 'Taller de Liderazgo',
                    fullName: 'Taller de Liderazgo 2025',
                    date: '2025-03-20',
                    maxCapacity: 30,
                    status: 'open',
                    closeDate: '2025-03-15',
                    description: 'Desarrolla tus habilidades de liderazgo'
                }
            ]
        };
        // En Serverless, no podemos escribir el archivo directamente.
        // await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(defaultActivities, null, 2));
        return defaultActivities;
    }
}

// ⚠️ ADVERTENCIA: saveActivities NO persistirá en Serverless.
async function saveActivities(data) {
    console.warn('⚠️ Intentando guardar actividades en archivo JSON. Esto NO persistirá en Serverless.');
    try {
        await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error guardando actividades en JSON:', error);
    }
}

function findActivityByName(activities, activityName) {
    return activities.activities.find(act =>
        act.name === activityName ||
        act.fullName === activityName ||
        act.id === activityName.toLowerCase().replace(/\s+/g, '-')
    );
}

function generateInscriptionId(lastId) {
    const newId = lastId + 1;
    const year = new Date().getFullYear();
    return `INS-${year}-${String(newId).padStart(4, '0')}`;
}

// ============================================
// HANDLER PRINCIPAL PARA /api/inscriptions
// ============================================

export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/inscriptions', '');

    try {
        // Validar variables de entorno para email (si se usan)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_TO) {
            console.warn('⚠️ Variables de entorno EMAIL_USER, EMAIL_PASS o EMAIL_TO no configuradas. El envío de emails podría fallar.');
            // No se hace return 500 aquí para permitir que otras rutas funcionen
        }

        switch (path) {
            case '/register':
                if (req.method === 'POST') {
                    await Promise.all(registerValidation.map(validation => validation.run(req)));
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        return res.status(400).json({ success: false, errors: errors.array() });
                    }

                    // await ensureDataDirectory(); // No aplicable en Serverless

                    const {
                        activityName,
                        studentId,
                        studentName,
                        studentEmail,
                        studentGroup,
                        emergencyContact,
                        additionalInfo
                    } = req.body;

                    const inscriptionsData = await readInscriptions();
                    const activitiesData = await readActivities();

                    const activity = findActivityByName(activitiesData, activityName);
                    if (!activity) {
                        return res.status(404).json({
                            success: false,
                            message: 'Actividad no encontrada'
                        });
                    }

                    if (activity.status !== 'open') {
                        return res.status(400).json({
                            success: false,
                            message: 'Las inscripciones para esta actividad están cerradas'
                        });
                    }

                    const currentInscriptions = inscriptionsData.inscriptions.filter(
                        ins => ins.activityId === activity.id && ins.status !== 'cancelled'
                    );

                    if (currentInscriptions.length >= activity.maxCapacity) {
                        return res.status(400).json({
                            success: false,
                            message: 'Lo sentimos, no hay cupos disponibles para esta actividad',
                            capacity: {
                                total: activity.maxCapacity,
                                occupied: currentInscriptions.length,
                                available: 0
                            }
                        });
                    }

                    const alreadyRegistered = currentInscriptions.find(
                        ins => ins.studentId === studentId
                    );

                    if (alreadyRegistered) {
                        return res.status(400).json({
                            success: false,
                            message: 'Ya estás inscrito en esta actividad',
                            inscriptionId: alreadyRegistered.inscriptionId
                        });
                    }

                    const inscriptionId = generateInscriptionId(inscriptionsData.lastId);
                    const now = new Date().toISOString();

                    const newInscription = {
                        inscriptionId,
                        activityId: activity.id,
                        activityName: activity.fullName,
                        student: {
                            id: studentId,
                            name: studentName,
                            email: studentEmail,
                            group: studentGroup
                        },
                        emergencyContact,
                        additionalInfo: additionalInfo || '',
                        status: 'pending',
                        registeredAt: now,
                        approvedAt: null,
                        approvedBy: null,
                        rejectedAt: null,
                        rejectedBy: null,
                        rejectionReason: null,
                        ipAddress: req.headers['x-forwarded-for'] || 'unknown'
                    };

                    inscriptionsData.inscriptions.push(newInscription);
                    inscriptionsData.lastId++;
                    await saveInscriptions(inscriptionsData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    // 📧 Enviar email de solicitud pendiente al estudiante
                    try {
                        const verificationService = await import('../server/services/verificationService.js');
                        await verificationService.default.transporter.sendMail({
                            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                            to: studentEmail,
                            subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                            html: `...` // HTML omitido por brevedad
                        });
                        console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
                    } catch (emailError) {
                        console.error('❌ Error enviando email de confirmación:', emailError);
                    }

                    // 📧 Enviar notificación a la institución
                    try {
                        const verificationService = await import('../server/services/verificationService.js');
                        await verificationService.default.transporter.sendMail({
                            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                            to: process.env.EMAIL_TO || '21ebh0200x.sep@gmail.com',
                            subject: `⏳ Nueva Solicitud de Inscripción PENDIENTE - ${activity.fullName}`,
                            html: `...` // HTML omitido por brevedad
                        });
                        console.log(`✅ Notificación enviada a institución`);
                    } catch (emailError) {
                        console.error('❌ Error enviando notificación a institución:', emailError);
                    }

                    return res.status(201).json({
                        success: true,
                        message: '⏳ Solicitud enviada exitosamente. Recibirás un correo cuando sea aprobada por el administrador.',
                        inscription: {
                            inscriptionId,
                            activityName: activity.fullName,
                            studentName,
                            registeredAt: now,
                            status: 'pending'
                        },
                        capacity: {
                            total: activity.maxCapacity,
                            occupied: currentInscriptions.length + 1,
                            available: activity.maxCapacity - currentInscriptions.length - 1
                        }
                    });
                }
                break;

            case '/verify': // Vercel no soporta :token directamente en el path del archivo
            case '/verify/' + params.token: // Adaptación para Vercel
                if (req.method === 'GET') {
                    const token = params.token || url.pathname.split('/').pop();

                    if (!token) {
                        return res.status(400).send(`...`); // HTML omitido
                    }

                    const verificationService = await import('../server/services/verificationService.js');
                    const verification = verificationService.default.verifyToken(token);

                    if (!verification.success) {
                        return res.status(400).send(`...`); // HTML omitido
                    }

                    const { form_type, ...formData } = verification.data;

                    // Enviar email final a la escuela (usando sendContactEmail adaptado)
                    // ⚠️ ADVERTENCIA: sendContactEmail usa contactMessages global, no persistente.
                    // Esto debería ser refactorizado para usar la base de datos.
                    const result = await sendContactEmail({
                        nombre: formData.name || formData.nombre,
                        email: formData.email,
                        telefono: formData.phone || formData.telefono || '',
                        asunto: formData.subject || formData.asunto,
                        mensaje: formData.message || formData.mensaje,
                        form_type
                    });

                    if (result.success) {
                        console.log(`✅ [VERIFIED] Mensaje enviado a la escuela desde: ${formData.email}`);
                        return res.status(200).send(`...`); // HTML omitido
                    } else {
                        throw new Error('Error al enviar mensaje verificado');
                    }
                }
                break;

            case '/list':
                if (req.method === 'GET') {
                    // ⚠️ ADVERTENCIA: contactMessages no persistirá en Serverless
                    // Esto debería ser reemplazado por una consulta a base de datos.
                    const limit = parseInt(params.limit) || 50;
                    const page = parseInt(params.page) || 1;
                    const skip = (page - 1) * limit;

                    const inscriptionsData = await readInscriptions();
                    let inscriptions = inscriptionsData.inscriptions;

                    if (params.activityId) {
                        inscriptions = inscriptions.filter(ins => ins.activityId === params.activityId);
                    }
                    if (params.status) {
                        inscriptions = inscriptions.filter(ins => ins.status === params.status);
                    }

                    return res.status(200).json({
                        success: true,
                        data: inscriptions,
                        total: inscriptionsData.inscriptions.length,
                        page,
                        totalPages: Math.ceil(inscriptionsData.inscriptions.length / limit)
                    });
                }
                break;

            case '/activities':
                if (req.method === 'GET') {
                    const activitiesData = await readActivities();
                    const inscriptionsData = await readInscriptions();

                    const activitiesWithStats = activitiesData.activities.map(activity => {
                        const activityInscriptions = inscriptionsData.inscriptions.filter(
                            ins => ins.activityId === activity.id && ins.status !== 'cancelled'
                        );

                        return {
                            ...activity,
                            statistics: {
                                total: activity.maxCapacity,
                                occupied: activityInscriptions.length,
                                available: activity.maxCapacity - activityInscriptions.length,
                                percentage: Math.round((activityInscriptions.length / activity.maxCapacity) * 100)
                            }
                        };
                    });

                    return res.status(200).json({
                        success: true,
                        activities: activitiesWithStats
                    });
                }
                break;

            case '/check':
                if (req.method === 'GET') {
                    const { studentId, activityId } = params;

                    const inscriptionsData = await readInscriptions();

                    const inscription = inscriptionsData.inscriptions.find(
                        ins => ins.studentId === studentId &&
                               ins.activityId === activityId &&
                               ins.status !== 'cancelled'
                    );

                    return res.status(200).json({
                        success: true,
                        isRegistered: !!inscription,
                        inscription: inscription || null
                    });
                }
                break;

            case '/approve':
                if (req.method === 'POST') {
                    const { inscriptionId } = params;
                    const { adminName } = req.body; // adminEmail no se usa directamente aquí

                    const inscriptionsData = await readInscriptions();
                    const inscription = inscriptionsData.inscriptions.find(
                        ins => ins.inscriptionId === inscriptionId
                    );

                    if (!inscription) {
                        return res.status(404).json({
                            success: false,
                            message: 'Solicitud no encontrada'
                        });
                    }

                    if (inscription.status !== 'pending') {
                        return res.status(400).json({
                            success: false,
                            message: `Esta solicitud ya fue ${inscription.status === 'approved' ? 'aprobada' : 'rechazada'}`
                        });
                    }

                    inscription.status = 'approved';
                    inscription.approvedAt = new Date().toISOString();
                    inscription.approvedBy = adminName || 'Administrador';

                    await saveInscriptions(inscriptionsData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    // Enviar email de aprobación al estudiante
                    try {
                        const verificationService = await import('../server/services/verificationService.js');
                        await verificationService.default.transporter.sendMail({
                            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                            to: inscription.student.email,
                            subject: `✅ Inscripción Aprobada - ${inscription.activityName}`,
                            html: `...` // HTML omitido
                        });
                        console.log(`✅ Solicitud ${inscriptionId} aprobada por ${inscription.approvedBy}`);
                    } catch (emailError) {
                        console.error('❌ Error enviando email de aprobación:', emailError);
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Solicitud aprobada exitosamente',
                        inscription
                    });
                }
                break;

            case '/reject':
                if (req.method === 'POST') {
                    const { inscriptionId } = params;
                    const { adminName, reason } = req.body;

                    const inscriptionsData = await readInscriptions();
                    const inscription = inscriptionsData.inscriptions.find(
                        ins => ins.inscriptionId === inscriptionId
                    );

                    if (!inscription) {
                        return res.status(404).json({
                            success: false,
                            message: 'Solicitud no encontrada'
                        });
                    }

                    if (inscription.status !== 'pending') {
                        return res.status(400).json({
                            success: false,
                            message: `Esta solicitud ya fue ${inscription.status === 'approved' ? 'aprobada' : 'rechazada'}`
                        });
                    }

                    inscription.status = 'rejected';
                    inscription.rejectedAt = new Date().toISOString();
                    inscription.rejectedBy = adminName || 'Administrador';
                    inscription.rejectionReason = reason || 'No especificada';

                    await saveInscriptions(inscriptionsData); // ⚠️ NO PERSISTENTE EN SERVERLESS

                    // Enviar email de rechazo al estudiante
                    try {
                        const verificationService = await import('../server/services/verificationService.js');
                        await verificationService.default.transporter.sendMail({
                            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                            to: inscription.student.email,
                            subject: `❌ Solicitud No Aprobada - ${inscription.activityName}`,
                            html: `...` // HTML omitido
                        });
                        console.log(`❌ Solicitud ${inscriptionId} rechazada por ${inscription.rejectedBy}`);
                    } catch (emailError) {
                        console.error('❌ Error enviando email de rechazo:', emailError);
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Solicitud rechazada exitosamente',
                        inscription
                    });
                }
                break;

            default:
                res.status(404).json({ error: 'Endpoint no encontrado', path: url.pathname });
                break;
        }
    } catch (error) {
        console.error('❌ Error en la función inscriptions:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
}