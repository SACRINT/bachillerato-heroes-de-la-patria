/**
 * 📝 RUTAS DE INSCRIPCIONES A ACTIVIDADES ESTUDIANTILES
 * Sistema completo de gestión de inscripciones con validación de cupos
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const verificationService = require('../../server/services/verificationService');

// 📁 Rutas de archivos
const INSCRIPTIONS_FILE = path.join(__dirname, '../data/inscriptions.json');
const ACTIVITIES_FILE = path.join(__dirname, '../data/activities.json');

// 🔧 Asegurar que existan los directorios
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// 📖 Leer inscripciones
async function readInscriptions() {
    try {
        const data = await fs.readFile(INSCRIPTIONS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe, crear archivo vacío
        const emptyData = { inscriptions: [], lastId: 0 };
        await fs.writeFile(INSCRIPTIONS_FILE, JSON.stringify(emptyData, null, 2));
        return emptyData;
    }
}

// 💾 Guardar inscripciones
async function saveInscriptions(data) {
    await fs.writeFile(INSCRIPTIONS_FILE, JSON.stringify(data, null, 2));
}

// 📖 Leer actividades
async function readActivities() {
    try {
        const data = await fs.readFile(ACTIVITIES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Actividades por defecto
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
        await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(defaultActivities, null, 2));
        return defaultActivities;
    }
}

// 💾 Guardar actividades
async function saveActivities(data) {
    await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(data, null, 2));
}

// 🔍 Buscar actividad por nombre
function findActivityByName(activities, activityName) {
    return activities.activities.find(act =>
        act.name === activityName ||
        act.fullName === activityName ||
        act.id === activityName.toLowerCase().replace(/\s+/g, '-')
    );
}

// 🎯 Generar ID único de inscripción
function generateInscriptionId(lastId) {
    const newId = lastId + 1;
    const year = new Date().getFullYear();
    return `INS-${year}-${String(newId).padStart(4, '0')}`;
}

/**
 * 📝 POST /api/inscriptions/register
 * Registrar nueva inscripción a actividad
 */
