#!/bin/bash
# Script de optimización de imágenes
# Requiere: imagemagick, cwebp

# Convertir todas las JPG/PNG a WebP
find public/assets/images -type f \( -name "*.jpg" -o -name "*.png" \) -exec sh -c '
    for img; do
        webp="${img%.*}.webp"
        if [ ! -f "$webp" ]; then
            cwebp -q 80 "$img" -o "$webp"
            echo "✅ Convertido: $webp"
        fi
    done
' sh {} +

# Generar thumbnails responsive
find public/assets/images -type f -name "*.webp" -exec sh -c '
    for img; do
        dir=$(dirname "$img")
        base=$(basename "$img" .webp)

        # Generar tamaños: 320w, 640w, 1024w, 1920w
        convert "$img" -resize 320x "$dir/${base}-320w.webp"
        convert "$img" -resize 640x "$dir/${base}-640w.webp"
        convert "$img" -resize 1024x "$dir/${base}-1024w.webp"
        convert "$img" -resize 1920x "$dir/${base}-1920w.webp"

        echo "✅ Responsive images: $base"
    done
' sh {} +