# 📖 INSTRUCCIONES GIT WORKFLOW - ARQUITECTO 2

**Para:** Arquitecto 2 - Logging GDPR Compliance + Backend Refactoring
**Rama Asignada:** `claude/logging-backend-refactoring-gdpr`
**Duración Estimada:** 10-14 días (30-35 horas)
**Objetivo:** Mergear 300+ cambios a rama main sin conflictos

---

## 🚀 INICIO RÁPIDO (5 minutos)

```bash
# 1. Actualizar main (traer últimos cambios)
git checkout main
git pull origin main

# 2. Crear tu rama feature
git checkout -b claude/logging-backend-refactoring-gdpr

# 3. Verificar que estás en la rama correcta
git branch --show-current
# Resultado esperado: claude/logging-backend-refactoring-gdpr

# 4. Comenzar trabajo
# (ver "FLUJO DE TRABAJO DIARIO" abajo)
```

---

## 📋 REGLAS CRÍTICAS PARA ARQUITECTO 2

### ✅ DEBES HACER

- **✅ Trabajar SOLO en `backend/`, `api/` y `docs/`**
  - Estos directorios son EXCLUSIVOS para Arquitecto 2
  - Arquitecto 1 no toca nada aquí
  - Especialmente: NO tocar `/public/js/` (eso es Arquitecto 1)

- **✅ Crear nuevos archivos en `backend/`**
  - `backend/utils/debug-logger.js` (NUEVO)
  - `backend/utils/sanitized-errors.js` (NUEVO)
  - `backend/services/auth-service.js` (NUEVO)
  - `backend/services/admin-service.js` (NUEVO)
  - ... (10 servicios nuevos en total)

- **✅ Hacer commits frecuentes** (mínimo cada 2-3 cambios)
  - Commits pequeños = fácil revertir si hay problema
  - Ejemplo: `git commit -m "feat(logging): Crear debug-logger + sanitized-errors"`

- **✅ Push regularmente a GitHub**
  - Mínimo 1 push diario
  - Previene pérdida de código local

- **✅ Actualizar `docs/REFACTOR_TRACKING.md`**
  - Cada cambio importante debe estar registrado
  - Formato: `## [Fecha] - [Servicio/Ruta] - [Cambios]`

- **✅ Testing local antes de commit**
  - `node -c backend/utils/archivo.js` (validar sintaxis)
  - `node -c backend/services/archivo.js` (validar servicios)
  - `node -c backend/routes/archivo.js` (validar rutas)
  - Testing funcional en Postman/curl después de cambios

- **✅ Comunicar progreso**
  - Push con mensaje claro en commit
  - Usuario sabrá avance por logs de GitHub

- **✅ Proteger datos sensibles**
  - NO commitear passwords, tokens, API keys
  - Si cometes algo sensible accidentalmente, revertir inmediatamente

### ❌ NO DEBES HACER

- **❌ Modificar archivos de Arquitecto 1**
  - Arquitecto 1: `/public/js/` (frontend)
  - Si necesitas cambiar algo acá, COMUNICA al usuario

- **❌ Hacer merge a main tú solo**
  - Usuario será quien mergee ambas ramas
  - Tú solo pushas a tu rama

- **❌ Resolver conflictos sin confirmar**
  - Si hay conflicto, DEJA que usuario resuelva
  - Communica el conflicto inmediatamente

- **❌ Cambiar ramas de trabajo**
  - Mantente en `claude/logging-backend-refactoring-gdpr`
  - NO regreses a main sin terminar

- **❌ Hacer force push**
  - `git push --force` = MALO (puede perder código)
  - Usa `git push` normal siempre

- **❌ Modificar logging en `/public/js/`**
  - Eso toca Arquitecto 1
  - Tú trabajas SOLO en backend logging

- **❌ Mergear sin permission**
  - Usuario es el único que mergea ambas ramas

---

## 📅 FLUJO DE TRABAJO DIARIO (Repetir cada día)

### Mañana: Inicio de sesión (5 minutos)

