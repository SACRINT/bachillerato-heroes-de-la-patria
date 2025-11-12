# 📝 GUÍA DE REFACTORIZACIÓN DE LOGGING - GDPR COMPLIANCE

**Fecha:** 2025-11-10
**Objetivo:** Migrar todos los console.log/error/warn/info a devLogger para cumplir con GDPR
**Estado:** 5 logs críticos corregidos, 261 pendientes

---

## 📊 PROGRESO ACTUAL

### Logs Reemplazados (5/266)

✅ **backend/routes/auth.js:213** - `console.error('❌ Error renovando token')` → `devLog.error('Error renovando token')`
✅ **backend/routes/auth.js:753** - `console.error('❌ [GOOGLE-AUTH] Token inválido')` → `devLog.error('[GOOGLE-AUTH] Token inválido')`
✅ **backend/routes/contact.js:290** - `console.log(email + token)` → `devLog.log('Email de verificación enviado')`
✅ **backend/routes/subscriptions.js:129** - `console.warn(token_verificacion)` → `devLog.warn('Columna token_verificacion no existe')`
✅ **backend/routes/subscriptions.js:155** - `console.log(email + ID + token)` → `devLog.log('Nuevo suscriptor agregado')`

### Logs Pendientes (261/266)

🔴 **CRITICAL:** 34 logs (Tokens, Passwords)
🟠 **HIGH:** 221 logs (Emails, User IDs)
🟡 **MEDIUM:** 6 logs (User Data)

**Ver lista completa en:** `docs/logging-audit/console-calls-to-replace.md`

---

## 🎯 PASO A PASO: Cómo Migrar un Log

### 1. Importar devLogger en el archivo

