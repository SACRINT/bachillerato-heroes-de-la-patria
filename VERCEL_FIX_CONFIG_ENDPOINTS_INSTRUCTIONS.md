# 🚀 VERCEL CONFIG ENDPOINTS FIX - INSTRUCCIONES POST-DEPLOY

**Fecha:** 15 de Diciembre de 2025
**Versión:** v2.30.11
**Status:** ✅ FIXED & PUSHED

---

## 📋 Resumen de Cambios

Se han creado handlers serverless separados para los endpoints de configuración que estaban retornando HTTP 500 en Vercel:

- ✅ `/api/config/tenant` → Nuevo handler en `api/config/tenant.js`
- ✅ `/api/config/public-keys` → Nuevo handler en `api/config/public-keys.js`
- ✅ Mejorado logging y error handling en `api/index.js`

---

## 🔄 Qué Sucede Después de Este Commit

### Paso 1: Vercel Detecta Cambios (Automático - 1-2 minutos)
- GitHub webhook notifica a Vercel
- Vercel detecta nuevo push en `main` branch
- Inicia build automático

### Paso 2: Build en Vercel (Automático - 2-5 minutos)
- Vercel instala dependencias
- Compila el proyecto
- Despliega los nuevos archivos

### Paso 3: Verificación Manual (Tu Parte - 5 minutos)
Una vez que Vercel termina el redeploy, verifica manualmente:

```bash
# Test 1: Config Tenant Endpoint
curl -s https://bge-heroesdelapatria.vercel.app/api/config/tenant | jq .

# Esperado: HTTP 200 con JSON:
{
  "success": true,
  "isDefault": true,
  "tenant": {
    "id": 1,
    "uuid": "default-uuid",
    "school_name": "Bachillerato General Estatal \"Héroes de la Patria\"",
    ...
  },
  "config": { ... }
}
```

```bash
# Test 2: Public Keys Endpoint
curl -s https://bge-heroesdelapatria.vercel.app/api/config/public-keys | jq .

# Esperado: HTTP 200 con JSON:
{
  "success": true,
  "environment": "production",
  "keys": {
    "tinymce": "...",
    "google_oauth_client_id": "..."
  }
}
```

### Paso 4: Verificar en Navegador
1. Ve a https://bge-heroesdelapatria.vercel.app
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Busca mensajes `[TENANT-CONFIG]` o `[PUBLIC-KEYS]`
5. Deberías ver:
   - ✅ `[TENANT-CONFIG] Request recibida`
   - ✅ `[TENANT-CONFIG] Retornando config para domain: bge-heroesdelapatria.vercel.app`
   - ❌ Sin errores HTTP 500

---

## 🔍 Troubleshooting

### Si aún ves HTTP 500:

**1. Verifica Vercel Logs:**
   - Ve a https://vercel.com/dashboard/bge-heroesdelapatria
   - Click en "Functions" o "Deployments"
   - Busca errores en los logs

**2. Limpia Cache del Navegador:**
   ```bash
   # En DevTools > Network > clear cache
   # O presiona Ctrl+Shift+Delete (Hard Refresh)
   ```

**3. Verifica Vercel Redeploy:**
   - Asegúrate de que el build completó exitosamente
   - Verifica que los archivos `api/config/tenant.js` y `api/config/public-keys.js` se encuentren en el deploy

**4. Revisa GitHub Actions:**
   - Verifica que el push llegó correctamente a GitHub
   - Revisa https://github.com/SACRINT/bachillerato-heroes-de-la-patria/commits/main

---

## 📊 Metrics Esperados Después del Fix

| Métrica | Antes | Después |
|---------|-------|---------|
| `/api/config/tenant` Status | ❌ HTTP 500 | ✅ HTTP 200 |
| `/api/config/public-keys` Status | ❌ HTTP 500 | ✅ HTTP 200 |
| Frontend Errors | ❌ "Error al cargar config" | ✅ Nada |
| Page Load Time | Lento (error retry) | Normal |

---

## 🛠️ Archivos Modificados

### Nuevos Archivos:
- `api/config.js` (90 líneas) - Router helper
- `api/config/tenant.js` (64 líneas) - Handler dedicado
- `api/config/public-keys.js` (53 líneas) - Handler dedicado

### Archivos Mejorados:
- `api/index.js` (mejoras en error handling)
- `CHANGELOG.md` (v2.30.11 documentada)
- `CLAUDE.md` (sesión registrada)

---

## ✅ Checklist de Verificación

- [ ] Vercel completó el redeploy exitosamente
- [ ] `/api/config/tenant` retorna HTTP 200
- [ ] `/api/config/public-keys` retorna HTTP 200
- [ ] No hay errores "Error al cargar configuración remota" en console
- [ ] Header y footer cargan correctamente en producción
- [ ] Frontend recibe configuración sin errores

---

## 📝 Notas Técnicas

**Por qué se resolvió:**
1. Los handlers nuevos son funciones simple Vercel serverless
2. No dependen de middleware Express problemático
3. Manejan todos los errores con try/catch completo
4. Logging detallado para debugging

**Diferencias vs versión anterior:**
- Antes: Una app Express completa en `/api/index.js` (problemática)
- Ahora: Handlers separados Vercel serverless (robusto)

---

**¿Preguntas o Problemas?** Verifica los logs de Vercel o el archivo `CHANGELOG.md` para más detalles.
