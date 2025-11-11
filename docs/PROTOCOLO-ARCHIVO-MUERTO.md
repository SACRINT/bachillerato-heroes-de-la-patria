# 📋 PROTOCOLO DE ARCHIVO MUERTO Y CONSERVACIÓN

**Versión:** 1.0
**Fecha Creación:** 9 de Noviembre 2025
**Propósito:** Definir cómo manejar archivos durante refactorización

---

## 🎯 PRINCIPIOS FUNDAMENTALES

### 1. NUNCA BORRAR - SIEMPRE ARCHIVAR
```
✗ PROHIBIDO: rm archivo.js, git rm archivo.js
✅ PERMITIDO: mv archivo.js /no_usados/[categoría]/archivo.js
```

### 2. CONSERVAR SI TIENE VALOR
```
Si el código:
  ✅ Puede ser reutilizado actualizándolo → CONSERVAR
  ✅ Necesita refactorización menor → CONSERVAR
  ✅ Implementa lógica válida → CONSERVAR

  ❌ Es completamente obsoleto → ARCHIVAR
  ❌ Tiene bugs críticos no reparables → ARCHIVAR
  ❌ Duplica funcionalidad actual → ARCHIVAR
```

### 3. TRAZABILIDAD TOTAL
```
Cada archivo archivado debe tener:
  📍 ORIGEN: Carpeta original en proyecto
  📅 FECHA: Cuándo fue archivado
  📝 RAZÓN: Por qué fue archivado
  🔍 CÓDIGO: Tipo de código (funcionalidad, bug, etc.)
  ✏️ ACCIÓN: Alternativa (crear desde cero, mantener, refactorizar)
```

---

## 📁 ESTRUCTURA DE ARCHIVOS ARCHIVADOS

### Sistema de Carpetas en /no_usados/

```
/no_usados/
├── codigo-muerto-archivado-2025-11-09/
│   ├── frontend-js/
│   │   ├── ia-ml-systems/
│   │   ├── experimental-features/
│   │   ├── mobile-pwa/
│   │   ├── bundles-webpack/
│   │   └── deprecated-optimizers/
│   │
│   ├── backend-js/
│   │   ├── obsolete-routes/
│   │   ├── legacy-services/
│   │   └── unused-middleware/
│   │
│   ├── html-pages/
│   │   └── deprecated-layouts/
│   │
│   └── README.md (Índice de archivos archivados)
│
├── codigo-refactorizable-2025-11-09/
│   ├── frontend-js/
│   │   ├── managers-to-refactor/
│   │   ├── old-implementations/
│   │   └── legacy-features/
│   │
│   ├── backend-js/
│   │   ├── database-access-old/
│   │   ├── routes-to-refactor/
│   │   └── services-legacy/
│   │
│   └── README.md (Índice de código refactorizable)
│
└── histórico/
    └── [Carpetas anteriores como evidencia]
```

---

## 📝 METADATA DE ARCHIVOS ARCHIVADOS

### Archivo de Índice: /no_usados/INDICE-ARCHIVOS-ARCHIVADOS.md

Cada archivo archivado debe estar documentado:

```markdown
# Índice de Archivos Archivados

**Fecha de Generación:** 2025-11-09

## Código Muerto (Eliminar o Recrear desde Cero)

| Archivo Original | Ruta Archivada | Fecha | Razón | Acción |
|---|---|---|---|---|
| public/js/adaptive-ai-tutor.js | no_usados/codigo-muerto/adaptive-ai-tutor.js | 2025-11-09 | IA no integrada, desarrollo pausado | Crear desde cero si es necesario |
| public/js/digital-ecosystem.js | no_usados/codigo-muerto/digital-ecosystem.js | 2025-11-09 | Concepto vago, nunca se completó | Crear desde cero si es necesario |
| public/js/admin.bundle.js | no_usados/codigo-muerto/bundles/admin.bundle.js | 2025-11-09 | Webpack bundle nunca cargado | Remover configuración de webpack |

## Código Refactorizable (Mantener, Actualizar Luego)

| Archivo Original | Ruta Archivada | Fecha | Razón | Acción |
|---|---|---|---|---|
| backend/data/database-access.js | no_usados/codigo-refactorizable/database-access-old.js | 2025-11-09 | Monolítico, necesita DAL modular | Refactorizar en 7 módulos |
| public/js/lazy-loader.js | no_usados/codigo-refactorizable/lazy-loader-v1.js | 2025-11-09 | Funciona pero necesita optimización | Refactorizar con Intersection Observer |
| backend/routes/admin.js | no_usados/codigo-refactorizable/admin-v1.js | 2025-11-09 | Funciona pero tight coupling | Refactorizar con DAL |
```

---

## 🔄 PROCESO DE DECISIÓN PARA CADA ARCHIVO

### Diagrama de Decisión

