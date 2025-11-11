# Script para corregir encoding UTF-8 en todos los archivos HTML
# Busca caracteres rotos típicos de degradación UTF-8 (HÃ© = Hé, Ã± = ñ, etc.)

$publicDir = "C:\03_BachilleratoHeroesWeb\public"
$filesToFix = @()

# Mapeo de caracteres rotos a correctos
$replacements = @{
    "HÃ©roes" = "Héroes"
    "HÃ¡"     = "á"
    "Ã©"      = "é"
    "Ã­"      = "í"
    "Ã³"      = "ó"
    "Ãº"      = "ú"
    "Ã±"      = "ñ"
    "Ã¡"      = "á"
    "Ã "      = "à"
    "Ã§"      = "ç"
    "Ã"       = "Á"
    "Ã‰"      = "É"
    "Ã"       = "Í"
    "Ã"       = "Ó"
    "Ã"       = "Ú"
    "Ã'"      = "Ñ"
    "MensajerÃ­a" = "Mensajería"
    "MensajerÃ­a Interna" = "Mensajería Interna"
    "Sistema de PagosÂ" = "Sistema de Pagos"
    "ConÃ³cenos" = "Conócenos"
    "BibliotecaÂ" = "Biblioteca"
}

Write-Host "🔧 Escaneando archivos HTML en: $publicDir" -ForegroundColor Cyan

Get-ChildItem -Path $publicDir -Filter "*.html" -File | ForEach-Object {
    $filePath = $_.FullName
    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    $fixed = $false

    # Buscar caracteres rotos
    foreach ($pattern in $replacements.Keys) {
        if ($content -match $pattern) {
            Write-Host "  ⚠️  $($_.Name) contiene: '$pattern'" -ForegroundColor Yellow
            $content = $content -replace [regex]::Escape($pattern), $replacements[$pattern]
            $fixed = $true
        }
    }

    if ($fixed) {
        # Guardar con encoding UTF-8
        [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
        Write-Host "  ✅ CORREGIDO: $($_.Name)" -ForegroundColor Green
        $filesToFix += $_.Name
    }
    else {
        Write-Host "  ✓ OK: $($_.Name)" -ForegroundColor DarkGreen
    }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "📊 Resumen de correcciones:" -ForegroundColor Cyan
Write-Host "   Total archivos escaneados: $((Get-ChildItem -Path $publicDir -Filter '*.html' -File).Count)"
Write-Host "   Archivos corregidos: $($filesToFix.Count)"

if ($filesToFix.Count -gt 0) {
    Write-Host "`n   Archivos corregidos:" -ForegroundColor Green
    $filesToFix | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Green
    }
}

Write-Host "`n✅ Tarea completada" -ForegroundColor Green
