# 🔑 Variables de Entorno para Vercel

## ⚠️ ACCIÓN REQUERIDA

Necesitas agregar estas variables de entorno en Vercel para que el sitio funcione:

1. Ve a: https://vercel.com/sacrints-projects/bge-heroes-patria/settings/environment-variables

2. Agrega las siguientes variables (TODAS son necesarias):

### 🔴 CRÍTICAS (El servidor no inicia sin estas):

```
SESSION_SECRET=session_secret_super_seguro_para_bge_heroes_patria_2025_minimo_32_caracteres
```

### 🟡 IMPORTANTES (Funcionalidades no funcionarán sin estas):

```
JWT_SECRET=desarrollo_jwt_secret_super_seguro_para_bge_heroes_patria_2025_minimo_32_caracteres
EMAIL_USER=contacto.heroesdelapatria.sep@gmail.com
EMAIL_PASS=swqkicltpjxoplni
EMAIL_TO=21ebh0200x.sep@gmail.com
NODE_ENV=production
CORS_ORIGIN=https://bge-heroesdelapatria.vercel.app,https://www.heroesdelapatria.edu.mx
```

### 🟢 OPCIONALES (Ya tienen valores por defecto):

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SECURITY_HSTS_MAX_AGE=31536000
```

---

## 📋 Estado Actual

### ✅ Ya configuradas:
- ✅ `DATABASE_URL` (Neon PostgreSQL connection string)

### ⏳ Pendientes:
- ❌ `SESSION_SECRET` **(CRÍTICA - servidor no inicia sin esto)**
- ❌ `JWT_SECRET`
- ❌ `EMAIL_USER`
- ❌ `EMAIL_PASS`
- ❌ `EMAIL_TO`
- ❌ `NODE_ENV`
- ❌ `CORS_ORIGIN`

---

## 🚀 Después de agregar las variables

Una vez que agregues todas las variables:

1. Vercel hará un **redeploy automático**
2. O puedes forzar uno con: `vercel --prod --force`
3. El sitio debería funcionar correctamente después del redeploy

---

## ⚡ Error Actual

```
FUNCTION_INVOCATION_FAILED
```

**Causa:** El servidor backend está fallando al iniciar porque falta `SESSION_SECRET`.

**Código relevante (backend/server.js líneas 124-128):**
```javascript
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error('❌ ERROR: SESSION_SECRET environment variable is required');
    process.exit(1);  // ← El servidor termina aquí
}
```

---

## 📝 Notas de Seguridad

- ✅ Las variables están en `.gitignore` - no se suben a GitHub
- ✅ Vercel las encripta y las mantiene seguras
- ✅ Solo son accesibles en runtime de las funciones serverless
- ⚠️ `EMAIL_PASS` es la contraseña de aplicación de Gmail (NO la contraseña normal)

---

**IMPORTANTE:** Después de agregar las variables, toma screenshot para confirmar que todo está configurado correctamente.