```
¿Archivo está en uso actual?
  ↓ SI
  ├→ ¿Funciona correctamente?
      ├→ SI  → MANTENER en producción
      └→ NO  → ¿Se puede arreglar fácilmente?
              ├→ SI  → Corregir y mantener
              └→ NO  → REFACTORIZAR (mover a refactorizable)

  ↓ NO
  ├→ ¿El código es reutilizable/escalable?
      ├→ SI  → ¿Necesita actualización?
              ├→ SEMANAL    → MANTENER (refactorizar después)
              ├→ URGENTE   → REFACTORIZAR
              └→ OPCIONAL  → ARCHIVAR a refactorizable

      └→ NO  → ¿Es obsoleto/duplicado?
              ├→ SI  → ARCHIVAR a código-muerto
              └→ NO  → ¿Tiene bugs críticos?
                      ├→ SI  → ARCHIVAR a código-muerto
                      └→ NO  → ARCHIVAR a refactorizable
```

---

## 📊 CATEGORÍAS DE ARCHIVOS

### 1. CÓDIGO MUERTO (Archivar definitivamente)

**Criterios:**
- Nunca se carga/usa en ninguna página
- Funcionalidad completamente reemplazada
- Bugs críticos imposibles de reparar
- Desarrollo pausado hace meses

**Ejemplo:**
```
adaptive-ai-tutor.js (25 KB)
  - IA avanzada no integrada en UI
  - Desarrollo pausado desde Julio
  - Mejor crear desde cero si es necesario
  → ARCHIVAR a: no_usados/codigo-muerto/ia-ml-systems/
```

**Ubicación:** `/no_usados/codigo-muerto-archivado-YYYY-MM-DD/`

---

### 2. CÓDIGO REFACTORIZABLE (Conservar, actualizar después)

**Criterios:**
- Funciona pero necesita actualización
- Tight coupling que necesita DAL
- Código duplicado que se puede consolidar
- Optimizaciones pendientes

**Ejemplo:**
```
database-access.js (1,458 líneas)
  - Funciona correctamente
  - Necesita dividirse en 7 DAL modules
  - Se puede actualizar sin perder funcionalidad
  → CONSERVAR pero REFACTORIZAR después
  → Documentar en ROADMAP
```

**Ubicación:** `/no_usados/codigo-refactorizable-YYYY-MM-DD/`

---

### 3. CÓDIGO ACTIVO (Mantener en producción)

**Criterios:**
- Se carga en HTML actual
- Funciona correctamente
- En uso por usuarios
- Parte del roadmap actual

**Ejemplo:**
```
main.js
dashboard-manager.js
api-client.js
  → MANTENER en /public/js/
  → Documentar mejoras pendientes
```

**Ubicación:** `/public/js/` (sin cambios)

---

## 📋 PLANTILLA DE DOCUMENTACIÓN

### Archivo: /no_usados/INDICE-ARCHIVOS-ARCHIVADOS.md

Cada fase de remediación debe actualizar este índice:

```markdown
# Índice de Archivos Archivados - [FECHA]

## Resumen
- Archivos archivados: N
- Archivos refactorizables: M
- Archivos eliminados del código: 0 (NUNCA)
- Archivos conservados: P

## Fase X - Fecha

### Archivos Archivados (Código Muerto)

#### adaptive-ai-tutor.js
- **Origen:** public/js/adaptive-ai-tutor.js
- **Tamaño:** 25 KB
- **Razón de Archivo:** IA avanzada no integrada, desarrollo pausado
- **Acción:** Crear desde cero si es necesario
- **Fecha Archivado:** 2025-11-09
- **Fase:** 2 - Limpieza Frontend
- **Notas:** Sistema de IA complejo que requeriría rediseño moderno

### Archivos Refactorizables (Código Válido)

#### database-access.js
- **Origen:** backend/data/database-access.js
- **Tamaño:** 1,458 líneas, 40 métodos
- **Razón de Archivo:** Monolítico, necesita dividirse en DAL modular
- **Acción:** Refactorizar en 7 módulos (students, teachers, parents, etc.)
- **Fecha Archivado:** 2025-11-09
- **Fase:** 3 - Refactorización DAL
- **Prioridad:** CRÍTICA (blocking multiple features)
- **Notas:** Código funciona bien, solo necesita mejor estructura
```

---

## 🚀 PROCESO PARA FASE 2 (LIMPIEZA FRONTEND)

### Antes de Archivar Cualquier Archivo JS

1. **✅ Verificar que NO está en uso:**
   ```bash
   # Buscar en todos los HTMLs
   grep -r "nombre-archivo.js" public/*.html

   # Buscar en todos los scripts
   grep -r "nombre-archivo.js" public/js/
   ```

