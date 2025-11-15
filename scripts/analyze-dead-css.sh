#!/bin/bash
# Análisis de archivos CSS no referenciados
# Arquitecto 1 - Auditoría completa

echo ""
echo "📊 ANÁLISIS 4: Archivos CSS NO referenciados en HTML"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

> /tmp/dead_code_css.txt
> /tmp/dead_code_css_summary.txt

total_css=0
unreferenced_css=0

# Analizar archivos CSS en public/css
for file in public/css/*.css; do
    filename=$(basename "$file")
    total_css=$((total_css + 1))

    # Buscar referencias en HTML
    html_refs=$(grep -r "href.*$filename\|href=\"public/css/$filename" public/*.html 2>/dev/null | wc -l)

    # Buscar imports en otros CSS
    css_imports=$(grep -r "@import.*$filename" public/css/*.css 2>/dev/null | grep -v "^$file:" | wc -l)

    # Buscar referencias en JS
    js_refs=$(grep -r "$filename" public/js/*.js 2>/dev/null | wc -l)

    total_refs=$((html_refs + css_imports + js_refs))

    if [ "$total_refs" -eq 0 ]; then
        echo "❌ $filename (0 referencias HTML, 0 @imports CSS, 0 refs JS)" >> /tmp/dead_code_css.txt
        unreferenced_css=$((unreferenced_css + 1))
    elif [ "$html_refs" -eq 0 ]; then
        echo "⚠️  $filename (0 referencias HTML, $css_imports @imports, $js_refs refs JS)" >> /tmp/dead_code_css.txt
    fi
done

echo "Total archivos CSS analizados: $total_css" >> /tmp/dead_code_css_summary.txt
echo "Archivos CSS sin referencias: $unreferenced_css" >> /tmp/dead_code_css_summary.txt
if [ "$total_css" -gt 0 ]; then
    echo "Porcentaje CSS muerto: $((unreferenced_css * 100 / total_css))%" >> /tmp/dead_code_css_summary.txt
fi

cat /tmp/dead_code_css.txt
echo ""
cat /tmp/dead_code_css_summary.txt
