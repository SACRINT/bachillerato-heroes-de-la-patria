# 🔧 INSTRUCCIONES DE REPARACIÓN PARA EL ARQUITECTO

**Fecha:** 17 Noviembre 2025
**Rama:** `claude/fix-csp-errors-01ESGL2jJ78S5gKkXhVdofRE`
**Acción:** Reparar 3 errores antes de mergear a main
**Tiempo estimado:** 60-90 minutos

---

## 📋 RESUMEN RÁPIDO

Se identificaron 3 errores menores en la validación de los cambios:

| # | Error | Archivo | Tiempo | Dificultad |
|---|-------|---------|--------|-----------|
| 1 | DOMPurify is not defined | `public/js/floating-toolbar.js` | 15 min | ✅ Fácil |
| 2 | Partials no cargan | `public/partials/` y `public/js/main.js` | 15 min | ✅ Fácil |
| 3 | Tenant context - BD | `backend/middleware/tenant-context.js` + Neon | 30 min | ✅ Fácil |

---

## 🔴 ERROR 1: DOMPurify is not defined (15 minutos)

### Causa:
- `floating-toolbar.js` intenta usar `DOMPurify.sanitize()` sin verificar si está disponible
- Error aparece en 3 páginas (index.html, estudiantes.html, padres.html)

### Pasos de reparación:

**1. Abre el archivo:**
```bash
code public/js/floating-toolbar.js
```

**2. Busca la línea 96** - Presiona `Ctrl+G` y escribe `96`

**3. Busca TODAS las instancias de `DOMPurify`** - Presiona `Ctrl+H`:
   - Search: `DOMPurify.sanitize`
   - Replace with: (seguir pasos abajo)

**4. Reemplaza cada instancia con protección:**

```javascript
// PATRÓN CORRECTO (Opción A - Recomendada):
const sanitized = (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize)
  ? DOMPurify.sanitize(html)
  : window.sanitizeHTML(html);
```

O si es más legible para ti:

```javascript
// PATRÓN ALTERNATIVO (Opción B):
let sanitized = html;
if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
  sanitized = DOMPurify.sanitize(html);
} else if (typeof window.sanitizeHTML === 'function') {
  sanitized = window.sanitizeHTML(html);
}
```

**5. Guarda el archivo:** `Ctrl+S`

**6. Verifica en navegador:**
```bash
# En otra terminal, abre:
http://localhost:3000/index.html

# Abre DevTools: F12 → Console
# NO debe haber error "DOMPurify is not defined"
```

**7. Haz commit:**
```bash
git add public/js/floating-toolbar.js
git commit -m "fix(dompurify): Verificar disponibilidad de DOMPurify antes de usar

- Agregar guards para DOMPurify.sanitize() en floating-toolbar.js
- Usar fallback window.sanitizeHTML() cuando DOMPurify no esté disponible
- Elimina error 'DOMPurify is not defined' de consola"
```

---

## 🔴 ERROR 2: Partials no cargan (15 minutos)

### Causa:
- `public/partials/header.html` y `footer.html` no se encuentran
- O rutas incorrectas en `main.js`

### Pasos de reparación:

**1. Verifica que los archivos existen:**
```bash
# En PowerShell o Terminal:
ls public/partials/
# Debe mostrar:
# header.html
# footer.html

# Si NO existen, necesitas crearlos:
# Verificar en qué carpeta están actualmente los parciales
ls public/includes/
ls public/components/
# O buscar en el proyecto:
find public -name "header.html" -o -name "footer.html"
```

**2. Si los archivos existen:**
- Abre `public/js/main.js`
- Busca la función `loadHeaderFooter()`
- Verifica la ruta: debe ser `./partials/header.html` (relativa, no absoluta)

**3. Reemplaza el código en `loadHeaderFooter()` con mejor manejo de errores:**

