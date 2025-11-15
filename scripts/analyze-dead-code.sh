#!/bin/bash
# Script de análisis de código muerto
# Arquitecto 1 - Auditoría completa del proyecto BGE

echo "=== AUDITORÍA DE CÓDIGO MUERTO ==="
echo ""
echo "📊 ANÁLISIS 1: Archivos JavaScript NO referenciados en HTML"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

# Crear archivo temporal con resultados
> /tmp/dead_code_js.txt
> /tmp/dead_code_summary.txt

# Analizar archivos JS en public/js
total_js=0
unreferenced_js=0

for file in public/js/*.js; do
    filename=$(basename "$file")
    total_js=$((total_js + 1))

    # Buscar referencias en todos los HTML
    references=$(grep -r "$filename" public/*.html 2>/dev/null | wc -l)

    if [ "$references" -eq 0 ]; then
        # También buscar en otros JS (imports)
        js_imports=$(grep -r "$filename" public/js/*.js 2>/dev/null | grep -v "^$file:" | wc -l)

        if [ "$js_imports" -eq 0 ]; then
            echo "❌ $filename (0 referencias HTML, 0 imports JS)" >> /tmp/dead_code_js.txt
            unreferenced_js=$((unreferenced_js + 1))
        else
            echo "⚠️  $filename (0 referencias HTML, $js_imports imports JS)" >> /tmp/dead_code_js.txt
        fi
    fi
done

echo "Total archivos JS analizados: $total_js" >> /tmp/dead_code_summary.txt
echo "Archivos sin referencias: $unreferenced_js" >> /tmp/dead_code_summary.txt
echo "Porcentaje código muerto JS: $((unreferenced_js * 100 / total_js))%" >> /tmp/dead_code_summary.txt

# Mostrar primeros 30 resultados
head -30 /tmp/dead_code_js.txt
echo ""
echo "... (ver archivo completo en /tmp/dead_code_js.txt)"
echo ""
cat /tmp/dead_code_summary.txt
