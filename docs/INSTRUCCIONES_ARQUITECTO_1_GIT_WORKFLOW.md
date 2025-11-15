# 📖 INSTRUCCIONES GIT WORKFLOW - ARQUITECTO 1

**Para:** Arquitecto 1 - Sanitización XSS Fase 2 Bloque 4
**Rama Asignada:** `claude/xss-sanitization-phase2-bloque4`
**Duración Estimada:** 5-7 días (20 horas)
**Objetivo:** Mergear 200+ cambios a rama main sin conflictos

---

## 🚀 INICIO RÁPIDO (5 minutos)

```bash
# 1. Actualizar main (traer últimos cambios)
git checkout main
git pull origin main

# 2. Crear tu rama feature
git checkout -b claude/xss-sanitization-phase2-bloque4

# 3. Verificar que estás en la rama correcta
git branch --show-current
# Resultado esperado: claude/xss-sanitization-phase2-bloque4

# 4. Comenzar trabajo
# (ver "FLUJO DE TRABAJO DIARIO" abajo)
```

---

## 📋 REGLAS CRÍTICAS PARA ARQUITECTO 1

### ✅ DEBES HACER

- **✅ Trabajar SOLO en `public/js/` y `docs/`**
  - Estos directorios son EXCLUSIVOS para Arquitecto 1
  - Arquitecto 2 no toca nada aquí

- **✅ Hacer commits frecuentes** (mínimo cada 3-5 archivos)
  - Commits pequeños = fácil revertir si hay problema
  - Ejemplo: `git commit -m "feat(xss): Sanitizar 5 archivos ALTOS (45 riesgos)"`

- **✅ Push regularmente a GitHub**
  - Mínimo 1 push diario
  - Previene pérdida de código local

- **✅ Actualizar `docs/REFACTOR_TRACKING.md`**
  - Cada cambio en archivo debe estar registrado
  - Formato: `## [Fecha] - [Archivo] - X riesgos eliminados`

- **✅ Testing local antes de commit**
  - `node -c public/js/archivo.js` (validar sintaxis)
  - Chrome DevTools → Console (sin errores)
  - Prueba funcionalidad relacionada

- **✅ Comunicar progreso**
  - Push con mensaje claro en commit
  - Usuario sabrá avance por logs de GitHub

### ❌ NO DEBES HACER

- **❌ Modificar archivos de Arquitecto 2**
  - Arquitecto 2: `backend/`, `api/`, rutas backend
  - Si necesitas cambiar algo acá, COMUNICA al usuario

- **❌ Hacer merge a main tú solo**
  - Usuario será quien mergee ambas ramas
  - Tú solo pushas a tu rama

- **❌ Resolver conflictos sin confirmar**
  - Si hay conflicto, DEJA que usuario resuelva
  - Communica el conflicto inmediatamente

- **❌ Cambiar ramas de trabajo**
  - Mantente en `claude/xss-sanitization-phase2-bloque4`
  - NO regreses a main sin terminar

- **❌ Hacer force push**
  - `git push --force` = MALO (puede perder código)
  - Usa `git push` normal siempre

---

## 📅 FLUJO DE TRABAJO DIARIO (Repetir cada día)

### Mañana: Inicio de sesión (5 minutos)

```bash
# 1. Verificar en qué rama estás
git branch --show-current
# Resultado esperado: claude/xss-sanitization-phase2-bloque4

# 2. Si estás en main, cambiar a tu rama
git checkout claude/xss-sanitization-phase2-bloque4

# 3. Traer cambios de main (por si usuario hizo algo)
git fetch origin

# 4. Ver estado
git status
# Resultado esperado: On branch claude/xss-sanitization-phase2-bloque4
#                    Your branch is up to date with 'origin/...'
```

### Durante el día: Trabajar (3-5 horas)

**Ciclo para cada archivo:**

```bash
# 1. Abrir archivo
code public/js/archivo1.js

# 2. Hacer cambios (sanitizar innerHTML, etc)
# 3. Guardar archivo (Ctrl+S)

# 4. Validar sintaxis
node -c public/js/archivo1.js
# Resultado esperado: (vacío = OK) o error visible

# 5. Testing en navegador
# F12 → Console → Ejecutar funcionalidad del archivo
# Resultado: ✓ Sin errores

# 6. Repetir para siguiente archivo

# Después de 3-5 archivos, hacer commit:
git add public/js/archivo1.js public/js/archivo2.js ...
git commit -m "feat(xss): Sanitizar 5 archivos ALTOS - [riesgos eliminados] riesgos

Archivos:
- archivo1.js (12 riesgos)
- archivo2.js (11 riesgos)
- archivo3.js (14 riesgos)
- archivo4.js (13 riesgos)
- archivo5.js (12 riesgos)

Total: 62 riesgos XSS eliminados
Sintaxis validada: ✓ node -c OK
Testing: ✓ Completado
Status: Fase 2 - 5/20 archivos (25%)"

# 7. Actualizar REFACTOR_TRACKING.md
code docs/REFACTOR_TRACKING.md
# Agregar entrada para los 5 archivos

# 8. Commit del tracking
git add docs/REFACTOR_TRACKING.md
git commit -m "docs: Actualizar REFACTOR_TRACKING.md - 5 archivos completados"

# 9. Push a GitHub
git push origin claude/xss-sanitization-phase2-bloque4
```