```bash
# 1. Verificar en qué rama estás
git branch --show-current
# Resultado esperado: claude/logging-backend-refactoring-gdpr

# 2. Si estás en main, cambiar a tu rama
git checkout claude/logging-backend-refactoring-gdpr

# 3. Traer cambios de main (por si usuario hizo algo)
git fetch origin

# 4. Ver estado
git status
# Resultado esperado: On branch claude/logging-backend-refactoring-gdpr
#                    Your branch is up to date with 'origin/...'

# 5. Ver qué hiciste ayer (último commit)
git log --oneline -1
```

### Fase 1: Sub-Tarea A - Logging (Días 1-5, ~10 horas)

#### Día 1: Crear archivos de logging

```bash
# 1. Crear directorio utils si no existe
mkdir -p backend/utils

# 2. Crear debug-logger.js
code backend/utils/debug-logger.js
# Copiar contenido de la tarea (50-70 líneas)

# 3. Validar sintaxis
node -c backend/utils/debug-logger.js

# 4. Crear sanitized-errors.js
code backend/utils/sanitized-errors.js
# Copiar contenido (40-50 líneas)

# 5. Validar sintaxis
node -c backend/utils/sanitized-errors.js

# 6. Hacer commit
git add backend/utils/debug-logger.js backend/utils/sanitized-errors.js
git commit -m "feat(logging): Crear debug-logger y sanitized-errors utilities

- debug-logger.js: Logging condicional basado en DEBUG_MODE
- sanitized-errors.js: Sanitización de errores para logging seguro
- Ambos archivos validados con node -c
- Listos para integración en rutas y servicios"

# 7. Push
git push origin claude/logging-backend-refactoring-gdpr
```

#### Días 2-4: Limpiar logs en archivos existentes

```bash
# Cada archivo: 30-45 minutos

# Ciclo para cada archivo:
git checkout backend/routes/archivo.js  # Si está modificado, revertir
# o editar el archivo existente si ya lo tiene

code backend/routes/admin.js  # EJEMPLO: limpiar admin.js

# Cambios a hacer:
# 1. Agregar import: const { debugLog } = require('../utils/debug-logger');
# 2. Reemplazar: console.log → debugLog.log('ADMIN', message)
# 3. Remover datos sensibles (tokens, emails, passwords)
# 4. Guardar

# Validar
node -c backend/routes/admin.js

# Commit
git add backend/routes/admin.js
git commit -m "refactor(logging): Limpiar logs en admin.js

- 89 logs convertidos a debugLog.log()
- Datos sensibles removidos (tokens, contraseñas, emails)
- Logging condicional implementado
- Validado con node -c"

# Repetir para: auth.js, students.js, approvals.js, etc (10 archivos)
```

#### Día 5: Testing Sub-Tarea A

```bash
# Testing exhaustivo
# 1. Buscar logs sensibles (resultado: CERO líneas)
grep -rn "console.log.*password\|console.log.*token" backend/

# 2. Buscar console.log sin debugLog (resultado: CERO líneas)
grep -rn "console\.log" backend/ | grep -v "debugLog"

# 3. Testing en navegador
npm start  # Iniciar servidor
# Abrir http://localhost:3000
# F12 → Console
# Con NODE_ENV=production: Resultado: CERO logs

# 4. Con NODE_ENV=development: Resultado: Logs con [TAG] visibles

# Commit de testing
git add SESSION_PROGRESS.md  # Si lo tienes
git commit -m "test: Sub-Tarea A - Logging completado y testeado

- 25 archivos limpios (15 frontend + 10 backend)
- ~730 logs sanitizados
- Logging condicional validado
- Testing completado sin errores"

git push origin claude/logging-backend-refactoring-gdpr
```

### Fase 2: Sub-Tarea B - Refactorización Backend (Días 6-14, ~20-25 horas)

#### Día 6: Diseñar y crear servicios base

```bash
# 1. Crear directorio services (si no existe)
mkdir -p backend/services

# 2. Crear primer servicio: auth-service.js
code backend/services/auth-service.js
# Copiar de la tarea (300 líneas)

# 3. Validar
node -c backend/services/auth-service.js

# 4. Crear segundo servicio: admin-service.js
code backend/services/admin-service.js
# Similar a auth-service

# 5. Validar
node -c backend/services/admin-service.js

# Commit
git add backend/services/auth-service.js backend/services/admin-service.js
git commit -m "feat(services): Crear auth-service y admin-service

- Patrón de servicios implementado
- Métodos: authenticate, create, update, delete
- Logging seguro integrado
- DAL integration ready
- Ambos validados con node -c"

git push origin claude/logging-backend-refactoring-gdpr
```