2. **✅ Revisar si hay funcionalidad en desarrollo:**
   ```bash
   # Buscar TODO, FIXME, WIP
   grep -i "TODO\|FIXME\|WIP\|EN DESARROLLO" public/js/nombre-archivo.js
   ```

3. **✅ Decidir: ¿Código muerto o refactorizable?**
   ```
   Si: Nunca se usa + bugs + desarrollo pausado
     → ARCHIVAR a codigo-muerto/

   Si: Funciona + necesita refactorización + valor potencial
     → ARCHIVAR a codigo-refactorizable/

   Si: Se usa actualmente + funciona
     → MANTENER en producción
   ```

4. **✅ Documentar el archivo archivado:**
   ```markdown
   - Archivo: adaptive-ai-tutor.js
   - Origen: public/js/
   - Razón: IA no integrada, desarrollo pausado
   - Acción: Crear desde cero
   - Fecha: 2025-11-09
   ```

5. **✅ Mover con estructura clara:**
   ```bash
   mkdir -p /no_usados/codigo-muerto-archivado-2025-11-09/frontend-js/ia-ml-systems/
   mv public/js/adaptive-ai-tutor.js /no_usados/codigo-muerto-archivado-2025-11-09/frontend-js/ia-ml-systems/
   ```

---

## 🔍 BÚSQUEDA Y RECUPERACIÓN

### Buscar Archivo Archivado

```bash
# Buscar por nombre
find /no_usados -name "*adaptive*" -type f

# Buscar por contenido
grep -r "clase AdaptiveAI" /no_usados/

# Ver historial completo
cat /no_usados/INDICE-ARCHIVOS-ARCHIVADOS.md | grep -A 5 "adaptive-ai"
```

### Recuperar Archivo (Si es necesario)

```bash
# Copiar de vuelta a producción
cp /no_usados/codigo-refactorizable-2025-11-09/backend-js/database-access-old.js \
   backend/data/database-access-v1-legacy.js

# Actualizar índice
echo "Recuperado: database-access.js en $(date)" >> /no_usados/INDICE-ARCHIVOS-ARCHIVADOS.md
```

---

## 📊 MANTENIMIENTO DEL ÍNDICE

### Cada Fase Debe Actualizar:

```markdown
## Estadísticas Acumuladas

**Total archivos archivados:** XXX
**Total líneas de código archivado:** YYY KB
**Archivos refactorizables en cola:** ZZZ
**Progreso de refactorización:** N%

### Timeline de Archivos

- **Fase 1 (Nov 9):** 10 archivos archivados
- **Fase 2 (Nov 16):** 85 archivos archivados
- **Fase 3 (Nov 23):** 40 archivos refactorizados
```

---

## ⚠️ REGLAS CRÍTICAS

### ❌ NUNCA HACER
```
✗ rm -rf public/js/archivo.js
✗ git rm archivo.js
✗ Eliminar sin documentar
✗ Borrar si no estás 100% seguro
✗ Mover archivos en uso
```

### ✅ SIEMPRE HACER
```
✅ Mover a /no_usados/ con estructura clara
✅ Documentar en INDICE-ARCHIVOS-ARCHIVADOS.md
✅ Verificar que NO está en uso antes de mover
✅ Revisar si se puede refactorizar
✅ Mantener git history (git log --all -- archivo)
```

---

## 📁 ESTRUCTURA FINAL ESPERADA

```
/no_usados/
├── codigo-muerto-archivado-2025-11-09/
│   ├── frontend-js/
│   │   ├── ia-ml-systems/
│   │   │   ├── adaptive-ai-tutor.js
│   │   │   ├── ai-machine-learning.js
│   │   │   └── README.md (Motivo archivo)
│   │   │
│   │   ├── bundles-webpack/
│   │   │   ├── admin.bundle.js
│   │   │   ├── core.bundle.js
│   │   │   └── README.md
│   │   │
│   │   └── README.md (Índice de esta carpeta)
│   │
│   └── backend-js/
│       └── [similar estructura]
│
├── codigo-refactorizable-2025-11-09/
│   ├── frontend-js/
│   │   ├── database-access-old.js
│   │   ├── README.md (Plan de refactorización)
│   │   └── [código funcional que se mejorará]
│   │
│   └── README.md (Índice y plan de trabajo)
│
├── INDICE-ARCHIVOS-ARCHIVADOS.md (Maestro global)
└── README.md (Guía general de no_usados/)
```

---

## 🎯 CONCLUSIÓN

**Este protocolo asegura:**
- ✅ Nada se pierde
- ✅ Trazabilidad total
- ✅ Fácil recuperación
- ✅ Claridad de intención
- ✅ Documentación para futuras decisiones
- ✅ Respeto por el código en desarrollo

**Aplica este protocolo en cada fase de remediación.**

---

**Versión:** 1.0
**Última Actualización:** 9 de Noviembre 2025
**Responsable:** Claude Code
