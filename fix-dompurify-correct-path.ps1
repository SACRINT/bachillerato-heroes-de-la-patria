# Script para CORREGIR la ruta incorrecta de DOMPurify
# Cambiar de /node_modules/isomorphic-dompurify/dist/purify.min.js (INCORRECTA)
# a /node_modules/dompurify/dist/purify.min.js (CORRECTA)

$htmlFiles = @(
    "ar-vr-lab.html",
    "aviso-privacidad.html",
    "biblioteca.html",
    "bolsa-trabajo.html",
    "calendario.html",
    "calificaciones.html",
    "chatbot.html",
    "citas.html",
    "comunidad.html",
    "conocenos.html",
    "contacto.html",
    "convocatorias.html",
    "descargas.html",
    "docentes.html",
    "egresados.html",
    "estudiantes.html",
    "index.html",
    "mensajeria.html",
    "normatividad.html",
    "oferta-educativa.html",
    "padres.html",
    "pagos.html",
    "privacidad.html",
    "reglamento.html",
    "servicios.html",
    "sitios-interes.html",
    "soporte.html",
    "tenants-admin.html",
    "terminos.html",
    "transparencia.html"
)

$publicPath = "C:\03_BachilleratoHeroesWeb\public"

# PATRÓN: Reemplazar la ruta incorrecta por la correcta
$oldPath = "/node_modules/isomorphic-dompurify/dist/purify.min.js"
$newPath = "/node_modules/dompurify/dist/purify.min.js"

$count = 0
$filesModified = @()

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $publicPath $file

    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw -Encoding UTF8

        # Verificar si el archivo contiene la ruta incorrecta
        if ($content -contains $oldPath) {
            # Reemplazar la ruta incorrecta por la correcta
            $newContent = $content -replace [regex]::Escape($oldPath), $newPath

            Set-Content $filePath $newContent -Encoding UTF8
            Write-Host "✅ CORREGIDO: $file"
            $filesModified += $file
            $count++
        } else {
            Write-Host "⚠️  No encontrada ruta incorrecta en: $file"
        }
    } else {
        Write-Host "❌ Archivo no encontrado: $filePath"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Corrección completada: $count archivos modificados"
Write-Host "=========================================="
Write-Host ""
Write-Host "Archivos modificados:"
$filesModified | ForEach-Object { Write-Host "  - $_" }
