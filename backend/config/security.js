/**
 * 🔒 SECURITY MIDDLEWARE CONFIG
 * Propósito: Configuración centralizada de seguridad y logging (Fase 7 - Semana 49)
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');

// 1. Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// 2. Rate Limiter (Global)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// 3. Rate Limiter (Auth/Sensitive)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit 5 login attempts per hour
    message: 'Too many login attempts, please try again later.'
});

// 4. Setup Function
const setupSecurity = (app) => {
    // Basic Headers (Helmet)
    app.use(helmet());

    // HTTP Request Logging
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

    // Global Rate Limiting (Apply to all requests)
    app.use('/api', globalLimiter);

    // Specific Limiters can be imported and used in routes
};

module.exports = { setupSecurity, authLimiter, logger };
