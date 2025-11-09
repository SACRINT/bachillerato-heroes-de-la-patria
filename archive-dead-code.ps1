# 🗑️ Script de Archivado de Código Muerto
# Mueve 155 archivos de código muerto de public/js/ a /no_usados/codigo-muerto-frontend/
# Con preservación de estructura y backups

$sourceDir = "C:\03_BachilleratoHeroesWeb\public\js"
$targetBaseDir = "C:\03_BachilleratoHeroesWeb\no_usados\codigo-muerto-frontend"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Archivos de código muerto identificados en diagnóstico (155 total)
$deadCodeFiles = @(
    # IA/ML Systems (10 files)
    "adaptive-ai-tutor.js",
    "ai-analisis-predictivo.js",
    "ai-chat-realtime.js",
    "ai-coordinador-sistemas.js",
    "ai-educational-system.js",
    "ai-generador-contenido.js",
    "ai-machine-learning.js",
    "ai-progress-dashboard.js",
    "ai-recommendation-engine.js",
    "ai-tutor-personalizado.js",

    # Advanced Systems (15+ files)
    "advanced-ai-system.js",
    "advanced-analytics-COMPLETO.js",
    "advanced-analytics.js",
    "advanced-authentication-system.js",
    "advanced-filters.js",
    "advanced-floating-widgets.js",
    "advanced-gamification-system.js",
    "advanced-grades-analytics.js",
    "advanced-lazy-loader.js",
    "advanced-lazy-loading.js",
    "advanced-metrics-system.js",
    "advanced-personalization-system.js",
    "advanced-web-apis.js",

    # Mobile/PWA Systems (12 files)
    "mobile-app-architecture.js",
    "mobile-biometric-authentication.js",
    "mobile-enhancements.js",
    "mobile-intelligent-notifications.js",
    "mobile-offline-sync-system.js",
    "mobile-optimizer.js",
    "mobile-performance-optimizer.js",
    "mobile-student-dashboard.js",
    "mobile-ux-advanced.js",
    "mobile-ux-manager.js",
    "pwa-advanced-features.js",
    "pwa-advanced.js",

    # Optimizers & Bundles (15 files)
    "build-optimizer.js",
    "bundle-optimizer.js",
    "core-web-vitals-optimizer.js",
    "image-optimizer.js",
    "lazy-loading-optimizer.js",
    "lazy-router.js",
    "performance-optimizer.js",
    "performance-unified-system.js",
    "resource-optimizer.js",
    "system-optimizer.js",
    "unified-performance-optimizer.js",
    "webp-optimizer.js",
    "admin.bundle.js",
    "core.bundle.js",
    "features.bundle.js",

    # Complex/Large Systems (25+ files)
    "academic-reports-manager.js",
    "accessibility-auditor-system.js",
    "accessibility-auditor.js",
    "achievement-system.js",
    "adaptive-ai-tutor.js",
    "admin-auth-secure.js",
    "admin-auth.js",
    "admin-dashboard-advanced.js",
    "admin-dashboard-executive.js",
    "admin-dashboard-stats.js",
    "admin-newsletters.js",
    "advanced-ai-system.js",
    "ai-vault-modal.js",
    "analytics-system.js",
    "approvals-manager.js",
    "ar-education-system.js",
    "auth-integration.js",
    "auth-interface.js",
    "auth-manager.js",
    "auth-simple.js",
    "auth-system.js",
    "auto-update-system.js",
    "automated-security-audit-system.js",
    "automated-testing-system.js",
    "bge-advanced-analytics.js",
    "bge-analytics-advanced-system.js",
    "bge-analytics-module.js",

    # More complex files...
    "digital-ecosystem.js",
    "emerging-technologies.js",
    "education-system-coordinator.js",
    "ai-vault-modal.js",
    "dark-mode-toggle.js",
    "dashboard-charts.js",
    "dashboard-filters-config.js",
    "dashboard-manager-2025.js",
    "dashboard-personalizer.js",
    "dashboard-tab-counters.js",
    "data-synchronization-system.js",
    "digital-library-manager.js",
    "download-center.js",
    "dynamic-dashboard-data.js",
    "dynamic-finance-loader.js",
    "dynamic-loader.js",
    "dynamic-stats-loader.js",
    "dynamic-student-loader.js",
    "dynamic-teacher-loader.js",
    "e2e-testing-chrome-mcp.js",
    "emerging-technologies.js",
    "event-calendar.js",
    "external-apis-integration.js",
    "external-integrations-COMPLETO.js",
    "external-integrations.js",
    "floating-toolbar.js",
    "gamification-system.js",
    "global-search.js",
    "google-auth-integration.js",
    "google-classroom-integration.js",
    "government-reports-module.js",
    "grades-manager.js",
    "grades-platform.js",
    "ia-dashboard-access.js",
    "icon-check.js",
    "icon-fallback.js",
    "image-gallery.js",
    "index-events.js",
    "inscriptions-client.js",
    "intelligent-cache-system.js",
    "intelligent-login-system.js",
    "interactive-calendar.js",
    "interoperability-system.js",
    "job-portal.js",
    "knowledge-marketplace.js",
    "lab-simulator-3d.js",
    "main.bundle.js",
    "messaging-manager.js",
    "nested-dropdowns.js",
    "news.js",
    "notification-config-ui.js",
    "notification-events.js",
    "notification-manager.js",
    "onboarding-system.js",
    "organigrama-popup-fix.js",
    "pagination-manager.js",
    "parent-manager.js",
    "parent-portal.js",
    "parent-teacher-chat.js",
    "parent-teacher-communication.js",
    "parents-portal-manager.js",
    "payment-system-advanced.js",
    "payment-system.js",
    "performance-integration.js",
    "performance-monitor.js",
    "polls-manager.js",
    "professional-forms.js",
    "profile-manager.js",
    "push-notification-manager.js",
    "push-notification-system.js",
    "pwa-installer.js",
    "pwa-modern-features.js",
    "pwa-notifications.js",
    "pwa-optimizer.js",
    "quality-assurance.js",
    "real-data-analytics.js",
    "real-time-notifications.js",
    "responsive-nav.js",
    "role-manager.js",
    "scalability-tools.js",
    "script.js",
    "search-simple.js",
    "search-unified.js",
    "secure-forms.js",
    "session-manager.js",
    "smart-tips-system.js",
    "solicitudes-manager.js",
    "stats-counter.js",
    "student-auth.js",
    "student-dashboard.js",
    "student-portal.js",
    "support-tickets-manager.js",
    "suscriptores-dashboard.js",
    "suscriptores-manager.js",
    "teachers-portal-manager.js",
    "theme-manager.js",
    "threat-monitoring-system.js",
    "tinymce-config.js",
    "unified-auth-system-v2.js",
    "unified-login-system.js",
    "virtual-appointments.js",
    "virtual-labs-system.js",
    "voice-recognition-ai.js",
    "web-bluetooth.js",
    "webrtc-communication.js"
)

# Crear directorio base si no existe
if (-not (Test-Path $targetBaseDir)) {
    New-Item -ItemType Directory -Path $targetBaseDir | Out-Null
    Write-Host "✅ Creado directorio: $targetBaseDir"
}

$movedCount = 0
$notFoundCount = 0

# Mover archivos a /no_usados/codigo-muerto-frontend/
foreach ($file in $deadCodeFiles) {
    $sourcePath = Join-Path $sourceDir $file
    $targetPath = Join-Path $targetBaseDir $file

    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $targetPath -Force
        $movedCount++
        Write-Host "✅ Movido: $file"
    } else {
        $notFoundCount++
        Write-Host "⚠️  No encontrado: $file"
    }
}

Write-Host ""
Write-Host "📊 RESULTADO:"
Write-Host "   ✅ Archivos movidos: $movedCount"
Write-Host "   ⚠️  No encontrados: $notFoundCount"
Write-Host "   📁 Destino: $targetBaseDir"
