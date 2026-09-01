<#
.SYNOPSIS
    Script de limpieza White-Label para SIPWEB-BG / EDUZONA EMS
.DESCRIPTION
    Escanea archivos HTML, JS y CSS en busca de referencias hardcodeadas
    a "Héroes de la Patria", "BGE" y otros datos específicos de escuela.
    Genera un reporte de las referencias encontradas.
.NOTES
    FASE 0 - Limpieza Profunda
    Versión: 1.0.0
    Fecha: 2026-09-01
#>

param(
    [string]$ScanPath = ".\public",
    [string]$ReportPath = ".\docs\WHITE-LABEL-CLEANUP-REPORT.md",
    [switch]$WhatIf = $true
)

$ErrorActionPreference = "Continue"

# Patrones a buscar (expresiones regulares)
$Patterns = @(
    @{ Name = "Héroes de la Patria";       Regex = 'H[eé]roes\s+de\s+la\s+Patria' },
    @{ Name = "Héroes de la Patria (comillas)"; Regex = '"H[eé]roes\s+de\s+la\s+Patria"' },
    @{ Name = "BGE Héroes";                Regex = 'BGE\s+H[eé]roes' },
    @{ Name = "Bachillerato General Estatal"; Regex = 'Bachillerato\s+General\s+Estatal' },
    @{ Name = "Bachillerato General por Competencias"; Regex = 'Bachillerato\s+General\s+por\s+Competencias' },
    @{ Name = "Coronel Tito Hernández";    Regex = 'Coronel\s+Tito\s+Hern[aá]ndez' },
    @{ Name = "Venustiano Carranza";        Regex = 'Venustiano\s+Carranza' },
    @{ Name = "21EBH0200X";                Regex = '21EBH0200[Xx]' },
    @{ Name = "21EBH0200";                 Regex = '21EBH0200' },
    @{ Name = "heroespatria.edu.mx";       Regex = 'heroespatria\.edu\.mx' },
    @{ Name = "heroes-de-la-patria";       Regex = 'heroes[-_]de[-_]la[-_]patria' },
    @{ Name = "facebook heroes";           Regex = 'facebook\.com/heroesdelapatria' },
    @{ Name = "21ebh0200x.sep";            Regex = '21ebh0200x\.sep' }
)

# Archivos excluidos
$ExcludedFiles = @(
    "node_modules",
    ".git",
    "no_usados",
    "CHANGELOG.md",
    "MASTER-CHECKLIST*.md",
    "CLAUDE.md",
    "docs/",
    "scripts/white-label-cleanup.ps1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA WHITE-LABEL - SIPWEB-BG" -ForegroundColor Cyan
Write-Host "  FASE 0: Detección de Referencias" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Escaneando: $ScanPath" -ForegroundColor Yellow
Write-Host ""

# Obtener archivos a escanear
$Extensions = @("*.html", "*.js", "*.css", "*.json")
$Files = @()
foreach ($Ext in $Extensions) {
    $Files += Get-ChildItem -Path $ScanPath -Filter $Ext -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $f = $_.FullName
            $excluded = $false
            foreach ($ex in $ExcludedFiles) {
                if ($f -like "*$ex*") { $excluded = $true; break }
            }
            -not $excluded
        }
}

Write-Host "Archivos a escanear: $($Files.Count)" -ForegroundColor Green
Write-Host ""

# Resultados
$Results = @()
$TotalMatches = 0

foreach ($File in $Files) {
    $Content = Get-Content -Path $File.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $Content) { continue }

    $Lines = Get-Content -Path $File.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
    $FileMatches = 0

    foreach ($Pattern in $Patterns) {
        $Matches = [regex]::Matches($Content, $Pattern.Regex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($Matches.Count -gt 0) {
            $FileMatches += $Matches.Count
            $TotalMatches += $Matches.Count

            # Encontrar líneas específicas
            $LineNumbers = @()
            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -match $Pattern.Regex) {
                    $LineNumbers += $i + 1
                }
            }

            $Results += [PSCustomObject]@{
                File        = $File.FullName.Replace((Get-Location).Path + "\", "")
                Pattern     = $Pattern.Name
                Count       = $Matches.Count
                Lines       = ($LineNumbers -join ", ")
            }
        }
    }
}

# Generar reporte
$Report = @()
$Report += "# WHITE-LABEL CLEANUP REPORT"
$Report += ""
$Report += "**Fecha:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$Report += "**Archivos escaneados:** $($Files.Count)"
$Report += "**Total de referencias encontradas:** $TotalMatches"
$Report += ""
$Report += "## Resumen por Patrón"
$Report += ""
$Report += "| Patrón | Ocurrencias |"
$Report += "|--------|-------------|"

$Grouped = $Results | Group-Object -Property Pattern | Sort-Object -Property Count -Descending
foreach ($Group in $Grouped) {
    $Report += "| $($Group.Name) | $($Group.Count) |"
}

$Report += ""
$Report += "## Detalle por Archivo"
$Report += ""
$Report += "| Archivo | Patrón | Ocurrencias | Líneas |"
$Report += "|---------|--------|-------------|--------|"

foreach ($R in ($Results | Sort-Object -Property File)) {
    $Report += "| $($R.File) | $($R.Pattern) | $($R.Count) | $($R.Lines) |"
}

$Report += ""
$Report += "## Archivos Más Problemáticos (Top 10)"
$Report += ""

$TopFiles = $Results | Group-Object -Property File | Sort-Object -Property { ($_.Group | Measure-Object -Property Count -Sum).Sum } -Descending | Select-Object -First 10
$Rank = 1
foreach ($TF in $TopFiles) {
    $Sum = ($TF.Group | Measure-Object -Property Count -Sum).Sum
    $Report += "$Rank. **$($TF.Name)** - $Sum referencias"
    $Rank++
}

$Report += ""
$Report += "---"
$Report += ""
$Report += "## Instrucciones"
$Report += ""
$Report += "1. Revisar cada referencia encontrada"
$Report += "2. Determinar si es contenido visible (reemplazar con data-tenant-field)"
$Report += "3. Determinar si es contenido de metadatos (reemplazar con data-tenant-field)"
$Report += "4. Determinar si es código/commentario (evaluar si mantener)"
$Report += "5. Ejecutar `tenant-content-binder.js` para bindeo dinámico"
$Report += ""

# Guardar reporte
$ReportDir = Split-Path -Path $ReportPath -Parent
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}
$Report | Out-File -FilePath $ReportPath -Encoding UTF8 -Force

Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESULTADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Referencias encontradas: $TotalMatches" -ForegroundColor $(if ($TotalMatches -eq 0) { "Green" } elseif ($TotalMatches -lt 50) { "Yellow" } else { "Red" })
Write-Host "Archivos escaneados:    $($Files.Count)" -ForegroundColor Cyan
Write-Host "Reporte generado:       $ReportPath" -ForegroundColor Cyan
Write-Host ""

if ($TotalMatches -gt 0) {
    Write-Host "Top 5 archivos más problemáticos:" -ForegroundColor Yellow
    foreach ($TF in $TopFiles | Select-Object -First 5) {
        $Sum = ($TF.Group | Measure-Object -Property Count -Sum).Sum
        Write-Host "  - $($TF.Name): $Sum refs" -ForegroundColor Red
    }
}
