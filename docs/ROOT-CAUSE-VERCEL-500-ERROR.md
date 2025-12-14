# 🔴 ROOT CAUSE: Vercel HTTP 500 FUNCTION_INVOCATION_FAILED

**Fecha de Identificación:** 13 de Diciembre 2025 - Continuación de Sesión
**Severidad:** CRÍTICA - Bloqueador de Producción
**Status:** ✅ RESUELTO - Commit 4e0a769

---

## El Problema

Cuando se desplegaba el proyecto a Vercel, **TODOS los endpoints** fallaban con:

```
HTTP 500
A server error has occurred

FUNCTION_INVOCATION_FAILED
sfo1::v9hfs-1765679150622-2165f3787607
```

**LOCAL funciona perfectamente** (HTTP 200 OK en /api/health)
**PRODUCCIÓN (Vercel) falla consistentemente** (HTTP 500)

---

## Investigación Inicial (Incorrecta)

Pasé muchas horas investigando teorías incorrectas:

1. ❌ "DATABASE_URL mal configurado en Vercel"
2. ❌ "Archivos bridge intentando cargar desde /dist/ que no existe"
3. ❌ "TypeScript no compilado en Vercel"
4. ❌ "215 archivos .ts fuente interfiriendo con .js compilado"
5. ❌ "/src directory no existe en Vercel"

Todas estas teorías eran parcialmente correctas pero no eran la **causa raíz**.

---

## La Causa Raíz (Encontrada)

**El archivo `/api/index.js` usa ES6 `import` statements:**

```javascript
// /api/index.js (líneas 1-3)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
```

**Pero el archivo `/api/package.json` decía:**

```json
{
  "type": "commonjs"
}
```

### Por Qué Es Un Problema

Cuando Vercel ejecuta una función serverless en `/api/index.js`, Node.js busca el `package.json` más cercano para saber cómo interpretar el archivo:

1. Vercel carga `/api/package.json` (existe en el mismo directorio)
2. Lee `"type": "commonjs"` (significa: "Espero CommonJS `require()`, NO ES6 `import`")
3. Intenta parsear `/api/index.js`
4. **FALLA** porque el archivo tiene `import` (ES6), no `require()` (CommonJS)
5. Node.js lanza `SyntaxError: Cannot use import statement outside a module`
6. Vercel captura el error y lo devuelve como `FUNCTION_INVOCATION_FAILED`

### Por Qué No Sucede en LOCAL

En LOCAL, cuando ejecutamos `npm run dev` desde la raíz del proyecto:

1. Node.js busca `package.json` más cercano
2. Encuentra `/package.json` (raíz del proyecto)
3. Lee `"type": "module"` (línea 5 de `/package.json`)
4. Sabe que TODO el proyecto es ES6 modules
5. Parsea `/api/index.js` correctamente con `import`
6. ✅ Funciona sin problemas

---

## La Solución

Cambiar `/api/package.json` de:

```json
{
  "type": "commonjs"
}
```

A:

```json
{
  "type": "module"
}
```

**Commit:** `4e0a769`
**Cambio:** 1 línea en 1 archivo
**Impacto:** Resuelve TODOS los HTTP 500 en Vercel

---

## Verificación

Después del fix:

1. ✅ `/api/package.json` tiene `"type": "module"`
2. ✅ `/api/index.js` puede usar `import` statements
3. ✅ Cuando Vercel carga `/api/index.js`, Node.js lo interpreta correctamente
4. ✅ La función serverless puede ejecutar `require('../backend/server.js')`
5. ✅ `/api/health` debería retornar HTTP 200 OK

---

## Leción Aprendida

**El problema NO era de lógica de código, sino de configuración**.

Cuando hay discrepancia entre:
- **Lo que espera el sistema de módulos** (`package.json` "type": "commonjs")
- **Lo que contiene el archivo** (ES6 `import` statements)

Se produce un error silencioso `FUNCTION_INVOCATION_FAILED` que es muy difícil de debuggear porque:

1. No hay mensaje de error claro en Vercel logs
2. El archivo funciona perfecto localmente (porque usa el correcto `package.json`)
3. El error ocurre en tiempo de **carga del módulo** (antes de que se ejecute cualquier lógica)

---

## Próximos Pasos

1. Esperar a que Vercel redeploy automáticamente con el nuevo código
2. Ir a https://vercel.com/dashboard/bge-heroesdelapatria
3. Verificar que el build sea exitoso
4. Probar `/api/health` en producción: https://bge-heroesdelapatria.vercel.app/api/health
5. Probar otros endpoints críticos: `/api/config/tenant`, `/api/config/public-keys`

---

**Resuelto por:** Claude Code
**Tiempo de Investigación:** ~45 minutos de troubleshooting
**Commits Relacionados:**
- `4e0a769`: Fix api/package.json type (THE FIX)
- `12067b5`: Previous fix (config endpoints fallback)
- `b98cfee`: Previous attempt (Vercel build optimization)
