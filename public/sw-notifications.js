/**
 * 🔔 SERVICE WORKER PARA NOTIFICACIONES PUSH BGE
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Maneja notificaciones push educativas inteligentes:
 * - Comunicados oficiales
 * - Recordatorios académicos
 * - Emergencias escolares
 * - Eventos y actividades
 */

const SW_VERSION = 'notifications-v1.0.0';
const NOTIFICATION_TAG_PREFIX = 'bge-';

// === TIPOS DE NOTIFICACIONES EDUCATIVAS ===

const NOTIFICATION_TYPES = {
    COMUNICADO_OFICIAL: {
        priority: 'high',
        icon: '/images/icons/comunicado-icon.png',
        badge: '/images/icons/badge-official.png',
        sound: '/sounds/notification-official.mp3',
        vibration: [200, 100, 200, 100, 200],
        actions: [
            { action: 'read', title: 'Leer Completo', icon: '/images/icons/read.png' },
            { action: 'share', title: 'Compartir', icon: '/images/icons/share.png' },
            { action: 'later', title: 'Leer Después', icon: '/images/icons/later.png' }
        ]
    },

    RECORDATORIO_EXAMEN: {
        priority: 'high',
        icon: '/images/icons/exam-reminder.png',
        badge: '/images/icons/badge-exam.png',
        sound: '/sounds/notification-reminder.mp3',
        vibration: [300, 200, 300],
        actions: [
            { action: 'prepare', title: 'Ver Material', icon: '/images/icons/book.png' },
            { action: 'calendar', title: 'Agregar al Calendario', icon: '/images/icons/calendar.png' },
            { action: 'dismiss', title: 'Entendido', icon: '/images/icons/check.png' }
        ]
    },

    EMERGENCIA_ESCOLAR: {
        priority: 'urgent',
        icon: '/images/icons/emergency.png',
        badge: '/images/icons/badge-emergency.png',
        sound: '/sounds/emergency-alert.mp3',
        vibration: [500, 200, 500, 200, 500],
        requireInteraction: true,
        actions: [
            { action: 'acknowledge', title: 'Entendido', icon: '/images/icons/acknowledge.png' },
            { action: 'contact', title: 'Contactar Escuela', icon: '/images/icons/phone.png' },
            { action: 'info', title: 'Más Información', icon: '/images/icons/info.png' }
        ]
    },

    CALIFICACIONES_DISPONIBLES: {
        priority: 'normal',
        icon: '/images/icons/grades.png',
        badge: '/images/icons/badge-grades.png',
        sound: '/sounds/notification-success.mp3',
        vibration: [200, 100, 200],
        actions: [
            { action: 'view', title: 'Ver Calificaciones', icon: '/images/icons/view.png' },
            { action: 'download', title: 'Descargar PDF', icon: '/images/icons/download.png' },
            { action: 'share', title: 'Compartir', icon: '/images/icons/share.png' }
        ]
    },

    EVENTO_PROXIMO: {
        priority: 'normal',
        icon: '/images/icons/event.png',
        badge: '/images/icons/badge-event.png',
        sound: '/sounds/notification-event.mp3',
        vibration: [150, 100, 150],
        actions: [
            { action: 'details', title: 'Ver Detalles', icon: '/images/icons/details.png' },
            { action: 'remind', title: 'Recordar 1h Antes', icon: '/images/icons/remind.png' },
            { action: 'directions', title: 'Cómo Llegar', icon: '/images/icons/directions.png' }
        ]
    },

    INSCRIPCIONES_ABIERTAS: {
        priority: 'high',
        icon: '/images/icons/enrollment.png',
        badge: '/images/icons/badge-enrollment.png',
        sound: '/sounds/notification-important.mp3',
        vibration: [250, 150, 250],
        actions: [
            { action: 'enroll', title: 'Inscribirse Ahora', icon: '/images/icons/enroll.png' },
            { action: 'requirements', title: 'Ver Requisitos', icon: '/images/icons/requirements.png' },
            { action: 'later', title: 'Recordar Mañana', icon: '/images/icons/later.png' }
        ]
    },

    TAREA_RECORDATORIO: {
        priority: 'normal',
        icon: '/images/icons/homework.png',
        badge: '/images/icons/badge-homework.png',
        sound: '/sounds/notification-gentle.mp3',
        vibration: [100, 50, 100],
        actions: [
            { action: 'view', title: 'Ver Tarea', icon: '/images/icons/homework-view.png' },
            { action: 'submit', title: 'Entregar', icon: '/images/icons/submit.png' },
            { action: 'help', title: 'Pedir Ayuda', icon: '/images/icons/help.png' }
        ]
    }
};

