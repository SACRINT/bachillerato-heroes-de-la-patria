#!/bin/bash
# Performance Audit Script - FASE 2 SEMANA 1
# Ejecuta Lighthouse en páginas críticas del proyecto BGE

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AUDITORÍA DE PERFORMANCE - LIGHTHOUSE${NC}"
echo -e "${GREEN}FASE 2 - SEMANA 1${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Verificar que Lighthouse esté instalado
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}Lighthouse no encontrado. Instalando...${NC}"
    npm install -g lighthouse
fi

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}Error: El servidor no está corriendo en localhost:3000${NC}"
    echo -e "${YELLOW}Por favor ejecuta: node backend/server.js${NC}"
    exit 1
fi

# Crear directorio para reportes
mkdir -p docs/lighthouse/json
mkdir -p docs/lighthouse/html

# Páginas críticas a auditar
PAGES=(
    "index.html"
    "admin-dashboard.html"
    "estudiantes.html"
    "padres.html"
    "docentes.html"
    "calificaciones.html"
    "citas.html"
    "egresados.html"
)

echo -e "${GREEN}Auditando ${#PAGES[@]} páginas críticas...${NC}\n"

# Ejecutar Lighthouse para cada página
for page in "${PAGES[@]}"; do
    echo -e "${YELLOW}Auditando: ${page}${NC}"

    lighthouse "http://localhost:3000/$page" \
        --output=json \
        --output=html \
        --output-path="docs/lighthouse/${page%.html}" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        2>&1 | grep -E "(Performance|Accessibility|Best Practices|SEO|First Contentful Paint|Speed Index|Largest Contentful Paint|Time to Interactive|Total Blocking Time|Cumulative Layout Shift)" || true

    # Mover archivos a carpetas correspondientes
    mv "docs/lighthouse/${page%.html}.report.json" "docs/lighthouse/json/" 2>/dev/null || true
    mv "docs/lighthouse/${page%.html}.report.html" "docs/lighthouse/html/" 2>/dev/null || true

    echo -e "${GREEN}✓ Completado${NC}\n"
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AUDITORÍA COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Reportes JSON: docs/lighthouse/json/"
echo -e "Reportes HTML: docs/lighthouse/html/"
echo -e "\nPróximo paso: Analizar resultados y crear PERFORMANCE_BASELINE_WEEK1.md"
