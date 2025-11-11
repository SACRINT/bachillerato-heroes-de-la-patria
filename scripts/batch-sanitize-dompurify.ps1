# 🔒 SCRIPT DE SANITIZACIÓN AUTOMÁTICA - FASE 2
# Propósito: Automatizar reemplazo de innerHTML/outerHTML con sanitizeHTML()
# Fecha: 11 Noviembre 2025

# ============================================
# CONFIGURACIÓN
# ============================================

$ProjectRoot = "C:\03_BachilleratoHeroesWeb"
$PublicJsDir = Join-Path $ProjectRoot "public\js"
$JsDir = Join-Path $ProjectRoot "js"

# Arrays de archivos ALTO y MEDIO prioridad
$AltoProriority = @(
    "admin-dashboard.js",
    "solicitudes-manager.js",
    "approvals-manager.js",
    "modal-manager.js",
    "professional-forms.js",
    "calendar-manager.js",
    "student-dashboard.js",
    "dashboard-manager-2025.js",
    "admin-dashboard-table-manager.js",
    "admin-dashboard-modal-manager.js",
    "admin-dashboard-events.js",
    "cms-manager.js",
    "content-editor.js",
    "data-table-manager.js",
    "form-validator.js",
    "notification-manager.js",
    "search-interface.js",
    "settings-panel.js",
    "user-profile-manager.js",
    "analytics-dashboard.js",
    "report-generator.js",
    "export-manager.js",
    "import-manager.js",
    "file-manager.js",
    "media-manager.js",
    "gallery-manager.js",
    "chart-builder.js",
    "widget-manager.js",
    "theme-customizer.js",
    "color-picker.js",
    "layout-builder.js",
    "component-library.js",
    "ui-framework.js",
    "template-engine.js",
    "html-generator.js"
)

# ============================================
# FUNCIONES
# ============================================

function Show-Progress {
    param([string]$Message, [string]$Status = "INFO")

    $colors = @{
        "INFO"    = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR"   = "Red"
    }

    Write-Host "[$Status] $Message" -ForegroundColor $colors[$Status]
}

function Sanitize-File {
    param(
        [string]$FilePath,
        [string]$Priority = "ALTO"
    )

    if (-not (Test-Path $FilePath)) {
        Show-Progress "Archivo no encontrado: $FilePath" "WARNING"
        return @{ Success = $false; Changes = 0 }
    }

    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        $changeCount = 0

        # Patrón 1: innerHTML = ... (ALTO prioridad)
        if ($Priority -eq "ALTO" -or $Priority -eq "AMBOS") {
            $pattern1 = '(\w+\.innerHTML\s*=\s*)(["\'])([^"\']*)\3'
            $replacement1 = '$1sanitizeHTML($2$3$2)'

            $content = [regex]::Replace($content, $pattern1, {
                param($match)
                $varName = $match.Groups[1].Value
                $quote = $match.Groups[2].Value
                $value = $match.Groups[3].Value

                # Evitar double-wrapping
                if (-not $value.StartsWith("sanitizeHTML(")) {
                    return "$varName sanitizeHTML($quote$value$quote)"
                }
                return $match.Value
            })
        }

        # Patrón 2: innerHTML += ... (ALTO prioridad)
        if ($Priority -eq "ALTO" -or $Priority -eq "AMBOS") {
            $pattern2 = '(\w+\.innerHTML\s*\+=\s*)(["\'])([^"\']*)\3'
            $content = [regex]::Replace($content, $pattern2, {
                param($match)
                $varName = $match.Groups[1].Value
                $quote = $match.Groups[2].Value
                $value = $match.Groups[3].Value

                if (-not $value.StartsWith("sanitizeHTML(")) {
                    return "$varName sanitizeHTML($quote$value$quote)"
                }
                return $match.Value
            })
        }

        # Patrón 3: insertAdjacentHTML(...) (ALTO prioridad)
        if ($Priority -eq "ALTO" -or $Priority -eq "AMBOS") {
            $pattern3 = 'insertAdjacentHTML\(\s*(["\'])([^"\']*)\1\s*,\s*(["\'])([^"\']*)\3'
            $content = [regex]::Replace($content, $pattern3, {
                param($match)
                $pos = $match.Groups[1].Value
                $html = $match.Groups[4].Value

                if (-not $html.StartsWith("sanitizeHTML(")) {
                    return "insertAdjacentHTML($pos, sanitizeHTML(`"$html`")"
                }
                return $match.Value
            })
        }

        # Patrón 4: setAttribute/data attributes (MEDIO prioridad)
        if ($Priority -eq "MEDIO" -or $Priority -eq "AMBOS") {
            $pattern4 = 'setAttribute\(\s*(["\'])data-([^"\']*)\1\s*,\s*(["\'])([^"\']*)\3'
            $content = [regex]::Replace($content, $pattern4, {
                param($match)
                $attrName = $match.Groups[2].Value
                $quote = $match.Groups[3].Value
                $value = $match.Groups[4].Value

                if (-not $value.StartsWith("sanitizeText(")) {
                    return "setAttribute(`"data-$attrName`", sanitizeText($quote$value$quote))"
                }
                return $match.Value
            })
        }

        # Contar cambios
        if ($content -ne $originalContent) {
            $changeCount = [regex]::Matches($originalContent, 'innerHTML|insertAdjacentHTML|setAttribute').Count

            # Guardar archivo modificado
            Set-Content $FilePath $content -Encoding UTF8
            Show-Progress "Sanitizado: $FilePath ($changeCount patterns)" "SUCCESS"

            return @{ Success = $true; Changes = $changeCount }
        }
        else {
            Show-Progress "Sin cambios necesarios: $FilePath" "INFO"
            return @{ Success = $true; Changes = 0 }
        }
    }
    catch {
        Show-Progress "Error procesando $FilePath : $_" "ERROR"
        return @{ Success = $false; Changes = 0 }
    }
}

function Sync-Files {
    param([string]$SourceDir, [string]$TargetDir, [string[]]$FileList)

    foreach ($file in $FileList) {
        $sourcePath = Join-Path $SourceDir $file
        $targetPath = Join-Path $TargetDir $file

        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $targetPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# ============================================
# EJECUCIÓN PRINCIPAL
# ============================================

Show-Progress "Iniciando sanitización FASE 2..." "INFO"
Show-Progress "Directorio base: $ProjectRoot" "INFO"

# Procesar ALTO prioridad
Show-Progress "Procesando 35 archivos ALTO prioridad..." "INFO"

$altoCounts = @()
foreach ($file in $AltoProriority) {
    $filePath = Join-Path $PublicJsDir $file
    $result = Sanitize-File -FilePath $filePath -Priority "ALTO"
    $altoCounts += $result.Changes
}

$altoTotal = ($altoCounts | Measure-Object -Sum).Sum
Show-Progress "ALTO Prioridad: $($AltoProriority.Count) archivos, $altoTotal cambios totales" "SUCCESS"

# Sincronizar a /js/
Show-Progress "Sincronizando archivos ALTO a /js/..." "INFO"
Sync-Files -SourceDir $PublicJsDir -TargetDir $JsDir -FileList $AltoProriority

Show-Progress "✅ Sanitización FASE 2 completada" "SUCCESS"
Show-Progress "Total de archivos procesados: $($AltoProriority.Count)" "SUCCESS"
Show-Progress "Total de cambios aplicados: $altoTotal" "SUCCESS"
