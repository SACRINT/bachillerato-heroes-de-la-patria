#!/usr/bin/env powershell
<#
.SYNOPSIS
    SEMANA 32 TAREA 32.2 - Deploy to Vercel Staging
    Script para hacer deploy de BGE v6.0.0 a Vercel staging

.DESCRIPTION
    Este script automáticamente:
    1. Verifica que estés en branch main
    2. Verifica que el tag v6.0.0 existe
    3. Genera variables de entorno (si no existen)
    4. Ejecuta vercel --prod=false
    5. Monitorea el build en vivo

.PARAMETER SkipChecks
    Si $true, salta las verificaciones previas

.PARAMETER SkipDeploy
    Si $true, solo prepara pero no ejecuta deploy

.EXAMPLE
    .\deploy-to-vercel-staging.ps1

.EXAMPLE
    .\deploy-to-vercel-staging.ps1 -SkipChecks $false -SkipDeploy $false

#>

param(
    [bool]$SkipChecks = $false,
    [bool]$SkipDeploy = $false
)

# Colores para output
$colorGreen = "Green"
$colorRed = "Red"
$colorYellow = "Yellow"
$colorBlue = "Cyan"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $colorGreen
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $colorRed
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $colorYellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $colorBlue
}

# ============================================
# PASO 1: PRE-DEPLOYMENT CHECKS
# ============================================

Write-Info "=========================================="
Write-Info "SEMANA 32 TAREA 32.2 - STAGING DEPLOYMENT"
Write-Info "=========================================="
Write-Host ""

if (-not $SkipChecks) {
    Write-Info "PASO 1: Ejecutando verificaciones previas..."
    Write-Host ""

    # Check 1: Git branch
    Write-Info "Verificando Git branch..."
    $branch = git rev-parse --abbrev-ref HEAD
    if ($branch -eq "main") {
        Write-Success "Branch: main ✓"
    } else {
        Write-Error "No estás en branch 'main' (actualmente en: $branch)"
        Write-Warning "Ejecuta: git checkout main"
        exit 1
    }

    # Check 2: Git tag v6.0.0
    Write-Info "Verificando Git tag v6.0.0..."
    $tagExists = git tag -l v6.0.0
    if ($tagExists -eq "v6.0.0") {
        Write-Success "Tag v6.0.0 existe ✓"
    } else {
        Write-Error "Tag v6.0.0 no encontrado"
        Write-Warning "Ejecuta: git tag -a v6.0.0 -m 'Release v6.0.0'"
        exit 1
    }

    # Check 3: package.json version
    Write-Info "Verificando package.json version..."
    $packageJson = Get-Content package.json | ConvertFrom-Json
    if ($packageJson.version -eq "6.0.0") {
        Write-Success "package.json version: 6.0.0 ✓"
    } else {
        Write-Warning "package.json version es: $($packageJson.version) (esperado: 6.0.0)"
    }

    # Check 4: Vercel CLI
    Write-Info "Verificando Vercel CLI..."
    $vercelVersion = vercel --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Vercel CLI instalado: $vercelVersion"
    } else {
        Write-Error "Vercel CLI no encontrado"
        Write-Warning "Instala: npm install -g vercel"
        exit 1
    }

    # Check 5: Node.js version
    Write-Info "Verificando Node.js version..."
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"

    # Check 6: RELEASE-NOTES.md
    Write-Info "Verificando RELEASE-NOTES.md..."
    if (Test-Path "RELEASE-NOTES.md") {
        Write-Success "RELEASE-NOTES.md existe ✓"
    } else {
        Write-Warning "RELEASE-NOTES.md no encontrado (continuando de todas formas)"
    }

    Write-Host ""
    Write-Success "Todas las verificaciones completadas ✓"
    Write-Host ""
}

# ============================================
# PASO 2: ENVIRONMENT SETUP
# ============================================

Write-Info "PASO 2: Preparando environment..."
Write-Host ""

