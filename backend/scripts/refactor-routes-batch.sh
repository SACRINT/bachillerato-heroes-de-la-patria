#!/bin/bash
#
# Script de Automatización: Refactorización GDPR de Rutas Backend
# Convierte devLogger → debugLog y agrega imports necesarios
#

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Iniciando refactorización automática de rutas backend..."
echo ""

# Array de archivos a procesar (Batch 2-4+)
FILES=(
  "backend/routes/contact.js"
  "backend/routes/citas.js"
  "backend/routes/newsletters.js"
  "backend/routes/egresados.js"
  "backend/routes/bolsa-trabajo.js"
  "backend/routes/uploads.js"
  "backend/routes/notifications.js"
  "backend/routes/analytics.js"
  "backend/routes/reports.js"
  "backend/routes/config.js"
  "backend/routes/calendar.js"
  "backend/routes/subscriptions.js"
  "backend/routes/export.js"
  "backend/routes/surveys.js"
  "backend/routes/auth.js"
)

# Contadores
PROCESSED=0
SUCCESS=0
FAILED=0
SKIPPED=0

# Función para refactorizar un archivo
refactor_file() {
  local file=$1

  # Verificar si el archivo existe
  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}⚠️  SKIP: $file no encontrado${NC}"
    ((SKIPPED++))
    return 1
  fi

  echo -e "${YELLOW}📄 Procesando: $file${NC}"

  # Backup del archivo original
  cp "$file" "${file}.backup"

  # 1. Verificar si ya tiene debugLog import
  if ! grep -q "require('../utils/debug-logger')" "$file"; then
    # Agregar debugLog import después de sanitized-errors si existe
    if grep -q "require('../utils/sanitized-errors')" "$file"; then
      # Insertar antes de sanitized-errors
      sed -i "/const { sanitizeError/i const { debugLog } = require('../utils/debug-logger');" "$file"
    else
      # Si no tiene sanitized-errors, buscar primer const y agregar ahí
      sed -i "0,/const express/a const { debugLog } = require('../utils/debug-logger');\nconst { sanitizeError } = require('../utils/sanitized-errors');" "$file"
    fi
    echo "   ✅ Import debugLog agregado"
  else
    echo "   ℹ️  debugLog ya existe"
  fi

  # 2. Reemplazar devLogger.log con debugLog.log
  sed -i "s/devLogger\.log(/debugLog.log('ROUTE', /g" "$file"

  # 3. Reemplazar devLogger.warn con debugLog.warn
  sed -i "s/devLogger\.warn(/debugLog.warn('ROUTE', /g" "$file"

  # 4. Reemplazar devLogger.error con debugLog.error
  # Patrón 1: devLogger.error('mensaje:', error);
  sed -i "s/devLogger\.error('\([^']*\):', error);/debugLog.error('ROUTE', '\1', sanitizeError(error, 'route'));/g" "$file"

  # Patrón 2: devLogger.error('mensaje:');
  sed -i "s/devLogger\.error('\([^']*\):');/debugLog.error('ROUTE', '\1', sanitizeError(new Error('Route error'), 'route'));/g" "$file"

  # Patrón 3: devLogger.error('mensaje:', variable);
  sed -i "s/devLogger\.error('\([^']*\):', \([a-zA-Z]*\));/debugLog.error('ROUTE', '\1', sanitizeError(\2, 'route'));/g" "$file"

  echo "   ✅ devLogger reemplazado con debugLog"

  # 5. Validar sintaxis
  if node -c "$file" 2>/dev/null; then
    echo -e "   ${GREEN}✅ Sintaxis válida${NC}"

    # Eliminar backup
    rm "${file}.backup"

    ((SUCCESS++))
    return 0
  else
    echo -e "   ${RED}❌ Error de sintaxis${NC}"

    # Restaurar backup
    mv "${file}.backup" "$file"

    ((FAILED++))
    return 1
  fi
}

# Procesar todos los archivos
echo "📋 Archivos a procesar: ${#FILES[@]}"
echo ""

for file in "${FILES[@]}"; do
  refactor_file "$file"
  ((PROCESSED++))
  echo ""
done

# Resumen final
echo "============================================================"
echo "📊 RESUMEN DE REFACTORIZACIÓN AUTOMÁTICA"
echo "============================================================"
echo -e "${GREEN}✅ Exitosos: $SUCCESS${NC}"
echo -e "${RED}❌ Fallidos: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Saltados: $SKIPPED${NC}"
echo "📋 Total procesados: $PROCESSED/${#FILES[@]}"
echo "============================================================"
echo ""

if [ $SUCCESS -gt 0 ]; then
  echo "🎉 Refactorización completada exitosamente!"
  echo ""
  echo "📝 Próximos pasos:"
  echo "1. Revisar cambios: git diff backend/routes/"
  echo "2. Agregar a staging: git add backend/routes/"
  echo "3. Hacer commit: git commit -m 'refactor(routes-batch-N): ...'"
  echo "4. Pushear: git push"
fi

exit 0
