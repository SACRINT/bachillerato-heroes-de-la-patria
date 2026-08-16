/**
 * Deduplicate casing services script
 * Ensures only canonical *.service.js files remain and all imports use them.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVICES_DIR = path.join(ROOT_DIR, 'backend', 'services');

const DUPLICATE_PAIRS = [
    { legacy: 'UploadService.js', canonical: 'upload.service.js' },
    { legacy: 'StudentService.js', canonical: 'student.service.js' },
    { legacy: 'SyncService.js', canonical: 'sync.service.js' },
    { legacy: 'TournamentsService.js', canonical: 'tournaments.service.js' },
    { legacy: 'twoFactorService.js', canonical: 'two-factor.service.js' },
    { legacy: 'webauthnService.js', canonical: 'webauthn.service.js' },
    { legacy: 'webhookService.js', canonical: 'webhook.service.js' },
    { legacy: 'webSocketService.js', canonical: 'websocket.service.js' },
    { legacy: 'smsService.js', canonical: 'sms.service.js' },
    { legacy: 'SMSNotificationService.js', canonical: 'sms.service.js' },
    { legacy: 'searchService.js', canonical: 'search.service.js' },
    { legacy: 'search-service.js', canonical: 'search.service.js' },
    { legacy: 'ForumsService.js', canonical: 'forums.service.js' },
    { legacy: 'MarketplaceService.js', canonical: 'marketplace.service.js' },
    { legacy: 'LevelsService.js', canonical: 'levels.service.js' },
    { legacy: 'ExportService.js', canonical: 'export.service.js' },
    { legacy: 'FormService.js', canonical: 'form.service.js' },
    { legacy: 'MonitoringService.js', canonical: 'monitoring.service.js' },
    { legacy: 'SecurityAuditService.js', canonical: 'security-audit.service.js' },
    { legacy: 'rateLimitService.js', canonical: 'rate-limit.service.js' },
    { legacy: 'RateLimiterService.js', canonical: 'rate-limit.service.js' },
    { legacy: 'eventBusService.js', canonical: 'event-bus.service.js' },
    { legacy: 'eventBus.service.js', canonical: 'event-bus.service.js' },
    { legacy: 'encryptionService.js', canonical: 'encryption.service.js' },
    { legacy: 'encryption-service.js', canonical: 'encryption.service.js' },
    { legacy: 'fileStorageService.js', canonical: 'storage.service.js' },
    { legacy: 'file-upload-service.js', canonical: 'upload.service.js' },
    { legacy: 'gdprService.js', canonical: 'gdpr.service.js' },
    { legacy: 'gdprComplianceService.js', canonical: 'gdpr.service.js' },
    { legacy: 'GDPRDataExportService.js', canonical: 'gdpr.service.js' },
    { legacy: 'right-to-erasure-service.js', canonical: 'gdpr.service.js' },
    { legacy: 'queueService.js', canonical: 'queue.service.js' },
    { legacy: 'performanceService.js', canonical: 'performance.service.js' },
    { legacy: 'PerformanceMonitorService.js', canonical: 'performance.service.js' },
    { legacy: 'performanceMonitor.js', canonical: 'performance.service.js' },
    { legacy: 'analyticsService.js', canonical: 'analytics.service.js' },
    { legacy: 'AnalyticsService.js', canonical: 'analytics.service.js' },
    { legacy: 'advancedAnalyticsService.js', canonical: 'advanced-analytics.service.js' },
    { legacy: 'AdvancedAnalyticsService.js', canonical: 'advanced-analytics.service.js' },
    { legacy: 'AITutorService.js', canonical: 'ai-tutor.service.js' },
    { legacy: 'aiTutorService.js', canonical: 'ai-tutor.service.js' },
    { legacy: 'AuditService.js', canonical: 'audit.service.js' },
    { legacy: 'auditService.js', canonical: 'audit.service.js' },
    { legacy: 'AuditLogService.js', canonical: 'audit-log.service.js' },
    { legacy: 'auditLogService.js', canonical: 'audit-log.service.js' },
    { legacy: 'AuthService.js', canonical: 'auth.service.js' },
    { legacy: 'authService.js', canonical: 'auth.service.js' },
    { legacy: 'AuthenticationService.js', canonical: 'auth.service.js' },
    { legacy: 'AuthorizationService.js', canonical: 'authorization.service.js' },
    { legacy: 'authorizationService.js', canonical: 'authorization.service.js' },
    { legacy: 'BackupService.js', canonical: 'backup.service.js' },
    { legacy: 'backupService.js', canonical: 'backup.service.js' },
    { legacy: 'CacheService.js', canonical: 'cache.service.js' },
    { legacy: 'cacheService.js', canonical: 'cache.service.js' },
    { legacy: 'GamificationService.js', canonical: 'gamification.service.js' },
    { legacy: 'gamificationService.js', canonical: 'gamification.service.js' },
    { legacy: 'NotificationService.js', canonical: 'notification.service.js' },
    { legacy: 'notificationService.js', canonical: 'notification.service.js' },
    { legacy: 'ReportService.js', canonical: 'report.service.js' },
    { legacy: 'ReportGeneratorService.js', canonical: 'report.service.js' },
    { legacy: 'reporting-service.js', canonical: 'reporting.service.js' },
    { legacy: 'PredictiveAnalyticsService.js', canonical: 'predictive-analytics.service.js' },
    { legacy: 'RealTimeCollaborationService.js', canonical: 'realtime-collaboration.service.js' }
];

function getAllBackendCodeFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist') {
                results = results.concat(getAllBackendCodeFiles(fullPath));
            }
        } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.ts'))) {
            results.push(fullPath);
        }
    }
    return results;
}

const allFiles = [
    ...getAllBackendCodeFiles(path.join(ROOT_DIR, 'backend')),
    path.join(ROOT_DIR, 'api', 'index.js')
].filter(f => fs.existsSync(f));

let updatedImports = 0;
let deletedFiles = 0;

for (const pair of DUPLICATE_PAIRS) {
    const legacyBase = pair.legacy.replace(/\.js$/, '');
    const canonicalBase = pair.canonical.replace(/\.js$/, '');

    for (const file of allFiles) {
        if (!fs.existsSync(file)) continue;
        let content = fs.readFileSync(file, 'utf8');
        const regex = new RegExp(`(['"\`].*?\\/services\\/)${legacyBase}(?:\\.js)?(['"\`])`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `$1${canonicalBase}$2`);
            fs.writeFileSync(file, content, 'utf8');
            updatedImports++;
        }
    }

    const legacyPath = path.join(SERVICES_DIR, pair.legacy);
    const canonicalPath = path.join(SERVICES_DIR, pair.canonical);

    if (fs.existsSync(legacyPath) && fs.existsSync(canonicalPath) && legacyPath !== canonicalPath) {
        fs.unlinkSync(legacyPath);
        deletedFiles++;
        console.log(`  🗑️ Removed duplicate service: ${pair.legacy} -> canonical: ${pair.canonical}`);
    }
}

console.log(`\n🎉 Consolidation complete: ${updatedImports} imports updated, ${deletedFiles} duplicate services removed.`);
