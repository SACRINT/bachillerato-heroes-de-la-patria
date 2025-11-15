#!/bin/bash
# Análisis de exports/imports huérfanos
# Arquitecto 1 - Auditoría completa

echo ""
echo "📊 ANÁLISIS 5: Módulos exportados pero nunca importados"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

> /tmp/dead_code_exports.txt
> /tmp/dead_code_exports_summary.txt

total_exports=0
orphan_exports=0

# Buscar archivos con exports
for file in public/js/*.js backend/routes/*.js backend/services/*.js 2>/dev/null; do
    if [ ! -f "$file" ]; then
        continue
    fi

    # Buscar exports en el archivo
    exports=$(grep -c "^export\|^module.exports\|^exports\." "$file" 2>/dev/null)

    if [ "$exports" -gt 0 ]; then
        filename=$(basename "$file")
        total_exports=$((total_exports + 1))

        # Buscar imports de este archivo en todo el proyecto
        import_count=$(grep -r "import.*$filename\|require.*$filename" public/js/*.js backend/*.js api/*.js 2>/dev/null | grep -v "^$file:" | wc -l)

        if [ "$import_count" -eq 0 ]; then
            echo "❌ $filename exporta pero NUNCA es importado (0 imports encontrados)" >> /tmp/dead_code_exports.txt
            orphan_exports=$((orphan_exports + 1))
        fi
    fi
done

echo "Total archivos con exports: $total_exports" >> /tmp/dead_code_exports_summary.txt
echo "Exports huérfanos (nunca importados): $orphan_exports" >> /tmp/dead_code_exports_summary.txt
if [ "$total_exports" -gt 0 ]; then
    echo "Porcentaje exports muertos: $((orphan_exports * 100 / total_exports))%" >> /tmp/dead_code_exports_summary.txt
fi

# Mostrar primeros 30
head -30 /tmp/dead_code_exports.txt
if [ $(cat /tmp/dead_code_exports.txt | wc -l) -gt 30 ]; then
    echo "... (ver archivo completo en /tmp/dead_code_exports.txt)"
fi
echo ""
cat /tmp/dead_code_exports_summary.txt