#### Días 7-9: Crear 8 servicios adicionales

```bash
# Ciclo para cada servicio (repetir 8 veces):

# Crear student-service.js
code backend/services/student-service.js
# (200-250 líneas, métodos similares a auth-service)

node -c backend/services/student-service.js

# Commits cada 2-3 servicios:
git add backend/services/student-service.js backend/services/approval-service.js
git commit -m "feat(services): Crear student-service y approval-service

- 2 servicios nuevos
- Métodos implementados: getAll, getById, create, update, delete
- Logging seguro
- Ready para refactoring de rutas"

git push origin claude/logging-backend-refactoring-gdpr

# Repite para: notification, upload, email, gamification, calendar, report
```

#### Días 10-12: Refactorizar rutas existentes

```bash
# Refactorizar backend/routes/admin.js

code backend/routes/admin.js

# Cambios:
# 1. Agregar import: const adminService = require('../services/admin-service');
# 2. En route handler, reemplazar lógica inline con llamada a servicio:
#    ANTES: const user = await pool.query('SELECT...'); [200 líneas de lógica]
#    DESPUÉS: const user = await adminService.getUserById(id);
# 3. Simplificar error handling (usar debugLog sanitizado)
# 4. Mantener response.json() al final

node -c backend/routes/admin.js

git add backend/routes/admin.js
git commit -m "refactor(routes): Integrar admin-service en routes/admin.js

- Lógica movida a admin-service
- Redución de líneas: 500 → 200
- Logging centralizado en servicio
- Testing funcional completado
- node -c validado"

# Repetir para 17 rutas más: auth.js, students.js, approvals.js, etc
# (3 commits de 6 rutas cada uno)

git push origin claude/logging-backend-refactoring-gdpr (diario)
```

#### Día 13: Procesar rutas huérfanas

```bash
# 1. Auditar rutas huérfanas (27 total)

# Para cada ruta huérfana:
# a) Buscar en git log si fue usada antes
git log --oneline -- backend/routes/huerfana.js | head -5

# b) Si hay historia, mantener y registrar en server.js
# c) Si nunca fue usada, marcar para eliminar

# 2. Registrar válidas en server.js
code backend/server.js

# Agregar (si la ruta es válida):
# const huerfanaRoute = require('./routes/huerfana');
# app.use('/api/huerfana', huerfanaRoute);

# 3. Eliminar deprecated
git rm backend/routes/deprecated-route.js
git commit -m "refactor(routes): Eliminar rutas deprecated

- Auditadas 27 rutas huérfanas
- 20 registradas en server.js
- 7 eliminadas (deprecated, nunca usadas)
- Backend limpio y consistente"

git push origin claude/logging-backend-refactoring-gdpr
```

#### Día 14: Testing final

```bash
# Testing exhaustivo

# 1. Validar sintaxis de TODOS los servicios
for file in backend/services/*.js; do
  echo "Validando $file..."
  node -c "$file"
done
# Resultado esperado: OK para todos

# 2. Validar sintaxis de TODAS las rutas
for file in backend/routes/*.js; do
  echo "Validando $file..."
  node -c "$file"
done

# 3. Testing funcional en Postman/curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@heroespatria.edu.mx","password":"password"}'
# Resultado esperado: 200 OK con token

# 4. Verificar logging seguro
NODE_ENV=production npm start
# F12 → Console
# Resultado: CERO logs (o solo [TAG] prefixed)

# 5. Commit final
git add docs/REFACTOR_TRACKING.md CHANGELOG.md
git commit -m "feat: Sub-Tarea B - Refactorización Backend completada

Servicios creados: 10 nuevos
Rutas refactorizadas: 18
Rutas huérfanas procesadas: 27
Logging GDPR-compliant: ✓
Testing validado: ✓
Performance mejorado: ✓

Merge ready para main"

git push origin claude/logging-backend-refactoring-gdpr
```

---

## 🔄 CASOS ESPECIALES

### Caso 1: Necesitas los cambios más recientes de main

**Razón:** Usuario mergeo algo a main mientras trabajabas

