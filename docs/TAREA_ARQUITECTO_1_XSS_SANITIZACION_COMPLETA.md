# 🎯 TAREA MONUMENTAL #1: SANITIZACIÓN XSS COMPLETA (FASE 2 BLOQUE 4)

**Asignado a:** Arquitecto 1
**Tipo:** Security / XSS Prevention / Automation / Testing
**Prioridad:** 🔴 CRÍTICO
**Tiempo Estimado:** 20-30 horas
**Rama Git:** `claude/xss-sanitization-phase2-bloque4`
**Objetivo Final:** Eliminar 613 puntos XSS en 62 archivos JavaScript, habilitar CSP `script-src 'self' https:` sin unsafe-inline

---

## 📋 DESCRIPCIÓN GENERAL

El proyecto BGE tiene **613 puntos de vulnerabilidad XSS** distribuidos en 62 archivos JavaScript con prioridad MEDIA. Estos son inline HTML injections (`.innerHTML = "<div>" + userInput</div>`) que requieren sanitización con DOMPurify.

Esta es la **SEGUNDA FASE** de un plan de 3 fases iniciado en Noviembre 2025:
- ✅ Fase 1 (Completada 11 Nov): 5 archivos CRÍTICOS, 134 riesgos, 11 modificados
- ⏳ **Fase 2 (TU TAREA):** 20 archivos ALTOS, 180 riesgos, ~14 horas
- ⏳ Fase 3: 37 archivos MEDIOS, 299 riesgos, ~10 horas

**Impacto:**
- Cierre de 313 vulnerabilidades XSS (53% del total)
- Acercamiento a CSP strict (sin unsafe-inline)
- Mejora dramática en seguridad de la aplicación
- GDPR compliance mejorado

---

## 🎓 ANTECEDENTES: LO QUE YA SE HIZO

### Fase 1 Completada (11 Noviembre)
**11 archivos modificados exitosamente:**

1. ✅ `support-tickets-manager.js` (2 riesgos sanitizados)
2. ✅ `academic-reports-manager.js` (1 riesgo)
3. ✅ `bge-notification-admin.js` (2 riesgos)
4. ✅ `admin-newsletters.js` (4 riesgos)
5. ✅ `parents-portal-manager.js` (1 riesgo)
6. ✅ `bge-chatbot-ia-avanzado.js` (1 riesgo)
7. ✅ `ar-education-system.js` (1 riesgo)
8. ✅ `ai-progress-dashboard.js` (3 riesgos)
9. ✅ `advanced-gamification-system.js` (2 riesgos)
10. ✅ `onboarding-system.js` (1 riesgo)
11. ✅ `payment-system.js` (2 riesgos)

**Total Fase 1:** 20 riesgos XSS eliminados ✅

### Script de Automatización Disponible
**Ubicación:** `scripts/sanitize-dompurify.mjs`

El script AUTOMATIZA la sanitización aplicando patrones predefinidos:
```javascript
// Patrón 1: Reemplazar .innerHTML simple
Busca: const html = "<div>" + variable + "</div>"; el.innerHTML = html;
Reemplaza: el.innerHTML = sanitizeHTML(html);

// Patrón 2: Reemplazar .innerHTML +=
Busca: el.innerHTML += "<span>" + data + "</span>";
Reemplaza: el.innerHTML += sanitizeHTML("<span>" + data + "</span>");

// Patrón 3: insertAdjacentHTML
Busca: el.insertAdjacentHTML('beforeend', html);
Reemplaza: el.insertAdjacentHTML('beforeend', sanitizeHTML(html));

// Patrón 4: setAttribute con data-* dinámicos
Busca: el.setAttribute("data-config", userValue);
Reemplaza: el.setAttribute("data-config", sanitizeText(userValue));
```

**Cómo ejecutar:**
```bash
node scripts/sanitize-dompurify.mjs
```

El script busca en 49 archivos y aplica cambios automáticamente.

---

## 🎯 TUS TAREAS (FASE 2)

### TAREA 2.1: Sanitizar 20 Archivos ALTOS (180 riesgos)

**Lista de archivos ALTOS (prioridad para esta fase):**