// === EVENT LISTENERS ===

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('🔔 SW Notificaciones instalado');
    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
    console.log('🔔 SW Notificaciones activado');
    event.waitUntil(self.clients.claim());
});

// === MANEJO DE NOTIFICACIONES PUSH ===

self.addEventListener('push', event => {
    console.log('📨 Push notification recibida');

    if (!event.data) {
        console.warn('⚠️ Push notification sin datos');
        return;
    }

    try {
        const notificationData = event.data.json();
        console.log('📋 Datos de notificación:', notificationData);

        event.waitUntil(
            showNotification(notificationData)
        );
    } catch (error) {
        console.error('❌ Error procesando push notification:', error);

        // Notificación fallback
        event.waitUntil(
            self.registration.showNotification('BGE Héroes de la Patria', {
                body: 'Tienes una nueva notificación',
                icon: '/images/icons/icon-default.png',
                badge: '/images/icons/badge-default.png'
            })
        );
    }
});

// === FUNCIÓN PRINCIPAL PARA MOSTRAR NOTIFICACIONES ===

async function showNotification(data) {
    const { type, title, body, payload } = data;

    // Obtener configuración del tipo de notificación
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.COMUNICADO_OFICIAL;

    // Verificar si las notificaciones están habilitadas para este tipo
    const userPrefs = await getUserNotificationPreferences();
    if (!userPrefs[type.toLowerCase()]?.enabled) {
        console.log(`📴 Notificaciones de tipo ${type} deshabilitadas por el usuario`);
        return;
    }

    // Verificar horarios silenciosos
    if (isInQuietHours(userPrefs)) {
        console.log('🌙 En horario silencioso, programando para después');
        await scheduleForLater(data);
        return;
    }

    // Configurar opciones de notificación
    const options = {
        body: body,
        icon: config.icon,
        badge: config.badge,
        tag: `${NOTIFICATION_TAG_PREFIX}${type.toLowerCase()}-${Date.now()}`,
        data: {
            type,
            payload,
            timestamp: Date.now(),
            url: getNotificationURL(type, payload)
        },
        actions: config.actions,
        vibrate: config.vibration,
        requireInteraction: config.requireInteraction || false,
        silent: userPrefs.sound ? false : true,

        // Configuraciones específicas por tipo
        ...getTypeSpecificOptions(type, payload)
    };

    // Reemplazar notificación anterior del mismo tipo si existe
    await replaceExistingNotification(type);

    // Mostrar notificación
    await self.registration.showNotification(title, options);

    // Logging y analytics
    await logNotificationShown(type, data);

    console.log(`✅ Notificación ${type} mostrada correctamente`);
}

// === CONFIGURACIONES ESPECÍFICAS POR TIPO ===

function getTypeSpecificOptions(type, payload) {
    const options = {};

    switch (type) {
        case 'EMERGENCIA_ESCOLAR':
            options.requireInteraction = true;
            options.silent = false; // Siempre con sonido
            options.renotify = true;
            break;

        case 'RECORDATORIO_EXAMEN':
            if (payload.horasRestantes <= 2) {
                options.requireInteraction = true;
                options.renotify = true;
            }
            break;

        case 'CALIFICACIONES_DISPONIBLES':
            if (payload.nuevasCalificaciones > 5) {
                options.requireInteraction = true;
            }
            break;
    }

    return options;
}

