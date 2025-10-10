/**
 * 📧 SERVICIO DE SUSCRIPCIONES
 * Funciones reutilizables para gestión de suscriptores
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Archivo de base de datos JSON - USAR BACKEND/DATA PARA CENTRALIZAR
const SUBSCRIBERS_FILE = path.join(__dirname, '../../backend/data/subscribers.json');

/**
 * 🔧 Inicializar archivo de suscriptores
 */
async function initializeSubscribersFile() {
    try {
        // Crear directorio data si no existe
        const dataDir = path.join(__dirname, '../data');
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }

        // Inicializar subscribers.json
        try {
            await fs.access(SUBSCRIBERS_FILE);
        } catch {
            const initialData = {
                subscribers: [],
                lastId: 0
            };
            await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(initialData, null, 2));
            console.log('✅ Archivo subscribers.json creado');
        }
    } catch (error) {
        console.error('❌ Error inicializando archivo subscribers:', error);
    }
}

// Inicializar al cargar el módulo
initializeSubscribersFile();

/**
 * 📖 Leer suscriptores
 */
async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo suscriptores:', error);
        return { subscribers: [], lastId: 0 };
    }
}

/**
 * 💾 Guardar suscriptores
 */
async function saveSubscribers(data) {
    try {
        await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando suscriptores:', error);
        return false;
    }
}

/**
 * 🆔 Generar ID único para suscriptor
 */
function generateSubscriberId(lastId) {
    const newId = lastId + 1;
    return `SUB-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;
}

/**
 * 🔑 Generar token de cancelación
 */
function generateUnsubscribeToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * ➕ Agregar nuevo suscriptor
 * @param {Object} data - Datos del suscriptor
 * @param {string} data.email - Email del suscriptor
 * @param {string} data.name - Nombre del suscriptor
 * @param {Array} data.categories - Categorías de interés
 * @param {string} data.source - Fuente de la suscripción
 * @returns {Promise<Object>} - Suscriptor creado o existente
 */
async function addSubscriber({ email, name, categories, source }) {
    try {
        const subscribersData = await readSubscribers();

        // Verificar si ya existe activo
        const activeSubscriber = subscribersData.subscribers.find(
            sub => sub.email === email && sub.active
        );

        if (activeSubscriber) {
            console.log(`ℹ️  Suscriptor ya existe y está activo: ${email}`);
            return {
                success: true,
                message: 'Ya estás suscrito',
                subscriber: activeSubscriber,
                existed: true
            };
        }

        // Verificar si existe pero está inactivo (se dio de baja)
        const inactiveSubscriber = subscribersData.subscribers.find(
            sub => sub.email === email && !sub.active
        );

        if (inactiveSubscriber) {
            // REACTIVAR suscripción existente en lugar de crear nueva
            inactiveSubscriber.active = true;
            inactiveSubscriber.resubscribedAt = new Date().toISOString();
            inactiveSubscriber.name = name || inactiveSubscriber.name;
            inactiveSubscriber.categories = categories || inactiveSubscriber.categories;
            inactiveSubscriber.source = source || inactiveSubscriber.source;

            // Eliminar fecha de baja
            delete inactiveSubscriber.unsubscribedAt;

            await saveSubscribers(subscribersData);

            console.log(`✅ Suscriptor reactivado: ${email} (${inactiveSubscriber.id})`);

            return {
                success: true,
                message: 'Suscripción reactivada exitosamente',
                subscriber: {
                    id: inactiveSubscriber.id,
                    email: email,
                    categories: inactiveSubscriber.categories
                },
                existed: false,
                reactivated: true
            };
        }

        // Si no existe, crear nuevo suscriptor
        const subscriberId = generateSubscriberId(subscribersData.lastId);
        const unsubscribeToken = generateUnsubscribeToken();

        const newSubscriber = {
            id: subscriberId,
            email: email,
            name: name || 'Suscriptor',
            categories: categories || ['all'],
            source: source || 'newsletter',
            subscribedAt: new Date().toISOString(),
            active: true,
            unsubscribeToken: unsubscribeToken,
            emailsSent: 0,
            lastEmailSent: null
        };

        subscribersData.subscribers.push(newSubscriber);
        subscribersData.lastId += 1;

        await saveSubscribers(subscribersData);

        console.log(`✅ Nuevo suscriptor agregado: ${email} (${subscriberId})`);

        return {
            success: true,
            message: 'Suscripción exitosa',
            subscriber: {
                id: subscriberId,
                email: email,
                categories: newSubscriber.categories
            },
            existed: false,
            reactivated: false
        };

    } catch (error) {
        console.error('Error agregando suscriptor:', error);
        throw error;
    }
}

/**
 * 📋 Obtener todos los suscriptores activos
 * @returns {Promise<Array>} - Lista de suscriptores activos
 */
async function getActiveSubscribers() {
    try {
        const subscribersData = await readSubscribers();
        return subscribersData.subscribers.filter(sub => sub.active);
    } catch (error) {
        console.error('Error obteniendo suscriptores activos:', error);
        return [];
    }
}

/**
 * 📊 Obtener estadísticas de suscriptores
 * @returns {Promise<Object>} - Estadísticas
 */
async function getSubscriberStats() {
    try {
        const subscribersData = await readSubscribers();
        const activeSubscribers = subscribersData.subscribers.filter(sub => sub.active);

        const statsByCategory = {};
        activeSubscribers.forEach(sub => {
            sub.categories.forEach(cat => {
                statsByCategory[cat] = (statsByCategory[cat] || 0) + 1;
            });
        });

        return {
            total: subscribersData.subscribers.length,
            active: activeSubscribers.length,
            inactive: subscribersData.subscribers.length - activeSubscribers.length,
            byCategory: statsByCategory
        };

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
            total: 0,
            active: 0,
            inactive: 0,
            byCategory: {}
        };
    }
}

module.exports = {
    addSubscriber,
    getActiveSubscribers,
    getSubscriberStats,
    readSubscribers,
    saveSubscribers
};
