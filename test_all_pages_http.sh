#!/bin/bash

# Array de todas las 34 páginas
pages=(
    "index.html"
    "admin-dashboard.html"
    "estudiantes.html"
    "padres.html"
    "docentes.html"
    "ar-vr-lab.html"
    "aviso-privacidad.html"
    "biblioteca.html"
    "bolsa-trabajo.html"
    "calendario.html"
    "calificaciones.html"
    "chatbot.html"
    "citas.html"
    "comunidad.html"
    "conocenos.html"
    "contacto.html"
    "convocatorias.html"
    "descargas.html"
    "egresados.html"
    "encuestas.html"
    "force-admin.html"
    "normatividad.html"
    "oferta-educativa.html"
    "offline.html"
    "pagos.html"
    "privacidad.html"
    "reglamento.html"
    "servicios.html"
    "sitios-interes.html"
    "soporte.html"
    "terminos.html"
    "test-dashboard.html"
    "transparencia.html"
    "mensajeria.html"
)

echo "🧪 Testing HTTP status para todas las 34 páginas..."
echo "════════════════════════════════════════════════════"

passed=0
failed=0

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$page")
    
    if [ "$status" = "200" ]; then
        echo "✅ $page - HTTP $status"
        ((passed++))
    else
        echo "❌ $page - HTTP $status"
        ((failed++))
    fi
done

echo ""
echo "════════════════════════════════════════════════════"
echo "📊 RESULTADOS:"
echo "   ✅ Pasaron: $passed/34"
echo "   ❌ Fallaron: $failed/34"
echo "   📈 Tasa de éxito: $(( (passed * 100) / 34 ))%"
