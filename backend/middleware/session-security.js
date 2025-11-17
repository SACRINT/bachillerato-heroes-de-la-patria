/**
 * 🔐 SESSION SECURITY - Gestión segura de sesiones
 *
 * Renovación automática de tokens, invalidación de sesiones, protección contra session fixation
 * OWASP: A07:2021 - Identification and Authentication Failures
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN
// ============================================

const SESSION_CONFIG = {
    // Tiempo de vida del token
    accessTokenExpiry: '15m', // 15 minutos
    refreshTokenExpiry: '7d', // 7 días

    // Renovación automática
    autoRenewThreshold: 5 * 60 * 1000, // Renovar si quedan menos de 5 minutos

    // Session fixation prevention
    regenerateOnLogin: true,
    regenerateOnPrivilegeChange: true,

    // Almacenamiento de sesiones activas (en producción usar Redis)
    activeSessions: new Map(), // sessionId -> {userId, createdAt, lastActivity}

    // Límite de sesiones por usuario
    maxSessionsPerUser: 5,

    // Timeout de inactividad
    inactivityTimeout: 30 * 60 * 1000, // 30 minutos

    // Headers de sesión
    tokenHeader: 'Authorization',
    refreshTokenCookie: 'refresh_token'
};

// ============================================
// JWT HELPERS
// ============================================

/**
 * Generar Access Token (corta duración)
 */
function generateAccessToken(payload) {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';

    return jwt.sign(
        payload,
        secret,
        {
            expiresIn: SESSION_CONFIG.accessTokenExpiry,
            issuer: 'bachillerato-heroes',
            audience: 'api'
        }
    );
}

/**
 * Generar Refresh Token (larga duración)
 */
function generateRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret';

    return jwt.sign(
        {
            userId: payload.userId,
            tokenId: crypto.randomBytes(16).toString('hex') // Identificador único del token
        },
        secret,
        {
            expiresIn: SESSION_CONFIG.refreshTokenExpiry,
            issuer: 'bachillerato-heroes',
            audience: 'refresh'
        }
    );
}

/**
 * Verificar Access Token
 */
function verifyAccessToken(token) {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';

    try {
        return jwt.verify(token, secret, {
            issuer: 'bachillerato-heroes',
            audience: 'api'
        });
    } catch (error) {
        return null;
    }
}

/**
 * Verificar Refresh Token
 */
function verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret';

    try {
        return jwt.verify(token, secret, {
            issuer: 'bachillerato-heroes',
            audience: 'refresh'
        });
    } catch (error) {
        return null;
    }
}

// ============================================
// GESTIÓN DE SESIONES
// ============================================

/**
 * Crear sesión nueva
 */
function createSession(userId, metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');

    const session = {
        sessionId,
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        metadata: {
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            ...metadata
        }
    };

    SESSION_CONFIG.activeSessions.set(sessionId, session);

    // Limpiar sesiones viejas del usuario si excede el límite
    cleanupUserSessions(userId);

    return sessionId;
}

/**
 * Obtener sesión
 */
function getSession(sessionId) {
    return SESSION_CONFIG.activeSessions.get(sessionId);
}

/**
 * Actualizar última actividad
 */
function touchSession(sessionId) {
    const session = SESSION_CONFIG.activeSessions.get(sessionId);
    if (session) {
        session.lastActivity = Date.now();
        SESSION_CONFIG.activeSessions.set(sessionId, session);
    }
}

/**
 * Invalidar sesión específica
 */
function invalidateSession(sessionId) {
    SESSION_CONFIG.activeSessions.delete(sessionId);
    console.log(`🗑️ [SESSION] Sesión invalidada: ${sessionId.substring(0, 8)}...`);
}

/**
 * Invalidar todas las sesiones de un usuario
 */
function invalidateUserSessions(userId) {
    let count = 0;
    for (const [sessionId, session] of SESSION_CONFIG.activeSessions.entries()) {
        if (session.userId === userId) {
            SESSION_CONFIG.activeSessions.delete(sessionId);
            count++;
        }
    }
    console.log(`🗑️ [SESSION] ${count} sesiones invalidadas para usuario ${userId}`);
}

/**
 * Limpiar sesiones inactivas
 */
function cleanupInactiveSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of SESSION_CONFIG.activeSessions.entries()) {
        if (now - session.lastActivity > SESSION_CONFIG.inactivityTimeout) {
            SESSION_CONFIG.activeSessions.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 [SESSION] ${cleaned} sesiones inactivas limpiadas`);
    }
}

/**
 * Limpiar sesiones viejas de un usuario (mantener solo las N más recientes)
 */
function cleanupUserSessions(userId) {
    const userSessions = [];

    for (const [sessionId, session] of SESSION_CONFIG.activeSessions.entries()) {
        if (session.userId === userId) {
            userSessions.push({ sessionId, createdAt: session.createdAt });
        }
    }

    // Si excede el límite, eliminar las más antiguas
    if (userSessions.length > SESSION_CONFIG.maxSessionsPerUser) {
        userSessions.sort((a, b) => a.createdAt - b.createdAt);

        const toRemove = userSessions.length - SESSION_CONFIG.maxSessionsPerUser;
        for (let i = 0; i < toRemove; i++) {
            SESSION_CONFIG.activeSessions.delete(userSessions[i].sessionId);
        }

        console.log(`🧹 [SESSION] ${toRemove} sesiones antiguas eliminadas para usuario ${userId}`);
    }
}

// ============================================
// MIDDLEWARES
// ============================================

/**
 * Middleware de autenticación con renovación automática
 */
function authenticateWithRenewal(req, res, next) {
    // Obtener token del header
    const authHeader = req.headers[SESSION_CONFIG.tokenHeader.toLowerCase()];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No autorizado',
            message: 'Token de autenticación faltante'
        });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'Token inválido',
            message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        });
    }

    // Adjuntar usuario al request
    req.user = decoded;

    // Verificar sesión activa
    if (decoded.sessionId) {
        const session = getSession(decoded.sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Sesión inválida',
                message: 'Tu sesión ha sido cerrada.'
            });
        }

        // Actualizar última actividad
        touchSession(decoded.sessionId);
    }

    // Verificar si el token está próximo a expirar y renovarlo
    const expiresAt = decoded.exp * 1000; // Convertir a milisegundos
    const timeUntilExpiry = expiresAt - Date.now();

    if (timeUntilExpiry < SESSION_CONFIG.autoRenewThreshold) {
        // Generar nuevo token
        const newToken = generateAccessToken({
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId
        });

        // Enviar nuevo token en header de respuesta
        res.setHeader('X-New-Token', newToken);

        console.log(`🔄 [SESSION] Token renovado automáticamente para usuario ${decoded.userId}`);
    }

    next();
}

/**
 * Middleware para refrescar access token con refresh token
 */
function refreshAccessToken(req, res, next) {
    const refreshToken = req.cookies?.[SESSION_CONFIG.refreshTokenCookie] || req.body?.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            error: 'Refresh token faltante'
        });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'Refresh token inválido o expirado'
        });
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        // Aquí deberías obtener datos actualizados del usuario desde la BD
        // por simplicidad, usamos los del refresh token
    });

    res.json({
        success: true,
        accessToken: newAccessToken
    });
}

/**
 * Middleware para prevenir session fixation en login
 */
function preventSessionFixation(req, res, next) {
    if (SESSION_CONFIG.regenerateOnLogin) {
        // Regenerar session ID (si usas express-session)
        if (req.session && typeof req.session.regenerate === 'function') {
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Error regenerando sesión:', err);
                }
                next();
            });
        } else {
            next();
        }
    } else {
        next();
    }
}

// ============================================
// SCHEDULED TASKS
// ============================================

/**
 * Tarea programada para limpiar sesiones inactivas (ejecutar cada 5 minutos)
 */
function startSessionCleanup() {
    setInterval(() => {
        cleanupInactiveSessions();
    }, 5 * 60 * 1000); // Cada 5 minutos

    console.log('🕐 [SESSION] Tarea de limpieza de sesiones iniciada (cada 5 minutos)');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Middlewares
    authenticateWithRenewal,
    refreshAccessToken,
    preventSessionFixation,

    // JWT helpers
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,

    // Session management
    createSession,
    getSession,
    touchSession,
    invalidateSession,
    invalidateUserSessions,
    cleanupInactiveSessions,
    cleanupUserSessions,

    // Scheduled tasks
    startSessionCleanup,

    // Config
    SESSION_CONFIG
};
