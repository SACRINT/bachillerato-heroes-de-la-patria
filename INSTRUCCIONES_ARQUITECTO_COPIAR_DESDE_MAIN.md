# 📋 INSTRUCCIONES: COPIAR DOCUMENTACIÓN DESDE MAIN BRANCH

**Para:** Arquitecto del Proyecto
**Fecha:** 17 Noviembre 2025
**Duración:** ~10 minutos

---

## PROBLEMA
No encontraste los documentos de Semanas 2-12 ni el plan de Semanas 13-24 en tu rama local porque Claude los pusheó a main branch, pero tú no los tenías sincronizados.

---

## SOLUCIÓN (Paso a Paso)

### Paso 1: Ubicarse en el Directorio Correcto

```bash
cd C:\03_BachilleratoHeroesWeb
```

### Paso 2: Ver en Qué Rama Estás Actualmente

```bash
git branch

# Salida esperada:
# main
# * mi-rama-trabajo (o lo que sea)
# feature/algo
```

Si ves un asterisco (*) en una rama que NO es main, estás en una rama separada. Eso es normal.

### Paso 3: Traer los Cambios desde Main (SIN CAMBIAR DE RAMA)

```bash
# Opción A: Merge (recomienda si quieres combinar)
git merge main

# Opción B: Rebase (si prefieres historial lineal)
git rebase main

# Opción C: Cherry-pick solo los documentos (MÁS SEGURO)
git checkout main -- PLAN_TRABAJO_ARQUITECTO_12SEMANAS.md
git checkout main -- PLAN_TRABAJO_ARQUITECTO_SEMANAS_13-24.md
git checkout main -- SEMANA1_RESUMEN_FINAL.md
git checkout main -- ESTADO_REAL_PROYECTO_17NOV_2025.md
git checkout main -- INSTRUCCIONES_ARQUITECTO_COPIAR_DESDE_MAIN.md
```

### Paso 4: Verificar que Tienes los Archivos

```bash
# Ver si existen los archivos
ls PLAN_TRABAJO_*.md
ls SEMANA1_RESUMEN_*.md
ls ESTADO_REAL_*.md
ls INSTRUCCIONES_ARQUITECTO_*.md

# Salida esperada: Todos los archivos listados sin error
```

### Paso 5: Ver el Contenido de los Archivos

```bash
# Ver el plan de Semanas 2-12
head -50 PLAN_TRABAJO_ARQUITECTO_12SEMANAS.md

# Ver el plan de Semanas 13-24
head -50 PLAN_TRABAJO_ARQUITECTO_SEMANAS_13-24.md

# Ver el estado real
cat ESTADO_REAL_PROYECTO_17NOV_2025.md
```

### Paso 6: Copiar el Código de Semana 1 (Opcional pero Recomendado)

Si quieres asegurar que tienes el código ejecutado en Semana 1:

```bash
# Traer también los archivos de código de Semana 1
git checkout main -- public/js/logger-manager.js
git checkout main -- public/js/auth-api-bridge.js
git checkout main -- public/js/auth-context-bridge.js
git checkout main -- public/js/data-event-emitter.js

# Verificar
ls -la public/js/logger-manager.js
ls -la public/js/auth-*-bridge.js
ls -la public/js/data-event-emitter.js
```

### Paso 7: Commit los Cambios en tu Rama (MUY IMPORTANTE)

```bash
# Ver qué cambios tienes
git status

# Agregar los cambios
git add PLAN_TRABAJO_*.md SEMANA1_*.md ESTADO_REAL_*.md INSTRUCCIONES_ARQUITECTO_*.md
git add public/js/logger-manager.js public/js/auth-*-bridge.js public/js/data-event-emitter.js

# Commit
git commit -m "docs: Sincronizar documentación y código de Semana 1 desde main

- Traídos plans de Semanas 2-12 y 13-24
- Traído código ejecutado de Semana 1
- Traída clarificación de estado real del proyecto"

# Push a tu rama
git push origin tu-rama-nombre
```

---

## ALTERNATIVA RÁPIDA (Para los Impacientes)

Si quieres TODO de main en un solo comando:

```bash
git pull origin main
```

Eso hará:
1. Traer TODOS los cambios desde main
2. Mergear automáticamente en tu rama actual
3. Si hay conflictos, te dirá dónde están

---

## ALTERNATIVA MÁS SEGURA (Si Tienes Cambios Locales)

Si ya tienes cambios en tu rama y NO quieres que se pierdan:

```bash
# 1. Guarda tus cambios locales en un stash
git stash

# 2. Trae los cambios desde main
git pull origin main

# 3. Reaplica tus cambios
git stash pop

# 4. Si hay conflictos, resuelve manualmente
# Luego commit
```

---

## VERIFICACIÓN FINAL

Después de cualquiera de los pasos arriba, verifica:

```bash
# 1. ¿Tienes los archivos?
ls -la PLAN_TRABAJO_ARQUITECTO_12SEMANAS.md
ls -la PLAN_TRABAJO_ARQUITECTO_SEMANAS_13-24.md

# 2. ¿Estás en la rama correcta?
git branch

# 3. ¿Está tu rama sincronizada?
git log --oneline -5

# Deberías ver commits que incluyan:
# - "Semanas 13-24"
# - "Semana 1"
# - "plan detallado"
```

---

## DECISIÓN CRÍTICA

Después de sincronizar, DEBES leer `ESTADO_REAL_PROYECTO_17NOV_2025.md` y decidir:

### Opción A: Ejecutar Semanas 2-12 Primero (24 semanas total)
- Lee: `PLAN_TRABAJO_ARQUITECTO_12SEMANAS.md`
- Ejecuta las 11 semanas restantes de la Fase 1
- Luego las 4 fases de Semanas 13-24
- **Tiempo:** ~24 semanas (~6 meses)
- **Riesgo:** Bajo (siguiendo plan original)
- **Beneficio:** Completo, nada saltado

### Opción B: Saltar a Semana 13 Directamente (12 semanas)
- Lee: `PLAN_TRABAJO_ARQUITECTO_SEMANAS_13-24.md`
- Comienza directamente con Multi-tenancy
- Asume que Semanas 2-12 fueron validadas
- **Tiempo:** ~12 semanas (~3 meses)
- **Riesgo:** Medio (saltando semanas)
- **Beneficio:** Rápido, llega a v4.0 antes

---

## CONTACTO/PREGUNTAS

Si algo no funciona:

1. Revisa el error exacto (copia/pega en mensaje)
2. Revisa `CLAUDE.md` sección 2 (Protocolos de Trabajo)
3. Revisa `docs/historia_del_proyecto.md` (contexto histórico)

---

**Generado por:** Claude Code
**Última Actualización:** 17 Noviembre 2025
**Estado:** Listo para ser ejecutado
