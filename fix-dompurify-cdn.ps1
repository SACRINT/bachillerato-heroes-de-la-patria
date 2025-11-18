# Script para ACTUALIZAR todas las referencias a DOMPurify al CDN jsDelivr
# Cambiar de fetch(/node_modules...) a CDN + loader

$htmlFiles = Get-ChildItem "C:\03_BachilleratoHeroesWeb\public" -Name "*.html" | ForEach-Object { $_ }

$oldPattern = @"
    <!-- 🔒 DOMPurify XSS Protection \(Cargado desde node_modules en lugar de CDN para evitar ORB\) -->
    <script>
        // Cargar DOMPurify desde node_modules via Express static
        // El servidor sirve node_modules como /node_modules
        fetch\('/node_modules/dompurify/dist/purify.min.js'\)
            \.then\(response => response\.text\(\)\)
            \.then\(code => \{
                // Crear un script que ejecute el código de DOMPurify
                const script = document\.createElement\('script'\);
                script\.textContent = code;
                document\.head\.appendChild\(script\);

                // Cargar dompurify-config después de que DOMPurify esté disponible
                const configScript = document\.createElement\('script'\);
                configScript\.src = 'js/dompurify-config\.js';
                document\.head\.appendChild\(configScript\);
            \}\)
            \.catch\(\(\) => \{
                // Fallback: Si falla, cargar dompurify-config de todas formas \(usará fallback\)
                const configScript = document\.createElement\('script'\);
                configScript\.src = 'js/dompurify-config\.js';
                document\.head\.appendChild\(configScript\);
            \}\);
    </script>
"@

$newScript = @"
    <!-- 🔒 DOMPurify XSS Protection (CDN jsDelivr) -->
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>

    <!-- 🔧 DOMPurify Loader & Config -->
    <script src="js/dompurify-loader.js"></script>
    <script src="js/dompurify-config.js"></script>
"@

$count = 0
$filesModified = @()

foreach ($file in $htmlFiles) {
    $filePath = Join-Path "C:\03_BachilleratoHeroesWeb\public" $file

    $content = Get-Content $filePath -Raw -Encoding UTF8

    # Verificar si el archivo contiene la ruta antigua
    if ($content -match [regex]::Escape("fetch('/node_modules/dompurify")) {
        # Reemplazar la ruta antigua por la nueva
        $newContent = $content -replace $oldPattern, $newScript

        Set-Content $filePath $newContent -Encoding UTF8
        Write-Host "✅ ACTUALIZADO: $file"
        $filesModified += $file
        $count++
    } else {
        Write-Host "⚠️  Ya actualizado o formato diferente: $file"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Actualización completada: $count archivos modificados"
Write-Host "=========================================="
if ($filesModified.Count -gt 0) {
    Write-Host ""
    Write-Host "Archivos modificados:"
    $filesModified | ForEach-Object { Write-Host "  - $_" }
}
