/**
 * Fix internal relative imports in backend/services/
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVICES_DIR = path.join(ROOT_DIR, 'backend', 'services');

const INTERNAL_MAPPINGS = {
    'eventBus.service': 'event-bus.service',
    'eventBusService': 'event-bus.service',
    'UploadService': 'upload.service',
    'uploadService': 'upload.service',
    'StudentService': 'student.service',
    'studentService': 'student.service',
    'TeacherService': 'teacher.service',
    'teacherService': 'teacher.service',
    'SyncService': 'sync.service',
    'syncService': 'sync.service',
    'TournamentsService': 'tournaments.service',
    'tournamentsService': 'tournaments.service',
    'twoFactorService': 'two-factor.service',
    'webauthnService': 'webauthn.service',
    'webhookService': 'webhook.service',
    'webSocketService': 'websocket.service',
    'smsService': 'sms.service',
    'SMSNotificationService': 'sms.service',
    'searchService': 'search.service',
    'search-service': 'search.service',
    'ForumsService': 'forums.service',
    'MarketplaceService': 'marketplace.service',
    'LevelsService': 'levels.service',
    'ExportService': 'export.service',
    'FormService': 'form.service',
    'MonitoringService': 'monitoring.service',
    'SecurityAuditService': 'security-audit.service',
    'rateLimitService': 'rate-limit.service',
    'RateLimiterService': 'rate-limit.service',
    'encryptionService': 'encryption.service',
    'encryption-service': 'encryption.service',
    'fileStorageService': 'storage.service',
    'file-upload-service': 'upload.service',
    'gdprService': 'gdpr.service',
    'gdprComplianceService': 'gdpr.service',
    'GDPRDataExportService': 'gdpr.service',
    'right-to-erasure-service': 'gdpr.service',
    'queueService': 'queue.service',
    'performanceService': 'performance.service',
    'PerformanceMonitorService': 'performance.service',
    'performanceMonitor': 'performance.service',
    'analyticsService': 'analytics.service',
    'AuditService': 'audit.service',
    'AuthService': 'auth.service',
    'BackupService': 'backup.service',
    'ReportService': 'report.service',
    'ReportGeneratorService': 'report.service',
    'PredictiveAnalyticsService': 'predictive-analytics.service',
    'RealTimeCollaborationService': 'realtime-collaboration.service'
};

const files = fs.readdirSync(SERVICES_DIR).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
let count = 0;

for (const file of files) {
    const filePath = path.join(SERVICES_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    for (const [legacy, canonical] of Object.entries(INTERNAL_MAPPINGS)) {
        const regex = new RegExp(`(['"\`])\\.\\/${legacy}(?:\\.js)?(['"\`])`, 'g');
        content = content.replace(regex, `$1./${canonical}$2`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log(`  🔄 Updated internal imports in backend/services/${file}`);
    }
}

console.log(`\n✅ Updated internal imports in ${count} service files.`);