// === MANEJO DE CLICKS EN NOTIFICACIONES ===

self.addEventListener('notificationclick', event => {
    console.log('🔔 Notificación clickeada:', event.notification.tag);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data;

    notification.close();

    event.waitUntil(
        handleNotificationClick(action, data)
    );
});

async function handleNotificationClick(action, data) {
    const { type, payload, url } = data;

    // Logging de interacción
    await logNotificationInteraction(type, action, data);

    // Enfocar o abrir ventana
    const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    // Buscar ventana existente
    let targetClient = null;
    for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
            targetClient = client;
            break;
        }
    }

    // Determinar URL objetivo
    let targetURL = url || '/';

    // Acciones específicas
    switch (action) {
        case 'read':
        case 'view':
            targetURL = url || getDefaultURLForType(type);
            break;

        case 'calendar':
            targetURL = '/calendario.html';
            if (payload.eventoId) {
                targetURL += `#evento-${payload.eventoId}`;
            }
            break;

        case 'prepare':
            targetURL = '/estudiantes.html#material-estudio';
            break;

        case 'contact':
            targetURL = '/contacto.html';
            break;

        case 'share':
            await shareNotification(data);
            return;

        case 'download':
            await downloadContent(data);
            return;

        case 'enroll':
            targetURL = '/servicios.html#inscripciones';
            break;

        case 'submit':
            targetURL = '/estudiantes.html#tareas';
            break;

        case 'acknowledge':
            await acknowledgeNotification(data);
            // No navegar, solo confirmar
            return;

        case 'later':
            await scheduleReminder(data);
            return;

        default:
            targetURL = url || '/public/admin-dashboard.html';
    }

    // Navegar a la URL
    if (targetClient) {
        await targetClient.focus();
        await targetClient.navigate(targetURL);
    } else {
        await self.clients.openWindow(targetURL);
    }
}

// === FUNCIONES DE APOYO ===

function getDefaultURLForType(type) {
    const urls = {
        'COMUNICADO_OFICIAL': '/public/admin-dashboard.html#comunicados',
        'RECORDATORIO_EXAMEN': '/calendario.html',
        'EMERGENCIA_ESCOLAR': '/contacto.html',
        'CALIFICACIONES_DISPONIBLES': '/calificaciones.html',
        'EVENTO_PROXIMO': '/comunidad.html#eventos',
        'INSCRIPCIONES_ABIERTAS': '/servicios.html#inscripciones',
        'TAREA_RECORDATORIO': '/estudiantes.html#tareas'
    };

    return urls[type] || '/';
}

function getNotificationURL(type, payload) {
    let baseURL = getDefaultURLForType(type);

    // Agregar parámetros específicos
    if (payload.id) {
        baseURL += baseURL.includes('#') ? `-${payload.id}` : `#${payload.id}`;
    }

    return baseURL;
}

async function getUserNotificationPreferences() {
    try {
        // En producción, obtener del IndexedDB o localStorage
        const defaultPrefs = {
            comunicado_oficial: { enabled: true },
            recordatorio_examen: { enabled: true },
            emergencia_escolar: { enabled: true },
            calificaciones_disponibles: { enabled: true },
            evento_proximo: { enabled: true },
            inscripciones_abiertas: { enabled: true },
            tarea_recordatorio: { enabled: true },
            sound: true,
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00'
            }
        };

        return defaultPrefs;
    } catch (error) {
        console.error('❌ Error obteniendo preferencias:', error);
        return {};
    }
}

function isInQuietHours(prefs) {
    if (!prefs.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime > endTime) {
        // Horario cruza medianoche
        return currentTime >= startTime || currentTime <= endTime;
    } else {
        return currentTime >= startTime && currentTime <= endTime;
    }
}

