# SCRIPT SIMPLE Y SEGURO - Inyectar DOMPurify en HTML
# ============================================

param([switch]$Execute = $false)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔒 INYECCIÓN SEGURA DE DOMPURIFY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\03_BachilleratoHeroesWeb"
$PublicDir = Join-Path $ProjectRoot "public"

# Código a inyectar (DESPUÉS de bootstrap)
$DomPurifyCode = @"

    <!-- 🔒 DOMPurify XSS Protection (INYECTADO AUTOMÁTICAMENTE) -->
    <script src="https://cdn.jsdelivr.net/npm/isomorphic-dompurify/dist/purify.min.js"></script>
    <script src="js/dompurify-config.js"></script>
"@

Write-Host "MODO: $(if ($Execute) { 'EJECUCIÓN REAL' } else { 'SIMULACIÓN (solo vista previa)' })" -ForegroundColor $(if ($Execute) { 'Red' } else { 'Yellow' })
Write-Host ""

# Obtener archivos HTML
$HtmlFiles = @(Get-ChildItem -Path $PublicDir -Name "*.html" -File | Where-Object { $_ -notlike "*partials*" } | Sort-Object)
Write-Host "Archivos a procesar: $($HtmlFiles.Count)" -ForegroundColor Cyan
Write-Host ""

$ModifiedCount = 0

foreach ($FileName in $HtmlFiles) {
    $FilePath = Join-Path $PublicDir $FileName
    $Content = Get-Content $FilePath -Raw

    # Verificar si ya tiene dompurify-config
    if ($Content -like "*dompurify-config.js*") {
        Write-Host "  ⏭️  $FileName (YA TIENE dompurify-config.js)" -ForegroundColor Gray
        continue
    }

    # Buscar línea de bootstrap
    if ($Content -like "*bootstrap.bundle.min.js*") {
        Write-Host "  ✓ $FileName" -ForegroundColor Green

        # SIMULACIÓN: mostrar lo que se va a cambiar
        if (-not $Execute) {
            # Encontrar y mostrar contexto
            $Lines = $Content -split "`n"
            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -like "*bootstrap.bundle.min.js*") {
                    Write-Host "    Línea ~$($i+1): insertaría DOMPurify DESPUÉS de bootstrap" -ForegroundColor Yellow
                    Write-Host "      $($Lines[$i].Substring(0, [Math]::Min(80, $Lines[$i].Length)))..." -ForegroundColor Gray
                    break
                }
            }
        }

        $ModifiedCount++

        # EJECUCIÓN REAL
        if ($Execute) {
            # Crear backup
            $BackupPath = "$FilePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item $FilePath $BackupPath
            Write-Host "    ✓ Backup creado: $(Split-Path -Leaf $BackupPath)" -ForegroundColor Gray

            # Reemplazar
            $NewContent = $Content -replace '(bootstrap\.bundle\.min\.js"><\/script>)', "`$1$DomPurifyCode"
            Set-Content $FilePath $NewContent -Encoding UTF8

            Write-Host "    ✓ DOMPurify inyectado" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️  $FileName (NO contiene bootstrap - SALTADO)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESUMEN: $ModifiedCount archivos serán modificados" -ForegroundColor $(if ($Execute) { 'Green' } else { 'Yellow' })
Write-Host ""

if (-not $Execute) {
    Write-Host "📌 Para EJECUTAR cambios reales, corre:" -ForegroundColor Yellow
    Write-Host "   .\inject-dompurify-simple.ps1 -Execute" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✅ CAMBIOS EJECUTADOS EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
}
