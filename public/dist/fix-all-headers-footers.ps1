# Script para actualizar todas las páginas HTML con la estructura correcta de header/footer

$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -File

$count = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content

    # Reemplazar <div id="main-header"></div> con <header id="main-header"></header>
    $content = $content -replace '<div id="main-header"><\/div>', '<header id="main-header"></header>'

    # Reemplazar <div id="main-footer"></div> con <footer id="main-footer"></footer>
    $content = $content -replace '<div id="main-footer"><\/div>', '<footer id="main-footer"></footer>'

    # Si el contenido cambió, escribir el archivo
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "✓ Actualizado: $($file.Name)"
        $count++
    }
}

Write-Host ""
Write-Host "===================================="
Write-Host "Actualización completada:"
Write-Host "Archivos actualizados: $count de $($htmlFiles.Count)"
Write-Host "===================================="
