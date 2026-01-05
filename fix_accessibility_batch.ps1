$files = @(
    "bolsa-trabajo.html",
    "calificaciones.html",
    "citas.html",
    "conocenos.html",
    "convocatorias.html",
    "estudiantes.html",
    "normatividad.html",
    "oferta-educativa.html",
    "padres.html",
    "transparencia.html"
)

$baseDir = "c:\03_BachilleratoHeroesWeb\public"

foreach ($file in $files) {
    $path = Join-Path $baseDir $file
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        $content = Get-Content $path -Raw
        
        # 1. Add apple-touch-icon if missing
        if ($content -notmatch "apple-touch-icon") {
            $content = $content -replace '(<link rel="icon"[^>]+>)', '$1`r`n    <link rel="apple-touch-icon" href="/images/logo-bachillerato-HDLP.webp">'
            Write-Host "  Added apple-touch-icon"
        }
        
        # 2. Add rel="noopener" to target="_blank" links if missing
        # Regex explanation: Find <a ... target="_blank" ...> where rel is NOT present or doesn't verify noopener
        # This simple regex handles the common case: target="_blank" followed by other attributes or end of tag
        
        # Strategy: Find all anchor tags with target="_blank"
        $regex = '<a\s+[^>]*target="_blank"[^>]*>'
        $matches = [regex]::Matches($content, $regex)
        
        foreach ($match in $matches) {
            $tag = $match.Value
            if ($tag -notmatch 'rel=["''][^"''\s]*noopener') {
                 # It lacks noopener. Let's add it.
                 # If it has a rel attribute, append. If not, add new attribute.
                 if ($tag -match 'rel="([^"]*)"') {
                     $newTag = $tag -replace 'rel="([^"]*)"', 'rel="$1 noopener"'
                 } else {
                     $newTag = $tag -replace 'target="_blank"', 'target="_blank" rel="noopener"'
                 }
                 $content = $content.Replace($tag, $newTag)
                 Write-Host "  Fixed link security for one tag."
            }
        }

        Set-Content $path $content -Encoding UTF8
    } else {
        Write-Warning "$file not found!"
    }
}
