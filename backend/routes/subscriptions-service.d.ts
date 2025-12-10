/**
 * ➕ Agregar nuevo suscriptor
 * @param {Object} data - Datos del suscriptor
 * @param {string} data.email - Email del suscriptor
 * @param {string} data.name - Nombre del suscriptor
 * @param {Array} data.categories - Categorías de interés
 * @param {string} data.source - Fuente de la suscripción
 * @returns {Promise<Object>} - Suscriptor creado o existente
 */
export function addSubscriber({ email, name, categories, source }: {
    email: string;
    name: string;
    categories: any[];
    source: string;
}): Promise<any>;
/**
 * 📋 Obtener todos los suscriptores activos
 * @returns {Promise<Array>} - Lista de suscriptores activos
 */
export function getActiveSubscribers(): Promise<any[]>;
/**
 * 📊 Obtener estadísticas de suscriptores
 * @returns {Promise<Object>} - Estadísticas
 */
export function getSubscriberStats(): Promise<any>;
/**
 * 📖 Leer suscriptores
 */
export function readSubscribers(): Promise<any>;
/**
 * 💾 Guardar suscriptores
 */
export function saveSubscribers(data: any): Promise<boolean>;
//# sourceMappingURL=subscriptions-service.d.ts.map