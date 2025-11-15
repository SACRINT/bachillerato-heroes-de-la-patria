# 🎯 INSTRUCCIONES PARA ARQUITECTO 1: SANITIZACIÓN XSS FASE 2

**Enfoque:** Trabajo técnico puro. Solo diseña y construye. El Git lo maneja el PM.

---

## 📋 TU MISIÓN (SOLO ESTO)

**Sanitizar 20 archivos JavaScript**, eliminando **180 vulnerabilidades XSS** usando DOMPurify.

Archivos a procesar:
1. `public/js/student-dashboard.js` (12 riesgos)
2. `public/js/api-client.js` (11 riesgos)
3. `public/js/auth-manager.js` (10 riesgos)
4. `public/js/modal-manager.js` (14 riesgos)
5. `public/js/student-portal.js` (13 riesgos)
6. `public/js/dashboard-manager-2025.js` (34 riesgos)
7. `public/js/gamification-achievements.js` (11 riesgos)
8. `public/js/notification-system.js` (15 riesgos)
9. `public/js/form-validator.js` (9 riesgos)
10. `public/js/user-profile-manager.js` (12 riesgos)
11. `public/js/data-table-manager.js` (13 riesgos)
12. `public/js/chart-builder.js` (10 riesgos)
13. `public/js/widget-system.js` (14 riesgos)
14. `public/js/admin-utils.js` (11 riesgos)
15. `public/js/export-manager.js` (12 riesgos)
16. `public/js/import-manager.js` (12 riesgos)
17. `public/js/real-time-updates.js` (9 riesgos)
18. `public/js/caching-system.js` (8 riesgos)
19. `public/js/error-handler.js` (7 riesgos)
20. `public/js/logging-service.js` (6 riesgos)

**Total:** 20 archivos, 180 riesgos, ~14 horas

---

## 🛠️ PROCESO (PASO A PASO)

### PASO 1: Leer la documentación (1 hora)
- Lee: `docs/FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md`
- Lee: `docs/PATRONES_DOMPURIFY_COPY_PASTE.md`
- Entiende los 4 patrones de sanitización

### PASO 2: Abre el primer archivo
Ejemplo: `public/js/student-dashboard.js`

### PASO 3: Busca vulnerabilidades XSS
```javascript
// ❌ BUSCA ESTO (son vulnerabilidades):
.innerHTML =
.innerHTML +=
.insertAdjacentHTML(
.setAttribute("data-", variable)

// ✅ SI YA TIENE ESTO, no toques:
DOMPurify.sanitize()
```

### PASO 4: Aplica el patrón correcto

**PATRÓN 1 - innerHTML simple:**
```javascript
// ❌ ANTES:
element.innerHTML = htmlContent;

// ✅ DESPUÉS:
element.innerHTML = DOMPurify.sanitize(htmlContent);
```

**PATRÓN 2 - innerHTML con template:**
```javascript
// ❌ ANTES:
div.innerHTML = `<span>${userInput}</span>`;

// ✅ DESPUÉS:
const safe = DOMPurify.sanitize(`<span>${userInput}</span>`);
div.innerHTML = safe;
```

**PATRÓN 3 - insertAdjacentHTML:**
```javascript
// ❌ ANTES:
container.insertAdjacentHTML('beforeend', htmlString);

// ✅ DESPUÉS:
const safe = DOMPurify.sanitize(htmlString);
container.insertAdjacentHTML('beforeend', safe);
```

**PATRÓN 4 - setAttribute con datos dinámicos:**
```javascript
// ❌ ANTES:
element.setAttribute('data-config', userValue);

// ✅ DESPUÉS:
const safe = DOMPurify.sanitize(userValue, {ALLOWED_TAGS: []});
element.setAttribute('data-config', safe);
```

### PASO 5: Valida cambios
```bash
# Copiar y ejecutar en terminal:
node -c public/js/archivo-que-editaste.js

# Resultado esperado: (sin errores)
```

Si hay error de sintaxis, corrígelo inmediatamente.

### PASO 6: Testing en navegador
1. Abre `http://localhost:3000` en Chrome
2. Abre DevTools (F12)
3. Ve a Console
4. Usa la funcionalidad relacionada al archivo que editaste
5. **Verificar:** ✓ Sin errores en roja / ✗ Sin breaking changes

### PASO 7: Siguiente archivo
Repite PASO 2-6 con el siguiente archivo.

---

## 📊 PROGRESO DIARIO (Recomendado)

**Día 1:** Archivos 1-3 (~3h)
**Día 2:** Archivos 4-6 (~3.5h)
**Día 3:** Archivos 7-10 (~3.5h)
**Día 4:** Archivos 11-13 (~3.5h)
**Día 5:** Archivos 14-17 (~3h)
**Día 6:** Archivos 18-20 (~2h)
**Día 7:** Testing final + revisión

Total: 18-19 horas de trabajo real

---

## 📝 DOCUMENTACIÓN (AL FINALIZAR CADA ARCHIVO)

Abre: `docs/REFACTOR_TRACKING.md`

Agrega al final (template):
```markdown
## [Fecha] - [Nombre Archivo]
- **Archivo:** public/js/archivo.js
- **Riesgos sanitizados:** X/X
- **Patrones aplicados:** Patrón 1, Patrón 2, Patrón 3
- **Validación:** ✓ Sintaxis OK
- **Testing:** ✓ Console limpia
- **Notas:** (si hay algo especial)
```

---

## ⚠️ ERRORES COMUNES (CÓMO ARREGLARLOS)

**Error 1: "Syntax error: Unexpected token"**
```bash
# Significa que rompiste la sintaxis de JavaScript
# Busca la línea que editaste y revisa:
# - Paréntesis cerrados correctamente
# - Comillas balanceadas
# - Punto y coma al final
```

**Error 2: "DOMPurify is not defined"**
```javascript
// Significa que no está importado. Agrega al inicio del archivo:
const DOMPurify = window.DOMPurify;
// O si usa import:
import DOMPurify from 'dompurify';
```

**Error 3: Página cargada pero funcionalidad rota**
```
Significa que quebraste algo con la sanitización
- Revierte el último cambio
- Revisa que el HTML permitido es correcto
- Prueba de nuevo
```

---

## ✅ CHECKLIST (CONFIRMAR AL TERMINAR)

- [ ] Los 20 archivos están editados
- [ ] Cada archivo pasó validación `node -c`
- [ ] Cada archivo fue testeado en navegador (sin console errors)
- [ ] Se agregaron líneas con `DOMPurify.sanitize()` en cada archivo
- [ ] REFACTOR_TRACKING.md actualizado con 20 entradas
- [ ] **¿Hay 0 líneas con `.innerHTML =` sin DOMPurify?**
  ```bash
  grep -n "\.innerHTML\s*=" public/js/*.js | grep -v "DOMPurify"
  # Resultado esperado: (vacío - 0 líneas)
  ```

---

## 🎯 ENTREGABLE FINAL

Al terminar, el PM hará:
```bash
git add public/js/
git commit -m "feat(xss): Sanitización Fase 2 - 180 riesgos eliminados"
git push
```

Tú **SOLO** necesitas haber hecho el trabajo técnico. El PM maneja Git.

---

## 🚀 COMIENZA AHORA

1. Abre `public/js/student-dashboard.js` (archivo 1)
2. Busca `.innerHTML =` o `.insertAdjacentHTML(`
3. Aplica el patrón correspondiente
4. Valida: `node -c public/js/student-dashboard.js`
5. Testea en navegador
6. Próximo archivo

**¡Adelante!**
