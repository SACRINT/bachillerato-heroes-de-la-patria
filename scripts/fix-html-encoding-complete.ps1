#!/usr/bin/env pwsh

# Variables
$publicDir = "C:\03_BachilleratoHeroesWeb\public"
$outputLog = "C:\03_BachilleratoHeroesWeb\encoding-fix-log.txt"
$filesProcessed = 0
$filesFixed = 0

# Clear previous log
if (Test-Path $outputLog) { Remove-Item $outputLog }

function Log-Message {
    param([string]$message)
    Add-Content -Path $outputLog -Value $message
    Write-Host $message
}

Log-Message "=== CORRECCION DE ENCODING UTF-8 EN ARCHIVOS HTML ==="
Log-Message "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log-Message ""

# Get all HTML files
$htmlFiles = Get-ChildItem -Path $publicDir -Filter "*.html" -Recurse

Log-Message "Total de archivos HTML encontrados: $($htmlFiles.Count)"
Log-Message ""

foreach ($file in $htmlFiles) {
    $filesProcessed++
    $fileName = $file.Name
    $filePath = $file.FullName

    Write-Host "[$filesProcessed/$($htmlFiles.Count)] Procesando: $fileName" -ForegroundColor Cyan

    try {
        # Read file in UTF-8
        $encoding = New-Object System.Text.UTF8Encoding($false)
        [string]$content = [System.IO.File]::ReadAllText($filePath, $encoding)

        # Store original for comparison
        $originalContent = $content

        # Fix encoding issues
        $content = $content.Replace('HÃ©roes', 'Héroes')
        $content = $content.Replace('Ã©', 'é')
        $content = $content.Replace('Ã­', 'í')
        $content = $content.Replace('Ã³', 'ó')
        $content = $content.Replace('Ãº', 'ú')
        $content = $content.Replace('Ã±', 'ñ')
        $content = $content.Replace('Ã ', 'à')
        $content = $content.Replace('Ã§', 'ç')
        $content = $content.Replace('Â¡', '¡')
        $content = $content.Replace('Â¿', '¿')
        $content = $content.Replace('Ã—', '×')
        $content = $content.Replace('Ã¡', 'á')
        $content = $content.Replace('Ã¤', 'ä')
        $content = $content.Replace('Ã«', 'ë')
        $content = $content.Replace('Ã¯', 'ï')
        $content = $content.Replace('Ã¶', 'ö')
        $content = $content.Replace('Ã¼', 'ü')

        # If changes were made, save file
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($filePath, $content, $encoding)
            $filesFixed++
            Log-Message "  OK: $fileName (corregido)"
            Write-Host "     -> Cambios guardados" -ForegroundColor Green
        }
        else {
            Log-Message "  SKIP: $fileName (sin cambios)"
            Write-Host "     -> Sin cambios necesarios" -ForegroundColor Yellow
        }
    }
    catch {
        Log-Message "  ERROR: $fileName - $_"
        Write-Host "     -> Error: $_" -ForegroundColor Red
    }
}

Log-Message ""
Log-Message "=== RESUMEN ==="
Log-Message "Procesados: $filesProcessed"
Log-Message "Corregidos: $filesFixed"
Log-Message "Sin cambios: $($filesProcessed - $filesFixed)"

Write-Host ""
Write-Host "Completado: $filesFixed/$filesProcessed archivos corregidos" -ForegroundColor Green