**Si NO existe:**
\`\`\`javascript
// Al inicio del archivo, después de otros requires
const devLog = require('../utils/devLogger'); // 🔐 Logging seguro (GDPR compliant)
\`\`\`

**Verificar si existe:**
\`\`\`bash
grep "devLog" backend/routes/nombre-archivo.js
\`\`\`

### 2. Identificar el tipo de log a reemplazar

| Método Original | Contiene Datos Sensibles | Reemplazo |
|-----------------|--------------------------|-----------|
| `console.log('Token:', token)` | ✅ SÍ (token) | `devLog.log('Token generado exitosamente')` |
| `console.error('Error:', error)` | ⚠️ DEPENDE | `devLog.error('Error en operación', error)` |
| `console.log('Usuario:', user.email)` | ✅ SÍ (email) | `devLog.log('Usuario autenticado')` |
| `console.warn('Límite alcanzado')` | ❌ NO | `devLog.warn('Límite alcanzado')` |

### 3. Aplicar el reemplazo

#### ❌ ANTES (INSEGURO)
\`\`\`javascript
console.log(\`✅ Email de verificación enviado a: \${email} - Token: \${token.substring(0, 8)}...\`);
\`\`\`

#### ✅ DESPUÉS (SEGURO)
\`\`\`javascript
devLog.log('Email de verificación enviado exitosamente');
\`\`\`

### 4. Validar sintaxis

\`\`\`bash
node -c backend/routes/nombre-archivo.js
\`\`\`

Si devuelve nada, la sintaxis es correcta ✅

---

## 🚨 REGLAS DE ORO (NUNCA VIOLAR)

### ❌ PROHIBIDO EN LOGS (GDPR VIOLATION)

| Dato Sensible | Ejemplo Incorrecto | Por qué está prohibido |
|---------------|-------------------|------------------------|
| Emails | `console.log('Email:', user.email)` | Dato personal identificable |
| Tokens JWT | `console.log('JWT:', token)` | Credencial de autenticación |
| Passwords | `console.log('Password:', pass)` | Credencial ultra-sensible |
| User IDs | `console.log('User ID:', user.id)` | Identificador personal |
| Nombres | `console.log('Nombre:', user.nombre)` | Dato personal |
| Teléfonos | `console.log('Tel:', user.telefono)` | Dato personal sensible |

### ✅ PERMITIDO EN LOGS

| Información Segura | Ejemplo Correcto | Por qué es seguro |
|--------------------|------------------|-------------------|
| Estados de operación | `devLog.log('Operación completada exitosamente')` | No identifica usuarios |
| Contadores anónimos | `devLog.log('Total de usuarios activos:', count)` | Agregado, no individual |
| Tiempos de ejecución | `devLog.log('Query ejecutada en:', duration)` | Métrica de performance |
| Errores genéricos | `devLog.error('Error conectando a BD', error)` | Sin datos de usuario |
| Acciones de sistema | `devLog.logAction('LOGIN_ATTEMPT', 'SUCCESS')` | Evento, no identidad |

---

## 📖 EJEMPLOS DE MIGRACIÓN POR CATEGORÍA

### 1. Tokens JWT y API Keys (CRITICAL)

#### ❌ ANTES
\`\`\`javascript
console.log('🔑 Token JWT generado:', token);
console.error('❌ Token inválido:', error.message);
console.log(\`Token de verificación: \${verificationToken}\`);
\`\`\`

#### ✅ DESPUÉS
\`\`\`javascript
devLog.log('Token JWT generado exitosamente');
devLog.error('Token inválido', error);
devLog.log('Token de verificación generado');
\`\`\`

### 2. Emails y Datos Personales (HIGH)

#### ❌ ANTES
\`\`\`javascript
console.log(\`Usuario autenticado: \${user.email}\`);
console.log(\`Enviando email a: \${recipient.email}\`);
console.log(\`Nuevo usuario: \${user.nombre} \${user.apellido}\`);
\`\`\`

#### ✅ DESPUÉS
\`\`\`javascript
devLog.log('Usuario autenticado exitosamente');
devLog.log('Email enviado exitosamente');
devLog.log('Nuevo usuario registrado');
\`\`\`

### 3. User IDs y Referencias (HIGH)

#### ❌ ANTES
\`\`\`javascript
console.log(\`Procesando usuario ID: \${userId}\`);
console.log(\`Admin \${req.user.email} aprobó solicitud \${requestId}\`);
\`\`\`

#### ✅ DESPUÉS
\`\`\`javascript
devLog.log('Procesando solicitud de usuario');
devLog.logAction('APPROVAL_REQUEST', 'SUCCESS', { requestId }); // requestId es GUID, no email
\`\`\`

### 4. Errores con Stack Traces (MEDIUM)

#### ❌ ANTES
\`\`\`javascript
console.error('Error:', error);
console.error('Error enviando email:', emailError);
\`\`\`

#### ✅ DESPUÉS
\`\`\`javascript
devLog.error('Error en operación', error); // En prod solo imprime mensaje, no stack
devLog.error('Error enviando email', emailError);
\`\`\`

### 5. Logs de Operaciones (SAFE - Solo cambiar método)

#### ❌ ANTES
\`\`\`javascript
console.log('Servidor iniciado en puerto 3000');
console.log('Base de datos conectada');
console.warn('Límite de reintentos alcanzado');
\`\`\`

#### ✅ DESPUÉS
\`\`\`javascript
devLog.log('Servidor iniciado en puerto 3000'); // Mismo mensaje, método seguro
devLog.log('Base de datos conectada');
devLog.warn('Límite de reintentos alcanzado');
\`\`\`

---

## 🔧 MÉTODO DE TRABAJO RECOMENDADO

### Opción A: Por Archivo (Recomendado)

1. Elegir un archivo de `docs/logging-audit/console-calls-to-replace.md`
2. Abrir el archivo en editor
3. Buscar TODOS los `console.log/error/warn/info`
4. Importar `devLog` al inicio (si no existe)
5. Reemplazar todos los console calls en ese archivo
6. Validar sintaxis: `node -c backend/routes/archivo.js`
7. Commit: `git commit -m "refactor(logging): Migrar archivo.js a devLogger"`

### Opción B: Por Severidad (Más Rápido)

1. Empezar con los 34 CRITICAL restantes
2. Luego los 221 HIGH
3. Finalmente los 6 MEDIUM

**Archivos con más logs CRITICAL:**
- `backend/routes/auth.js` (2 restantes)
- `backend/routes/egresados.js` (verificar tokens)
- `backend/routes/approvals.js` (verificar emails)
- `backend/routes/subscriptions.js` (verificar tokens)

---

## 🎬 SCRIPT DE AYUDA (OPCIONAL)

Para buscar y reemplazar automáticamente (con precaución):

\`\`\`bash
# Buscar todos los console.log con email
grep -rn "console\.log.*email" backend/routes/

# Buscar todos los console.log con token
grep -rn "console\.log.*token" backend/routes/

# Contar cuántos quedan
grep -r "console\\.log\\|console\\.error\\|console\\.warn\\|console\\.info" backend/routes/ | wc -l
\`\`\`

---

## ✅ CHECKLIST DE VALIDACIÓN

Después de migrar un archivo, verificar:

- [ ] `devLog` está importado al inicio del archivo
- [ ] TODOS los `console.log/error/warn/info` fueron reemplazados
- [ ] NO se expone: email, token, password, user.id
- [ ] Sintaxis JavaScript es válida: `node -c archivo.js`
- [ ] Logs siguen siendo informativos (no muy genéricos)
- [ ] En producción (NODE_ENV=production), NO imprimirá datos sensibles

---

## 📞 SOPORTE

**Dudas sobre qué reemplazar:**
- Revisar `backend/utils/devLogger.js` líneas 109-157 (Security Guidelines)
- Revisar ejemplos en esta guía

**Error de sintaxis:**
- Ejecutar `node -c archivo.js` para identificar línea del error
- Verificar que no falten comas, paréntesis, etc.

**Progreso:**
- Ver `docs/logging-audit/console-calls-to-replace.md` para lista completa
- Ejecutar `node backend/scripts/analyze-console-logs.js` para re-analizar

---

## 🎯 OBJETIVO FINAL

- **0 console.log/error/warn/info** con datos sensibles en producción
- **GDPR Compliant:** Sin exposición de datos personales en logs
- **Seguridad:** Sin tokens, passwords, o credenciales en DevTools
- **Mantenible:** Un solo sistema de logging (devLogger)

---

**Última actualización:** 2025-11-10
**Logs migrados:** 5/266 (1.9%)
**Progreso:** 🟥🟥🟥⬜⬜⬜⬜⬜⬜⬜ 2%