| # | Archivo | Riesgos | Estimado | Status |
|---|---------|---------|----------|--------|
| 1 | `public/js/student-dashboard.js` | 12 | 45min | ⏳ |
| 2 | `public/js/api-client.js` | 11 | 40min | ⏳ |
| 3 | `public/js/auth-manager.js` | 10 | 35min | ⏳ |
| 4 | `public/js/modal-manager.js` | 14 | 50min | ⏳ |
| 5 | `public/js/student-portal.js` | 13 | 45min | ⏳ |
| 6 | `public/js/dashboard-manager-2025.js` | 34 | 90min | ⏳ |
| 7 | `public/js/gamification-achievements.js` | 11 | 40min | ⏳ |
| 8 | `public/js/notification-system.js` | 15 | 50min | ⏳ |
| 9 | `public/js/form-validator.js` | 9 | 30min | ⏳ |
| 10 | `public/js/user-profile-manager.js` | 12 | 40min | ⏳ |
| 11 | `public/js/data-table-manager.js` | 13 | 45min | ⏳ |
| 12 | `public/js/chart-builder.js` | 10 | 35min | ⏳ |
| 13 | `public/js/widget-system.js` | 14 | 50min | ⏳ |
| 14 | `public/js/admin-utils.js` | 11 | 40min | ⏳ |
| 15 | `public/js/export-manager.js` | 12 | 40min | ⏳ |
| 16 | `public/js/import-manager.js` | 12 | 40min | ⏳ |
| 17 | `public/js/real-time-updates.js` | 9 | 30min | ⏳ |
| 18 | `public/js/caching-system.js` | 8 | 30min | ⏳ |
| 19 | `public/js/error-handler.js` | 7 | 25min | ⏳ |
| 20 | `public/js/logging-service.js` | 6 | 20min | ⏳ |

**Total:** 20 archivos, 180 riesgos, ~14 horas

### TAREA 2.2: Testing y Validación

Para CADA archivo modificado:

1. **Validar sintaxis:**
   ```bash
   node -c public/js/archivo.js
   ```
   Resultado esperado: `✓ Syntax OK`

2. **Testing manual en navegador:**
   - Abrir Chrome DevTools
   - Ejecutar funcionalidad relacionada al archivo
   - Verificar: `✓ Console sin errores`
   - Verificar: `✓ Funcionalidad operativa`

3. **Validar cambios:**
   - Buscar en archivo por `sanitizeHTML`, `sanitizeText`
   - Confirmar que las líneas se reemplazaron correctamente
   - Ejemplo verificación:
     ```bash
     grep -n "sanitizeHTML\|sanitizeText" public/js/archivo.js
     ```

### TAREA 2.3: Testing de Seguridad

**Para 5 archivos críticos de la lista anterior, ejecutar testing adicional:**

Archivos críticos: `dashboard-manager-2025.js`, `student-dashboard.js`, `api-client.js`, `modal-manager.js`, `student-portal.js`

```bash
# Buscar todavía vulnerabilidades XSS después de sanitización
grep -n "\.innerHTML\s*=" public/js/archivo.js | grep -v "sanitizeHTML"
grep -n "insertAdjacentHTML" public/js/archivo.js | grep -v "sanitizeHTML"

# Resultado esperado: Cero líneas (todas deben estar sanitizadas)
```

### TAREA 2.4: Documentación de Cambios

**Para cada archivo, registrar en REFACTOR_TRACKING.md:**

```markdown
## [Fecha] - [Archivo]
- **Riesgos XSS encontrados:** X
- **Riesgos XSS eliminados:** X
- **Patrones aplicados:** Patrón 1, Patrón 2, Patrón 3
- **Testing status:** ✓ Validado
- **Notas especiales:** (si las hay)
```

### TAREA 2.5: Git Commit y Push

**Después de cada 5 archivos, hacer commit:**

```bash
git add public/js/archivo1.js public/js/archivo2.js ... public/js/archivo5.js
git commit -m "feat(xss-sanitization): Sanitizar 5 archivos ALTOS (45 riesgos eliminados)

- Aplicados patrones 1-4 de sanitización con DOMPurify
- Validada sintaxis en todos los archivos (node -c)
- Testing manual completado sin errores
- CHANGELOG.md actualizado

Fase 2 Bloque 4: 5/20 archivos (25% completado)"

git push origin claude/xss-sanitization-phase2-bloque4
```

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### Documentación Crítica (YA EXISTE)

1. **Plan Completo:**
   - Ubicación: `docs/FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md`
   - Contiene: Listado de 62 archivos, riesgos por archivo, timeline

2. **Quick Start:**
   - Ubicación: `docs/INICIO_RAPIDO_SANITIZACION_62_ARCHIVOS.md`
   - Contiene: Pasos rápidos, ejemplos, troubleshooting

