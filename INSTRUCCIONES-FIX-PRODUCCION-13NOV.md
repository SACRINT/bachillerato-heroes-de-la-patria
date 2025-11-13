# 🚨 INSTRUCCIONES URGENTES - FIX PRODUCCIÓN

## Fecha: 13 Noviembre 2025
## Problemas Solucionados:
1. ✅ 404 Errors masivos en `/api/config/tenant` y `/api/config/public-keys`
2. ✅ Login del admin dashboard roto (Usuario no existía en BD)

---

## 📋 CAMBIOS REALIZADOS

### 1. Registradas rutas de configuración faltantes
**Archivos modificados:**
- `api/app.js` - Agregadas líneas 1178 y 1257
- `backend/routes/config.js` - Agregado endpoint `/public-keys` (líneas 157-189)

**Impacto:**
- ✅ `/api/config/tenant` ahora responderá 200 en lugar de 404
- ✅ `/api/config/public-keys` ahora responderá 200 en lugar de 404
- ✅ Eliminados ~30+ errores repetidos en consola

---

### 2. Creado script SQL para usuario administrador
**Archivo nuevo:**
- ~~`backend/scripts/create-admin-user.sql`~~ (DEPRECATED - credenciales incorrectas)
- ✅ `backend/scripts/create-admin-user-real-credentials.sql` (USAR ESTE)

**Credenciales del usuario:**
- **Email**: admin@heroespatria.edu.mx
- **Usuario**: Administrador
- **Contraseña**: HeroesPatria2024!
- **Rol**: admin

**Diferencia:** El script nuevo usa **tus credenciales exactas** y genera el hash bcrypt directamente en PostgreSQL usando `pgcrypto`.

---

## 🔧 PASOS NECESARIOS PARA APLICAR LOS FIXES

### PASO 1: Hacer git pull (si trabajas en local)

Si estás trabajando localmente, primero haz pull de mis cambios:

```bash
git fetch origin claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
git pull origin claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
```

### PASO 2: Crear usuario administrador en Neon

1. Abre **Neon Console**: https://console.neon.tech
2. Selecciona tu base de datos BGE
3. Ve a **SQL Editor**
4. Abre el archivo: `backend/scripts/create-admin-user-real-credentials.sql`
5. Copia TODO el contenido del script
6. Pégalo en el SQL Editor de Neon
7. Click en **Run** o presiona `Ctrl+Enter`
8. Verifica que el script ejecute sin errores
9. Verifica que la consulta SELECT al final muestre el usuario:
   ```
   id | uuid | email                        | username      | role  | status | password_hash_length
   ---|------|----------------------------|---------------|-------|--------|---------------------
   X  | ...  | admin@heroespatria.edu.mx | Administrador | admin | activo | 60
   ```
10. **IMPORTANTE**: Si ves `password_hash_length = 60`, el hash bcrypt se generó correctamente

### PASO 3: Re-deploy a Vercel

#### Opción A: Push automático (si ya hice push a tu rama)

```bash
# Simplemente haz merge a main y push
git checkout main
git merge claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
git push origin main
```

Vercel detectará el cambio y hará re-deploy automáticamente.

#### Opción B: Manual en Vercel Dashboard

1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto BGE
3. Ve a **Deployments**
4. Click en **Redeploy** en el último deployment
5. Espera ~2-3 minutos a que termine

---

## ✅ VALIDACIÓN POST-DEPLOYMENT

### 1. Verificar que los 404s desaparecieron

1. Abre https://bge-heroesdelapatria.vercel.app/
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Recarga la página (Ctrl+R o F5)
5. **Verifica**:
   - ❌ Ya NO debe aparecer: `GET /api/config/tenant 404`
   - ❌ Ya NO debe aparecer: `GET /api/config/public-keys 404`
   - ✅ Debe aparecer: `[TENANT-CONFIG] Configuración cargada` (o similar)

### 2. Verificar login del admin dashboard

1. Ve a https://bge-heroesdelapatria.vercel.app/admin-dashboard.html
2. Ingresa las credenciales:
   - **Email/Usuario**: `admin@heroespatria.edu.mx` o `Administrador`
   - **Contraseña**: `HeroesPatria2024!`
3. Click en **Iniciar Sesión**
4. **Verifica**:
   - ✅ Debe entrar al dashboard sin errores
   - ✅ Debe mostrar tu nombre ("Administrador Sistema BGE") en el header
   - ✅ Debe mostrar las pestañas del dashboard (Estudiantes, Docentes, etc.)

---

## 🐛 TROUBLESHOOTING

### Problema: Aún aparecen 404s después del deploy

**Causa**: Caché de Vercel no se limpió

**Solución**:
1. Ve a Vercel Dashboard → Settings → General
2. Scroll hasta **Clear Cache**
3. Click en **Clear Cache**
4. Espera 1 minuto
5. Recarga la página con Ctrl+Shift+R (hard refresh)

---

### Problema: Login sigue sin funcionar

**Posibles causas**:

1. **No ejecutaste el script SQL**
   - Solución: Ve al PASO 2 y ejecuta el script en Neon

2. **El password hash no coincide o la contraseña no funciona**
   - Solución: Vuelve a ejecutar el script completo `create-admin-user-real-credentials.sql` en Neon SQL Editor
   - El script usa `pgcrypto` para generar el hash correcto automáticamente
   - Asegúrate de que Neon tenga la extensión `pgcrypto` habilitada (el script la activa automáticamente)

3. **El endpoint /api/auth/login no existe**
   - Solución: Verifica que api/app.js tiene la línea:
     ```javascript
     app.use('/api/auth', authRoutes);
     ```
   - Busca en línea ~1231 de api/app.js

4. **Variables de entorno faltantes**
   - Solución: Ve a Vercel → Settings → Environment Variables
   - Verifica que exista `JWT_SECRET`
   - Si no existe, agrégala con cualquier valor random largo (ej: `mi-secreto-super-seguro-2025`)

---

## 📊 RESUMEN DE ARCHIVOS MODIFICADOS

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `api/app.js` | Agregado import y registro de configRoutes | +2 |
| `backend/routes/config.js` | Agregado endpoint /public-keys | +32 |
| ~~`backend/scripts/create-admin-user.sql`~~ | ~~Nuevo archivo para crear admin~~ | ~~+94~~ (DEPRECATED) |
| `backend/scripts/create-admin-user-real-credentials.sql` | ✅ Script SQL con TUS credenciales exactas | +108 |

**Total**: 4 archivos (3 modificados + 1 nuevo)

---

## 🎯 RESULTADO ESPERADO

Después de aplicar estos fixes:

1. ✅ **Consola limpia**: 0 errores 404 de `/api/config/*`
2. ✅ **Login funcional**: Puedes entrar al dashboard con las credenciales
3. ✅ **Dashboard cargando**: Todos los tabs visibles y funcionales

---

## 📞 SOPORTE

Si después de seguir TODOS los pasos anteriores aún tienes problemas:

1. Abre DevTools → Console
2. Copia TODOS los errores que aparezcan
3. Toma screenshot del login fallando
4. Compártelos conmigo para diagnóstico adicional

---

**Fecha de creación**: 13 Noviembre 2025
**Autor**: Claude Code
**Sesión**: claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
