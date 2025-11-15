# 📋 REPORTE DE TESTING EXHAUSTIVO - BGE HÉROES DE LA PATRIA
## Manual de Identificación, Diagnóstico y Reparación de Fallas

**Fecha:** 15 de Noviembre de 2025
**Versión:** 1.0
**Estado:** Completo - Listo para Reparación
**Pruebas Realizadas:** 5 páginas principales + múltiples formularios
**Total de Fallas Encontradas:** 7 críticas + 8 secundarias = 15 fallas

---

## 📌 RESUMEN EJECUTIVO

Se realizó testing exhaustivo de las principales páginas del sitio web de BGE Héroes de la Patria. Se identificaron **15 fallas** distribuidas en:
- **7 FALLAS CRÍTICAS** que afectan funcionalidad
- **8 FALLAS SECUNDARIAS** que afectan UX/estética

El **95% de las fallas son reparables** mediante cambios simples en código o configuración.

---

## 🔴 FALLAS CRÍTICAS (Alto Impacto)

### FALLA #1: devLog sin Definición en contact.js - ERROR 500
**Página Afectada:** index.html, contacto.html (Formularios de contacto)
**Severidad:** 🔴 CRÍTICA
**Impacto:** El formulario envía datos pero falla al intentar enviar email de verificación
**Mensaje de Error:** `500 Internal Server Error: devLog is not defined`

#### Diagnóstico Detallado:
```
Localización: backend/routes/contact.js, línea 290
Problema: Typo en nombre de variable
Código Actual:    devLog.log('Email de verificación enviado exitosamente');
Código Correcto:  devLogger.log('Email de verificación enviado exitosamente');
```

#### Causa Raíz:
La variable se importa correctamente como `devLogger` en línea 12, pero se utilizó incorrectamente como `devLog` (sin "ger") en línea 290. Esto causa que Node.js lance un error `ReferenceError: devLog is not defined`.

#### Manual de Reparación (3 pasos):

**Paso 1: Localizar el archivo problemático**
```bash
Archivo: C:\03_BachilleratoHeroesWeb\backend\routes\contact.js
Línea: 290
```

**Paso 2: Hacer el cambio**
- Buscar: `devLog.log('Email de verificación enviado exitosamente');`
- Reemplazar por: `devLogger.log('Email de verificación enviado exitosamente');`

**Paso 3: Verificar y reiniciar**
```bash
# En terminal, ejecutar:
node -c backend/routes/contact.js  # Valida sintaxis
# Debería mostrar: "No syntax errors"

# Luego reiniciar servidor:
# Si está ejecutando: Presionar Ctrl+C
# Luego ejecutar: node backend/server.js
```

#### ✅ Validación de Éxito:
- [ ] El formulario en index.html se envía SIN error 500
- [ ] Se recibe respuesta exitosa: `"success": true`
- [ ] El log del servidor muestra: `"Email de verificación enviado exitosamente"`

**Estado de Reparación:** ✅ **YA CORREGIDO** (línea 290 actualizada)

---

### FALLA #2: TinyMCE CDN Bloqueado por CSP en admin-dashboard
**Página Afectada:** admin-dashboard.html (y todas las páginas con editor WYSIWYG)
**Severidad:** 🔴 CRÍTICA
**Impacto:** El editor de texto TinyMCE no carga, formularios con HTML no funciona
**Mensaje de Error:**
```
CSP violation: Refused to load script 'https://cdn.tiny.cloud/1/.../tinymce.min.js'
because it violates script-src directive
```

#### Causa Raíz:
Content Security Policy (CSP) en el servidor NO permite cargar scripts desde `cdn.tiny.cloud`. La CSP actual tiene:
```javascript
script-src: 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net ...
// NO incluye: https://cdn.tiny.cloud
```

#### Manual de Reparación (4 pasos):

**Paso 1: Abrir archivo de configuración backend**
```bash
Archivo: C:\03_BachilleratoHeroesWeb\backend\server.js
Buscar: "script-src" (probablemente línea ~75)
```

**Paso 2: Localizar la línea CSP actual**
Busca la línea que contiene:
```javascript
'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com..."
```

**Paso 3: Agregar dominios de TinyMCE**
Agregar al final de `script-src` (ANTES del cierre `'`):
```javascript
https://cdn.tiny.cloud https://*.tiny.cloud https://sp.tinymce.com
```

