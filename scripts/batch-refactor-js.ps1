$baseDir = "C:\03_BachilleratoHeroesWeb"
$dirs = @("$baseDir\public\js", "$baseDir\js")

$patterns = @(
    @{ find = "Bachillerato General Estatal Héroes de la Patria"; replace = "window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')" },
    @{ find = "BGE Héroes de la Patria"; replace = "window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')" },
    @{ find = "BGE Héroes"; replace = "window.getTenantConfigValue('school_short_form', 'BGE Héroes')" },
    @{ find = "Héroes de la Patria"; replace = "window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')" }
)

$total = 0
$modified = @()

Write-Host "Starting refactor..."

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) { continue }

    Write-Host "Directory: $dir"
    $files = Get-ChildItem -Path $dir -Filter *.js -Recurse

    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $count = 0

        foreach ($p in $patterns) {
            $matches = ($content -split [regex]::Escape($p.find) | Measure-Object).Count - 1
            if ($matches -gt 0) {
                $content = $content -replace [regex]::Escape($p.find), $p.replace
                $count += $matches
                $total += $matches
            }
        }

        if ($count -gt 0) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  DONE: $($file.Name) - $count changes"
            $modified += @{ n = $file.Name; c = $count }
        }
    }
}

Write-Host ""
Write-Host "RESULTS:"
Write-Host "Modified files: $($modified.Count)"
Write-Host "Total changes: $total"

foreach ($f in $modified) {
    Write-Host "  - $($f.n): $($f.c) changes"
}
