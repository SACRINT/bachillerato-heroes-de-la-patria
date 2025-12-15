# ✅ INSTRUCCIONES DE VERIFICACIÓN - ENDPOINTS EN VERCEL

**Fecha:** 15 de Diciembre 2025
**Versión del Deploy:** v2.30.16

---

## 📋 CHECKLIST ANTES DE VERIFICAR

- [ ] Vercel completó el redeploy (2-5 minutos después del push)
- [ ] El nuevo commit `fa0904a` apareció en GitHub
- [ ] Las 13 líneas nuevas de endpoints están en `/api/index.js`

**Verifica el estado del deploy:**
```
https://vercel.com/dashboard/bge-heroesdelapatria
```

---

## 🔍 VERIFICACIÓN EN NAVEGADOR (RECOMENDADO)

### Opción 1: Ver Errores Desaparecer

1. **Abre la página en navegador:**
   ```
   https://bge-heroesdelapatria.vercel.app/gamification-center.html
   ```

2. **Abre DevTools (F12):**
   - Pestaña: **Console**
   - Pestaña: **Network**

3. **Busca estos errores:**
   - ❌ `GET /api/wallet 404`
   - ❌ `GET /api/challenges 404`
   - ❌ `GET /api/iacoins/balance 404`

4. **Resultado esperado:**
   - ✅ Todos los requests ahora devuelven **200 OK**
   - ✅ Ningún error 404 en la consola
   - ✅ Los requests muestran **response JSON válida**

### Opción 2: Verificar Endpoints Específicos

Abre el navegador y visita cada URL directamente:

#### Endpoints Públicos (Sin Token)

```
https://bge-heroesdelapatria.vercel.app/api/challenges
```
**Esperado:** JSON con lista de desafíos o array vacío `[]`

```
https://bge-heroesdelapatria.vercel.app/api/iacoins/leaderboard
```
**Esperado:** JSON con tabla de líderes o array vacío `[]`

```
https://bge-heroesdelapatria.vercel.app/api/store/items
```
**Esperado:** JSON con items de tienda o array vacío `[]`

```
https://bge-heroesdelapatria.vercel.app/api/digital-library/categories
```
**Esperado:** JSON con categorías o array vacío `[]`

#### Endpoints Privados (Requieren Token)

Para estos, abre DevTools y copia un token JWT válido del login:

1. **Login en la página:**
   - Ve a `https://bge-heroesdelapatria.vercel.app`
   - Haz login con credenciales reales
   - En DevTools → Console, ejecuta:
     ```javascript
     localStorage.getItem('accessToken')
     ```

2. **Copia el token y prueba en terminal (Windows PowerShell):**

   ```powershell
   $token = "PEGA_TU_TOKEN_AQUI"
   $headers = @{"Authorization" = "Bearer $token"}

   Invoke-WebRequest -Uri "https://bge-heroesdelapatria.vercel.app/api/iacoins/balance" `
     -Headers $headers | Select-Object -ExpandProperty Content
   ```

   **Esperado:** JSON con balance en IACoins

---

## 🖥️ VERIFICACIÓN DESDE TERMINAL (AVANZADO)

### Para Linux/Mac (bash):

```bash
# Endpoint público
curl -s https://bge-heroesdelapatria.vercel.app/api/challenges | jq .

# Endpoint privado (requiere TOKEN)
TOKEN="Tu_JWT_Token_Aqui"
curl -s -H "Authorization: Bearer $TOKEN" \
  https://bge-heroesdelapatria.vercel.app/api/iacoins/balance | jq .
```

### Para Windows (PowerShell):

```powershell
# Endpoint público
Invoke-WebRequest -Uri "https://bge-heroesdelapatria.vercel.app/api/challenges" `
  | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Endpoint privado (requiere TOKEN)
$token = "Tu_JWT_Token_Aqui"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://bge-heroesdelapatria.vercel.app/api/iacoins/balance" `
  -Headers $headers | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## ✅ TABLA DE VERIFICACIÓN COMPLETA