3. **Patrones Copy-Paste:**
   - Ubicación: `docs/PATRONES_DOMPURIFY_COPY_PASTE.md`
   - Contiene: 10 patrones listos para copiar/pegar

4. **Tracking de Refactor:**
   - Ubicación: `docs/REFACTOR_TRACKING.md`
   - Contiene: Historial de cambios por sesión

### Herramientas Disponibles

1. **Script de Automatización (RECOMENDADO):**
   ```bash
   node scripts/sanitize-dompurify.mjs
   ```
   - Procesa 49 archivos
   - Aplica patrones automáticamente
   - Genera reporte de cambios

2. **Validación Manual:**
   ```bash
   node -c public/js/archivo.js  # Validar sintaxis
   grep -n "innerHTML\|insertAdjacentHTML" public/js/archivo.js  # Buscar targets
   ```

3. **Testing en Navegador:**
   - Chrome DevTools (F12)
   - Console: Verificar cero errores
   - Network: Verificar requests exitosas
   - Performance: Verificar no hay memory leaks

### DOMPurify Integration

**YA INSTALADO EN PROYECTO:**

```javascript
// En cualquier archivo:
import DOMPurify from 'dompurify';

// Función wrapper (usar en tus archivos):
const sanitizeHTML = (html) => DOMPurify.sanitize(html);
const sanitizeText = (text) => DOMPurify.sanitize(text, {ALLOWED_TAGS: []});

// Uso:
el.innerHTML = sanitizeHTML("<div>Contenido user</div>");
```

---

## 🔄 FLUJO DE TRABAJO (PASO A PASO)

### Fase 2A: Preparación (1 hora)

1. **Crear rama feature:**
   ```bash
   git checkout -b claude/xss-sanitization-phase2-bloque4
   ```

2. **Leer documentación:**
   - Lee `docs/FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md` (completo)
   - Lee `docs/PATRONES_DOMPURIFY_COPY_PASTE.md` (patrones)

3. **Entender el script:**
   ```bash
   cat scripts/sanitize-dompurify.mjs  # Revisar qué hace
   ```

4. **Hacer test ejecutable:**
   ```bash
   npm run build  # Validar que proyecto compila
   node backend/server.js &  # Iniciar servidor (background)
   ```

### Fase 2B: Sanitización (14 horas)

**Ciclo para CADA archivo:**

1. **Abrir archivo:**
   ```bash
   code public/js/archivo.js
   ```

2. **Identificar patrones XSS:**
   - Buscar: `.innerHTML =`
   - Buscar: `.innerHTML +=`
   - Buscar: `.insertAdjacentHTML(`
   - Buscar: `.setAttribute("data-`

3. **Aplicar sanitización (2 opciones):**

   **OPCIÓN A - Automática (recomendada):**
   ```bash
   node scripts/sanitize-dompurify.mjs
   ```
   El script procesa el archivo automáticamente.

   **OPCIÓN B - Manual (si necesitas control):**
   Editar archivo manualmente, cambiar:
   ```javascript
   // Antes:
   el.innerHTML = userHTML;

   // Después:
   import DOMPurify from 'dompurify';
   const sanitizeHTML = (html) => DOMPurify.sanitize(html);
   el.innerHTML = sanitizeHTML(userHTML);
   ```

4. **Validar sintaxis:**
   ```bash
   node -c public/js/archivo.js
   ```

5. **Testing en navegador:**
   - F12 → Console
   - Ejecutar funcionalidad del archivo
   - ✓ Cero errores
   - ✓ Funcional

6. **Commit:**
   ```bash
   git add public/js/archivo.js
   git commit -m "feat(xss): Sanitizar archivo.js - X riesgos eliminados"
   ```

### Fase 2C: Testing y Validación (3 horas)

Para los **5 archivos críticos:**

1. **Testing de seguridad:**
   ```bash
   # Verificar que NO hay innerHTML/insertAdjacentHTML sin sanitizar
   grep -E "\.innerHTML|insertAdjacentHTML" public/js/archivo.js | grep -v "sanitize"

   # Resultado esperado: CERO líneas (vacío)
   ```

2. **Testing funcional:**
   - Usar aplicación completa
   - Click en botones, llenar formularios
   - Verificar datos dinámicos se muestran correctamente
   - Verificar no hay XSS alerts

3. **Testing de performance:**
   - Chrome DevTools → Performance
   - Registrar rendering time
   - Verificar no hay regresión (<2% variance aceptable)

### Fase 2D: Finalización (2 horas)

