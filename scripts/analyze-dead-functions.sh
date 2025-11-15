#!/bin/bash
# Análisis de clases y funciones grandes no utilizadas
# Arquitecto 1 - Auditoría completa

echo ""
echo "📊 ANÁLISIS 6: Clases declaradas pero nunca instanciadas"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

> /tmp/dead_code_classes.txt

total_classes=0
unused_classes=0

# Buscar clases declaradas en archivos JS
for file in public/js/*.js; do
    # Buscar declaraciones de clases
    classes=$(grep -o "^class [A-Z][a-zA-Z]*\|^export class [A-Z][a-zA-Z]*" "$file" 2>/dev/null | sed 's/^class //; s/^export class //')

    for class in $classes; do
        if [ -z "$class" ]; then
            continue
        fi

        total_classes=$((total_classes + 1))

        # Buscar instanciación de la clase (new ClassName)
        instances=$(grep -r "new $class\|new $class(" public/js/*.js public/*.html 2>/dev/null | wc -l)

        if [ "$instances" -eq 0 ]; then
            filename=$(basename "$file")
            echo "❌ Clase '$class' en $filename - NUNCA instanciada (0 'new $class' encontrados)" >> /tmp/dead_code_classes.txt
            unused_classes=$((unused_classes + 1))
        fi
    done
done

echo ""
echo "Primeras 20 clases no utilizadas:"
head -20 /tmp/dead_code_classes.txt
echo ""
echo "Total clases analizadas: $total_classes"
echo "Clases nunca instanciadas: $unused_classes"
if [ "$total_classes" -gt 0 ]; then
    echo "Porcentaje clases muertas: $((unused_classes * 100 / total_classes))%"
fi