**Solución:**
```bash
# 1. Stash tus cambios sin commit (si los hay)
git stash

# 2. Traer cambios de main
git fetch origin
git merge origin/main

# 3. Recuperar tus cambios
git stash pop

# 4. Si hay conflictos, COMUNICA al usuario
# (ver Caso 2)

# 5. Continuar trabajando
```

### Caso 2: Hay conflicto de merge

**Razón:** Tú y Arquitecto 1 cambiaron archivos relacionados (RARO)

**Solución:**
```bash
# ❌ NO intentes resolver solo
# ✅ COMUNICA AL USUARIO

# Comando para ver conflicto:
git status  # Mostrará archivos en conflicto

# Comando para ver detalles:
git diff

# Luego comunica: "Hay conflicto en [archivo]. Necesito que lo resuelvas."
```

### Caso 3: Creaste un servicio pero no funciona

**Razón:** Error en lógica o sintaxis

**Solución:**
```bash
# 1. Validar sintaxis
node -c backend/services/archivo.js

# 2. Si hay error, arreglarlo en editor
code backend/services/archivo.js

# 3. Validar de nuevo
node -c backend/services/archivo.js

# 4. Si no está commiteado:
git add backend/services/archivo.js
git commit -m "fix(services): Corregir servicio"

# 5. Si ya está commiteado, revertir y arreglar:
git revert HEAD  # Revierte último commit

# Editar archivo, corregir

git add backend/services/archivo.js
git commit -m "fix(services): Arreglar [problema específico]"

git push origin claude/logging-backend-refactoring-gdpr
```

### Caso 4: Accidentalmente estás en main

**Razón:** Te confundiste de rama

**Solución:**
```bash
# 1. Verificar dónde estás
git branch --show-current
# Resultado: main (❌ MALO)

# 2. Cambiar a tu rama
git checkout claude/logging-backend-refactoring-gdpr

# 3. Verificar
git branch --show-current
# Resultado: claude/logging-backend-refactoring-gdpr (✓ BIEN)

# 4. Continuar trabajando
```

### Caso 5: Commitiste datos sensibles accidentalmente

**Razón:** Olvidaste que tenías un token o password en el código

**Solución (URGENTE):**
```bash
# 1. Buscar qué commitaste
git diff HEAD~1 HEAD  # Ver último commit

# 2. Si tiene datos sensibles:
git revert HEAD  # Revierte el commit (crea nuevo commit que revierte)

# 3. O editar y amend (SOLO si no está pusheado):
# (si ya hiciste push, usar revert)

git add archivo_limpiado.js
git commit --amend  # Modifica último commit

git push origin claude/logging-backend-refactoring-gdpr

# 4. COMUNICA al usuario si pusheaste datos sensibles
# (para que pueda hacer rotación de secretos en producción)
```

---

## 📊 TRACKING DE PROGRESO

### Mantén actualizado este archivo (SESSION_PROGRESS.md)

```markdown
# Progreso Arquitecto 2 - Logging GDPR + Backend Refactoring

## Sub-Tarea A: Logging (Día 1-5, 10 horas)

### Día 1 [Fecha]
- Archivos creados: debug-logger.js, sanitized-errors.js
- Commits: 1
- Status: ✓ Completo

### Día 2 [Fecha]
- Archivos limpios: admin.js, auth.js, students.js
- Logs sanitizados: ~210
- Commits: 2
- Status: ✓ Completo

### Día 3 [Fecha]
- Archivos limpios: approvals.js, notifications.js, uploads.js
- Logs sanitizados: ~195
- Commits: 2
- Status: ✓ Completo

### Día 4 [Fecha]
- Archivos limpios: emails.js, gamification.js, calendar.js
- Logs sanitizados: ~188
- Commits: 2
- Status: ✓ Completo

### Día 5 [Fecha]
- Testing Sub-Tarea A: ✓ Completo
- Validaciones: All pass
- Status: ✓ READY PARA SUB-TAREA B

## Sub-Tarea B: Servicios + Refactoring (Día 6-14, 20-25 horas)

### Día 6 [Fecha]
- Servicios creados: auth-service.js, admin-service.js
- Commits: 1
- Status: ✓ Completo

### Día 7 [Fecha]
- Servicios creados: student-service.js, approval-service.js
- Commits: 1
- Status: ✓ Completo

... (continuar por cada día)

### Día 14 [Fecha]
- Testing final: ✓ Completo
- All 10 servicios validados
- All 18 rutas refactorizadas
- All 27 huérfanas procesadas
- Status: ✓ READY FOR MERGE
```