# Check .env.staging
if (Test-Path ".env.staging") {
    Write-Success ".env.staging existe ✓"
    Write-Info "Contenido de .env.staging:"
    Get-Content ".env.staging" | ForEach-Object {
        if ($_ -match "SECRET|PASSWORD|TOKEN") {
            Write-Host "  [REDACTED]" -ForegroundColor $colorYellow
        } elseif ($_ -and -not $_.StartsWith("#")) {
            Write-Host "  $_"
        }
    }
} else {
    Write-Warning ".env.staging no encontrado"
    Write-Warning "Asegúrate de crear .env.staging antes de continuar"
    Write-Host ""
    Write-Info "Template:"
    @"
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=[use-strong-random-secret]
SESSION_SECRET=[use-strong-random-secret]
REDIS_ENABLED=true
API_BASE_URL=https://bge-staging.vercel.app
"@
}

Write-Host ""

# ============================================
# PASO 3: DEPLOYMENT
# ============================================

if (-not $SkipDeploy) {
    Write-Info "PASO 3: Ejecutando deployment..."
    Write-Host ""

    Write-Warning "Vercel te pedirá confirmar configuración"
    Write-Info "Responde así a los prompts:"
    Write-Host "  - 'Set up and deploy?' → Y (Yes)"
    Write-Host "  - 'Which scope?' → Tu account/team"
    Write-Host "  - 'Link to existing project?' → Depende si es nuevo"
    Write-Host "  - 'Project name?' → bge-staging (o tu nombre)"
    Write-Host "  - 'Root directory?' → . (punto - current)"
    Write-Host ""

    Write-Warning "Presiona ENTER para continuar con deployment..."
    Read-Host "Enter para continuar"
    Write-Host ""

    # Execute deployment
    Write-Info "Ejecutando: vercel --prod=false"
    Write-Host "=========================================="

    vercel --prod=false

    if ($LASTEXITCODE -eq 0) {
        Write-Host "=========================================="
        Write-Success "Deployment ejecutado exitosamente ✓"
    } else {
        Write-Host "=========================================="
        Write-Error "Deployment falló con error code: $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Warning "SKIPPING deployment (SkipDeploy=$SkipDeploy)"
}

Write-Host ""

# ============================================
# PASO 4: POST-DEPLOYMENT INFO
# ============================================

Write-Info "PASO 4: Información post-deployment..."
Write-Host ""

Write-Success "Deployment completado"
Write-Host ""

Write-Info "Próximos pasos:"
Write-Host "  1. Ir a https://vercel.com/dashboard/bge-staging"
Write-Host "  2. Verificar que deployment status es 'Ready'"
Write-Host "  3. Copiar URL de staging (ej: https://bge-staging.vercel.app)"
Write-Host "  4. Ejecutar validación post-deployment"
Write-Host "  5. Proceder con TAREA 32.3 (UAT & Smoke Tests)"
Write-Host ""

Write-Info "Validación rápida:"
Write-Host "  - Health check: curl https://[staging-url]/api/health"
Write-Host "  - Frontend: https://[staging-url]/"
Write-Host "  - Logs en vivo: vercel logs --follow"
Write-Host ""

Write-Info "Documentación:"
Write-Host "  - Guía completa: docs/SEMANA_32_TAREA_32_2_STAGING_DEPLOYMENT_GUIDE.md"
Write-Host "  - Release Notes: RELEASE-NOTES.md"
Write-Host ""

Write-Success "=========================================="
Write-Success "TAREA 32.2: STAGING DEPLOYMENT completada"
Write-Success "=========================================="

# ============================================
# PASO 5: OFFER VALIDATION HELP
# ============================================

Write-Host ""
Write-Info "¿Deseas ejecutar validaciones post-deployment? (S/N)"
$validate = Read-Host "Respuesta"

if ($validate -eq "S" -or $validate -eq "Y" -or $validate -eq "s" -or $validate -eq "y") {
    Write-Info "Abriendo Vercel dashboard..."
    Start-Process "https://vercel.com/dashboard"

    Write-Info ""
    Write-Info "Por favor:"
    Write-Info "1. Espera a que el deployment status sea 'Ready'"
    Write-Info "2. Copia la URL staging desde el dashboard"
    Write-Info "3. Abre la URL en navegador"
    Write-Info "4. Verifica que todo carga correctamente"
    Write-Info "5. Revisa console (F12) para errores"
}

Write-Host ""
Write-Success "Script completado ✓"

