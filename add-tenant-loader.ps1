# Script para agregar tenant-config-loader.js a todos los archivos HTML
# Autor: Claude Code
# Fecha: 2025-11-10

$scriptTag = @"
    <!-- 🏢 TENANT CONFIG LOADER - Carga configuración multi-tenancy desde BD -->
    <script src="js/tenant-config-loader.js" defer></script>
"@

$files = @(
    'ar-vr-lab.html',
    'aviso-privacidad.html',
    'biblioteca.html',
    'bolsa-trabajo.html',
    'calendario.html',
    'calificaciones.html',
    'chatbot.html',
    'citas.html',
    'comunidad.html',
    'conocenos.html',
    'contacto.html',
    'convocatorias.html',
    'descargas.html',
    'egresados.html',
    'encuestas.html',
    'force-admin.html',
    'mensajeria.html',
    'normatividad.html',
    'oferta-educativa.html',
    'offline.html',
    'pagos.html',
    'privacidad.html',
    'reglamento.html',
    'servicios.html',
    'sitios-interes.html',
    'soporte.html',
    'tenants-admin.html',
    'terminos.html',
    'test-dashboard.html',
    'transparencia.html'
)

$count = 0
$modified = @()

foreach ($file in $files) {
    $filePath = Join-Path "C:\03_BachilleratoHeroesWeb\public" $file

    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw

        # Verificar que no tenga el script ya
        if ($content -notmatch 'tenant-config-loader.js') {
            # Verificar que tenga </body>
            if ($content -match '</body>') {
                # Insertar antes de </body>
                $newContent = $content -replace '(\s+)</body>', "`$1$scriptTag`n`n    </body>"
                Set-Content $filePath -Value $newContent -Encoding UTF8
                $count++
                $modified += $file
                Write-Host "✅ $file"
            } else {
                Write-Host "⚠️ $file (no </body> encontrado)"
            }
        } else {
            Write-Host "⏭️  $file (ya contiene el script)"
        }
    } else {
        Write-Host "❌ $file (archivo no encontrado)"
    }
}

Write-Host ""
Write-Host "==========================================="
Write-Host "RESUMEN"
Write-Host "==========================================="
Write-Host "Total modificados: $count/30"
Write-Host ""
Write-Host "Archivos modificados:"
$modified | ForEach-Object { Write-Host "  - $_" }
