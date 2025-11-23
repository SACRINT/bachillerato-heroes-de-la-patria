# 🚨 DIAGNÓSTICO Y REPARACIÓN - ERRORES 500 CRÍTICOS
**Fecha:** 21 Noviembre 2025
**Estado:** 3 Errores 500 bloqueando login
**Prioridad:** CRÍTICA
**Duración de reparación estimada:** 45 min - 1 hora

---

## 📊 RESUMEN EJECUTIVO

**Errores Reportados:**
1. ❌ `GET /api/config/tenant` → 500 (Internal Server Error)
2. ❌ `GET /api/config/google-client-id` → 500 (Internal Server Error)
3. ❌ `GET /api/config/public-keys` → 500 (Internal Server Error)
4. ❌ `POST /api/auth/login` → 500 (cascada del #1-3)
5. ❌ `GET /manifest.json` → 401 (secundario, PWA)

**Impacto:**
- ❌ No carga tenant config (multi-tenant bloqueado)
- ❌ No carga Google OAuth config (login Google imposible)
- ❌ No carga public keys (autenticación imposible)
- ❌ Login admin falla con: `Error: [object Object]`
- ❌ Modal de login muestra: "Error de conexión. Intente nuevamente."

**Causa Raíz Probable:**
Los endpoints `/api/config/*` no están implementados en el backend o están en ruta comentada/no registrada.

---

## 🔍 INVESTIGACIÓN NECESARIA

### Paso 1: Verificar que endpoints existen
```bash
# En terminal, desde raíz del proyecto:
grep -r "config/tenant" backend/routes/*.js
grep -r "config/google-client-id" backend/routes/*.js
grep -r "config/public-keys" backend/routes/*.js
```

**Resultado esperado:** Deberías ver 3 líneas mostrando estos endpoints.

### Paso 2: Verificar que están registrados en server.js
```bash
grep -n "api/config" backend/server.js
```

**Resultado esperado:** Deberías ver imports y `app.use()` para rutas de config.

### Paso 3: Probar endpoints localmente
```bash
# En terminal, asume servidor corriendo en localhost:3000
curl -X GET http://localhost:3000/api/config/tenant
curl -X GET http://localhost:3000/api/config/google-client-id
curl -X GET http://localhost:3000/api/config/public-keys
```

**Resultado esperado:** JSON, no 500 error.

---

## 🛠️ SOLUCIONES PROBABLES

### SOLUCIÓN A: Ruta no existe o está comentada

**Archivos a revisar:**
- `backend/routes/config.js` (buscar si existe)
- `backend/server.js` (línea donde se registra `app.use('/api/config', ...)`)

**Si existe pero está comentada:**
```javascript
// En backend/server.js, DESCOMENTA esta línea:
// app.use('/api/config', require('./routes/config'));
```

**Si no existe el archivo:**
Crear `backend/routes/config.js` con:

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/config/tenant
router.get('/tenant', async (req, res) => {
  try {
    // Para ahora, retorna config default (multi-tenancy)
    res.json({
      success: true,
      data: {
        school_name: 'BGE Héroes de la Patria',
        school_domain: process.env.DOMAIN || 'localhost',
        school_color: '#1a365d',
        features_enabled: {
          oauth_google: true,
          two_factor: true,
          multi_tenant: true
        }
      }
    });
  } catch (error) {
    console.error('[CONFIG] Error en /tenant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/config/google-client-id
router.get('/google-client-id', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        client_id: process.env.GOOGLE_CLIENT_ID || 'dev-client-id.apps.googleusercontent.com'
      }
    });
  } catch (error) {
    console.error('[CONFIG] Error en /google-client-id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/config/public-keys
router.get('/public-keys', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        tinymce_api_key: process.env.TINYMCE_API_KEY || 'dev-key'
      }
    });
  } catch (error) {
    console.error('[CONFIG] Error en /public-keys:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

Luego registra en `backend/server.js`:
```javascript
// Línea ~500:
app.use('/api/config', require('./routes/config'));
```

### SOLUCIÓN B: Endpoint existe pero database query falla

Si el endpoint existe pero retorna 500:

1. **Revisar logs del servidor:**
```bash
# Verifica console output del servidor Node.js para el error real
# Busca línea que diga: [CONFIG] Error en /tenant: ...
```

2. **Probable causa:** `pool.query()` falla porque tabla no existe o SQL mal escrita
   - **Fix:** Cambiar a versión simplificada (ver Solución A arriba) que NO consulta BD

### SOLUCIÓN C: manifest.json 401

Este es secundario, pero mientras estés:

```javascript
// En backend/server.js, asegúrate que manifest.json es servido públicamente:
app.use(express.static('public'));

// Si está en /public/manifest.json, debería servirse automáticamente
// Si falta archivo, crearlo:
```

Crear `public/manifest.json`:
```json
{
  "name": "BGE Héroes de la Patria",
  "short_name": "BGE",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a365d",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 📋 CHECKLIST DE REPARACIÓN

Antes de hacer el PR, valida:

- [ ] **Ruta `/api/config` existe** (`backend/routes/config.js`)
- [ ] **Ruta está registrada** en `backend/server.js`
- [ ] **GET /api/config/tenant responde 200** (no 500)
- [ ] **GET /api/config/google-client-id responde 200** (no 500)
- [ ] **GET /api/config/public-keys responde 200** (no 500)
- [ ] **Servidor inicia sin errores** (`npm start` o `node backend/server.js`)
- [ ] **Console no muestra [CONFIG] errors**
- [ ] **Login modal aparece (sin error "Error de conexión")**
- [ ] **manifest.json sirve correctamente** (201 OK, no 401)

---

## 🎯 PRÓXIMOS PASOS PARA TI

### Opción 1: Rápido (hoy)
1. Verifica que `/api/config` existe con `grep`
2. Si no existe, crea `backend/routes/config.js` (código arriba)
3. Registra en `backend/server.js`
4. Reinicia servidor
5. Verifica `curl http://localhost:3000/api/config/tenant`
6. Si OK → Haz PR

### Opción 2: Asignar al Arquitecto (próxima sesión)
Dale esta instrucción simple:

```
Arquitecto IA: Tienes 3 errores 500 que reparar antes de continuar:

1. GET /api/config/tenant → 500
2. GET /api/config/google-client-id → 500
3. GET /api/config/public-keys → 500

Archivo: DIAGNOSTICO_ERRORES_500_REPARACION.md

Reparalos siguiendo las instrucciones. Validar con curl que cada endpoint retorna 200.
Commit: fix(backend): Reparar 3 endpoints config que retornaban 500
```

---

## 📝 TÍTULO Y DESCRIPCIÓN PARA EL PR ACTUAL

### Opción A: PR de Trabajo Completado (RECOMENDADO - hoy)
```
Título:
refactor(fase-1-3): Integración Event-Driven + Testing + Validación (v2.28.4)

Descripción:
## Summary
Completadas FASES 1, 2 y 3 del proyecto de refactorización BGE.
Event-Driven Architecture implementada y validada sin regresiones.

## Changes
- FASE 1: Event Bus + 2 Subscribers integrados
- FASE 2: Testing exhaustivo, 2 errores críticos reparados
- FASE 3: Validación de funcionalidad, 0 regresiones
- 61 rutas activas (fue 43, +41.8%)
- 3 commits realizados

## Test plan
✅ Event Bus testeado exhaustivamente
✅ 6 eventos procesados correctamente
✅ Backend inicia sin errores
✅ 8/9 endpoints públicos funcionan

## ⚠️ Known Issues (PRÓXIMA SESIÓN)
❌ /api/config/tenant → 500 (multi-tenant config)
❌ /api/config/google-client-id → 500 (Google OAuth)
❌ /api/config/public-keys → 500 (TinyMCE API key)
❌ Login falla cascada de estos 3 errores

Reparación documentada en: DIAGNOSTICO_ERRORES_500_REPARACION.md
```

### Opción B: PR CON REPARACIÓN (si alcanzas a reparar hoy)
```
Título:
refactor(fase-1-3): Integración Event-Driven + Testing + Validación + Config Fix (v2.28.5)

Descripción:
## Summary
Completadas FASES 1, 2 y 3 del proyecto.
Event-Driven Architecture implementada, testeada y con 3 endpoints config reparados.

## Changes
- FASE 1: Event Bus + 2 Subscribers integrados
- FASE 2: Testing exhaustivo, errores críticos reparados
- FASE 3: Validación sin regresiones
- FIX: Implementados endpoints /api/config/* (tenant, google-client-id, public-keys)
- 61 rutas activas
- 4 commits realizados

## Test plan
✅ Event Bus 100% funcional
✅ 3 endpoints config retornan 200 OK
✅ Login modal funciona (sin Error de conexión)
✅ Manifest.json servido correctamente
✅ 0 regresiones en funcionalidad
```

---

## 📌 RECOMENDACIÓN FINAL

**HOY (ahora):**
1. Haz el PR con el Título A (sin reparación, conocidos los issues)
2. En descripción, documenta los 3 errores conocidos
3. Enlaza `DIAGNOSTICO_ERRORES_500_REPARACION.md`

**PRÓXIMA SESIÓN:**
1. Pasa el diagnóstico al Arquitecto IA
2. El Arquitecto repara los 3 endpoints (30-45 min)
3. Haz segundo PR con fix

Esto es mejor que:
- Retrasar el PR esperando reparación (pierde tiempo)
- Hacer PR incompleto sin documentar issues (confunde)
- Meter fix chapucero sin testing (peor calidad)

---

*Documento generado: 21 Noviembre 2025*
*Estado: Listo para reparación*
*Tiempo estimado:** 45 min - 1 hora para reparación completa*
