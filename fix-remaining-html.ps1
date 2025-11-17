# Script PowerShell para reparar DOMPurify en los 26 archivos HTML restantes
# Reemplaza isomorphic-dompurify con dompurify@3.0.6 y agrega debug-logger.js

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
    "egresados.html",
    "encuestas.html",
    "mensajeria.html",
    "normatividad.html",
    "oferta-educativa.html",
    "pagos.html",
    "privacidad.html",
    "reglamento.html",
    "servicios.html",
    "sitios-interes.html",
    "soporte.html",
    "tenants-admin.html",
    "terminos.html"
)

$repairCount = 0

foreach ($file in $htmlFiles) {
    $filePath = "public\$file"

    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  Archivo no encontrado: $filePath" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content -Path $filePath -Raw -Encoding UTF8

    # Verificar si necesita reparación (tiene isomorphic-dompurify)
    if ($content -notmatch "isomorphic-dompurify") {
        Write-Host "✅ Ya está reparado: $file"
        continue
    }

    # Reemplazar isomorphic-dompurify con dompurify@3.0.6
    $content = $content -replace `
        'https://cdn\.jsdelivr\.net/npm/isomorphic-dompurify/dist/purify\.min\.js', `
        'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js'

    # Agregar debug-logger.js si no existe
    if ($content -notmatch "debug-logger\.js") {
        # Patrón: buscar "🔒 DOMPurify" y agregar debug-logger antes
        $content = $content -replace `
            '(\s+)<!-- 🔒 DOMPurify', `
            '    <!-- 📝 Debug Logger - Logging condicional GDPR-compliant -->
    <script src="js/debug-logger.js"></script>

$1<!-- 🔒 DOMPurify'
    }

    # Guardar archivo
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -Force
    $repairCount++
    Write-Host "✅ Reparado: $file" -ForegroundColor Green
}

Write-Host "`n✅ Total reparados: $repairCount archivos HTML" -ForegroundColor Green
Write-Host "✅ DOMPurify ahora usa versión browser (dompurify@3.0.6)" -ForegroundColor Green
Write-Host "✅ Debug-logger.js agregado para logging GDPR-compliant" -ForegroundColor Green
