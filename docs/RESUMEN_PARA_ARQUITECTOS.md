# 📩 INSTRUCCIONES PARA TUS ARQUITECTOS

---

## 🎯 ARQUITECTO 1: SANITIZACIÓN XSS

**Lee este archivo:**
👉 `docs/INSTRUCCIONES_ARQUITECTO_1_TRABAJO_XSS.md`

**Tu misión:**
- Sanitizar 20 archivos JavaScript
- Eliminar 180 vulnerabilidades XSS
- Usar DOMPurify en `.innerHTML`, `.insertAdjacentHTML`, `.setAttribute`

**Tiempo:** 20-30 horas (~7 días)

**Archivos a procesar:**
- `public/js/student-dashboard.js`
- `public/js/api-client.js`
- `public/js/auth-manager.js`
- `public/js/modal-manager.js`
- `public/js/student-portal.js`
- `public/js/dashboard-manager-2025.js`
- `public/js/gamification-achievements.js`
- `public/js/notification-system.js`
- `public/js/form-validator.js`
- `public/js/user-profile-manager.js`
- `public/js/data-table-manager.js`
- `public/js/chart-builder.js`
- `public/js/widget-system.js`
- `public/js/admin-utils.js`
- `public/js/export-manager.js`
- `public/js/import-manager.js`
- `public/js/real-time-updates.js`
- `public/js/caching-system.js`
- `public/js/error-handler.js`
- `public/js/logging-service.js`

**Patrón básico:**
```javascript
// ❌ ANTES:
element.innerHTML = htmlContent;

// ✅ DESPUÉS:
element.innerHTML = DOMPurify.sanitize(htmlContent);
```

**Validación final:**
```bash
node -c public/js/archivo.js  # ✓ Sin errores
grep -n "\.innerHTML\s*=" public/js/*.js | grep -v "DOMPurify"  # ✓ Cero resultados
```

---

## 🎯 ARQUITECTO 2: LOGGING GDPR + BACKEND REFACTORING

**Lee este archivo:**
👉 `docs/INSTRUCCIONES_ARQUITECTO_2_TRABAJO_BACKEND.md`

**Tu misión (2 sub-tareas):**

### SUB-TAREA A: Eliminar 5,966 logs masivos (10 horas)
- Crear infraestructura de logging condicional
- Sanitizar 15 archivos frontend (732 logs)
- Sanitizar 10 archivos backend (545 logs)
- Testing y validación

### SUB-TAREA B: Refactorización backend (25-30 horas)
- Crear 10 servicios nuevos (`UserService`, `StudentService`, `ApprovalService`, etc.)
- Refactorizar 18 rutas para usar servicios
- Eliminar acceso directo a `pool` en rutas

**Tiempo total:** 35-40 horas (~14 días)

**Patrón A - Logging:**
```javascript
// ❌ ANTES:
console.log('User authenticated:', { email: user.email, token: jwt });

// ✅ DESPUÉS:
const { debugLog } = require('../utils/debug-logger');
debugLog.log('AUTH', 'User authenticated', { userId: user.id });
```

**Patrón B - Servicios:**
```javascript
// ❌ ANTES:
router.get('/students', async (req, res) => {
  const result = await pool.query('SELECT * FROM usuarios');
  res.json(result.rows);
});

// ✅ DESPUÉS:
const StudentService = require('../services/StudentService');
router.get('/students', async (req, res) => {
  const students = await StudentService.getStudents();
  res.json(students);
});
```

---

## 📋 RECURSOS DISPONIBLES

**Documentación Completa:**
- `docs/FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md` (Contexto XSS Fase 2)
- `docs/PATRONES_DOMPURIFY_COPY_PASTE.md` (10 patrones copy-paste)
- `docs/REFACTOR_TRACKING.md` (Historial de refactorizaciones)

**Scripts útiles:**
- `scripts/sanitize-dompurify.mjs` (Automatización de sanitización)

**Herramientas de validación:**
```bash
node -c archivo.js              # Validar sintaxis
grep -n "pattern" archivo.js    # Buscar patrones
npm start                       # Iniciar servidor local
```

---

## ⚡ FLUJO DE TRABAJO SIMPLE

### Para ARQUITECTO 1:
1. Lee `docs/INSTRUCCIONES_ARQUITECTO_1_TRABAJO_XSS.md`
2. Abre `public/js/student-dashboard.js`
3. Busca `.innerHTML =` y `.insertAdjacentHTML(`
4. Reemplaza con `DOMPurify.sanitize()`
5. Valida: `node -c public/js/student-dashboard.js`
6. Próximo archivo

### Para ARQUITECTO 2:
1. Lee `docs/INSTRUCCIONES_ARQUITECTO_2_TRABAJO_BACKEND.md`
2. Crea `public/js/debug-logger.js` (copia exacta del documento)
3. Crea `backend/utils/debug-logger.js` (copia exacta del documento)
4. Crea `backend/utils/sanitized-errors.js` (copia exacta del documento)
5. Sanitiza 25 archivos usando `debugLog` en lugar de `console.log`
6. Crea 10 servicios en `backend/services/`
7. Refactoriza 18 rutas

---

## 🎯 RESPONSABILIDADES DEL PM (TÚ)

**No instruyas Git a los arquitectos.** Ellos:
- ✅ Diseñan y construyen código
- ✅ Validan con `node -c`
- ✅ Testean funcionalidad
- ✅ Documentan cambios

**Tú (PM) harás:**
- ✅ `git add` los cambios
- ✅ `git commit` con mensaje descriptivo
- ✅ `git push` a la rama
- ✅ `git pull request` y merge a main

---

## 📊 PROGRESO ESPERADO

### ARQUITECTO 1:
- Día 1: 3 archivos ✓
- Día 2: 3 archivos ✓
- Día 3: 4 archivos ✓
- Día 4: 4 archivos ✓
- Día 5: 3 archivos ✓
- Día 6: 3 archivos ✓

**Total:** 20 archivos en 6-7 días

### ARQUITECTO 2:
- Días 1-4: SUB-TAREA A (Logging)
- Días 5-14: SUB-TAREA B (Backend Refactoring)

**Total:** 35-40 horas en ~14 días

---

## ✅ ENTREGABLES FINALES

### ARQUITECTO 1:
- 20 archivos JavaScript con XSS sanitizado
- Todos validados `node -c`
- `REFACTOR_TRACKING.md` actualizado
- 0 vulnerabilidades `.innerHTML` sin `DOMPurify`

### ARQUITECTO 2:
- 3 archivos nuevos (`debug-logger.js`, `debug-logger.js` backend, `sanitized-errors.js`)
- 10 servicios nuevos en `backend/services/`
- 25 archivos frontend/backend con logging limpio
- 18 rutas refactorizadas
- 0 accesos directo a `pool` en rutas

---

## 🚀 ¿LISTO?

**Envíales los documentos:**
1. `docs/INSTRUCCIONES_ARQUITECTO_1_TRABAJO_XSS.md`
2. `docs/INSTRUCCIONES_ARQUITECTO_2_TRABAJO_BACKEND.md`

**Y diles:**
> "Trabajen en sus archivos asignados. Yo manejo el Git. Validen con `node -c` y testean en navegador. ¡Adelante!"

---

**¡Buena suerte con los arquitectos! 🎯**