```javascript
async function loadHeaderFooter() {
  try {
    // Cargar header
    const headerResponse = await fetch('./partials/header.html');
    if (!headerResponse.ok) {
      console.warn(`⚠️ Header no encontrado (${headerResponse.status})`);
    } else {
      const headerHtml = await headerResponse.text();
      const headerElement = document.querySelector('header') || document.body;
      headerElement.insertAdjacentHTML('afterbegin', headerHtml);
    }

    // Cargar footer
    const footerResponse = await fetch('./partials/footer.html');
    if (!footerResponse.ok) {
      console.warn(`⚠️ Footer no encontrado (${footerResponse.status})`);
    } else {
      const footerHtml = await footerResponse.text();
      const footerElement = document.querySelector('footer') || document.body;
      footerElement.insertAdjacentHTML('beforeend', footerHtml);
    }
  } catch (err) {
    console.warn('Error cargando partials:', err);
  }
}
```

**4. Guarda el archivo:** `Ctrl+S`

**5. Verifica en navegador:**
```bash
http://localhost:3000/index.html
# Console (F12) NO debe haber warnings de "Could not load partials"
```

**6. Haz commit:**
```bash
git add public/js/main.js public/partials/
git commit -m "fix(partials): Corregir carga de header y footer

- Usar rutas relativas correctas ./partials/header.html
- Agregar mejor manejo de errores en loadHeaderFooter()
- Verificar que archivos existen en public/partials/"
```

---

## 🔴 ERROR 3: Tenant Context - BD (30 minutos)

### Causa:
- Tabla `tenants` en PostgreSQL (Neon) no tiene columna `nombre`
- SQL query en `backend/middleware/tenant-context.js` usa columna que no existe

### Pasos de reparación:

**1. Conecta a Neon Console:**
```
https://console.neon.tech
→ Selecciona proyecto BGE
→ SQL Editor
```

**2. Verifica estructura de tabla `tenants`:**
```sql
-- Ejecuta en Neon:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name    | data_type | is_nullable
id             | uuid      | NO
name           | varchar   | YES
domain         | varchar   | NO
config_json    | jsonb     | YES
... otras columnas ...
```

**3. Si NO ves columna `nombre` o `name`:**

Ejecuta esto en Neon para crearla:

```sql
-- Crear columna nombre
ALTER TABLE tenants ADD COLUMN nombre VARCHAR(255) DEFAULT 'Tenant';

-- Crear índice para mejor performance
CREATE INDEX idx_tenants_nombre ON tenants(nombre);

-- Verificar que se creó
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants' ORDER BY ordinal_position;
```

**4. Verifica el archivo `backend/middleware/tenant-context.js`:**

Abre:
```bash
code backend/middleware/tenant-context.js
```

**5. Busca queries que usen la tabla `tenants` y verifica sintaxis PostgreSQL:**

❌ **INCORRECTO (MySQL):**
```sql
SELECT * FROM tenants WHERE id = ?;
```

✅ **CORRECTO (PostgreSQL):**
```sql
SELECT * FROM tenants WHERE id = $1;
```

**6. Reemplaza cualquier `?` con `$1, $2, $3` según corresponda:**

Ejemplo correcto:
```javascript
const query = `
  SELECT id, nombre, domain, config_json
  FROM tenants
  WHERE domain = $1
`;
const result = await pool.query(query, [tenantDomain]);
```

**7. Guarda el archivo:** `Ctrl+S`

**8. Reinicia el servidor:**
```bash
# En terminal donde está corriendo:
npm stop

# Espera 2 segundos

npm start

# Verifica logs - NO debe haber "column 'nombre' does not exist"
```

**9. Verifica en navegador:**
```bash
http://localhost:3000/index.html
# Abre DevTools: F12 → Console
# Debe mostrar: "[TENANT-CONFIG] Configuración cargada exitosamente"
# NO debe haber errores de tenant-context
```

