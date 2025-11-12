#!/bin/bash
# Chequear TODOS los 35 archivos con errores
errors_found=0
for file in public/js/academic-reports-manager.js public/js/admin.bundle.js public/js/admin-dashboard-advanced.js public/js/admin-newsletters.js public/js/ai-progress-dashboard.js public/js/ar-education-system.js public/js/automated-testing-system.js public/js/bge-notification-admin.js public/js/bolsa-trabajo-dashboard.js public/js/dashboard-manager-2025.js public/js/egresados-dashboard.js public/js/features.bundle.js public/js/forms.bundle.js public/js/google-auth-integration.js public/js/image-gallery.js public/js/mobile-ux-advanced.js public/js/onboarding-system.js public/js/pwa-advanced-features.js public/js/student-dashboard.js; do
  if [ -f "$file" ]; then
    if ! node -c "$file" >/dev/null 2>&1; then
      errors_found=$((errors_found + 1))
      echo "❌ $file"
    fi
  fi
done
echo "TOTAL CON ERRORES: $errors_found/19"