| Endpoint | Tipo | Esperado | ✓ |
|----------|------|----------|---|
| `/api/wallet` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/challenges` | GET | 200 OK + JSON | [ ] |
| `/api/iacoins/balance` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/iacoins/achievements` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/iacoins/challenges` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/iacoins/leaderboard` | GET | 200 OK + JSON | [ ] |
| `/api/iacoins/transactions` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/store/items` | GET | 200 OK + JSON | [ ] |
| `/api/auth/profile` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/students-auth/check` | GET + JWT | 200 OK + JSON | [ ] |
| `/api/digital-library/categories` | GET | 200 OK + JSON | [ ] |
| `/api/digital-library/documents` | GET | 200 OK + JSON | [ ] |
| `/api/messaging/conversations` | GET + JWT | 200 OK + JSON | [ ] |

---

## 🚨 SI AÚN RECIBES ERRORES 404

### Paso 1: Verifica que el redeploy completó
```
https://vercel.com/dashboard/bge-heroesdelapatria → Deployments
```
- El nuevo deployment debe mostrar ✅ **READY**
- El URL debe mostrar el nuevo commit hash

### Paso 2: Limpia el cache del navegador
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```
- Selecciona: All time
- Deselecciona todo EXCEPTO "Cookies and other site data"
- Haz click "Clear data"

### Paso 3: Recarga la página
```
Ctrl+Shift+R (Reload sin cache)
```

### Paso 4: Revisa los logs de Vercel
```
https://vercel.com/dashboard/bge-heroesdelapatria
→ Deployments → [Latest] → Functions → [ENDPOINT] → Logs
```

Busca messages con prefijo:
- `[WALLET]`
- `[CHALLENGES]`
- `[IACOINS]`
- `[STORE]`
- `[AUTH]`
- `[LIBRARY]`
- `[MESSAGING]`

### Paso 5: Si persisten los errores
Contacta con información:
- Screenshot de DevTools Network tab
- URL exacta donde falla
- Resultado de: `curl -v https://dominio/api/endpoint`

---

## 📊 RESPUESTAS ESPERADAS

### Respuesta Exitosa (200 OK)

**Formato:**
```json
{
  "success": true,
  "data": { ... },
  "total": 5
}
```

**Ejemplo /api/challenges:**
```json
{
  "success": true,
  "challenges": [
    {
      "id": 1,
      "title": "Desafío 1",
      "description": "...",
      "difficulty": "easy",
      "reward_coins": 100,
      "status": "active",
      "created_at": "2025-12-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Respuesta Sin Datos (Tablas Vacías)

```json
{
  "success": true,
  "challenges": [],
  "total": 0
}
```

### Error 404 (Endpoint No Encontrado) ❌

```json
{
  "success": false,
  "message": "Not Found",
  "path": "/api/wallet"
}
```

**Si ves esto, significa que el redeploy AÚN NO completó o hay un problema en Vercel.**

---

## 🔐 NOTAS SOBRE AUTENTICACIÓN

### Endpoints que REQUIEREN Token JWT
- ✅ `/api/wallet`
- ✅ `/api/iacoins/balance`
- ✅ `/api/iacoins/achievements`
- ✅ `/api/iacoins/challenges`
- ✅ `/api/iacoins/transactions`
- ✅ `/api/auth/profile`
- ✅ `/api/students-auth/check`
- ✅ `/api/messaging/conversations`

### Endpoints PÚBLICOS (Sin Token)
- ✅ `/api/challenges`
- ✅ `/api/iacoins/leaderboard`
- ✅ `/api/store/items`
- ✅ `/api/digital-library/categories`
- ✅ `/api/digital-library/documents`

---

## 🎯 TIEMPO ESPERADO

| Acción | Tiempo |
|--------|--------|
| Vercel detecta cambios en GitHub | < 1 min |
| Build en Vercel | 1-3 minutos |
| Deploy en edge servers globales | 1-2 minutos |
| **Total esperado** | **2-5 minutos** |

---

## 📝 RESUMEN

Una vez que Vercel complete el redeploy (puedes ver el estado en el dashboard):

1. ✅ Los errores 404 deben desaparecer
2. ✅ Los endpoints deben responder con HTTP 200
3. ✅ Las páginas deben cargar sin errores de red
4. ✅ Las features de gamificación deben funcionar

Si todo es ✅, ¡la reparación fue exitosa!

---

**v2.30.16 - Guía de Verificación Completa**
