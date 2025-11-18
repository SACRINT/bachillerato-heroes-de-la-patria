# Script para arreglar la carga de DOMPurify en todos los HTML
# Cambiar de CDN bloqueado por ORB a carga local desde node_modules

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

$oldPattern = '    <script src="https://cdn.jsdelivr.net/npm/isomorphic-dompurify/dist/purify.min.js"></script>\s+<script src="js/dompurify-config.js"></script>'

$newScript = @"
    <!-- 🔒 DOMPurify XSS Protection (Cargado desde node_modules en lugar de CDN para evitar ORB) -->
    <script>
        // Cargar DOMPurify desde node_modules via Express static
        // El servidor sirve node_modules como /node_modules
        fetch('/node_modules/isomorphic-dompurify/dist/purify.min.js')
            .then(response => response.text())
            .then(code => {
                // Crear un script que ejecute el código de DOMPurify
                const script = document.createElement('script');
                script.textContent = code;
                document.head.appendChild(script);

                // Cargar dompurify-config después de que DOMPurify esté disponible
                const configScript = document.createElement('script');
                configScript.src = 'js/dompurify-config.js';
                document.head.appendChild(configScript);
            })
            .catch(() => {
                // Fallback: Si falla, cargar dompurify-config de todas formas (usará fallback)
                const configScript = document.createElement('script');
                configScript.src = 'js/dompurify-config.js';
                document.head.appendChild(configScript);
            });
    </script>
"@

$count = 0
foreach ($file in $htmlFiles) {
    $filePath = Join-Path $publicPath $file

    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw -Encoding UTF8

        if ($content -match 'isomorphic-dompurify') {
            $newContent = [regex]::Replace($content, $oldPattern, $newScript, [System.Text.RegularExpressions.RegexOptions]::Multiline)

            Set-Content $filePath $newContent -Encoding UTF8
            Write-Host "✅ Actualizado: $file"
            $count++
        }
    }
}

Write-Host ""
Write-Host "✅ Actualización completa: $count archivos modificados"
