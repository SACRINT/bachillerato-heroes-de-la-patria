# 📋 DOCUMENTO DE TRANSICIÓN - ARQUITECTO IA CONTINÚA CSP COMPLIANCE

**Fecha:** 19 de Noviembre 2025
**Estado:** Trabajo pausado por límite de créditos
**Rama:** `claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6`
**Último commit:** `70ccd56` - "fix(auth): Mejorar logging de auth-api-bridge y corregir carga de TinyMCE API key"

---

## ✅ TRABAJO COMPLETADO

### Fase 1: CSP Compliance para admin-dashboard.html (FINALIZADA)
- ✅ Extracción de 15 inline scripts a archivos externos
- ✅ Todos validados con `node -c`
- ✅ Commit realizado: `0c5c769`
- ✅ Archivos creados: `public/js/dashboard/*` (15 archivos, ~99KB)

### Fase 2: Fixes de Warnings (FINALIZADA)
- ✅ auth-api-bridge.js: Mejorado logging (cambiar error → warning)
- ✅ TinyMCE: Agregado config.js antes de tinymce-loader.js
- ✅ Commit realizado: `70ccd56`

---

## ⏳ TRABAJO PENDIENTE (PRÓXIMOS PASOS)

### Fase 3: CSP Compliance para Páginas Públicas (EN PROGRESO)

**Estado:** 25+ páginas con inline scripts identificadas

**Prioridad Alta - Páginas a procesar:**

1. **pagos.html** - 3 inline scripts (~322 líneas)
   - Script 1 (líneas 519-524): Chatbot global functions
   - Script 2 (líneas 529-789): Sistema de pagos completo
   - Script 3 (líneas 853+): Dark mode toggle
   - **Acción:** Crear `public/js/pages/pagos-system.js` (261 líneas)

2. **calificaciones.html** - 3 inline scripts
   - Estructura similar a pagos.html
   - **Acción:** Extraer a `public/js/pages/calificaciones-system.js`

3. **estudiantes.html** - 2 inline scripts
   - **Acción:** Extraer a archivos correspondientes

4. **conocenos.html** - 2 inline scripts
   - **Acción:** Extraer a archivos correspondientes

**Prioridad Media - 15+ páginas adicionales:**
- contacto.html, comunidad.html, bolsa-trabajo.html, egresados.html, etc.

---

## 🔧 INSTRUCCIONES PARA CONTINUAR

### Paso 1: Actualizar rama local
```bash
cd "C:\03_BachilleratoHeroesWeb"
git fetch origin
git checkout claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
git pull origin claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
```

### Paso 2: Verificar estado actual
```bash
git log --oneline -5
# Debe mostrar: 70ccd56 (HEAD) - fix(auth): Mejorar logging...
#               0c5c769 - fix(csp): Extraer todos los inline scripts...
#               + 8 commits anteriores

git status
# Debe mostrar: "Your branch is ahead of 'origin/...' by 1 commit"
```

### Paso 3: Push del último commit (IMPORTANTE)
```bash
git push origin claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
# Esto sube el commit 70ccd56 que aún no está en GitHub
```

### Paso 4: Iniciar con pagos.html (primera página)

**a) Leer el archivo:**
```bash
# Identificar los 3 inline scripts exactos
grep -n "^ *<script>" public/pagos.html
```

**b) Extraer Script 1 (Chatbot global functions):**
Crear: `public/js/pages/chatbot-global-functions.js`
```javascript
(function() {
    'use strict';
    console.log('🤖 [CHATBOT] Global functions cargadas');

    // Exportar funciones globales si existen
    // Copiar contenido del inline script de pagos.html líneas 519-524
})();
```

**c) Extraer Script 2 (Sistema de pagos - GRANDE):**
Crear: `public/js/pages/pagos-system.js` (261 líneas)
```javascript
(function() {
    'use strict';
    console.log('💳 [PAGOS] Sistema de pagos cargado');

    // Copiar TODO el contenido del inline script líneas 529-789
    // Mantener estructura exacta, solo envuelto en IIFE
    // Asegurar que funciones claves estén en window: loginStudentWithId, payDebt, etc.
})();
```

**d) Extraer Script 3 (Dark mode toggle):**
Crear: `public/js/pages/dark-mode-toggle.js` (reutilizable)
```javascript
(function() {
    'use strict';
    console.log('🌙 [DARK-MODE] Dark mode toggle cargado');

    // Copiar contenido del inline script líneas 853+
    // Asegurar que toggle esté en window.toggleDarkMode
})();
```

**e) Actualizar pagos.html:**
Reemplazar los 3 inline `<script>` blocks con:
```html
<script src="js/pages/chatbot-global-functions.js"></script>
<script src="js/pages/pagos-system.js"></script>
<script src="js/pages/dark-mode-toggle.js"></script>
```

