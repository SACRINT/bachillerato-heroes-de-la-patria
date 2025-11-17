# 🔴 ERRORES ENCONTRADOS - AUDITORÍA 16 NOV 2025

## RESUMEN EJECUTIVO

**Página: index.html**
- ✅ No hay errores críticos en consola
- ✅ Warnings de DOMPurify (BAJO IMPACTO)
- ✅ Warnings de fonts preload (BAJO IMPACTO)
- ✅ 2 Errores PWA promise rechazadas (BAJO IMPACTO)

**Página: admin-dashboard.html**
- 🔴 **ERROR CRÍTICO 1:** TinyMCE NO CARGA - CSP bloqueando script de CDN
- 🔴 **ERROR CRÍTICO 2:** /api/approvals/pending retorna 500 (Internal Server Error)
- 🔴 **ERROR CRÍTICO 3:** /api/finances falla intermitentemente
- ⚠️ Muchos 304 Not Modified (caché - bajo impacto)
- ⚠️ Script TinyMCE pendiente (nunca carga por CSP)

---

## ERRORES CRÍTICOS DETALLADOS

### 1️⃣ TinyMCE NO CARGA (CRÍTICO)

**Consola Error (msgid=208,209,210):**
```
Refused to load the script 'https://cdn.tiny.cloud/1/9eomuls0jgbqziqkahugmesowt48tellxulfspshp9pa03bi/tinymce/6.8.6-46/tinymce.min.js'
because it violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com ..."

Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
```

**Timeout (msgid=348):**
```
❌ [TINYMCE] TinyMCE no se cargó después de 10 segundos.
Verifica la API key y la conexión a CDN.
```

**Causa Raíz:**
- CSP en `backend/server.js` o `vercel.json` NO incluye `https://cdn.tiny.cloud` ni variantes
- La URL intenta cargar desde `https://cdn.tiny.cloud/1/...` pero CSP no lo permite
- TinyMCE intenta múltiples URLs (6, 6.8.6-46) todas bloqueadas

**Ubicación del problema:**
- `backend/server.js` - línea con CSP headers
- `vercel.json` - si existe configuración de CSP

**Solución:**
```
Agregar a script-src en CSP:
- https://cdn.tiny.cloud
- https://*.tiny.cloud (wildcard para todas las versiones)
- https://cdn.tiny.cloud/*
```

---

### 2️⃣ /api/approvals/pending retorna 500 (CRÍTICO)

**Network Error (reqid=95):**
```
GET http://localhost:3000/api/approvals/pending [FAILED - 500]
```

**Consola Error (msgid=230):**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**Causa probable:**
- Ruta `/api/approvals/pending` en `backend/routes/` tiene error en lógica
- Probablemente SQL query incorrecto o tabla no existe
- Podría ser problema de conexión BD o query mal formada

**Archivos a revisar:**
- `backend/routes/approvals.js` (si existe)
- `backend/routes/admin.js` - línea del endpoint `/approvals/pending`
- Query SQL que intenta ejecutar

**Impacto:**
- Tab de "Aprobaciones" no carga datos
- Dashboard muestra "0 aprobaciones" (fallback)

---

### 3️⃣ /api/finances falla intermitentemente (CRÍTICO)

**Network:**
- Primera llamada: `reqid=94` [success - 200]
- Segunda llamada: `reqid=356` [pending - nunca completa]

**Síntoma:**
- A veces funciona, a veces falla
- Problema de race condition o timeout

**Archivos a revisar:**
- `backend/routes/finances.js`
- Conexión con pool de PostgreSQL
- Query que tarda mucho

---

## WARNINGS NO CRÍTICOS

### DOMPurify no disponible (msgid=3,46,82,88,etc)
```
⚠️ [DOMPURIFY] DOMPurify no disponible, retornando texto sin HTML
```
**Impacto:** Bajo - fallback funciona
**Solución:** Asegurar que `isomorphic-dompurify` o `dompurify` cargue antes

### Google Fonts preload (msgid=234,235)
```
The resource https://fonts.googleapis.com/... was preloaded using link preload
but not used within a few seconds from the window's load event.
```
**Impacto:** Muy bajo - solo warning de performance
**Solución:** Cambiar `rel="preload"` a `rel="prefetch"` o eliminar

### Script preload (msgid=337)
```
The resource http://localhost:3000/js/script.js was preloaded using link preload
but not used within a few seconds
```
**Impacto:** Muy bajo - script no se usa
**Solución:** Remover del HTML o lazy load

---

## ERRORES DE ESTILO EN TABS

**Descripción de problemas visuales:**
1. ❌ Tabs del dashboard tienen márgenes/paddings inconsistentes
2. ❌ Headers de los tabs no están alineados correctamente
3. ❌ Iconos dentro de tabs aparecen desalineados
4. ❌ Colores de tabs activos/inactivos inconsistentes
5. ❌ Espaciado entre elementos dentro de tabs irregular

**Archivo a revisar:** `public/css/style.css` y/o `public/css/admin-dashboard.css`

---

## RESUMEN DE ACCIONES REQUERIDAS

| Prioridad | Error | Archivo | Solución |
|-----------|-------|---------|----------|
| 🔴 CRÍTICA | TinyMCE CSP blocked | backend/server.js, vercel.json | Agregar cdn.tiny.cloud a CSP |
| 🔴 CRÍTICA | /api/approvals/pending 500 | backend/routes/approvals.js | Revisar query y lógica |
| 🔴 CRÍTICA | /api/finances intermitente | backend/routes/finances.js | Revisar timeout y conexión |
| 🟡 ALTO | Estilo tabs inválido | public/css/style.css | Revisar flex, grid, margins |
| 🟢 BAJO | DOMPurify warnings | public/js/dompurify-config.js | Asegurar carga correcta |
| 🟢 BAJO | Font preload warning | public/index.html, admin-dashboard.html | Cambiar rel="preload" a rel="prefetch" |

---

## PRÓXIMOS PASOS

1. **CRÍTICO:** Arreglar CSP para TinyMCE
2. **CRÍTICO:** Debuggear /api/approvals/pending 500 error
3. **CRÍTICO:** Optimizar /api/finances para evitar timeouts
4. **ALTO:** Arreglar estilos CSS de tabs
5. **BAJO:** Limpiar warnings de preload

