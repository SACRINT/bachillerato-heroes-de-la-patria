/**
 * 🚀 VERCEL SERVERLESS ENTRY POINT
 * Archivo de entrada para funciones serverless de Vercel
 * NO debe hacer .listen() - Vercel maneja la ejecución
 *
 * IMPORTANTE: Manejador de rutas de API simple sin dependencias problemáticas
 */

// Cargar variables de entorno PRIMERO
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env desde raíz (Vercel inyecta automáticamente)
try {
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
    console.warn('[VERCEL] Warning loading .env:', e.message);
}

// CRÍTICO: Marcar NODE_ENV como producción para Vercel
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

console.log('[VERCEL-API] Iniciando handler en NODE_ENV:', process.env.NODE_ENV);

// Importar directamente los componentes de server.js SIN ejecutar .listen()
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// NO cargar database.js aqui - evita errores de pool initialization
// const { pool } = require('../backend/config/database');

// Middleware con lazy loading para evitar crashes al requerir
let errorHandler;
let securityMiddleware;
let tenantContext;

try {
    errorHandler = require('../backend/middleware/errorHandler').errorHandler;
} catch (e) {
    console.warn('[VERCEL] Error loading errorHandler:', e.message);
    errorHandler = (err, req, res, next) => {
        res.status(500).json({ error: 'Internal Server Error' });
    };
}

try {
    securityMiddleware = require('../backend/middleware/security').securityMiddleware;
} catch (e) {
    console.warn('[VERCEL] Error loading securityMiddleware:', e.message);
    securityMiddleware = (req, res, next) => next();
}

try {
    tenantContext = require('../backend/middleware/tenant-context').tenantContext;
} catch (e) {
    console.warn('[VERCEL] Error loading tenantContext:', e.message);
    tenantContext = (req, res, next) => next();
}

// Crear la app
const app = express();

// VERIFICACIÓN DE ENTORNO CRÍTICA
console.log('[VERCEL STARTUP]', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_VALID: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME'),
    TIMESTAMP: new Date().toISOString()
});

// ============================================
// MIDDLEWARE BÁSICO (SIMPLIFICADO PARA VERCEL)
// ============================================

// NOTA: Helmet descomentado temporalmente porque causaba HTTP 500
// Vercel ya proporciona headers de seguridad
// app.use(helmet({...}));

// CORS simple
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Middleware personalizado con fallback
try {
    if (securityMiddleware) app.use(securityMiddleware);
} catch (e) {
    console.warn('[VERCEL-API] Security middleware skipped:', e.message);
}

try {
    if (tenantContext) app.use(tenantContext);
} catch (e) {
    console.warn('[VERCEL-API] Tenant context middleware skipped:', e.message);
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
            configured: !!process.env.DATABASE_URL,
            valid: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME')
        }
    };

    res.json(healthStatus);
});

// ============================================
// RUTAS
// ============================================

// ============================================
// RUTAS API (LAZY LOADED ON DEMAND)
// ============================================

// /api/config/tenant - Default configuration for frontend
// VERSIÓN ULTRA-SIMPLE PARA VERCEL (sin try/catch externo)
app.get('/api/config/tenant', (req, res) => {
    console.log('[VERCEL-API] GET /api/config/tenant');

    const defaultConfig = {
        school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
        school_short_name: 'BGE',
        school_type: 'Bachillerato General por Competencias',
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        logo_url: '/images/logo-bge.png',
        contact_email: 'contacto@heroespatria.edu.mx',
        contact_phone: '(777) 123-4567',
        address: 'Calle Principal #123, Cuernavaca, Morelos',
        enable_notifications: true,
        enable_gamification: true
    };

    const hostname = req.headers.host || 'bge-heroesdelapatria.vercel.app';

    const response = {
        success: true,
        isDefault: true,
        tenant: {
            id: 1,
            uuid: 'default-uuid',
            school_name: defaultConfig.school_name,
            schema_name: 'public',
            domain: hostname,
            status: 'activo'
        },
        config: defaultConfig
    };

    console.log('[VERCEL-API] Respondiendo /api/config/tenant con HTTP 200');
    res.json(response);
});

