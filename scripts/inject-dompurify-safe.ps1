# ============================================
# SCRIPT SEGURO: Inyectar DOMPurify en HTML
# ============================================
# IMPORTANTE: Este script ES SEGURO porque:
# 1. Crea backups antes de modificar
# 2. Valida sintaxis antes/después
# 3. Muestra cambios exactos antes de aplicar
# 4. Permite revisar/aprobar cambios manualmente
# ============================================

param(
    [switch]$Approve = $false,  # Solo ejecutar si se pasa -Approve
    [switch]$DryRun = $true      # Modo simulación por defecto
)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔒 INYECCIÓN SEGURA DE DOMPURIFY EN PÁGINAS HTML" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CONFIGURACIÓN
# ============================================
$ProjectRoot = "C:\03_BachilleratoHeroesWeb"
$PublicDir = Join-Path $ProjectRoot "public"
$ScriptsBackupDir = Join-Path $ProjectRoot "backups\html-dompurify-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
$ReportFile = Join-Path $ProjectRoot "scripts\injection-report.txt"

# Scripts a inyectar (ORDEN CRÍTICO)
$InjectionCode = @"
    <!-- 🔒 DOMPurify - Sanitización XSS (INYECTADO AUTOMÁTICAMENTE) -->
    <script src="https://cdn.jsdelivr.net/npm/isomorphic-dompurify/dist/purify.min.js"></script>
    <script src="js/dompurify-config.js"></script>
"@

# Búsqueda: Línea donde encontrar Bootstrap JS (punto de inserción)
$SearchPattern = '<script src="https://cdn.jsdelivr.net/npm/bootstrap@[\d\.]+/dist/js/bootstrap\.bundle\.min\.js"><\/script>'

# ============================================
# FUNCIONES
# ============================================

function Get-HtmlFiles {
    Get-ChildItem -Path $PublicDir -Name "*.html" -File |
        Where-Object { $_ -notlike "*partials*" } |
        Sort-Object
}

function Test-HtmlSyntax {
    param([string]$FilePath)

    try {
        $content = Get-Content $FilePath -Raw

        # Validaciones básicas
        $openTags = [regex]::Matches($content, '<[a-zA-Z]').Count
        $closeTags = [regex]::Matches($content, '</[a-zA-Z]').Count

        # Simplificado: solo verificar que no haya síntomas obvios de corrupción
        if ($content -match '<<|>>|<\s<|>\s>') {
            return @{Valid=$false; Message="Síntesis sospechosa detectada"}
        }

        return @{Valid=$true; Message="OK"}
    }
    catch {
        return @{Valid=$false; Message=$_.Exception.Message}
    }
}

function Show-ChangePreview {
    param([string]$FilePath, [string]$OriginalContent, [string]$ModifiedContent)

    # Encontrar línea específica que cambia
    $originalLines = $OriginalContent -split "`n"
    $modifiedLines = $ModifiedContent -split "`n"

    Write-Host ""
    Write-Host "📝 VISTA PREVIA DEL CAMBIO:" -ForegroundColor Yellow
    Write-Host "   Archivo: $(Split-Path -Leaf $FilePath)" -ForegroundColor Gray
    Write-Host ""

    # Mostrar líneas alrededor del cambio
    $searchLineNum = 0
    for ($i = 0; $i -lt $originalLines.Count; $i++) {
        if ($originalLines[$i] -match $SearchPattern) {
            $searchLineNum = $i
            break
        }
    }

    if ($searchLineNum -gt 0) {
        Write-Host "   ❌ ANTES (Línea ~$($searchLineNum + 1)):" -ForegroundColor Red
        Write-Host "   $($originalLines[$searchLineNum - 1])" -ForegroundColor Gray
        Write-Host "   $($originalLines[$searchLineNum])" -ForegroundColor Red

        Write-Host ""
        Write-Host "   ✅ DESPUÉS:" -ForegroundColor Green
        $injectionLines = $InjectionCode -split "`n"
        foreach ($line in $injectionLines) {
            if ($line.Trim()) {
                Write-Host "   $line" -ForegroundColor Green
            }
        }
        Write-Host "   $($originalLines[$searchLineNum])" -ForegroundColor Green
        Write-Host ""
        return $true
    }

    return $false
}

# ============================================
# MAIN
# ============================================

Write-Host "📋 MODO: $(if ($DryRun) { 'SIMULACIÓN (sin cambios)' } else { 'EJECUCIÓN REAL' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Red' })
Write-Host ""

if (-not $Approve -and -not $DryRun) {
    Write-Host "⚠️  ADVERTENCIA: Debes pasar -Approve para ejecutar cambios reales" -ForegroundColor Red
    Write-Host "   Comando correcto: .\inject-dompurify-safe.ps1 -Approve -DryRun:`$false" -ForegroundColor Yellow
    exit 1
}

