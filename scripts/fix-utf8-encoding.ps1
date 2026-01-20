# Script para corregir problemas de encoding UTF-8 en archivos HTML
# Ejecutar desde la raiz del proyecto

param(
    [string]$Path = "public",
    [switch]$DryRun = $false
)

# Mapeo usando caracteres unicode
# Patron corrupto -> Caracter correcto
$patterns = @(
    @{ Find = [char]0xC3 + [char]0xA9; Replace = [char]0xE9 },  # e con acento
    @{ Find = [char]0xC3 + [char]0xB3; Replace = [char]0xF3 },  # o con acento
    @{ Find = [char]0xC3 + [char]0xAD; Replace = [char]0xED },  # i con acento
    @{ Find = [char]0xC3 + [char]0xA1; Replace = [char]0xE1 },  # a con acento
    @{ Find = [char]0xC3 + [char]0xBA; Replace = [char]0xFA },  # u con acento
    @{ Find = [char]0xC3 + [char]0xB1; Replace = [char]0xF1 }   # n con tilde
)

$files = Get-ChildItem -Path $Path -Filter "*.html" -Recurse -File | Where-Object { $_.FullName -notlike "*\dist\*" }

Write-Host "Buscando archivos con problemas de encoding en: $Path" -ForegroundColor Cyan
Write-Host "Archivos encontrados: $($files.Count)" -ForegroundColor Yellow

$fixed = 0
$skipped = 0

foreach ($file in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $content = [System.Text.Encoding]::UTF8.GetString($bytes)
        $originalContent = $content
        $modified = $false
        
        foreach ($pattern in $patterns) {
            if ($content.Contains($pattern.Find)) {
                $content = $content.Replace($pattern.Find, $pattern.Replace)
                $modified = $true
            }
        }
        
        if ($modified) {
            if ($DryRun) {
                Write-Host "[DRY RUN] Se corrigiria: $($file.Name)" -ForegroundColor Yellow
            }
            else {
                $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
                Write-Host "[FIXED] $($file.Name)" -ForegroundColor Green
            }
            $fixed++
        }
        else {
            $skipped++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`nResumen:" -ForegroundColor Cyan
Write-Host "  Archivos corregidos: $fixed" -ForegroundColor Green
Write-Host "  Archivos sin cambios: $skipped" -ForegroundColor Gray