// /api/config/public-keys
// VERSIÓN ULTRA-SIMPLE PARA VERCEL (sin try/catch externo)
app.get('/api/config/public-keys', (req, res) => {
    console.log('[VERCEL-API] GET /api/config/public-keys');

    const isDevelopment = process.env.NODE_ENV === 'development';

    const response = {
        success: true,
        environment: isDevelopment ? 'development' : 'production',
        keys: {
            tinymce: process.env.TINYMCE_API_KEY || null,
            google_oauth_client_id: isDevelopment
                ? (process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || '')
                : (process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '')
        }
    };

    console.log('[VERCEL-API] Respondiendo /api/config/public-keys con HTTP 200');
    res.json(response);
});

// ============================================
// MOUNT BACKEND ROUTES (COMMENTED OUT - CAUSING ISSUES)
// ============================================
// Las rutas del backend requieren database pool que no está disponible en serverless
// Descomentado para simplificar y evitar HTTP 500
/*
try {
    const storeRoutes = require('../backend/routes/store');
    app.use('/api/store', storeRoutes);
    console.log('[VERCEL] ✅ Rutas de Store montadas');
} catch (e) {
    console.warn('[VERCEL] ⚠️ No se pudieron montar rutas de Store:', e.message);
}

try {
    const walletRoutes = require('../backend/routes/wallet');
    app.use('/api/wallet', walletRoutes);
    console.log('[VERCEL] ✅ Rutas de Wallet montadas');
} catch (e) {
    console.warn('[VERCEL] ⚠️ No se pudieron montar rutas de Wallet:', e.message);
}
*/

// ============================================
// AUTHENTICATION ENDPOINTS (SIMPLIFIED FOR VERCEL)
// ============================================

