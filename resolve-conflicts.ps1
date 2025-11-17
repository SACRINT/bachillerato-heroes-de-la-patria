# Script para resolver conflictos de merge - Elegir la rama GDPR (incoming)
# Razón: Los cambios GDPR (debugLog + sanitizeHTML) son mejoras sobre los cambios XSS

Write-Host "🔧 Resolviendo conflictos - Elegir rama GDPR (incoming)" -ForegroundColor Cyan

# Resolver todos los conflictos eligiendo 'theirs' (GDPR incoming changes)
$conflictFiles = @(
    "public/js/admin-dashboard.js",
    "public/js/dashboard-manager-2025.js"
)

foreach ($file in $conflictFiles) {
    Write-Host "📝 Resolviendo $file..." -ForegroundColor Yellow
    
    # Elegir la rama incoming (GDPR)
    git checkout --theirs $file
    git add $file
    
    Write-Host "✅ $file resuelto (GDPR)" -ForegroundColor Green
}

Write-Host "`n✅ Todos los conflictos resueltos" -ForegroundColor Green
git status
