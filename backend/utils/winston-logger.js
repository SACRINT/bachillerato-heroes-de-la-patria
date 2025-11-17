/**
 * 📊 WINSTON LOGGER - Logging Multi-Transport
 * Sistema centralizado de logging con Winston
 * Semana 9-10 - Monitoring y Observability
 */

const winston = require('winston');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
require('fs').mkdirSync(logsDir, { recursive: true });

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

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuración de transports
const transports = [
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
  }),
];

// Transport a Logstash (ELK Stack) - solo en producción
if (process.env.NODE_ENV === 'production' && process.env.LOGSTASH_HOST) {
  transports.push(
    new winston.transports.Http({
      host: process.env.LOGSTASH_HOST || 'logstash',
      port: parseInt(process.env.LOGSTASH_PORT) || 5000,
      path: '/',
      ssl: process.env.LOGSTASH_SSL === 'true',
    })
  );
}

// Consola - solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
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
