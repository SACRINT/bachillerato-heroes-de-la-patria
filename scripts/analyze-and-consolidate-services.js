/**
 * Service Consolidation Script
 * 1. Analyzes references to backend/services across all routes and controllers
 * 2. Rewrites legacy bridge/duplicate imports to canonical services
 * 3. Identifies and safely cleans up .bridge.js, orphan .d.ts, .map files
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVICES_DIR = path.join(ROOT_DIR, 'backend', 'services');

function getAllFiles(dir, exts = ['.js', '.ts']) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist') {
                results = results.concat(getAllFiles(fullPath, exts));
            }
        } else if (item.isFile() && exts.some(ext => item.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

const allBackendFiles = [
    ...getAllFiles(path.join(ROOT_DIR, 'backend', 'routes')),
    ...getAllFiles(path.join(ROOT_DIR, 'backend', 'controllers')),
    ...getAllFiles(path.join(ROOT_DIR, 'backend', 'middleware')),
    path.join(ROOT_DIR, 'backend', 'server.js'),
    path.join(ROOT_DIR, 'api', 'index.js')
].filter(f => fs.existsSync(f));

console.log(`🔍 Scanning ${allBackendFiles.length} backend files for service imports...`);

// Mapping of legacy/bridge services to canonical active service files
const CANONICAL_MAPPING = {
    'UploadService.bridge': 'upload.service',
    'UploadService': 'upload.service',
    'uploadService': 'upload.service',
    'AuthService.bridge': 'auth.service',
    'AuthService': 'auth.service',
    'authService': 'auth.service',
    'AuthenticationService': 'auth.service',
    'emailService.bridge': 'emailService',
    'EmailService.bridge': 'emailService',
    'EmailService': 'emailService',
    'smsService.bridge': 'sms.service',
    'SMSNotificationService': 'sms.service',
    'smsService': 'sms.service',
    'twoFactorService.bridge': 'two-factor.service',
    'twoFactorService': 'two-factor.service',
    'TwoFactorService': 'two-factor.service',
    'notificationService.bridge': 'notification.service',
    'NotificationService': 'notification.service',
    'notificationService': 'notification.service',
    'syncService.bridge': 'sync.service',
    'SyncService.bridge': 'sync.service',
    'SyncService': 'sync.service',
    'syncService': 'sync.service',
    'auditService.bridge': 'audit-log.service',
    'AuditService.bridge': 'audit-log.service',
    'AuditService': 'audit.service',
    'auditService': 'audit.service',
    'SecurityAuditService.bridge': 'security-audit.service',
    'SecurityAuditService': 'security-audit.service',
    'rateLimitService.bridge': 'rate-limit.service',
    'rateLimitService': 'rate-limit.service',
    'RateLimitService': 'rate-limit.service',
    'webauthnService.bridge': 'webauthn.service',
    'webauthnService': 'webauthn.service',
    'WebauthnService': 'webauthn.service',
    'webhookService.bridge': 'webhook.service',
    'webhookService': 'webhook.service',
    'WebhookService': 'webhook.service',
    'webSocketService.bridge': 'websocket.service',
    'webSocketService': 'websocket.service',
    'WebSocketService': 'socket-service',
    'searchService.bridge': 'search.service',
    'searchService': 'search.service',
    'SearchService': 'search.service',
    'StudentService.bridge': 'student.service',
    'StudentService': 'student.service',
    'studentService': 'student.service',
    'teacherService.bridge': 'teacher.service',
    'teacherService': 'teacher.service',
    'TeacherService': 'teacher.service',
    'TournamentsService.bridge': 'tournaments.service',
    'TournamentsService': 'tournaments.service',
    'tournamentsService': 'tournaments.service',
    'stripePaymentsService.bridge': 'stripe-payments.service',
    'stripePaymentsService': 'stripe-payments.service',
    'StripePaymentsService': 'stripe-payments.service',
    'gamificationService.bridge': 'gamification.service',
    'gamificationService': 'gamification.service',
    'GamificationService': 'gamification.service'
};

let filesUpdated = 0;
let importsReplaced = 0;

for (const file of allBackendFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    for (const [legacy, canonical] of Object.entries(CANONICAL_MAPPING)) {
        const regex = new RegExp(`(['"\`].*?\\/services\\/)${legacy}(?:\\.js)?(['"\`])`, 'g');
        content = content.replace(regex, (match, prefix, suffix) => {
            importsReplaced++;
            return `${prefix}${canonical}${suffix}`;
        });
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesUpdated++;
        console.log(`  🔄 Updated imports in: ${path.relative(ROOT_DIR, file)}`);
    }
}

console.log(`\n✅ Imports updated: ${importsReplaced} across ${filesUpdated} files.`);

// Now list and delete bridge files and orphan .d.ts / .map in backend/services
const serviceFiles = fs.readdirSync(SERVICES_DIR);
let deletedCount = 0;

for (const file of serviceFiles) {
    const fullPath = path.join(SERVICES_DIR, file);
    if (!fs.statSync(fullPath).isFile()) continue;

    const isBridge = file.includes('.bridge.');
    const isMap = file.endsWith('.map');
    const isDts = file.endsWith('.d.ts');

    if (isBridge || isMap || isDts) {
        fs.unlinkSync(fullPath);
        deletedCount++;
        console.log(`  🗑️ Deleted artifact: backend/services/${file}`);
    }
}

console.log(`\n🧹 Cleaned up ${deletedCount} bridge/artifact files from backend/services.`);