router.post('/register', [
    body('activityName').trim().notEmpty().withMessage('El nombre de la actividad es requerido'),
    body('studentId').trim().notEmpty().withMessage('El ID del estudiante es requerido'),
    body('studentName').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre inválido'),
    body('studentEmail').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('studentGroup').trim().notEmpty().withMessage('El grupo es requerido'),
    body('emergencyContact').trim().notEmpty().withMessage('Contacto de emergencia requerido'),
    body('additionalInfo').optional().trim()
], async (req, res) => {
    try {
        // Validar datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        await ensureDataDirectory();

        const {
            activityName,
            studentId,
            studentName,
            studentEmail,
            studentGroup,
            emergencyContact,
            additionalInfo
        } = req.body;

        // Leer datos
        const inscriptionsData = await readInscriptions();
        const activitiesData = await readActivities();

        // Buscar actividad
        const activity = findActivityByName(activitiesData, activityName);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Actividad no encontrada'
            });
        }

        // Verificar si la actividad está abierta
        if (activity.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'Las inscripciones para esta actividad están cerradas'
            });
        }

        // Contar inscripciones actuales para esta actividad
        const currentInscriptions = inscriptionsData.inscriptions.filter(
            ins => ins.activityId === activity.id && ins.status !== 'cancelled'
        );

        // Verificar cupos disponibles
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

        // Verificar si el estudiante ya está inscrito
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

        // Crear inscripción
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
            status: 'pending', // ⚠️ CAMBIADO: Ahora requiere aprobación del administrador
            registeredAt: now,
            approvedAt: null,
            approvedBy: null,
            rejectedAt: null,
            rejectedBy: null,
            rejectionReason: null,
            ipAddress: req.ip || 'unknown'
        };

        // Guardar inscripción
        inscriptionsData.inscriptions.push(newInscription);
        inscriptionsData.lastId++;
        await saveInscriptions(inscriptionsData);

        // 📧 Enviar email de solicitud pendiente al estudiante
        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">⏳ Solicitud Recibida</h1>
                    </div>

                    <div style="padding: 30px; background: #f9f9f9;">
                        <p style="font-size: 16px; color: #333;">Hola <strong>${studentName}</strong>,</p>

                        <p style="font-size: 16px; color: #333;">
                            Tu solicitud de inscripción a "<strong>${activity.fullName}</strong>" ha sido recibida exitosamente.
                        </p>

                        <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
                            <p style="margin: 0; color: #E65100;">
                                <strong>⏳ Estado:</strong> Tu solicitud está <strong>pendiente de revisión</strong> por parte del administrador.
                                <br><br>
                                Recibirás un correo de confirmación cuando tu solicitud sea aprobada.
                            </p>
                        </div>

                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976D2;">
                            <h3 style="margin-top: 0; color: #1976D2;">📋 Detalles de tu Inscripción</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Evento:</strong> ${activity.fullName}
                                </li>
                                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Fecha:</strong> ${new Date(activity.date).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </li>
                                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Estudiante:</strong> ${studentName}
                                </li>
                                <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Grupo:</strong> ${studentGroup}
                                </li>
                                <li style="padding: 8px 0;">
                                    <strong>Folio:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${inscriptionId}</code>
                                </li>
                            </ul>
                        </div>

                        <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #1565C0;">
                                <strong>🔔 Importante:</strong> Guarda este correo como comprobante.
                                Te notificaremos por email cuando tu solicitud sea revisada.
                            </p>
                        </div>

                        <p style="font-size: 14px; color: #666; margin-top: 30px;">
                            Gracias por tu interés.<br>
                            <strong>Bachillerato General Estatal "Héroes de la Patria"</strong>
                        </p>
                    </div>

                    <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">Coronel Tito Hernández, Puebla</p>
                        <p style="margin: 5px 0;">📧 contacto.heroesdelapatria.sep@gmail.com</p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: studentEmail,
                subject: `⏳ Solicitud Recibida - ${activity.fullName}`,
                html: emailHtml
            });

            console.log(`✅ Email de confirmación enviado a: ${studentEmail}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de confirmación:', emailError);
            // No fallar la inscripción si el email falla
        }

        // 📧 Enviar notificación a la institución
        try {
            const notificationHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2E7D32; color: white; padding: 20px;">
                        <h2 style="margin: 0;">📝 Nueva Inscripción Registrada</h2>
                    </div>

                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3 style="color: #2E7D32;">Actividad: ${activity.fullName}</h3>

                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Estudiante:</td>
                                <td style="padding: 10px;">${studentName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Grupo:</td>
                                <td style="padding: 10px;">${studentGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;">${studentEmail}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Contacto emergencia:</td>
                                <td style="padding: 10px;">${emergencyContact}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscriptionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha inscripción:</td>
                                <td style="padding: 10px;">${new Date(now).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>

                        ${additionalInfo ? `
                            <div style="background: white; padding: 15px; margin-top: 15px; border-left: 3px solid #FF9800;">
                                <strong>Información adicional:</strong><br>
                                ${additionalInfo}
                            </div>
                        ` : ''}

                        <div style="background: #FFF3E0; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #FF9800;">
                            <h4 style="margin: 0 0 10px 0; color: #E65100;">⏳ ACCIÓN REQUERIDA</h4>
                            <p style="margin: 0; color: #E65100;">
                                <strong>Esta solicitud está pendiente de aprobación.</strong><br>
                                Debes revisar la solicitud y aprobarla o rechazarla desde el panel administrativo.
                            </p>
                        </div>

                        <div style="background: #E8F5E9; padding: 15px; margin-top: 20px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #2E7D32;">📊 Estadísticas de la Actividad</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li>🎯 <strong>Cupos totales:</strong> ${activity.maxCapacity}</li>
                                <li>⏳ <strong>Solicitudes (incluyendo esta):</strong> ${currentInscriptions.length + 1}</li>
                                <li>📌 <strong>Disponibles:</strong> ${activity.maxCapacity - currentInscriptions.length - 1}</li>
                            </ul>
                        </div>

                        <p style="margin-top: 20px; text-align: center;">
                            <a href="http://localhost:3000/admin-inscriptions.html?activity=${activity.id}"
                               style="display: inline-block; background: #FF9800; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                                ⚡ Ir al Panel de Aprobación
                            </a>
                        </p>
                    </div>
                </div>
            `;

            await verificationService.transporter.sendMail({
                from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO || '21ebh0200x.sep@gmail.com',
                subject: `⏳ Nueva Solicitud de Inscripción PENDIENTE - ${activity.fullName}`,
                html: notificationHtml
            });

            console.log(`✅ Notificación enviada a institución`);
        } catch (emailError) {
            console.error('❌ Error enviando notificación a institución:', emailError);
        }

        // Respuesta exitosa
        res.status(201).json({
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

    } catch (error) {
        console.error('❌ Error en registro de inscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la inscripción. Por favor intenta nuevamente.'
        });
    }
});