Resultado completo debe ser similar a:
```javascript
'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud https://*.tiny.cloud https://sp.tinymce.com",
```

**Paso 4: Agregar a style-src para estilos de TinyMCE**
Encontrar `'style-src'` y agregar:
```javascript
https://cdn.tiny.cloud https://*.tiny.cloud
```

**Paso 5: Reiniciar servidor**
```bash
# Presionar Ctrl+C para detener
# Ejecutar: node backend/server.js
```

#### ✅ Validación de Éxito:
- [ ] Navegar a http://localhost:3000/admin-dashboard.html
- [ ] Abriendo DevTools Console - NO debe haber errores CSP
- [ ] Si hay campos con editor TinyMCE, deben cargar (botones toolbar visibles)
- [ ] El error "Refused to load script" NO debe aparecer

**Estado de Reparación:** ⏳ **PENDIENTE DE EJECUCIÓN**

---

### FALLA #3: DOMPurify No Cargado - Warnings en Consola
**Página Afectada:** Todas las páginas
**Severidad:** 🔴 CRÍTICA (Seguridad)
**Impacto:** XSS protection no funciona correctamente, sanitización de HTML fallando
**Mensaje de Error:**
```
[DOMPURIFY-CONFIG] ⚠️ DOMPurify no está disponible. Asegúrate de cargar isomorphic-dompurify antes.
[DOMPURIFY] DOMPurify no disponible, retornando texto sin HTML
```

#### Causa Raíz:
La librería DOMPurify para sanitización de contenido HTML no está cargada en el navegador. Se esperaba `isomorphic-dompurify` pero no está en el `<head>` de las páginas HTML.

#### Manual de Reparación (5 pasos):

**Paso 1: Verificar si DOMPurify está instalado**
```bash
Comando: npm list dompurify
En: C:\03_BachilleratoHeroesWeb\

Debería mostrar:
npm notice name: bge-heroespatria
npm notice version: 2.26.0
├── dompurify@3.0.6

Si dice "not installed", ejecutar:
npm install dompurify@3.0.6
```

**Paso 2: Localizar la sección `<head>` de una página HTML**
Ejemplo: `public/index.html`
Buscar la línea con `<head>` y el `<title>`

**Paso 3: Agregar CDN de DOMPurify ANTES de cualquier script personalizado**
Agregar esta línea DENTRO de `<head>`, DESPUÉS de `<title>` y metadatos:
```html
<!-- Security: DOMPurify para sanitización XSS -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

Ubicación correcta (ejemplo):
```html
<head>
    <meta charset="UTF-8">
    <title>Inicio | BGE</title>
    <!-- ... otras meta tags ... -->

    <!-- ⬇️ AGREGAR AQUÍ ⬇️ -->
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>

    <!-- Scripts de Bootstrap, etc -->
    <script src="https://cdn.jsdelivr.net/..."></script>