1. **Actualizar documentación:**
   ```bash
   # Agregar a docs/REFACTOR_TRACKING.md:
   ## Fase 2 - Completado [Fecha]
   - 20 archivos ALTOS sanitizados
   - 180 riesgos XSS eliminados
   - Testing completado: ✓
   - Performance impacto: <2%
   ```

2. **Actualizar CHANGELOG.md:**
   ```markdown
   ### v2.28.0 - Sanitización XSS Fase 2 Completada
   - **Tipo:** Security / XSS Prevention
   - **Impacto:** 180 riesgos XSS eliminados (30% del total)
   - **Archivos Modificados:** 20 (dashboard, auth, api, etc)
   - **Testing:** ✓ Validado 100%
   - **CSP Status:** Progreso hacia `script-src 'self' https:`
   ```

3. **Push final a GitHub:**
   ```bash
   git push origin claude/xss-sanitization-phase2-bloque4
   ```

4. **Crear PR (opcional):**
   El usuario lo mergeará a main después.

---

## ⚠️ PUNTOS CRÍTICOS Y TROUBLESHOOTING

### Problema: Script no encuentra archivos
**Solución:**
```bash
# Verificar que estás en directorio raíz:
pwd  # Debe mostrar: /path/to/03_BachilleratoHeroesWeb
ls scripts/sanitize-dompurify.mjs  # Debe existir
```

### Problema: "DOMPurify is not defined"
**Solución:**
```javascript
// Agregar import en archivo:
import DOMPurify from 'dompurify';
const sanitizeHTML = (html) => DOMPurify.sanitize(html);
```

### Problema: Chrome DevTools muestra errores después de sanitización
**Causas posibles:**
1. Olvidaste importar DOMPurify
2. El contenido sanitizado se vuelve vacío (demasiado restrictivo)
3. Syntax error en el cambio

**Solución:** Revisar el archivo línea por línea, verificar imports, validar sintaxis.

### Problema: Funcionalidad no funciona después de sanitización
**Causa:** DOMPurify removió HTML importante (ej: scripts, event handlers)

**Solución:** Usar `ALLOWED_TAGS` y `ALLOWED_ATTR` si necesitas HTML más permisivo:
```javascript
const sanitizeHTML = (html) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'a', 'img'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id']
});
```

---

## 📊 TIMELINE ESPERADO

| Fase | Tarea | Tiempo | Fecha Esperada |
|------|-------|--------|----------------|
| 2A | Preparación | 1h | Día 1 |
| 2B | Sanitización 5 arch | 3.5h | Día 1 |
| 2B | Sanitización 10 arch | 7h | Día 2-3 |
| 2B | Sanitización 5 arch | 3.5h | Día 4 |
| 2C | Testing seguridad | 3h | Día 4 |
| 2D | Finalización | 2h | Día 5 |
| **TOTAL** | **Fase 2 Completa** | **~20h** | **~5 días (4h/día)** |

---

## ✅ CHECKLIST DE COMPLETITUD

**Antes de decir que terminaste:**

- [ ] Todos los 20 archivos tienen `sanitizeHTML` o `sanitizeText`
- [ ] `node -c` valida sintaxis en todos sin errores
- [ ] Chrome DevTools muestra cero errores en console
- [ ] Testing manual de funcionalidad completado
- [ ] 5 archivos críticos pasaron testing de seguridad (grep validation)
- [ ] REFACTOR_TRACKING.md actualizado con detalles
- [ ] CHANGELOG.md actualizado
- [ ] Commits pusheados a rama `claude/xss-sanitization-phase2-bloque4`
- [ ] PR creado (opcional, usuario mergeará)

---

## 🎯 OBJETIVO FINAL

**Después de esta tarea, el proyecto habrá:**
- ✅ Eliminado 180 vulnerabilidades XSS (30% del total)
- ✅ Mejorado puntuación de seguridad de 75/100 → 82/100
- ✅ Avanzado significativamente hacia CSP strict
- ✅ Documentado completamente cada cambio
- ✅ Validado con testing exhaustivo

**Impacto combinado (Fase 1 + Fase 2):**
- 200 vulnerabilidades XSS eliminadas (33% del total)
- Preparación para Fase 3 (37 archivos MEDIOS)
- Meta final: 100% XSS eliminado en proyecto BGE

---

**¡ÉXITO EN TU TAREA! 🚀**

Si encuentras problemas, revisa primero TROUBLESHOOTING y consulta la documentación disponible. El script de automatización hace la mayoría del trabajo.
