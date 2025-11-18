# 📋 INSTRUCCIONES PARA ARQUITECTO - CONTINUACIÓN DEL PROYECTO BGE

**Fecha:** 17 de Noviembre 2025
**Estado del Proyecto:** v4.1.0
**Arquitecto Anterior:** Completó PR #20 exitosamente ✅
**Arquitecto Actual:** TÚ
**Prioridad:** 🔴 CRÍTICA - Aplicar fixes inmediatamente

---

## 🎯 TAREAS INMEDIATAS (Hoy - 30 minutos)

### PASO 1: Entender lo que pasó (5 minutos de lectura)

El arquitecto anterior completó 4 fixes y los mergeó a `main` via PR #20. Sin embargo, después de mergear, descubrí **2 nuevos errores** que **impiden que el servidor inicie**:

1. **ERROR 5:** Mismatch en nombre de función importada (`authMiddleware` vs `authenticateToken`)
2. **ERROR 6:** Falta de dependencia `ioredis` en el backend

Ambos errores ya fueron **reparados automáticamente** por Claude Code, pero necesito que hagas los commits para documentar los cambios.

---

### PASO 2: Revisar los cambios ya hechos (5 minutos)

Los siguientes archivos ya fueron modificados **automáticamente**. Verifica con:

```bash
# Ver el status de git
git status

# Deberías ver cambios en:
# - backend/routes/reports.js
# - backend/routes/webhooks.js
# - backend/routes/search.js
# - backend/routes/notifications-realtime.js
# - backend/package-lock.json
```

**Cambios realizados:**

#### **CAMBIO 1: Archivo `backend/routes/reports.js` (línea 9)**
```javascript
// ❌ ANTES (incorrecto)
const { authMiddleware } = require('../middleware/auth');

// ✅ DESPUÉS (correcto)
const { authenticateToken } = require('../middleware/auth');
```

**Por qué se arregló:**
- El archivo `/backend/middleware/auth.js` **exporta `authenticateToken`**, no `authMiddleware`
- Las 7 líneas que usaban `authMiddleware` fueron reemplazadas por `authenticateToken`

#### **CAMBIO 2: Otros archivos de rutas**
Los mismos cambios se aplicaron a:
- `backend/routes/webhooks.js`
- `backend/routes/search.js`
- `backend/routes/notifications-realtime.js`

#### **CAMBIO 3: Dependencia ioredis**
```bash
npm install ioredis
```
- Agregado al `backend/package.json` y `backend/package-lock.json`
- Requiere este paquete: `backend/services/cache-service.js`

---

### PASO 3: Haz los commits (10 minutos)

Ejecuta estos comandos **en orden**:

```bash
# 1. Asegúrate de estar en main y todo esté sincronizado
git checkout main
git pull origin main

# 2. Revisa qué cambios hay
git status

# 3. Agrega los cambios de las rutas
git add backend/routes/reports.js
git add backend/routes/webhooks.js
git add backend/routes/search.js
git add backend/routes/notifications-realtime.js

# 4. Commit para ERROR 5
git commit -m "fix(imports): Cambiar authMiddleware a authenticateToken en rutas

- Problema: auth.js exporta 'authenticateToken', no 'authMiddleware'
- Archivos: reports.js, webhooks.js, search.js, notifications-realtime.js
- Total cambios: 7 líneas de imports y usos
- Esto permite que el servidor inicie sin error de imports"

# 5. Agrega cambios del package
git add backend/package-lock.json

# 6. Commit para ERROR 6
git commit -m "deps(cache): Instalar ioredis para cache-service

- Problema: backend/services/cache-service.js requiere ioredis pero no estaba instalado
- Solución: npm install ioredis
- Necesario para: Caching de Redis en Semanas 17-24 del plan
- Status: Dependencia ahora disponible"

# 7. Push a main
git push origin main
```

**Resultado esperado:**
```
✅ 2 nuevos commits en main
✅ GitHub mostrará los commits en el historial
✅ Vercel será notificado y ejecutará deploy automático
```

---

### PASO 4: Verifica que el servidor inicia (10 minutos)