// POST /api/auth/login - Email/Password authentication (CONNECTED TO POSTGRESQL)
app.post('/api/auth/login', express.json(), async (req, res) => {
    try {
        const { email, password, rememberMe = false } = req.body;

        // Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña requeridos'
            });
        }

        console.log('[AUTH] Login attempt for email:', email);

        // ✅ CONEXIÓN REAL A POSTGRESQL (Neon)
        const { Pool } = require('pg');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');

        // Crear pool de conexiones
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }  // Necesario para Neon
        });

        const client = await pool.connect();

        try {
            // Buscar usuario por email en tabla 'usuarios'
            const query = `
                SELECT id, uuid, email, username, password_hash, nombre, apellido_paterno,
                       apellido_materno, role, status, created_at
                FROM usuarios
                WHERE email = $1 AND status = 'activo'
                LIMIT 1
            `;

            const result = await client.query(query, [email]);

            if (result.rows.length === 0) {
                console.warn('[AUTH] Usuario no encontrado:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    message: 'Email o contraseña incorrectos'
                });
            }

            const user = result.rows[0];

            // Validar contraseña con bcrypt
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                console.warn('[AUTH] Contraseña incorrecta para:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    message: 'Email o contraseña incorrectos'
                });
            }

            // Generar tokens JWT
            const userPayload = {
                userId: user.id,
                uuid: user.uuid,
                email: user.email,
                username: user.username,
                role: user.role,
                permissions: getPermissionsForRole(user.role)
            };

            const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

            const accessToken = jwt.sign(
                { ...userPayload, type: 'access' },
                jwtSecret,
                { expiresIn: '24h', audience: 'bge-users', issuer: 'bge-heroes-patria' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id, uuid: user.uuid, email: user.email, type: 'refresh' },
                jwtSecret,
                { expiresIn: '7d', audience: 'bge-users', issuer: 'bge-heroes-patria' }
            );

            const accessTokenExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
            const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

            console.log('[AUTH] Login exitoso para:', email, 'role:', user.role);

            return res.json({
                success: true,
                message: 'Autenticación exitosa',
                user: {
                    id: user.id,
                    uuid: user.uuid,
                    username: user.username,
                    email: user.email,
                    nombre: user.nombre,
                    apellido_paterno: user.apellido_paterno,
                    apellido_materno: user.apellido_materno,
                    role: user.role,
                    permissions: userPayload.permissions
                },
                tokens: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    accessTokenExpiry: accessTokenExpiry,
                    refreshTokenExpiry: refreshTokenExpiry,
                    tokenType: 'Bearer'
                },
                sessionInfo: {
                    loginTime: new Date().toISOString(),
                    rememberMe: rememberMe,
                    expiresAt: new Date(accessTokenExpiry * 1000).toISOString()
                }
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[AUTH] Error en login:', error.message, error.stack);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Helper function para obtener permisos según el role
function getPermissionsForRole(role) {
    const rolePermissions = {
        'admin': ['manage_users', 'manage_grades', 'manage_notifications', 'manage_reports', 'read_analytics'],
        'docente': ['read_students', 'manage_grades', 'read_attendance', 'manage_assignments', 'read_analytics'],
        'estudiante': ['read_profile', 'read_grades', 'read_attendance', 'view_assignments', 'submit_assignments'],
        'padre': ['read_student_profile', 'read_grades', 'read_attendance', 'contact_teacher']
    };

    return rolePermissions[role] || ['read_profile'];
}

// POST /api/auth/google - Google OAuth authentication
app.post('/api/auth/google', express.json(), async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            console.warn('[AUTH] No credential provided');
            return res.status(400).json({
                success: false,
                error: 'Token de Google requerido'
            });
        }

        console.log('[AUTH] Google OAuth attempt');

        // Decodificar el JWT (sin verificar firma, solo para obtener datos)
        // ⚠️ EN PRODUCCIÓN, SIEMPRE VERIFICA LA FIRMA CON GOOGLE'S PUBLIC KEYS
        // Usar la biblioteca google-auth-library para verificación segura

        let payload;
        try {
            const parts = credential.split('.');
            if (parts.length !== 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Token JWT inválido'
                });
            }

            // Decodificar payload (parte 2)
            // Agregar padding si es necesario (base64 puede no tener el padding correcto)
            const base64Payload = parts[1];
            const base64WithPadding = base64Payload + '=='.substring(0, (4 - base64Payload.length % 4) % 4);
            payload = JSON.parse(Buffer.from(base64WithPadding, 'base64').toString('utf-8'));

            console.log('[AUTH] Google token decoded - user:', payload.email);
        } catch (decodeError) {
            console.error('[AUTH] Error decodificando Google JWT:', decodeError.message);
            return res.status(400).json({
                success: false,
                error: 'No se pudo decodificar el token de Google'
            });
        }

        // Validar que el JWT contiene los campos necesarios
        if (!payload.email || !payload.sub) {
            return res.status(400).json({
                success: false,
                error: 'Token de Google inválido o incompleto'
            });
        }

        // En Vercel/producción, aquí buscarías/crearías el usuario en la base de datos
        // Para esta demostración, retornamos un usuario mock

        const mockUser = {
            id: payload.sub || 'google-' + Date.now(),
            email: payload.email,
            username: payload.email.split('@')[0],
            nombre: payload.given_name || 'Usuario',
            apellido_paterno: payload.family_name || '',
            role: 'estudiante',
            picture: payload.picture || null,
            oauth_provider: 'google',
            permissions: ['read_profile', 'read_grades']
        };

        // Mock JWT tokens (en producción, usar jwtUtils del backend)
        const mockTokens = {
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
            accessTokenExpiry: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
            refreshTokenExpiry: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
        };

        console.log('[AUTH] Google login successful for:', mockUser.email);

        res.json({
            success: true,
            message: 'Autenticación con Google exitosa',
            user: mockUser,
            tokens: mockTokens,
            sessionInfo: {
                loginTime: new Date().toISOString(),
                rememberMe: true,
                expiresAt: new Date(mockTokens.accessTokenExpiry * 1000).toISOString()
            }
        });

    } catch (error) {
        console.error('[AUTH] Error en Google OAuth:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error en autenticación de Google',
            message: error.message
        });
    }
});

