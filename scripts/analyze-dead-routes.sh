#!/bin/bash
# Análisis de rutas backend no registradas
# Arquitecto 1 - Auditoría completa

echo ""
echo "📊 ANÁLISIS 3: Rutas backend NO registradas en server.js o api/app.js"
echo "================================================================"

cd /home/user/bachillerato-heroes-de-la-patria

> /tmp/dead_code_routes.txt
> /tmp/dead_code_routes_summary.txt

total_routes=0
unregistered_routes=0

# Analizar archivos en backend/routes
for file in backend/routes/*.js; do
    filename=$(basename "$file")
    total_routes=$((total_routes + 1))

    # Buscar si está registrado en server.js
    server_refs=$(grep -c "$filename\|${filename%.js}" backend/server.js 2>/dev/null)

    # Buscar si está registrado en api/app.js
    api_refs=$(grep -c "$filename\|${filename%.js}" api/app.js 2>/dev/null)

    total_refs=$((server_refs + api_refs))

    if [ "$total_refs" -eq 0 ]; then
        echo "❌ $filename (NO registrada en server.js ni api/app.js)" >> /tmp/dead_code_routes.txt
        unregistered_routes=$((unregistered_routes + 1))
    fi
done

echo "Total rutas analizadas: $total_routes" >> /tmp/dead_code_routes_summary.txt
echo "Rutas NO registradas: $unregistered_routes" >> /tmp/dead_code_routes_summary.txt
if [ "$total_routes" -gt 0 ]; then
    echo "Porcentaje rutas muertas: $((unregistered_routes * 100 / total_routes))%" >> /tmp/dead_code_routes_summary.txt
fi

cat /tmp/dead_code_routes.txt
echo ""
cat /tmp/dead_code_routes_summary.txt
