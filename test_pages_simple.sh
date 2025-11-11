#!/bin/bash

# Lista de todas las 34 páginas HTML
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

echo "🚀 Testing de todas las 34 páginas HTML"
echo "=========================================="
echo ""

passed=0
failed=0

for page in "${pages[@]}"; do
    url="http://localhost:3000/$page"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "200" ]; then
        echo "✅ $page - HTTP $status"
        ((passed++))
    else
        echo "❌ $page - HTTP $status"
        ((failed++))
    fi
done

echo ""
echo "=========================================="
echo "📊 RESUMEN:"
echo "✅ PASARON:  $passed/34"
echo "❌ FALLARON: $failed/34"
echo "📈 Tasa de éxito: $((passed * 100 / 34))%"
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 ¡TODAS LAS PÁGINAS ESTÁN DISPONIBLES!"
    exit 0
else
    echo "⚠️  Algunas páginas tienen errores"
    exit 1
fi