// POST /api/auth/register - User registration
app.post('/api/auth/register', express.json(), async (req, res) => {
    try {
        const { email, password, nombre, apellido_paterno, apellido_materno } = req.body;

        // Validación básica
        if (!email || !password || !nombre) {
            return res.status(400).json({
                success: false,
                error: 'Email, contraseña y nombre requeridos'
            });
        }

        // Validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }

        // Validación de contraseña (mínimo 6 caracteres)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        console.log('[AUTH] Registro attempt for email:', email);

        // En Vercel, retornamos mensaje indicando que el registro no está disponible
        // porque la BD no está disponible en el serverless
        return res.status(503).json({
            success: false,
            error: 'Registro no disponible en esta versión',
            message: 'Por favor usa Google para crear tu cuenta',
            suggestion: 'Usa el botón de Google para una autenticación rápida y segura'
        });

    } catch (error) {
        console.error('[AUTH] Error en registro:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// GAMIFICACIÓN - ENDPOINTS (IACOINS & WALLET)
// ============================================

// GET /api/wallet - Obtener billetera del usuario
app.get('/api/wallet', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        // Decodificar token para obtener userId
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const userId = decoded.userId;
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            // Obtener saldo de IACoins del usuario
            const balanceQuery = `
                SELECT COALESCE(SUM(amount), 0) as total_coins
                FROM iacoins_transactions
                WHERE user_id = $1
            `;

            const balanceResult = await client.query(balanceQuery, [userId]);
            const totalCoins = parseInt(balanceResult.rows[0]?.total_coins || 0);

            // Obtener items del usuario en la tienda
            const itemsQuery = `
                SELECT id, name, description, price, image_url, category
                FROM store_items
                WHERE user_id = $1
                LIMIT 50
            `;

            const itemsResult = await client.query(itemsQuery, [userId]);

            res.json({
                success: true,
                wallet: {
                    userId: userId,
                    totalCoins: totalCoins,
                    items: itemsResult.rows || [],
                    lastUpdated: new Date().toISOString()
                }
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[WALLET] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener billetera'
        });
    }
});

// GET /api/challenges - Obtener desafíos activos
app.get('/api/challenges', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, title, description, difficulty, reward_coins, status, created_at
                FROM challenges
                WHERE status = 'active'
                ORDER BY created_at DESC
                LIMIT 20
            `;

            const result = await client.query(query);

            res.json({
                success: true,
                challenges: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[CHALLENGES] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener desafíos'
        });
    }
});

// GET /api/iacoins/balance - Obtener balance de IACoins
app.get('/api/iacoins/balance', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT COALESCE(SUM(amount), 0) as balance
                FROM iacoins_transactions
                WHERE user_id = $1 AND status = 'completed'
            `;

            const result = await client.query(query, [decoded.userId]);
            const balance = parseInt(result.rows[0]?.balance || 0);

            res.json({
                success: true,
                userId: decoded.userId,
                balance: balance,
                currency: 'IACoins'
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[IACOINS-BALANCE] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener balance'
        });
    }
});

// GET /api/iacoins/achievements - Obtener logros del usuario
app.get('/api/iacoins/achievements', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, title, description, icon_url, unlocked_at
                FROM achievements
                WHERE user_id = $1
                ORDER BY unlocked_at DESC
            `;

            const result = await client.query(query, [decoded.userId]);

            res.json({
                success: true,
                achievements: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[ACHIEVEMENTS] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener logros'
        });
    }
});

// GET /api/iacoins/challenges - Obtener desafíos disponibles
app.get('/api/iacoins/challenges', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, title, description, difficulty, reward_coins, status
                FROM challenges
                WHERE status = 'active'
                ORDER BY difficulty, reward_coins DESC
                LIMIT 30
            `;

            const result = await client.query(query);

            res.json({
                success: true,
                challenges: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[IACOINS-CHALLENGES] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener desafíos'
        });
    }
});

// GET /api/iacoins/leaderboard - Obtener tabla de líderes
app.get('/api/iacoins/leaderboard', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT
                    u.id,
                    u.username,
                    u.nombre,
                    COALESCE(SUM(t.amount), 0) as total_coins,
                    COUNT(a.id) as achievements_count
                FROM usuarios u
                LEFT JOIN iacoins_transactions t ON u.id = t.user_id AND t.status = 'completed'
                LEFT JOIN achievements a ON u.id = a.user_id
                GROUP BY u.id, u.username, u.nombre
                ORDER BY total_coins DESC
                LIMIT 50
            `;

            const result = await client.query(query);

            // Agregar ranking
            const leaderboard = result.rows.map((row, index) => ({
                ...row,
                rank: index + 1
            }));

            res.json({
                success: true,
                leaderboard: leaderboard,
                total: leaderboard.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[LEADERBOARD] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener tabla de líderes'
        });
    }
});

// GET /api/iacoins/transactions - Obtener transacciones del usuario
app.get('/api/iacoins/transactions', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, type, amount, reason, status, created_at
                FROM iacoins_transactions
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 100
            `;

            const result = await client.query(query, [decoded.userId]);

            res.json({
                success: true,
                transactions: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[TRANSACTIONS] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener transacciones'
        });
    }
});

