/**
 * 📝 MIDDLEWARE DE LOGGING
 * Sistema de logs personalizado para la aplicación
 */

const { executeQuery } = require('../config/database');

/**
 * Middleware para registrar requests
 */
const requestLogger = async (req, res, next) => {
    const startTime = Date.now();
    
    // Capturar información del request
    const requestInfo = {
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        userId: null
    };
    
    // Hook para capturar la respuesta
    const originalSend = res.send;
    res.send = function(data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Log a consola
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
        
        // Registrar en base de datos para requests importantes
        if (shouldLogToDB(req, res)) {
            logToDatabase({
                ...requestInfo,
                statusCode: res.statusCode,
                responseTime: responseTime,
                userId: req.user?.id || null
            }).catch(error => {
                console.error('Error guardando log:', error);
            });
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * Determinar si el request debe guardarse en base de datos
 */
const shouldLogToDB = (req, res) => {
    // Solo loggear requests importantes
    const importantPaths = [
        '/api/auth',
        '/api/chatbot/message',
        '/api/students',
        '/api/teachers'
    ];
    
    // Loggear errores
    if (res.statusCode >= 400) return true;
    
    // Loggear requests importantes
    return importantPaths.some(path => req.path.startsWith(path));
};

/**
 * Guardar log en base de datos
 */
const logToDatabase = async (logData) => {
    try {
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                getLogLevel(logData.statusCode),
                `${logData.method} ${logData.path}`,
                JSON.stringify({
                    statusCode: logData.statusCode,
                    responseTime: logData.responseTime,
                    timestamp: logData.timestamp
                }),
                logData.userId,
                logData.ip,
                logData.userAgent
            ]
        );
    } catch (error) {
        console.error('Error en logToDatabase:', error);
    }
};

/**
 * Determinar nivel de log basado en status code
 */
const getLogLevel = (statusCode) => {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warning';
    return 'info';
};

/**
 * Logger personalizado para diferentes niveles
 */
const logger = {
    info: async (message, context = {}, userId = null) => {
        console.log(`ℹ️  INFO: ${message}`, context);
        
        try {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id) 
                 VALUES (?, ?, ?, ?)`,
                ['info', message, JSON.stringify(context), userId]
            );
        } catch (error) {
            console.error('Error guardando log info:', error);
        }
    },
    
    warning: async (message, context = {}, userId = null) => {
        console.warn(`⚠️  WARNING: ${message}`, context);
        
        try {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id) 
                 VALUES (?, ?, ?, ?)`,
                ['warning', message, JSON.stringify(context), userId]
            );
        } catch (error) {
            console.error('Error guardando log warning:', error);
        }
    },
    
    error: async (message, context = {}, userId = null) => {
        console.error(`❌ ERROR: ${message}`, context);
        
        try {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id) 
                 VALUES (?, ?, ?, ?)`,
                ['error', message, JSON.stringify(context), userId]
            );
        } catch (error) {
            console.error('Error guardando log error:', error);
        }
    },
    
    debug: async (message, context = {}, userId = null) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`🐛 DEBUG: ${message}`, context);
        }
        
        try {
            await executeQuery(
                `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id) 
                 VALUES (?, ?, ?, ?)`,
                ['debug', message, JSON.stringify(context), userId]
            );
        } catch (error) {
            console.error('Error guardando log debug:', error);
        }
    }
};

/**
 * Middleware para limpiar logs antiguos (ejecutar periódicamente)
 */
const cleanOldLogs = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await executeQuery(
            'DELETE FROM logs_sistema WHERE created_at < ?',
            [thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ')]
        );
        
        if (result.affectedRows > 0) {
            logger.info(`Limpieza de logs completada: ${result.affectedRows} registros eliminados`);
        }
    } catch (error) {
        logger.error('Error limpiando logs antiguos', { error: error.message });
    }
};

// Ejecutar limpieza de logs cada 24 horas
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
    requestLogger,
    logger,
    cleanOldLogs
};