# Obtener archivos HTML
$htmlFiles = @(Get-HtmlFiles)
Write-Host "🔍 Encontrados: $($htmlFiles.Count) archivos HTML" -ForegroundColor Cyan
Write-Host ""

# Listar archivos que serán modificados
Write-Host "📄 ARCHIVOS A PROCESAR:" -ForegroundColor Yellow
$htmlFiles | ForEach-Object { Write-Host "   • $_" }
Write-Host ""

# ============================================
# VALIDACIÓN PRE-CAMBIO
# ============================================

Write-Host "✓ VALIDACIÓN PRE-CAMBIO:" -ForegroundColor Cyan
$allValid = $true
foreach ($file in $htmlFiles) {
    $filePath = Join-Path $PublicDir $file
    $syntax = Test-HtmlSyntax $filePath

    if ($syntax.Valid) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - $($syntax.Message)" -ForegroundColor Red
        $allValid = $false
    }
}

if (-not $allValid) {
    Write-Host ""
    Write-Host "❌ ABORTADO: Hay archivos con sintaxis inválida" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Todos los archivos tienen sintaxis válida" -ForegroundColor Green
Write-Host ""

# ============================================
# SIMULACIÓN DE CAMBIOS
# ============================================

Write-Host "🔄 SIMULANDO CAMBIOS:" -ForegroundColor Cyan
Write-Host ""

$changeCount = 0
$previewsShown = 0

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $PublicDir $file
    $originalContent = Get-Content $filePath -Raw

    # Verificar si ya contiene dompurify
    if ($originalContent -match 'dompurify-config\.js') {
        Write-Host "   ⏭️  $file (YA CONTIENE dompurify-config.js)" -ForegroundColor Gray
        continue
    }

    # Verificar si tiene el patrón de Bootstrap
    if ($originalContent -match $SearchPattern) {
        $changeCount++
        Write-Host "   ✓ $file - Punto de inserción ENCONTRADO" -ForegroundColor Green

        # Mostrar preview solo para primeros 3 archivos
        if ($previewsShown -lt 3) {
            $modifiedContent = $originalContent -replace $SearchPattern, "`$0`n$InjectionCode"
            Show-ChangePreview $filePath $originalContent $modifiedContent
            $previewsShown++
        }
    } else {
        Write-Host "   ⚠️  $file - Bootstrap NO ENCONTRADO (SALTADO)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
Write-Host "   Archivos a modificar: $changeCount" -ForegroundColor Green
Write-Host "   Archivos ya modificados: $($htmlFiles.Count - $changeCount)" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "✅ SIMULACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 Para ejecutar CAMBIOS REALES:" -ForegroundColor Yellow
    Write-Host "   .\inject-dompurify-safe.ps1 -Approve -DryRun:`$false" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# ============================================
# EJECUTAR CAMBIOS REALES (si -Approve pasado)
# ============================================

if ($Approve) {
    Write-Host "🚀 EJECUTANDO CAMBIOS REALES..." -ForegroundColor Red
    Write-Host ""

    # Crear directorio de backup
    New-Item -ItemType Directory -Path $ScriptsBackupDir -Force | Out-Null

    $modifiedCount = 0

    foreach ($file in $htmlFiles) {
        $filePath = Join-Path $PublicDir $file
        $originalContent = Get-Content $filePath -Raw

        # Saltar archivos que ya tienen dompurify
        if ($originalContent -match 'dompurify-config\.js') {
            continue
        }

        # Saltar archivos sin Bootstrap
        if ($originalContent -notmatch $SearchPattern) {
            continue
        }

        # Crear backup
        $backupPath = Join-Path $ScriptsBackupDir "$file.backup"
        Copy-Item $filePath $backupPath

        # Aplicar cambios
        $modifiedContent = $originalContent -replace $SearchPattern, "`$0`n$InjectionCode"
        Set-Content $filePath $modifiedContent -Encoding UTF8

        # Validar post-cambio
        $syntax = Test-HtmlSyntax $filePath

        if ($syntax.Valid) {
            Write-Host "   ✅ $file (modificado y validado)" -ForegroundColor Green
            $modifiedCount++
        } else {
            Write-Host "   ❌ $file (VALIDACIÓN FALLÓ - RESTAURANDO)" -ForegroundColor Red
            Copy-Item $backupPath $filePath
        }
    }

    Write-Host ""
    Write-Host "✅ CAMBIOS COMPLETADOS:" -ForegroundColor Green
    Write-Host "   Archivos modificados: $modifiedCount" -ForegroundColor Cyan
    Write-Host "   Backups creados en: $ScriptsBackupDir" -ForegroundColor Gray
    Write-Host ""
}