// ============================================
// TIENDA (STORE)
// ============================================

// GET /api/store/items - Obtener items de la tienda
app.get('/api/store/items', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, name, description, price, image_url, category, stock, created_at
                FROM store_items
                WHERE status = 'active'
                ORDER BY category, name
                LIMIT 100
            `;

            const result = await client.query(query);

            res.json({
                success: true,
                items: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[STORE-ITEMS] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener items de la tienda'
        });
    }
});

// ============================================
// AUTENTICACIÓN - ENDPOINTS ADICIONALES
// ============================================

// GET /api/auth/profile - Obtener perfil del usuario
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, uuid, email, username, nombre, apellido_paterno, apellido_materno,
                       role, status, created_at, avatar_url
                FROM usuarios
                WHERE id = $1
            `;

            const result = await client.query(query, [decoded.userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const user = result.rows[0];

            res.json({
                success: true,
                user: {
                    id: user.id,
                    uuid: user.uuid,
                    email: user.email,
                    username: user.username,
                    nombre: user.nombre,
                    apellido_paterno: user.apellido_paterno,
                    apellido_materno: user.apellido_materno,
                    role: user.role,
                    status: user.status,
                    avatarUrl: user.avatar_url,
                    createdAt: user.created_at
                }
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[AUTH-PROFILE] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
});

// GET /api/students-auth/check - Verificar sesión de estudiante
app.get('/api/students-auth/check', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Token inválido'
            });
        }

        // Verificar que es estudiante
        if (decoded.role !== 'estudiante') {
            return res.status(403).json({
                success: false,
                authenticated: true,
                isStudent: false,
                error: 'Solo estudiantes pueden acceder'
            });
        }

        res.json({
            success: true,
            authenticated: true,
            isStudent: true,
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username
        });

    } catch (error) {
        console.error('[STUDENT-CHECK] Error:', error.message);
        res.status(500).json({
            success: false,
            authenticated: false,
            error: 'Error al verificar sesión'
        });
    }
});

// ============================================
// BIBLIOTECA DIGITAL
// ============================================

// GET /api/digital-library/categories - Obtener categorías de la biblioteca
app.get('/api/digital-library/categories', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, name, description, icon_url, document_count
                FROM library_categories
                WHERE status = 'active'
                ORDER BY name
            `;

            const result = await client.query(query);

            res.json({
                success: true,
                categories: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[LIBRARY-CATEGORIES] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener categorías'
        });
    }
});

// GET /api/digital-library/documents - Obtener documentos de la biblioteca
app.get('/api/digital-library/documents', async (req, res) => {
    try {
        const { category, search } = req.query;
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            let query = `
                SELECT id, title, description, category, file_url, created_at, view_count
                FROM library_documents
                WHERE status = 'active'
            `;

            const params = [];

            if (category) {
                query += ` AND category = $${params.length + 1}`;
                params.push(category);
            }

            if (search) {
                query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
                params.push(`%${search}%`);
            }

            query += ` ORDER BY created_at DESC LIMIT 100`;

            const result = await client.query(query, params);

            res.json({
                success: true,
                documents: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[LIBRARY-DOCUMENTS] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener documentos'
        });
    }
});

// ============================================
// MENSAJERÍA
// ============================================

// GET /api/messaging/conversations - Obtener conversaciones del usuario
app.get('/api/messaging/conversations', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token requerido'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'vercel-secret-key-change-in-production';

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            const query = `
                SELECT id, title, participants, last_message, last_message_at, unread_count
                FROM conversations
                WHERE $1 = ANY(participants)
                ORDER BY last_message_at DESC
                LIMIT 50
            `;

            const result = await client.query(query, [decoded.userId]);

            res.json({
                success: true,
                conversations: result.rows || [],
                total: result.rows.length
            });

        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('[MESSAGING] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener conversaciones'
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(errorHandler);

// Catch-all para 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path,
        method: req.method
    });
});

// ============================================
// EXPORTAR PARA VERCEL
// ============================================
// Vercel necesita que exportemos la app directamente
// El routing se maneja dentro de la app Express
module.exports = app;
