#!/bin/bash
#
# Script BASH para inyectar DOMPurify en páginas HTML
# Modo seguro: solo simula/muestra cambios hasta que se ejecute con -x
#

DRYRUN=true
PROJECT_ROOT="/c/03_BachilleratoHeroesWeb"
PUBLIC_DIR="$PROJECT_ROOT/public"

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -x|--execute) DRYRUN=false; shift ;;
        *) shift ;;
    esac
done

echo "════════════════════════════════════════════════════════"
echo "🔒 INYECCIÓN SEGURA DE DOMPURIFY EN HTML"
echo "════════════════════════════════════════════════════════"
echo ""
echo "MODO: $([ "$DRYRUN" = true ] && echo 'SIMULACIÓN (sin cambios)' || echo 'EJECUCIÓN REAL')"
echo ""

# Encontrar archivos HTML (excluyendo partials)
HTML_FILES=$(find "$PUBLIC_DIR" -maxdepth 1 -name "*.html" -type f | sort)
COUNT=$(echo "$HTML_FILES" | wc -l)

echo "📋 Archivos encontrados: $COUNT"
echo ""

# Código DOMPurify a inyectar
DOMPURIFY_CODE="
    <!-- 🔒 DOMPurify XSS Protection -->
    <script src=\"https://cdn.jsdelivr.net/npm/isomorphic-dompurify/dist/purify.min.js\"><\/script>
    <script src=\"js/dompurify-config.js\"><\/script>"

MODIFIED_COUNT=0

for FILE in $HTML_FILES; do
    FILENAME=$(basename "$FILE")

    # Verificar si ya tiene dompurify-config
    if grep -q "dompurify-config.js" "$FILE" 2>/dev/null; then
        echo "  ⏭️  $FILENAME (YA TIENE dompurify-config.js)"
        continue
    fi

    # Verificar si tiene bootstrap
    if grep -q "bootstrap.bundle.min.js" "$FILE" 2>/dev/null; then
        echo "  ✓ $FILENAME"
        MODIFIED_COUNT=$((MODIFIED_COUNT + 1))

        # Mostrar vista previa
        LINE_NUM=$(grep -n "bootstrap.bundle.min.js" "$FILE" | head -1 | cut -d: -f1)
        if [ ! -z "$LINE_NUM" ]; then
            echo "    Línea ~$LINE_NUM: Insertaría DOMPurify después de bootstrap"
        fi

        # Ejecutar cambios si no está en DRY-RUN
        if [ "$DRYRUN" = false ]; then
            # Crear backup
            cp "$FILE" "$FILE.backup-$(date +%Y%m%d-%H%M%S)"

            # Inyectar DOMPurify
            sed -i "s|bootstrap.bundle.min.js\"><\/script>|bootstrap.bundle.min.js\"><\/script>$DOMPURIFY_CODE|" "$FILE"

            echo "    ✓ DOMPurify inyectado"
        fi
    else
        echo "  ⚠️  $FILENAME (NO contiene bootstrap - SALTADO)"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "RESUMEN: $MODIFIED_COUNT archivos serán modificados"
echo ""

if [ "$DRYRUN" = true ]; then
    echo "📌 Para EJECUTAR cambios reales, corre:"
    echo "   bash scripts/inject-dompurify.sh -x"
    echo ""
else
    echo "✅ CAMBIOS EJECUTADOS EXITOSAMENTE"
    echo ""
fi