### Tarde: Verificación (10 minutos)

```bash
# 1. Ver historial de commits hoy
git log --oneline -5
# Resultado: Tus 2 commits (código + docs)

# 2. Ver estado del push
git status
# Resultado esperado: Your branch is ahead of 'origin/...' by 2 commits.

# 3. Verificar en GitHub
# Abrir: https://github.com/user/repo/branches
# Buscar: claude/xss-sanitization-phase2-bloque4
# Resultado: ✓ Rama existe con tus commits

# 4. Logging de fin de día (opcional pero recomendado)
echo "Día [X]: Completados [5] archivos, [45] riesgos sanitizados" >> SESSION_LOG.md
git add SESSION_LOG.md
git commit -m "log: Actualizar sesión del día"
git push origin claude/xss-sanitization-phase2-bloque4
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

**Razón:** Tú y Arquitecto 2 cambiaron el mismo archivo (RARO, pero posible)

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

### Caso 3: Cometiste un cambio malo y quieres revertir

**Razón:** Sanitización falló o archivo no funciona

**Solución:**

```bash
# Opción A: Revertir un commit anterior
git log --oneline  # Ver historial

# Encontrar commit que quieres revertir
git revert <commit-id>  # Crea nuevo commit que revierte cambios

# Opción B: Volver a versión anterior
git checkout public/js/archivo.js  # Volver a versión en staging
# o
git restore public/js/archivo.js  # Volver a versión en repositorio

# Opción C: Si ya hiciste commit, revertir
git reset HEAD~1  # Deshacer último commit (mantiene cambios)
# Edita archivo, corrige, luego:
git add public/js/archivo.js
git commit -m "fix(xss): Corregir sanitización en archivo.js"
git push origin claude/xss-sanitization-phase2-bloque4
```

### Caso 4: Accidentalmente estás en main

**Razón:** Te confundiste de rama

**Solución:**
```bash
# 1. Verificar dónde estás
git branch --show-current
# Resultado: main (❌ MALO)

# 2. Cambiar a tu rama
git checkout claude/xss-sanitization-phase2-bloque4

# 3. Verificar
git branch --show-current
# Resultado: claude/xss-sanitization-phase2-bloque4 (✓ BIEN)

# 4. Continuar trabajando
```

---

## 📊 TRACKING DE PROGRESO

### Mantén actualizado este archivo (SESSION_PROGRESS.md)

```markdown
# Progreso Arquitecto 1 - Sanitización XSS Fase 2

## Día 1 [Fecha]
- Archivos completados: 5
- Riesgos eliminados: 45
- Commits: 2
- Status: ✓ Completo

## Día 2 [Fecha]
- Archivos completados: 5
- Riesgos eliminados: 62
- Commits: 2
- Status: ✓ Completo

... (etc para cada día)
```

**Actualizar:**
```bash
code SESSION_PROGRESS.md  # Editar
git add SESSION_PROGRESS.md
git commit -m "log: Actualizar progreso del día [X]"
git push origin claude/xss-sanitization-phase2-bloque4
```

---

## 🔐 SEGURIDAD DE CÓDIGO

### Verificar que no cometiste datos sensibles

```bash
# Antes de cada push, verificar:
git diff --cached | grep -i "password\|token\|secret\|key"
# Resultado esperado: (vacío - ningún resultado)

# Si encuentra algo, remover:
git reset HEAD archivo_sensible.js  # Desestadiar
# Editar archivo, remover secreto
git add archivo_sensible.js
git commit -m "security: Remover secretos hardcodeados"
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

---

## ✅ FINAL CHECKLIST ANTES DE TERMINAR

**Cuando hayas completado todos los 20 archivos:**

- [ ] Todos los archivos validados con `node -c`
- [ ] Chrome DevTools sin errores en todos
- [ ] REFACTOR_TRACKING.md completamente actualizado
- [ ] CHANGELOG.md tiene entrada Fase 2 Completada
- [ ] Último commit pusheado
- [ ] Rama `claude/xss-sanitization-phase2-bloque4` existe en GitHub
- [ ] Usuario confirmó que puede ver tus cambios en GitHub

**Luego:**
- Usuario mergeará rama a main
- Tú estarás listo para próxima tarea (Fase 3 si quieres)

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
┌─────────────────────────────────────────────┐
│  WORKFLOW RÁPIDO - REPITE CADA DÍA          │
├─────────────────────────────────────────────┤
│ 1. git checkout rama                        │
│ 2. Editar archivos                          │
│ 3. node -c validar                          │
│ 4. git add, git commit (cada 5 files)       │
│ 5. Editar REFACTOR_TRACKING.md              │
│ 6. git add, git commit (docs)               │
│ 7. git push origin rama                     │
│ 8. Repetir mañana                           │
└─────────────────────────────────────────────┘
```

---

**¡A por ello! 🚀**

Tienes todo lo que necesitas. Los cambios están seguros en GitHub. Commiteá seguido, pushea diario, y comunica avance en tus commits. El usuario podrá ver exactamente qué hiciste y cuándo.