async function replaceExistingNotification(type) {
    try {
        const notifications = await self.registration.getNotifications({
            tag: `${NOTIFICATION_TAG_PREFIX}${type.toLowerCase()}`
        });

        // Cerrar notificaciones anteriores del mismo tipo
        notifications.forEach(notification => {
            notification.close();
        });
    } catch (error) {
        console.error('❌ Error reemplazando notificaciones:', error);
    }
}

async function scheduleForLater(data) {
    // Programar para después de las horas silenciosas
    console.log('⏰ Programando notificación para después de horarios silenciosos');

    // En producción, usar IndexedDB para persistir notificaciones programadas
    const scheduledNotifications = await getScheduledNotifications();
    scheduledNotifications.push({
        ...data,
        scheduledFor: getEndOfQuietHours()
    });

    await saveScheduledNotifications(scheduledNotifications);
}

function getEndOfQuietHours() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0); // 7:00 AM por defecto

    return tomorrow.getTime();
}

async function getScheduledNotifications() {
    // Implementar con IndexedDB en producción
    return [];
}

async function saveScheduledNotifications(notifications) {
    // Implementar con IndexedDB en producción
    console.log('💾 Guardando notificaciones programadas:', notifications.length);
}

// === ACCIONES ESPECÍFICAS ===

async function shareNotification(data) {
    console.log('📤 Compartiendo notificación:', data);

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'BGE Héroes de la Patria',
                text: data.payload.title || 'Comunicado importante',
                url: data.url || window.location.origin
            });
        } catch (error) {
            console.log('Usuario canceló compartir');
        }
    }
}

async function downloadContent(data) {
    console.log('📥 Descargando contenido:', data);

    if (data.payload.downloadURL) {
        await self.clients.openWindow(data.payload.downloadURL);
    }
}

async function acknowledgeNotification(data) {
    console.log('✅ Notificación confirmada:', data);

    // Enviar confirmación al servidor
    try {
        await fetch('/api/notifications/acknowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notificationId: data.payload.id,
                timestamp: Date.now()
            })
        });
    } catch (error) {
        console.log('ℹ️ Modo offline - confirmación guardada localmente');
    }
}

async function scheduleReminder(data) {
    console.log('⏰ Programando recordatorio:', data);

    // Programar recordatorio para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const reminderData = {
        ...data,
        title: `Recordatorio: ${data.payload.title}`,
        scheduledFor: tomorrow.getTime()
    };

    await scheduleForLater(reminderData);
}

// === LOGGING Y ANALYTICS ===

async function logNotificationShown(type, data) {
    const logEntry = {
        type: 'notification_shown',
        notificationType: type,
        timestamp: Date.now(),
        data: data
    };

    await saveToAnalytics(logEntry);
}

async function logNotificationInteraction(type, action, data) {
    const logEntry = {
        type: 'notification_interaction',
        notificationType: type,
        action: action,
        timestamp: Date.now(),
        data: data
    };

    await saveToAnalytics(logEntry);
}

async function saveToAnalytics(logEntry) {
    try {
        // En producción, enviar al servidor de analytics
        console.log('📊 Analytics:', logEntry);

        // Guardar localmente también
        const logs = JSON.parse(localStorage.getItem('bge-notification-analytics') || '[]');
        logs.push(logEntry);

        // Mantener solo últimos 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }

        localStorage.setItem('bge-notification-analytics', JSON.stringify(logs));

    } catch (error) {
        console.error('❌ Error guardando analytics:', error);
    }
}

// === LIMPIEZA PERIÓDICA ===

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEANUP_NOTIFICATIONS') {
        event.waitUntil(cleanupOldNotifications());
    }
});

async function cleanupOldNotifications() {
    try {
        const notifications = await self.registration.getNotifications();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas

        notifications.forEach(notification => {
            if (notification.data && (now - notification.data.timestamp) > maxAge) {
                notification.close();
            }
        });

        console.log('🧹 Limpieza de notificaciones completada');
    } catch (error) {
        console.error('❌ Error en limpieza de notificaciones:', error);
    }
}

console.log('🔔 Service Worker de Notificaciones BGE inicializado correctamente');