```bash
# Terminal 1: Reinicia el servidor
cd C:\03_BachilleratoHeroesWeb
npm start

# Deberías ver:
# ✅ Server running on port 3000
# ✅ Connected to Neon database
# ✅ SIN errores de "Cannot find module"
# ✅ SIN errores de "ioredis"
```

Si el servidor **NO inicia**, revisa:
- ¿Ejecutaste ambos commits?
- ¿Hiciste git push?
- ¿Reiniciaste después de hacer npm install ioredis?

---

## 📚 DOCUMENTACIÓN IMPORTANTE

Léete estos documentos **en este orden** para entender qué viene:

### 1️⃣ PRIMERO: `REVISION_COMPLETA_ERRORES_Y_PLAN_24_SEMANAS.md` (2-3 horas)
- Resumen de los 6 errores encontrados
- Detalles técnicos de cada uno
- **Plan de 24 semanas** dividido en 6 fases
- Tareas específicas para cada semana
- Estimación de horas por semana
- Costo de APIs (Gemini solamente, como pidió el PM)
- Métricas de éxito

### 2️⃣ SEGUNDO: Este documento (20 minutos)
- Instrucciones para commits de los fixes
- Contexto de qué pasó

### 3️⃣ TERCERO: `docs/historia_del_proyecto.md` (30 minutos)
- Contexto histórico del proyecto
- Arquitectura actual
- Tecnologías usadas
- Decisiones previas

### 4️⃣ CUARTO: `CLAUDE.md` (20 minutos)
- Protocolos de trabajo obligatorios
- Directivas especiales del PM
- Estado actual del proyecto

---

## 🚀 PRÓXIMOS PASOS (Después de hacer los commits)

Una vez que los commits estén hechos y el servidor esté iniciando correctamente:

### **SEMANA 1 (Hoy - Viernes):** Auditoría de Código
Basado en el plan de 24 semanas, tu primera tarea es:

1. **Auditar console.logs en producción**
   - Hay ~6,000 console.logs sin condicionales
   - Muchos contienen datos sensibles (emails, tokens)
   - Necesitan ser reemplazados con logging condicional (debugLog)

2. **Revisar código muerto en `/no_usados/`**
   - Hay 155 archivos de código muerto (~4-5 MB)
   - Algunos son útiles y deben recuperarse
   - Otros deben ser archivados permanentemente

3. **Identificar requests lentos (>200ms)**
   - Actualmente 50-70 requests por página
   - Target: <40 requests

### **COMMIT SCHEDULE para Semana 1:**
```
Lunes:   Commits de fixes + Iniciación del plan (HOY - 30 min)
Martes:  Auditoría de logs (6-8 horas)
Miércoles: Código muerto (4-6 horas)
Jueves:  Performance baselines (4-6 horas)
Viernes: Documentación + Pull Request (2-4 horas)
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Por qué el servidor no iniciaba?**
R: Dos problemas:
1. Importaba `authMiddleware` que no existe (debía ser `authenticateToken`)
2. Faltaba instalar `ioredis` que usa cache-service.js

**P: ¿Quién arregló estos errores?**
R: Claude Code automáticamente. Tu tarea es documentarlos con commits.

**P: ¿Puedo empezar el plan de 24 semanas ahora?**
R: SÍ, después de completar PASO 1-4. El plan está en `REVISION_COMPLETA_ERRORES_Y_PLAN_24_SEMANAS.md`.

**P: ¿Debo usar OpenAI/Anthropic APIs?**
R: **NO**. El PM pidió usar **Gemini API solamente** por costos. Esto ya está en el plan.

**P: ¿Qué si tengo problemas con los commits?**
R: Contacta al PM. Los cambios ya están hechos en disco, solo necesitan ser commiteados.

---

## 📞 CONTACTO

Si algo falla:
1. Revisa la consola del servidor (`npm start` output)
2. Verifica `git status` para confirmar cambios
3. Contacta al PM con el error exacto

---

**Estado:** ✅ LISTO PARA QUE ARQUITECTO CONTINÚE
**Próximo Checkpoint:** Después de los commits (30 min)
**Inicio del Plan de 24 Semanas:** Inmediatamente después

