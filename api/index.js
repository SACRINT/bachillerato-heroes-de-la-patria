/**
 * 🛡️ SERVIDOR BACKEND SEGURO - VERCEL SERVERLESS
 * Bachillerato General Estatal "Héroes de la Patria"
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            objectSrc: ["'none'"]
        }
    }
}));

// CORS
app.use(cors({
    origin: [
        'https://bachillerato-heroes-de-la-patria.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 requests por IP
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Variables de entorno obligatorias para producción
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET environment variable is required');
    process.exit(1);
}

// Contraseña y hash desde variables de entorno
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
if (!ADMIN_PASSWORD_HASH) {
    console.error('❌ ERROR: ADMIN_PASSWORD_HASH environment variable is required');
    process.exit(1);
}

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validación básica
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Verificar credenciales admin (acepta "admin" o "Administrador")
        if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'administrador') {
            const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

            if (isValidPassword) {
                // Generar JWT token
                const token = jwt.sign(
                    {
                        username: 'admin',
                        role: 'admin',
                        timestamp: Date.now()
                    },
                    JWT_SECRET,
                    {
                        expiresIn: '30m',
                        issuer: 'heroespatria-backend'
                    }
                );

                res.json({
                    success: true,
                    message: 'Login exitoso',
                    token: token,
                    user: {
                        username: 'admin',
                        role: 'admin'
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
        } else {
            res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Función común para verificar tokens
const verifyAuthToken = (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.substring(7);

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }

            res.json({
                success: true,
                message: 'Token válido',
                user: {
                    username: decoded.username,
                    role: decoded.role
                }
            });
        });
    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// GET /api/auth/verify (para el cliente JavaScript)
app.get('/api/auth/verify', verifyAuthToken);

// POST /api/auth/verify (compatibilidad)
app.post('/api/auth/verify', verifyAuthToken);

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: 'production'
    });
});

// Ruta por defecto
app.get('/api', (req, res) => {
    res.json({
        message: 'API Backend - Bachillerato Héroes de la Patria',
        version: '2.0.0',
        status: 'active'
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Para Vercel serverless, exportamos una función handler
module.exports = app;