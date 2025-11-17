#!/bin/bash
# ============================================
# IMAGE OPTIMIZATION SCRIPT - SEMANA 2
# Convierte imágenes JPG/PNG a WebP para reducir tamaño
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IMAGE OPTIMIZATION - WEBP CONVERSION${NC}"
echo -e "${GREEN}FASE 2 - SEMANA 2${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Verificar cwebp instalado
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp not found${NC}"
    echo -e "${YELLOW}Install with: sudo apt-get install webp${NC}"
    exit 1
fi

# Directorios a procesar
DIRS=(
    "public/images"
    "public/assets"
    "public/assets/images"
)

total_converted=0
total_savings=0

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}Skipping (not found): $dir${NC}"
        continue
    fi

    echo -e "${GREEN}Processing directory: $dir${NC}"

    # Encontrar todas las imágenes JPG/PNG
    find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read img; do
        # Skip si ya existe WebP
        webp="${img%.*}.webp"
        if [ -f "$webp" ]; then
            echo -e "${YELLOW}  Skip (exists): $(basename $webp)${NC}"
            continue
        fi

        # Tamaño original
        original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)

        # Convertir con calidad 85
        if cwebp -q 85 "$img" -o "$webp" &> /dev/null; then
            # Tamaño WebP
            webp_size=$(stat -f%z "$webp" 2>/dev/null || stat -c%s "$webp" 2>/dev/null)

            # Calcular savings
            savings=$((original_size - webp_size))
            percent=$((100 * savings / original_size))

            total_converted=$((total_converted + 1))
            total_savings=$((total_savings + savings))

            echo -e "${GREEN}  ✓ $(basename $img) → $(basename $webp)${NC}"
            echo -e "    Original: $(numfmt --to=iec $original_size) | WebP: $(numfmt --to=iec $webp_size) | Savings: ${percent}%"
        else
            echo -e "${RED}  ✗ Failed: $(basename $img)${NC}"
        fi
    done
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}SUMMARY${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Images converted: ${total_converted}"
echo -e "Total savings: $(numfmt --to=iec $total_savings)"
echo -e "\n${YELLOW}Next step: Update HTML to use <picture> tags with WebP${NC}"
