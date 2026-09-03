/**
 * 📊 WINSTON LOGGER - Logging Multi-Transport
 * Sistema centralizado de logging con Winston
 * Semana 9-10 - Monitoring y Observability
 */

const winston = require('winston');
const path = require('path');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Crear directorio de logs solo si no estamos en entorno serverless
const logsDir = path.join(__dirname, '../../logs');
if (!isServerless) {
  try {
    require('fs').mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.warn('[WINSTON] No se pudo crear directorio de logs:', err.message);
  }
}

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato personalizado
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuración de transports
const transports = [];

if (isServerless) {
  // En Vercel / Serverless: enviar logs a consola (stdout/stderr de Lambda)
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    })
  );
} else {
  // En servidor tradicional con disco persistente
  transports.push(
    // Errores - archivo separado
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos los logs combinados
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // HTTP requests
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );

  // Consola en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  }
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Stream para Morgan (HTTP logging middleware)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods
logger.logRequest = (req, res, duration) => {
  logger.http({
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.info({
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn({
    type: 'security',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

logger.logDatabase = (query, duration, rows = 0) => {
  logger.debug({
    type: 'database',
    query: query.substring(0, 100), // Truncate long queries
    duration: `${duration}ms`,
    rows,
  });
};

module.exports = logger;