---

## 🔐 SEGURIDAD DE CÓDIGO

### Antes de cada push, verificar seguridad

```bash
# Buscar datos sensibles
git diff --cached | grep -i "password\|token\|secret\|api_key"
# Resultado esperado: (vacío - ningún resultado)

# Buscar hardcoded URLs locales
git diff --cached | grep "localhost\|127.0.0.1"
# (OK si están en tests, pero no en código de producción)

# Si encuentra algo:
git reset HEAD archivo_sensible.js  # Desestadiar
# Editar archivo, remover sensible
git add archivo_sensible.js
git commit -m "security: Remover hardcoded secrets"
```

---

## 📈 COMANDOS GIT ÚTILES

| Comando | Uso |
|---------|-----|
| `git status` | Ver estado actual |
| `git log --oneline -10` | Ver últimos 10 commits |
| `git branch` | Ver todas las ramas |
| `git diff` | Ver cambios sin stagear |
| `git diff --cached` | Ver cambios staged |
| `git add archivo.js` | Stagear cambio |
| `git commit -m "msg"` | Hacer commit |
| `git push origin rama` | Pushar a GitHub |
| `git pull origin main` | Traer cambios de main |
| `git checkout rama` | Cambiar de rama |
| `git stash` | Guardar cambios temporalmente |
| `git stash pop` | Recuperar cambios guardados |
| `git revert <id>` | Revertir commit |

---

## ✅ FINAL CHECKLIST ANTES DE TERMINAR

**Cuando hayas completado ambas sub-tareas:**

**Sub-Tarea A (Logging):**
- [ ] debug-logger.js creado y funcional
- [ ] sanitized-errors.js creado
- [ ] 25 archivos tienen logging condicional (debugLog.log)
- [ ] Grep valida: CERO logs con tokens/passwords
- [ ] Servidor producción muestra CERO logs
- [ ] REFACTOR_TRACKING.md actualizado

**Sub-Tarea B (Servicios):**
- [ ] 10 servicios creados en `backend/services/`
- [ ] 18 rutas refactorizadas
- [ ] 27 rutas huérfanas procesadas
- [ ] `node -c` valida todos sin errores
- [ ] Postman/curl testing completado
- [ ] REFACTOR_TRACKING.md actualizado
- [ ] CHANGELOG.md tiene entrada "Fase Completa"

**General:**
- [ ] Todos los commits pusheados a rama
- [ ] Rama `claude/logging-backend-refactoring-gdpr` existe en GitHub
- [ ] Usuario confirmó que puede ver cambios

**Luego:**
- Usuario mergeará rama a main
- Project status: ✅ READY PARA MERGE

---

## 📞 SOPORTE Y AYUDA

**Si tienes problema con Git:**

```bash
# Ver estado completo
git status

# Ver todos los cambios
git diff

# Ver historial
git log --oneline -20

# Verificar rama correcta
git branch --show-current

# Copiar y pegar salida en Slack/mensaje al usuario
```

**No tengas miedo de pedir ayuda. Los cambios están en GitHub, nada se pierde.**

---

## 🎯 RESUMEN RÁPIDO

```
┌──────────────────────────────────────────────┐
│  WORKFLOW RÁPIDO - REPITE CADA DÍA           │
├──────────────────────────────────────────────┤
│ 1. git checkout rama                         │
│ 2. Editar archivos en backend/               │
│ 3. node -c validar sintaxis                  │
│ 4. git add, git commit (cada 2-3 files)      │
│ 5. Editar REFACTOR_TRACKING.md (docs)        │
│ 6. git add, git commit (docs)                │
│ 7. git push origin rama                      │
│ 8. Repetir mañana                            │
└──────────────────────────────────────────────┘
```

---

**¡A por ello! 🚀**

Esta es la tarea más grande, pero está clara. Tienes 14 días y ~40 horas. 3-4 horas/día es perfecto. Commiteá seguido, pushea diario, y los cambios estarán seguros.

Uno es el logging (simple), lo otro es crear servicios y refactorizar (systematic pero no difícil). ¡Adelante!
