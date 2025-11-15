#!/bin/bash
# Análisis de archivos HTML huérfanos
# Arquitecto 1 - Auditoría completa

echo ""
echo "📊 ANÁLISIS 2: Archivos HTML sin enlaces entrantes"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

> /tmp/dead_code_html.txt
> /tmp/dead_code_html_summary.txt

total_html=0
orphan_html=0

for file in public/*.html; do
    filename=$(basename "$file")
    total_html=$((total_html + 1))

    # Saltar index.html (siempre es punto de entrada)
    if [ "$filename" = "index.html" ]; then
        continue
    fi

    # Buscar referencias en otros HTML
    html_links=$(grep -r "href.*$filename\|href=\"$filename" public/*.html 2>/dev/null | wc -l)

    # Buscar referencias en JS
    js_refs=$(grep -r "$filename" public/js/*.js 2>/dev/null | wc -l)

    # Buscar en header/footer partials
    partial_refs=$(grep -r "$filename" public/partials/*.html 2>/dev/null | wc -l)

    total_refs=$((html_links + js_refs + partial_refs))

    if [ "$total_refs" -eq 0 ]; then
        echo "❌ $filename (0 enlaces HTML, 0 refs JS, 0 refs partials)" >> /tmp/dead_code_html.txt
        orphan_html=$((orphan_html + 1))
    elif [ "$html_links" -eq 0 ]; then
        echo "⚠️  $filename (0 enlaces HTML, $js_refs refs JS, $partial_refs refs partials)" >> /tmp/dead_code_html.txt
    fi
done

echo "Total archivos HTML analizados: $total_html" >> /tmp/dead_code_html_summary.txt
echo "Archivos huérfanos (0 referencias): $orphan_html" >> /tmp/dead_code_html_summary.txt
if [ "$total_html" -gt 0 ]; then
    echo "Porcentaje HTML huérfano: $((orphan_html * 100 / total_html))%" >> /tmp/dead_code_html_summary.txt
fi

cat /tmp/dead_code_html.txt
echo ""
cat /tmp/dead_code_html_summary.txt
