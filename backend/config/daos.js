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
  appointment: require('../data/appointment.dao'),
  attendance: require('../data/attendance.dao'),
  student: require('../data/student.dao'),
  teacher: require('../data/teacher.dao'),
  parent: require('../data/parent.dao'),
  user: require('../data/user.dao'),

  // Data Access Objects - Grades & Learning
  grade: require('../data/grade.dao'),
  grades: require('../data/grades.dao'),
  learningPath: require('../data/learning-path.dao'),
  learningProfile: require('../data/learning-profile.dao'),

  // Data Access Objects - Academic Features
  challenge: require('../data/challenge.dao'),
  conversation: require('../data/conversation.dao'),
  forum: require('../data/forum.dao'),
  tournament: require('../data/tournament.dao'),
  tumorSession: require('../data/tutor-session.dao'),

  // Data Access Objects - Gamification & Engagement
  gamification: require('../data/gamification.dao'),
  marketplace: require('../data/marketplace.dao'),

  // Data Access Objects - Library & Resources
  digitalLibrary: require('../data/digital-library.dao'),

  // Data Access Objects - Admin & Monitoring
  audit: require('../data/audit.dao'),
  auditLog: require('../data/audit-log.dao'),
  securityAudit: require('../data/security-audit.dao'),
  reporting: require('../data/reporting.dao'),
  reportGenerator: require('../data/report-generator.dao'),

  // Data Access Objects - Analytics
  teacherAnalytics: require('../data/teacher-analytics.dao'),
  performanceMonitor: require('../data/performance-monitor.dao'),
  predictiveAnalytics: require('../data/predictive-analytics.dao'),

  // Data Access Objects - Notifications & Communication
  notifications: require('../data/notifications.dao'),
  smsNotification: require('../data/sms-notification.dao'),

  // Data Access Objects - Messaging
  calendar: require('../data/calendar.dao'),

  // Data Access Objects - GDPR & Privacy
  gdpr: require('../data/gdpr.dao'),
  gdprDataExport: require('../data/gdpr-data-export.dao'),
  dsar: require('../data/dsar.dao'),
  erasure: require('../data/erasure.dao'),
  emailConfirmation: require('../data/email-confirmation.dao'),

  // Data Access Objects - Security & Authentication
  twoFactor: require('../data/two-factor.dao'),
  webauthn: require('../data/webauthn.dao'),

  // Data Access Objects - Email & Templates
  emailTemplate: require('../data/email-template.dao'),

  // Data Access Objects - Tenant & Configuration
  tenant: require('../data/tenant.dao'),
  tenantAudit: require('../data/tenant-audit.dao'),
  tenantOnboarding: require('../data/tenant-onboarding.dao'),

  // Data Access Objects - Infrastructure & Integration
  backup: require('../data/backup-automation.dao'),
  search: require('../data/search.dao'),
  sync: require('../data/sync.dao'),
  webhook: require('../data/webhook.dao')
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
