# Script PowerShell para integrar automáticamente los scripts
# Ejecutar como: .\install-integrations.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend-Backend Integration Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "c:\03_BachilleratoHeroesWeb\public"

# Función para agregar script a archivo HTML
function Add-ScriptToHTML {
    param (
        [string]$FilePath,
        [string[]]$Scripts
    )
    
    if (!(Test-Path $FilePath)) {
        Write-Host "❌ Archivo no encontrado: $FilePath" -ForegroundColor Red
        return
    }
    
    Write-Host "📝 Modificando: $FilePath" -ForegroundColor Yellow
    
    $content = Get-Content $FilePath -Raw
    
    # Buscar </body>
    if ($content -match '</body>') {
        # Generar tags de script
        $scriptTags = ""
        foreach ($script in $Scripts) {
            $scriptTags += "    <!-- Integration Script -->`n"
            $scriptTags += "    <script src=`"$script`"></script>`n"
        }
        
        # Reemplazar </body> con script tags + </body>
        $content = $content -replace '</body>', "$scriptTags</body>"
        
        # Guardar archivo
        Set-Content -Path $FilePath -Value $content -NoNewline
        
        Write-Host "✅ Scripts agregados a $FilePath" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ No se encontró </body> en $FilePath" -ForegroundColor Yellow
    }
}

# 1. Agregar auth a index.html (header)
Write-Host "`n1️⃣ Integrando autenticación en index.html..." -ForegroundColor Cyan
Add-ScriptToHTML -FilePath "$projectRoot\index.html" -Scripts @("js/simple-auth.js")

# 2. Agregar scripts a estudiantes.html
Write-Host "`n2️⃣ Integrando dashboard de estudiantes..." -ForegroundColor Cyan
Add-ScriptToHTML -FilePath "$projectRoot\estudiantes.html" -Scripts @(
    "js/simple-auth.js",
    "js/student-dashboard-integration.js"
)

# 3. Agregar scripts a admin-dashboard.html
Write-Host "`n3️⃣ Integrando dashboard de administración..." -ForegroundColor Cyan
Add-ScriptToHTML -FilePath "$projectRoot\admin-dashboard.html" -Scripts @(
    "js/simple-auth.js",
    "js/admin-dashboard-integration.js"
)

# 4. Agregar form handlers a formularios
Write-Host "`n4️⃣ Integrando formularios..." -ForegroundColor Cyan

# Contacto
if (Test-Path "$projectRoot\contacto.html") {
    Add-ScriptToHTML -FilePath "$projectRoot\contacto.html" -Scripts @(
        "js/form-handler.js",
        "js/contact-form-integration.js"
    )
}

# Inscripciones
if (Test-Path "$projectRoot\inscripciones.html") {
    Add-ScriptToHTML -FilePath "$projectRoot\inscripciones.html" -Scripts @(
        "js/form-handler.js",
        "js/inscriptions-form-integration.js"
    )
}

# Bolsa de trabajo
if (Test-Path "$projectRoot\bolsa-trabajo.html") {
    Add-ScriptToHTML -FilePath "$projectRoot\bolsa-trabajo.html" -Scripts @(
        "js/form-handler.js",
        "js/job-form-integration.js"
    )
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Instalación completada!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verificar que los archivos JS estén en public/js/" -ForegroundColor White
Write-Host "2. Hacer deploy a Vercel" -ForegroundColor White
Write-Host "3. Configurar variables de entorno en Vercel" -ForegroundColor White
Write-Host "4. Probar login en production" -ForegroundColor White
Write-Host ""