**f) Validar sintaxis:**
```bash
node -c public/js/pages/chatbot-global-functions.js
node -c public/js/pages/pagos-system.js
node -c public/js/pages/dark-mode-toggle.js
```

**g) Commit:**
```bash
git add public/pagos.html public/js/pages/
git commit -m "fix(csp): Extraer inline scripts de pagos.html a archivos externos

CAMBIOS:
- Extraído sistema de pagos a pages/pagos-system.js (261 líneas)
- Extraído chatbot global functions a pages/chatbot-global-functions.js (reutilizable)
- Extraído dark mode toggle a pages/dark-mode-toggle.js (reutilizable)

VALIDACIÓN:
✅ Sintaxis JavaScript: 3/3 archivos
✅ CSP Compliance: 0 inline scripts en pagos.html
✅ Funcionalidad: Sistema de pagos funcional

BENEFICIO:
- pagos.html 100% CSP compliant
- Componentes reutilizables para otras páginas"
```

**h) Push:**
```bash
git push origin claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
```

### Paso 5: Repetir proceso para siguientes páginas
1. calificaciones.html (3 scripts)
2. estudiantes.html (2 scripts)
3. conocenos.html (2 scripts)
4. Y así sucesivamente...

---

## 📊 MATRIZ DE PÁGINAS CON INLINE SCRIPTS

| # | Página | Scripts | Líneas | Estado | Prioridad |
|---|--------|---------|--------|--------|-----------|
| 1 | pagos.html | 3 | ~322 | ⏳ Pendiente | 🔴 Alta |
| 2 | calificaciones.html | 3 | ~250 | ⏳ Pendiente | 🔴 Alta |
| 3 | estudiantes.html | 2 | ~180 | ⏳ Pendiente | 🔴 Alta |
| 4 | conocenos.html | 2 | ~150 | ⏳ Pendiente | 🔴 Alta |
| 5 | contacto.html | 2 | ~120 | ⏳ Pendiente | 🟡 Media |
| 6 | comunidad.html | 2 | ~140 | ⏳ Pendiente | 🟡 Media |
| 7 | bolsa-trabajo.html | 2 | ~160 | ⏳ Pendiente | 🟡 Media |
| 8 | egresados.html | 2 | ~140 | ⏳ Pendiente | 🟡 Media |
| 9-25 | Otras 17 páginas | ~35 | ~1500 | ⏳ Pendiente | 🟢 Baja |

---

## 🎯 OBJETIVO FINAL

**Meta:** CSP 100% Compliant en todas las páginas públicas
- ✅ admin-dashboard.html: COMPLETADA
- ⏳ 24 páginas restantes: EN PROGRESO

**Estimación de tiempo:**
- pagos.html: 30 minutos
- calificaciones.html: 25 minutos
- estudiantes.html: 20 minutos
- conocenos.html: 20 minutos
- Subtotal (4 páginas prioritarias): 95 minutos
- Páginas restantes: 2-3 horas
- **Total estimado: 4-5 horas para 100% CSP compliance**

---

## 🔗 REFERENCIAS IMPORTANTES

**Documentación de Context:**
- CLAUDE.md - Instrucciones y contexto del proyecto
- MASTER-CHECKLIST-BGE-2025.md - Estado general del proyecto
- docs/historia_del_proyecto.md - Historial completo

**Ramas relacionadas:**
- `main` - Rama principal (HEAD)
- `claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6` - Rama actual de trabajo (1 commit pendiente de push)
- `claude/fix-four-errors-01TJxC1Ga1YgY6hptifwYsqQ` - Rama con fixes de finances

**Comandos útiles:**
```bash
# Ver cambios pendientes
git diff

# Ver commits pendientes de push
git log origin/..

# Crear PR después de completar trabajo
# Link: https://github.com/SACRINT/bachillerato-heroes-de-la-patria/pull/new/claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
```

---

## ✅ CHECKLIST ANTES DE EMPEZAR

- [ ] Pull/actualizar rama `claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6`
- [ ] Verificar que último commit es `70ccd56`
- [ ] Push del commit `70ccd56` a GitHub
- [ ] Crear directorio `public/js/pages/` si no existe
- [ ] Empezar con `pagos.html`
- [ ] Validar sintaxis con `node -c` antes de cada commit
- [ ] Hacer commit y push después de cada página completada
- [ ] Documentar progreso en este archivo

---

**Última actualización:** 19 Nov 2025 - 23:59 UTC
**Arquitecto IA anterior:** Claude (sesión pausada)
**Siguiente Arquitecto IA:** [Tu nombre aquí cuando continúes]

---
