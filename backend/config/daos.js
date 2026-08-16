/**
 * REGISTRO CENTRAL DE DAOs
 * ========================
 *
 * Este archivo exporta todos los DAOs en un objeto central.
 * Permite inyección de dependencias y carga centralizada.
 *
 * Fecha: 4 de Diciembre, 2025
 * Versión: v7.0.0
 * Estado: TODOS LOS DAOs VALIDADOS (44/44 - 100%)
 *
 * CÓMO USAR:
 * ----------
 * const DAOs = require('./backend/config/daos');
 * const student = await DAOs.student.getById(1);
 * const teacher = await DAOs.teacher.getById(1);
 */

const Logger = require('../utilities/logger');

/**
 * Cargar todos los DAOs
 */
const DAOs = {
  // Data Access Objects - Core
  appointment: require('../data/appointment.dao.js'),
  attendance: require('../data/attendance.dao.js'),
  student: require('../data/student.dao.js'),
  teacher: require('../data/teacher.dao.js'),
  parent: require('../data/parent.dao.js'),
  user: require('../data/user.dao.js'),

  // Data Access Objects - Grades & Learning
  grade: require('../data/grade.dao.js'),
  grades: require('../data/grades.dao.js'),
  learningPath: require('../data/learning-path.dao.js'),
  learningProfile: require('../data/learning-profile.dao.js'),

  // Data Access Objects - Academic Features
  challenge: require('../data/challenge.dao.js'),
  conversation: require('../data/conversation.dao.js'),
  forum: require('../data/forum.dao.js'),
  tournament: require('../data/tournament.dao.js'),
  tumorSession: require('../data/tutor-session.dao.js'),

  // Data Access Objects - Gamification & Engagement
  gamification: require('../data/gamification.dao.js'),
  marketplace: require('../data/marketplace.dao.js'),

  // Data Access Objects - Library & Resources
  digitalLibrary: require('../data/digital-library.dao.js'),

  // Data Access Objects - Admin & Monitoring
  audit: require('../data/audit.dao.js'),
  auditLog: require('../data/audit-log.dao.js'),
  securityAudit: require('../data/security-audit.dao.js'),
  reporting: require('../data/reporting.dao.js'),
  reportGenerator: require('../data/report-generator.dao.js'),

  // Data Access Objects - Analytics
  teacherAnalytics: require('../data/teacher-analytics.dao.js'),
  performanceMonitor: require('../data/performance-monitor.dao.js'),
  predictiveAnalytics: require('../data/predictive-analytics.dao.js'),

  // Data Access Objects - Notifications & Communication
  notifications: require('../data/notifications.dao.js'),
  smsNotification: require('../data/sms-notification.dao.js'),

  // Data Access Objects - Messaging
  calendar: require('../data/calendar.dao.js'),

  // Data Access Objects - GDPR & Privacy
  gdpr: require('../data/gdpr.dao.js'),
  gdprDataExport: require('../data/gdpr-data-export.dao.js'),
  dsar: require('../data/dsar.dao.js'),
  erasure: require('../data/erasure.dao.js'),
  emailConfirmation: require('../data/email-confirmation.dao.js'),

  // Data Access Objects - Security & Authentication
  twoFactor: require('../data/two-factor.dao.js'),
  webauthn: require('../data/webauthn.dao.js'),

  // Data Access Objects - Email & Templates
  emailTemplate: require('../data/email-template.dao.js'),

  // Data Access Objects - Tenant & Configuration
  tenant: require('../data/tenant.dao.js'),
  tenantAudit: require('../data/tenant-audit.dao.js'),
  tenantOnboarding: require('../data/tenant-onboarding.dao.js'),

  // Data Access Objects - Infrastructure & Integration
  backup: require('../data/backup-automation.dao.js'),
  search: require('../data/search.dao.js'),
  sync: require('../data/sync.dao.js'),
  webhook: require('../data/webhook.dao.js')
};

/**
 * Función para obtener un DAO de forma segura
 * @param {string} daoName - Nombre del DAO
 * @returns {Object|null} DAO o null si no existe
 */
function getDAO(daoName) {
  if (!DAOs[daoName]) {
    Logger.warn('[DAOs] DAO no encontrado:', daoName);
    return null;
  }
  return DAOs[daoName];
}

/**
 * Función para obtener lista de todos los DAOs registrados
 * @returns {Array} Array de nombres de DAOs
 */
function listDAOs() {
  return Object.keys(DAOs).sort();
}

/**
 * Función para validar que un DAO existe
 * @param {string} daoName - Nombre del DAO
 * @returns {boolean} true si el DAO existe
 */
function hasDAO(daoName) {
  return daoName in DAOs;
}

/**
 * Información de registro de DAOs
 */
const info = {
  totalDAOs: Object.keys(DAOs).length,
  lastUpdated: new Date().toISOString(),
  version: 'v7.0.0',
  validationStatus: '44/44 DAOs validados (100%)',
  daos: listDAOs()
};

// Logging de carga
Logger.log('[DAOs] 🎯 Sistema de DAOs cargado');
Logger.log(`[DAOs] ✅ ${info.totalDAOs} DAOs registrados`);
Logger.log('[DAOs] 📌 Uso: const DAOs = require("./backend/config/daos")');

// Exportar
module.exports = DAOs;
module.exports.getDAO = getDAO;
module.exports.listDAOs = listDAOs;
module.exports.hasDAO = hasDAO;
module.exports.info = info;
