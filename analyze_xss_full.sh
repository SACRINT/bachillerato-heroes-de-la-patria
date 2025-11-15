#!/bin/bash

# Función para analizar un archivo
analyze_file() {
  local file="$1"
  local name=$(basename "$file")
  local inner=$(grep -o "\.innerHTML\s*=" "$file" 2>/dev/null | wc -l)
  local adj=$(grep -o "\.insertAdjacentHTML" "$file" 2>/dev/null | wc -l)
  local dompurify=$(grep -c "DOMPurify" "$file" 2>/dev/null || echo 0)
  local total=$((inner + adj))
  
  if [ "$total" -gt 0 ]; then
    echo "$total|$inner|$adj|$dompurify|$name"
  fi
}

# Analizar todos los archivos
for file in public/js/*.js public/js/*/*.js; do
  if [ -f "$file" ]; then
    analyze_file "$file"
  fi
done | sort -rn -t'|' -k1 | awk -F'|' 'NR<=100 {print NR, $5, "(" $1 " riesgos: innerHTML=" $2 ", insertAdjacent=" $3 ", DOMPurify=" $4 ")"}'
