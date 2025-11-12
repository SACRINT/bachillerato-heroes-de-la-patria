# Archivos a Refactorizar - FASE 2.2 XSS Sanitization

## Vía 1: Reparación Rápida (Errores Simples)

Archivos con errores simples que pueden arreglarse con un `replace` directo:

- ✅ `public/js/admin-dashboard-advanced.js` - **COMPLETADO** (líneas 710, 718)
- ✅ `public/js/google-auth-integration.js` - **COMPLETADO** (líneas 208, 275, 306, 341, 436, 463)
- ✅ `public/js/pwa-advanced-features.js` - **COMPLETADO** (líneas 165, 175)
- ✅ `public/js/admin-newsletters.js` - **COMPLETADO** (líneas 90, 98, 109, 113, 243, 247)
- ✅ `public/js/bge-notification-admin.js` - **COMPLETADO** (líneas 692, 711, 954, 959)
- ✅ `public/js/image-gallery.js` - **COMPLETADO** (líneas 214, 220)
- ✅ `public/js/mobile-ux-advanced.js` - **COMPLETADO** (líneas 507, 509)
- ✅ `public/js/onboarding-system.js` - **COMPLETADO** (4 instancias)

## Vía 2: Refactorización (Errores Complejos)

Archivos con problemas estructurales que requieren refactorización más profunda:

### Problemas Identificados:

**Template Strings sin cerrar en `modal.innerHTML = sanitizeHTML(\`...`)**
- `public/js/dashboard-manager-2025.js` (línea 1619 falta `);`)
- `public/js/student-dashboard.js` (línea 229 falta `);`)

**Inline HTML con múltiples líneas en atributos HTML (onclick, etc.)**
- `public/js/dashboard-manager-2025.js` (línea 1754: onclick con template literals)
- `public/js/egresados-dashboard.js` (línea 1020: onclick con múltiples funciones JavaScript)

### Solución Propuesta:

Extraer handlers JavaScript de atributos HTML y crear funciones independientes:

```javascript
// BEFORE (problematico):
<button onclick="
    navigator.clipboard.writeText('${password}'));
    this.innerHTML = sanitizeHTML('<i class=\"fas fa-check\"></i> Copiado');
    ...
">

// AFTER (correcto):
<button onclick="handleCopyPassword(this, '${password}')">

// Nueva función:
function handleCopyPassword(button, password) {
    navigator.clipboard.writeText(password);
    button.innerHTML = sanitizeHTML('<i class="fas fa-check"></i> Copiado');
    setTimeout(() => {
        button.innerHTML = sanitizeHTML('<i class="fas fa-copy"></i> Copiar');
    }, 2000);
}
```

## Bundles y Código Muerto (Para Archivar Después)

- `public/js/admin.bundle.js`
- `public/js/features.bundle.js`
- `public/js/forms.bundle.js`
- `public/js/academic-reports-manager.js`
- `public/js/ai-progress-dashboard.js`
- `public/js/ar-education-system.js`
- `public/js/automated-testing-system.js`
- `public/js/bolsa-trabajo-dashboard.js`

## Progreso

- **Vía 1 Completados:** 8/8 (100%) ✅
- **Vía 2 Identificados:** 3 archivos
- **Código Muerto Archivado:** 11/11 archivos ✅

## Resumen de Vía 1 Completada

Todos los 8 archivos de reparación rápida han sido completados exitosamente:
1. ✅ admin-dashboard-advanced.js (2 instancias)
2. ✅ google-auth-integration.js (6 instancias)
3. ✅ pwa-advanced-features.js (2 instancias)
4. ✅ admin-newsletters.js (6 instancias)
5. ✅ bge-notification-admin.js (4 instancias)
6. ✅ image-gallery.js (2 instancias)
7. ✅ mobile-ux-advanced.js (2 instancias)
8. ✅ onboarding-system.js (4 instancias)

**Total Reparado:** 28 instancias de errores de sintaxis
**Commits:** 8 commits atómicos

## Código Muerto Archivado

11 archivos de código muerto han sido exitosamente movidos a `public/js/dead_code_archive/`:
1. ✅ academic-reports-manager.js
2. ✅ adaptive-ai-tutor.js
3. ✅ admin.bundle.js
4. ✅ ai-progress-dashboard.js
5. ✅ ai-recommendation-engine.js
6. ✅ ar-education-system.js
7. ✅ automated-testing-system.js
8. ✅ bolsa-trabajo-dashboard.js
9. ✅ digital-ecosystem.js
10. ✅ features.bundle.js
11. ✅ forms.bundle.js

**Total Archivado:** 11 archivos (~850 KB)
**Reducción:** Limpieza de 11 archivos no utilizados en el sistema activo