/**
 * 📋 GET /api/inscriptions/list
 * Listar inscripciones (requiere autenticación admin)
 */
router.get('/list', async (req, res) => {
    try {
        const { activityId, status } = req.query;

        const inscriptionsData = await readInscriptions();
        let inscriptions = inscriptionsData.inscriptions;

        // Filtrar por actividad si se especifica
        if (activityId) {
            inscriptions = inscriptions.filter(ins => ins.activityId === activityId);
        }

        // Filtrar por estado si se especifica
        if (status) {
            inscriptions = inscriptions.filter(ins => ins.status === status);
        }

        res.json({
            success: true,
            total: inscriptions.length,
            inscriptions: inscriptions.sort((a, b) =>
                new Date(b.registeredAt) - new Date(a.registeredAt)
            )
        });

    } catch (error) {
        console.error('❌ Error listando inscripciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inscripciones'
        });
    }
});

/**
 * 📊 GET /api/inscriptions/activities
 * Listar actividades con estadísticas
 */
router.get('/activities', async (req, res) => {
    try {
        const activitiesData = await readActivities();
        const inscriptionsData = await readInscriptions();

        // Agregar estadísticas a cada actividad
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

        res.json({
            success: true,
            activities: activitiesWithStats
        });

    } catch (error) {
        console.error('❌ Error obteniendo actividades:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener actividades'
        });
    }
});

/**
 * 🔍 GET /api/inscriptions/check/:studentId/:activityId
 * Verificar si un estudiante ya está inscrito
 */
router.get('/check/:studentId/:activityId', async (req, res) => {
    try {
        const { studentId, activityId } = req.params;

        const inscriptionsData = await readInscriptions();

        const inscription = inscriptionsData.inscriptions.find(
            ins => ins.studentId === studentId &&
                   ins.activityId === activityId &&
                   ins.status !== 'cancelled'
        );

        res.json({
            success: true,
            isRegistered: !!inscription,
            inscription: inscription || null
        });

    } catch (error) {
        console.error('❌ Error verificando inscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar inscripción'
        });
    }
});

/**
 * ✅ POST /api/inscriptions/approve/:inscriptionId
 * Aprobar solicitud de inscripción (solo admin)
 */