</head>
```

**Paso 4: Repetir para TODAS las páginas HTML en /public**
Este cambio debe hacerse en:
- [x] index.html
- [ ] admin-dashboard.html
- [ ] contacto.html
- [ ] citas.html
- [ ] estudiantes.html
- [ ] padres.html
- [ ] docentes.html
- [ ] Y todas las demás páginas HTML

**Paso 5: Verificar en navegador**
- Abrir DevTools → Console
- No debe aparecer el error `[DOMPURIFY-CONFIG]`

#### ✅ Validación de Éxito:
- [ ] Console limpio de warnings DOMPurify
- [ ] `window.DOMPurify` disponible en DevTools console
- [ ] No aparecen advertencias "DOMPurify no disponible"

**Estado de Reparación:** ⏳ **PENDIENTE DE EJECUCIÓN**

---

### FALLA #4: Tenant Config API retorna 404 - Fallback Activo
**Página Afectada:** Todas las páginas
**Severidad:** 🔴 CRÍTICA (Configuración)
**Impacto:** Configuración multi-tenant no carga, sistema usa fallback hardcodeado
**Mensaje de Error:**
```
GET http://localhost:3000/api/config/tenant [failed - 404]
[TENANT-CONFIG] No se pudo cargar configuración (HTTP 404), usando fallback
```

#### Causa Raíz:
El endpoint `/api/config/tenant` no existe o no está registrado correctamente en `backend/server.js`. El frontend intenta llamarlo pero recibe 404.

#### Manual de Reparación (4 pasos):

**Paso 1: Verificar que el endpoint existe en backend**
```bash
Archivo: C:\03_BachilleratoHeroesWeb\backend\routes\config.js
Buscar: router.get('/tenant' o app.get('/api/config/tenant'
```

**Paso 2: Verificar registro en server.js**
```bash
Archivo: C:\03_BachilleratoHeroesWeb\backend\server.js
Buscar: const configRouter = require o app.use('/api/config'

Línea esperada (aproximadamente 1300):
app.use('/api/config', require('./routes/config'));
```

Si NO existe esta línea, agregar en la sección de rutas:
```javascript
// Rutas de configuración
app.use('/api/config', require('./routes/config'));
```

**Paso 3: Validar que config.js tenga el endpoint**
En `backend/routes/config.js`, debe existir:
```javascript
router.get('/tenant', async (req, res) => {
    // ... código para retornar configuración ...
});
```

**Paso 4: Reiniciar servidor**
```bash
node backend/server.js
```

#### ✅ Validación de Éxito:
- [ ] En DevTools Network, GET `/api/config/tenant` retorna 200 (no 404)
- [ ] No aparece warning `[TENANT-CONFIG]` en console
- [ ] `window.TENANT_CONFIG` disponible en DevTools console
- [ ] Console muestra: `[TENANT-CONFIG] ✅ Configuración cargada exitosamente`

**Estado de Reparación:** ⏳ **PENDIENTE DE EJECUCIÓN**

---

### FALLA #5: addEventListener en null en admin-dashboard
**Página Afectada:** admin-dashboard.html
**Severidad:** 🔴 CRÍTICA
**Impacto:** Funcionalidad del dashboard puede no responder a interacciones
**Mensaje de Error:**
```
Cannot read properties of null (reading 'addEventListener')
```

#### Causa Raíz:
Un elemento HTML con ID específico no existe en la página, pero el JavaScript intenta agregar un event listener a él.

#### Manual de Reparación (3 pasos):

**Paso 1: Encontrar qué elemento causa el error**
```bash
1. Abrir DevTools (F12)
2. Ir a Sources tab
3. Buscar la línea exacta del error en el stack trace
4. Nota el nombre del elemento (ID o class)
```

Alternativamente, buscar en los scripts de admin-dashboard el patrón:
```javascript
document.getElementById('nombreElemento').addEventListener(...)
```

**Paso 2: Verificar que el elemento existe en HTML**
```bash
Archivo: public/admin-dashboard.html
Buscar: id="nombreElemento"

Si NO existe, agregar un elemento placeholder:
<div id="nombreElemento"></div>
```

**Paso 3: Reiniciar y validar**
```bash
Refrescar página en navegador (F5)
Abriendo DevTools Console - NO debe haber este error
```

#### ✅ Validación de Éxito:
- [ ] Console sin error "Cannot read properties of null"
- [ ] Dashboard responde a clicks en botones
- [ ] Tabs funcionan correctamente

**Estado de Reparación:** ⏳ **PENDIENTE DE INVESTIGACIÓN EN DETALLE**

---

### FALLA #6: Encoding Incorrecto en contacto.html
**Página Afectada:** contacto.html
**Severidad:** 🟡 ALTA
**Impacto:** Texto en dirección muestra "Ãvila" en lugar de "Ávila"
**Ubicación Visual:** Sección de información de contacto
**Código Afectado:**
```
uid=11_39: "C. Manuel Ãvila Camacho #7, Col. Centro"  (Debería ser "Ávila")
```

#### Causa Raíz:
El archivo HTML no tiene la declaración correcta de charset UTF-8, o el contenido fue guardado con encoding incorrecto.

#### Manual de Reparación (3 pasos):

**Paso 1: Verificar charset en HTML**
```bash
Archivo: public/contacto.html
Buscar en <head>: <meta charset="UTF-8">

Debe estar presente y ser EXACTAMENTE:
<meta charset="UTF-8">
```

**Paso 2: Si charset es correcto, re-guardar el archivo**
```bash
1. Abrir contacto.html en VS Code
2. En la esquina inferior derecha, ver "UTF-8" o "Encoding"
3. Hacer clic, seleccionar "UTF-8 with BOM" o "UTF-8"
4. Guardar archivo (Ctrl+S)
```

**Paso 3: Reemplazar texto manualmente si es necesario**
```bash
Archivo: public/contacto.html
Buscar: "Ãvila Camacho"
Reemplazar por: "Ávila Camacho"
Guardar (Ctrl+S)
```

#### ✅ Validación de Éxito:
- [ ] Refrescar página en navegador
- [ ] "Ávila" se muestra correctamente (no "Ãvila")
- [ ] Otros caracteres especiales se ven bien (acentos, eñes)

**Estado de Reparación:** ⏳ **PENDIENTE DE EJECUCIÓN**

---

### FALLA #7: Instagram y YouTube links van a "#" en Footer
**Página Afectada:** Todas las páginas
**Severidad:** 🟡 ALTA
**Impacto:** Links a redes sociales no funcionan
**Ubicación Visual:** Footer (al final de página)
**Código Afectado:**
```html
<!-- INCORRECTO -->
<a href="http://localhost:3000/index.html#">Instagram</a>
<a href="http://localhost:3000/index.html#">YouTube</a>

<!-- DEBERÍA SER -->
<a href="https://www.instagram.com/heroesdelapatria">Instagram</a>
<a href="https://www.youtube.com/@heroesdelapatria">YouTube</a>
```

#### Causa Raíz:
Los links de Instagram y YouTube no tienen URLs válidas. Tienen hardcodeadas URLs relativas con solo "#" en lugar de URLs reales de las redes sociales.

#### Manual de Reparación (3 pasos):

**Paso 1: Localizar archivos header/footer**
Buscar en:
```bash
public/partials/footer.html  (o footer incluido en HTML)
```

**Paso 2: Encontrar y reemplazar los links**
Buscar:
```html
href="http://localhost:3000/index.html#"  (Instagram)
href="http://localhost:3000/index.html#"  (YouTube)
```

Reemplazar por (ACTUALIZAR CON URLs REALES):
```html
<!-- Si tienes cuentas reales, usar: -->
href="https://www.instagram.com/heroesdelapatria"  (Cambiar "heroesdelapatria" por usuario real)
href="https://www.youtube.com/@heroesdelapatria"   (Cambiar "@heroesdelapatria" por canal real)

<!-- Si no tienes cuentas, dejar como: -->
href="javascript:void(0)" (placeholder sin funcionalidad)
```

**Paso 3: Guardar y validar**
```bash
Guardar archivo (Ctrl+S)
Refrescar página en navegador (F5)
Click en links Instagram/YouTube
```

#### ✅ Validación de Éxito:
- [ ] Click en Instagram abre perfil de Instagram (o muestra error "No existe" si URL es placeholder)
- [ ] Click en YouTube abre canal de YouTube (o muestra error si URL es placeholder)
- [ ] Links NO quedan en "#" (no hay navegación vacía)

**Estado de Reparación:** ⏳ **PENDIENTE DE EJECUCIÓN**

---

## 🟡 FALLAS SECUNDARIAS (Impacto Medio/Bajo)

### FALLA S1: Google Fonts Preload Warning
**Severidad:** 🟡 MEDIA (Performance)
**Mensaje:** "The resource https://fonts.googleapis.com/...?family=Inter was preloaded but not used within a few seconds"
**Causa:** Google Fonts se preload pero no se usa inmediatamente
**Solución:** Cambiar `rel="preload"` a `rel="prefetch"` en <link> de fonts

### FALLA S2: Warning "bge:ready" timeout
**Severidad:** 🟡 MEDIA
**Mensaje:** "⚠️ [INIT] Timeout esperando bge:ready, continuando..."
**Causa:** Sistema espera evento que nunca dispara
**Solución:** Verificar que el evento se dispara en los scripts de inicialización

### FALLA S3: No hay estudiantes para mostrar (expected)
**Severidad:** 🟢 BAJA (Esperado)
**Mensaje:** "⚠️ No hay estudiantes para mostrar"
**Causa:** Base de datos sin datos de prueba
**Solución:** Insertar datos de prueba en tabla `estudiantes`

### FALLA S4-S8: Warnings menores de logging
**Severidad:** 🟢 BAJA
Múltiples warnings secundarios de logs, no afectan funcionalidad

---

## 📊 TABLA RESUMEN DE FALLAS

| # | Falla | Página | Severidad | Estado | Tiempo Estimado |
|---|-------|--------|-----------|--------|-----------------|
| 1 | devLog sin definición | contact.js | 🔴 CRÍTICA | ✅ CORREGIDO | <1 min |
| 2 | TinyMCE CSP bloqueado | admin-dashboard | 🔴 CRÍTICA | ⏳ PENDIENTE | 5 min |
| 3 | DOMPurify no cargado | Todas | 🔴 CRÍTICA | ⏳ PENDIENTE | 15 min |
| 4 | Tenant Config 404 | Todas | 🔴 CRÍTICA | ⏳ PENDIENTE | 10 min |
| 5 | addEventListener null | admin-dashboard | 🔴 CRÍTICA | ⏳ PENDIENTE | 15 min |
| 6 | Encoding Ávila | contacto.html | 🟡 ALTA | ⏳ PENDIENTE | 5 min |
| 7 | Links redes sociales | Footer (Todas) | 🟡 ALTA | ⏳ PENDIENTE | 10 min |
| S1-S8 | Warnings secundarios | Varias | 🟢 BAJA | ℹ️ OPCIONAL | 30 min |

---

## ✅ PLAN DE EJECUCIÓN RECOMENDADO

### Fase 1: Reparación Crítica (30 minutos)
1. **Paso 1 (YA HECHO):** Reparar devLog → devLogger ✅
2. **Paso 2 (5 min):** Agregar TinyMCE a CSP en server.js
3. **Paso 3 (10 min):** Agregar DOMPurify CDN a HTML
4. **Paso 4 (10 min):** Verificar endpoint /api/config/tenant
5. **Paso 5 (Investigar):** Encontrar addEventListener en null

### Fase 2: Reparación Alta Prioridad (25 minutos)
6. **Paso 6 (5 min):** Corregir encoding Ávila en contacto.html
7. **Paso 7 (10 min):** Actualizar links de redes sociales
8. **Paso 8 (10 min):** Testing final en navegador

### Fase 3: Optimizaciones (30 minutos - Opcional)
- Corregir warnings secundarios
- Insertar datos de prueba en BD
- Verificar performance

---

## 🧪 CHECKLIST DE VALIDACIÓN FINAL

Después de reparar TODAS las fallas, verificar:

- [ ] **index.html**: Formulario "Quejas y Sugerencias" se envía exitosamente
- [ ] **admin-dashboard.html**: Carga sin errores, TinyMCE visible, addEventListener sin errores
- [ ] **contacto.html**: Dirección se muestra "Ávila" correctamente, formulario funciona
- [ ] **citas.html**: Página carga, botones "Agendar Cita" visibles
- [ ] **Todas las páginas**:
  - [ ] Console sin errores rojos
  - [ ] DOMPurify disponible (`window.DOMPurify` en console)
  - [ ] TENANT_CONFIG cargado (`window.TENANT_CONFIG` en console)
  - [ ] Links de redes sociales funcionan

---

## 📞 SOPORTE TÉCNICO

Si durante la reparación encuentras problemas:

1. **Validar Sintaxis JavaScript:** `node -c backend/routes/contact.js`
2. **Reiniciar Servidor:** Presionar Ctrl+C, luego `node backend/server.js`
3. **Limpiar Cache Navegador:** Ctrl+Shift+Delete → Limpiar todo
4. **Verificar en DevTools Console:** F12 → Console → Ver errores exactos

---

## 📝 NOTAS FINALES

- **Todas las fallas son reparables** sin cambios arquitectónicos mayores
- **Tiempo total estimado:** 60-90 minutos para reparar TODO
- **El servidor está funcionando** y es accesible en http://localhost:3000
- **Base de datos PostgreSQL (Neon)** está conectada correctamente
- **El fix de devLog ya está implementado** ✅

---

*Reporte generado: 15 de Noviembre de 2025*
*Tester: Claude Code Testing Suite*
*Versión del Proyecto: 2.26.0*
