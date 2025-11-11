$publicDir = "C:\03_BachilleratoHeroesWeb\public"
$scriptTag = '<script src="js/meta-updater.js" defer></script>'
$filesProcessed = 0
$filesModified = 0

# Obtener todos los archivos HTML excepto index.html
$htmlFiles = Get-ChildItem -Path $publicDir -Filter *.html | Where-Object { $_.Name -ne 'index.html' }

Write-Host "INFO: Found $($htmlFiles.Count) HTML files to process."

foreach ($file in $htmlFiles) {
    $filesProcessed++
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $wasModified = $false

        # 1. Actualizar la etiqueta <title>
        if ($content -match '(?si)<title[^>]*>(.*?)</title>' -and $content -notmatch 'id="page-title"') {
            $existingTitle = $Matches[1].Trim()
            $newTitleTag = "<title id=`"page-title`" data-base-title=`"$existingTitle`">$existingTitle</title>"
            $content = $content -replace '(?si)<title[^>]*>.*?</title>', $newTitleTag
            $wasModified = $true
        }

        # 2. Actualizar la etiqueta <meta name="description">
        if ($content -match '<meta name="description"' -and $content -notmatch 'id="page-description"') {
            $content = $content -replace '(<meta name="description")', '<meta name="description" id="page-description"'
            $wasModified = $true
        }

        # 3. Inyectar el script si no existe
        if ($content -notmatch [regex]::Escape($scriptTag)) {
            $content = $content -replace '</head>', "    $scriptTag`n</head>"
            $wasModified = $true
        }

        if ($wasModified) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "SUCCESS: Modified $($file.Name)"
            $filesModified++
        } else {
            Write-Host "INFO: No changes needed for $($file.Name)"
        }
    } catch {
        Write-Error "ERROR: Failed to process $($file.FullName): $_"
    }
}

Write-Host "----------------------------------------"
Write-Host "Batch update complete."
Write-Host "Files Processed: $filesProcessed"
Write-Host "Files Modified: $filesModified"