router.post('/approve/:inscriptionId', async (req, res) => {
    try {
        const { inscriptionId } = req.params;
        const { adminName, adminEmail } = req.body;

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

        // Actualizar estado a aprobado
        inscription.status = 'approved';
        inscription.approvedAt = new Date().toISOString();
        inscription.approvedBy = adminName || 'Administrador';

        await saveInscriptions(inscriptionsData);

        // Enviar email de aprobación al estudiante
        const approvalEmailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">✅ Inscripción Aprobada</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Hola <strong>${inscription.student.name}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">
                        ¡Excelentes noticias! Tu solicitud de inscripción a "<strong>${inscription.activityName}</strong>" ha sido <strong>aprobada</strong>.
                    </p>

                    <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                        <p style="margin: 0; color: #2E7D32;">
                            <strong>✅ Estado:</strong> Inscripción confirmada
                            <br><br>
                            Ya estás oficialmente inscrito en esta actividad.
                        </p>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="color: #4CAF50; margin-top: 0;">📋 Detalles de tu Inscripción</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscription.inscriptionId}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Actividad:</td>
                                <td style="padding: 10px;">${inscription.activityName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Aprobado por:</td>
                                <td style="padding: 10px;">${inscription.approvedBy}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha aprobación:</td>
                                <td style="padding: 10px;">${new Date(inscription.approvedAt).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #1565C0;">
                            <strong>🔔 Importante:</strong> Guarda este correo como comprobante de tu inscripción aprobada.
                            Recibirás más información sobre el evento próximamente.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
                        <p style="color: #666; font-size: 14px; margin: 5px 0;">
                            BGE Héroes de la Patria
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 5px 0;">
                            Sistema de Inscripciones Extracurriculares
                        </p>
                    </div>
                </div>
            </div>
        `;

        await verificationService.transporter.sendMail({
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: inscription.student.email,
            subject: `✅ Inscripción Aprobada - ${inscription.activityName}`,
            html: approvalEmailHtml
        });

        console.log(`✅ Solicitud ${inscriptionId} aprobada por ${inscription.approvedBy}`);

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            inscription
        });

    } catch (error) {
        console.error('❌ Error aprobando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aprobar la solicitud'
        });
    }
});

/**
 * ❌ POST /api/inscriptions/reject/:inscriptionId
 * Rechazar solicitud de inscripción (solo admin)
 */
router.post('/reject/:inscriptionId', [
    body('reason').optional().trim()
], async (req, res) => {
    try {
        const { inscriptionId } = req.params;
        const { adminName, adminEmail, reason } = req.body;

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

        // Actualizar estado a rechazado
        inscription.status = 'rejected';
        inscription.rejectedAt = new Date().toISOString();
        inscription.rejectedBy = adminName || 'Administrador';
        inscription.rejectionReason = reason || 'No especificada';

        await saveInscriptions(inscriptionsData);

        // Enviar email de rechazo al estudiante
        const rejectionEmailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
                <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">❌ Solicitud No Aprobada</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Hola <strong>${inscription.student.name}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">
                        Lamentamos informarte que tu solicitud de inscripción a "<strong>${inscription.activityName}</strong>" no pudo ser aprobada en este momento.
                    </p>

                    <div style="background: #FFEBEE; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <p style="margin: 0; color: #c62828;">
                            <strong>❌ Estado:</strong> Solicitud no aprobada
                        </p>
                    </div>

                    ${reason ? `
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="color: #f44336; margin-top: 0;">📝 Motivo</h3>
                            <p style="margin: 0; color: #333;">${reason}</p>
                        </div>
                    ` : ''}

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="color: #666; margin-top: 0;">📋 Detalles de la Solicitud</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Folio:</td>
                                <td style="padding: 10px;">${inscription.inscriptionId}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Actividad:</td>
                                <td style="padding: 10px;">${inscription.activityName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px; font-weight: bold;">Revisado por:</td>
                                <td style="padding: 10px;">${inscription.rejectedBy}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Fecha revisión:</td>
                                <td style="padding: 10px;">${new Date(inscription.rejectedAt).toLocaleString('es-MX')}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #1565C0;">
                            <strong>💡 Recuerda:</strong> Puedes intentar inscribirte en otras actividades disponibles.
                            Si tienes dudas, contacta a la administración.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
                        <p style="color: #666; font-size: 14px; margin: 5px 0;">
                            BGE Héroes de la Patria
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 5px 0;">
                            Sistema de Inscripciones Extracurriculares
                        </p>
                    </div>
                </div>
            </div>
        `;

        await verificationService.transporter.sendMail({
            from: `"BGE Héroes de la Patria" <${process.env.EMAIL_USER}>`,
            to: inscription.student.email,
            subject: `❌ Solicitud No Aprobada - ${inscription.activityName}`,
            html: rejectionEmailHtml
        });

        console.log(`❌ Solicitud ${inscriptionId} rechazada por ${inscription.rejectedBy}`);

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente',
            inscription
        });

    } catch (error) {
        console.error('❌ Error rechazando solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar la solicitud'
        });
    }
});

module.exports = router;