**10. Haz commit:**
```bash
git add backend/middleware/tenant-context.js
git commit -m "fix(tenant-context): Corregir estructura de BD y queries

- Agregar columna 'nombre' a tabla tenants en Neon
- Crear índice idx_tenants_nombre para performance
- Verificar sintaxis PostgreSQL en queries (\$1, \$2 en lugar de ?)
- Validar que RLS policies usan sintaxis correcta"
```

---

## ✅ PASO FINAL: VERIFICACIÓN COMPLETA (10 minutos)

**Ejecuta esto en orden:**

**1. Verifica que estamos en la rama correcta:**
```bash
git branch
# Debe mostrar: * claude/fix-csp-errors-01ESGL2jJ78S5gKkXhVdofRE
```

**2. Verifica que tienes los 3 commits:**
```bash
git log --oneline -5
# Debe mostrar los 3 commits que hiciste
```

**3. Abre cada página en navegador y verifica Console (F12):**

📄 http://localhost:3000/index.html
- [ ] NO debe haber error "DOMPurify is not defined"
- [ ] Mensaje: "[TENANT-CONFIG] Configuración cargada exitosamente"
- [ ] NO debe haber warnings de "Could not load partials"

📄 http://localhost:3000/estudiantes.html
- [ ] NO debe haber errores críticos
- [ ] Sistema debe estar operativo

📄 http://localhost:3000/padres.html
- [ ] NO debe haber errores críticos
- [ ] Formularios deben ser interactivos

**4. Verifica que todos los cambios están committed:**
```bash
git status
# Debe mostrar: "nothing to commit, working tree clean"
```

**5. Pushea los cambios a tu rama:**
```bash
git push origin claude/fix-csp-errors-01ESGL2jJ78S5gKkXhVdofRE
```

**6. Verifica en GitHub:**
- Ve a: https://github.com/SACRINT/03_BachilleratoHeroesWeb
- Selecciona rama: `claude/fix-csp-errors-01ESGL2jJ78S5gKkXhVdofRE`
- Verifica que ves los 3 commits nuevos

---

## 🎯 RESUMEN DE COMANDOS RÁPIDO

```bash
# 1. Hacer los 3 commits (uno por cada fix)
git add public/js/floating-toolbar.js
git commit -m "fix(dompurify): Verificar disponibilidad de DOMPurify..."

git add public/js/main.js public/partials/
git commit -m "fix(partials): Corregir carga de header y footer"

git add backend/middleware/tenant-context.js
git commit -m "fix(tenant-context): Corregir estructura de BD y queries"

# 2. Pushear a la rama
git push origin claude/fix-csp-errors-01ESGL2jJ78S5gKkXhVdofRE

# 3. Verificar
git log --oneline -5
git status
```

---

## ❓ SI NECESITAS AYUDA

Si algo no funciona:

1. **Verifica los logs del servidor:**
   ```bash
   # Terminal donde corre npm start
   # Busca messages con [TENANT-CONTEXT], [DOMPURIFY], etc.
   ```

2. **Verifica Console del navegador:**
   ```
   F12 → Console tab
   Busca ERRORS (en rojo) - no WARNINGS
   ```

3. **Contacta con el usuario** si necesitas clarificación

---

## 📊 CHECKLIST FINAL

- [ ] ✅ ERROR 1: DOMPurify - Verificación agregada
- [ ] ✅ ERROR 2: Partials - Rutas y manejo de errores corregido
- [ ] ✅ ERROR 3: Tenant Context - Columna creada en BD + Sintaxis PostgreSQL
- [ ] ✅ Los 3 commits están en la rama
- [ ] ✅ Código testeado en navegador (F12 → Console)
- [ ] ✅ Push a GitHub completado
- [ ] ✅ Verificado en GitHub que aparecen los 3 commits

---

**¡Listo! Una vez completes esto, el usuario hará merge a main y el proyecto estará 100% funcional.**

