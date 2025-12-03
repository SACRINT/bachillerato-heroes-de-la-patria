# 🔍 DIAGNÓSTICO: Caracteres UTF-8 Corruptos en Base de Datos Neon

**Fecha:** 2 de Diciembre de 2025
**Estado:** 🔴 CRÍTICO - Requiere intervención en Neon
**Afectados:** Datos dinámicos del gamification-center.html
**Responsable:** Arquitecto / Admin de Neon

---

## 1. Síntoma Observado

En la página `gamification-center.html`, los datos dinámicos cargados desde la base de datos muestran caracteres corruptos:

```
❌ "Posici†n" en lugar de "Posición"
❌ "D†as Consecutivos" en lugar de "Días Consecutivos"
❌ "Estad†sticas" en lugar de "Estadísticas"
❌ "Acad†mico" en lugar de "Académico"
❌ "Mart†nez" en lugar de "Martínez"
❌ "L†pez" en lugar de "López"
❌ "Garc†a" en lugar de "García"
❌ "Obt†n" en lugar de "Obtén"
❌ "informaci†n" en lugar de "información"
```

---

## 2. Investigación Realizada

### 2.1 Se descartó problema en código fronted

✅ Verificado:
- HTML estático: UTF-8 correcto en archivos HTML
- JavaScript: UTF-8 correcto en código JS
- CSS: UTF-8 correcto en estilos

**Conclusión:** El código no tiene problemas de encoding.

### 2.2 Se encontró problema en datos dinámicos

✅ Identificado:
- Los datos estáticos en el HTML se renderizan correctamente
- Los datos dinámicos cargados vía JavaScript + fetch() desde `/api/*` muestran caracteres corruptos
- El endpoint es: `GET /api/challenges` → `ChallengesService` → `pool.query()` → **Neon Database**

### 2.3 Root Cause: Base de Datos Neon

🎯 **La fuente del problema es la base de datos Neon.**

Los datos fueron insertados con mala codificación UTF-8:
- Los caracteres acentuados (á, é, í, ó, ú) se almacenaron incorrectamente
- El símbolo † (U+2020, DAGGER) aparece cuando 'ó' se decodifica mal
- Ejemplo: `Martínez` se almacenó como bytes corruptos que se decodifican como `Mart†nez`

---

## 3. Cadena de Problemas

```
Base de Datos Neon (datos corruptos)
           ↓
Backend API (/api/challenges, etc.)
           ↓
Frontend JavaScript (fetch)
           ↓
HTML renderizado en navegador
           ↓
Usuario ve: "Posici†n" en lugar de "Posición"
```

---

## 4. Solución: Script SQL para Neon

### 4.1 Ubicación del Script

```
C:\03_BachilleratoHeroesWeb\backend\scripts\fix-neon-utf8-data.sql
```

### 4.2 Cómo Ejecutar

**Paso 1:** Abrir Neon Console
→ https://console.neon.tech

**Paso 2:** Seleccionar tu proyecto
→ Ir a "SQL Editor"

**Paso 3:** Copiar el contenido de `fix-neon-utf8-data.sql`

**Paso 4:** Pegar en el editor de Neon

**Paso 5:** Ejecutar el script
→ Click "Run" o Ctrl+Enter

**Paso 6:** Verificar los cambios
```sql
-- Ver resultados
SELECT nombre FROM usuarios WHERE nombre LIKE '%Martínez%' LIMIT 5;
SELECT nombre FROM estudiantes WHERE nombre LIKE '%García%' LIMIT 5;
```

**Paso 7:** Reiniciar el servidor backend
```bash
# En terminal del backend
npm stop
npm start
```

**Paso 8:** Hard refresh en navegador
```
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

---

## 5. Qué Hace el Script

El script `fix-neon-utf8-data.sql`:

1. **Identifica** filas con caracteres corruptos (`†` = símbolo dagger)
2. **Reemplaza** en todas las tablas:
   - `usuarios` (nombres, apellidos, email)
   - `estudiantes` (nombre, apellidos, padres)
   - `challenges` o `desafios` (títulos, descripciones)
   - `tenants` (configuración JSON)
   - Otras tablas con datos de usuario

3. **Arregla** patrones específicos:
   - `Mart†nez` → `Martínez`
   - `L†pez` → `López`
   - `Garc†a` → `García`
   - `Acad†mico` → `Académico`
   - `informaci†n` → `información`
   - Y más...

4. **Verifica** que los cambios fueron exitosos

---

## 6. Tablas Afectadas

El script corrige encoding en:

| Tabla | Columnas | Afectadas |
|-------|----------|-----------|
| `usuarios` | nombre, apellido, email | ✅ Sí |
| `estudiantes` | nombre, apellidos, nombre_padre, nombre_madre | ✅ Sí |
| `challenges` | title, description | ✅ Sí |
| `desafios` | titulo, descripcion | ✅ Sí |
| `tenants` | config_json (JSON) | ✅ Sí |
| `calificaciones` | nombre_asignatura | ✅ Sí |
| `cursos` | nombre | ✅ Sí |
| `noticias` | titulo, contenido | ✅ Sí |

---

## 7. Impacto después de la reparación

✅ **El usuario verá:**
- "Posición" correctamente
- "Días Consecutivos" correctamente
- "Estadísticas" correctamente
- "Académico" correctamente
- "Martínez", "López", "García" con acentos correctos
- "Información", "Obtén" con acentos correctos

---

## 8. Notas Técnicas

### 8.1 Por qué sucedió esto

Los datos fueron insertados desde una fuente con:
- Encoding incorrecto (probablemente Latin-1 en lugar de UTF-8)
- O una herramienta de importación que no respetó UTF-8

### 8.2 Cómo prevenir en el futuro

1. **Asegurar que Neon está configurado para UTF-8:**
   ```sql
   SHOW client_encoding;  -- Debe ser 'UTF8'
   ```

2. **Insertar datos nuevos con encoding explícito:**
   ```sql
   INSERT INTO usuarios (nombre) VALUES ('Martínez'::text);
   -- Asegurarse de que la fuente sea UTF-8
   ```

3. **Usar backend validado:**
   - El código backend ya valida UTF-8
   - Los scripts Python ya están corregidos

---

## 9. Archivos Relacionados

- **Script SQL:** `backend/scripts/fix-neon-utf8-data.sql`
- **Scripts Python:** `backend/scripts/fix-encoding-utf8-all.py`
- **Código Frontend (ya corregido):**
  - `public/gamification-center.html`
  - `public/js/gamification-system.js`
- **Documentación:** Este archivo

---

## 10. Checklist para Arquitecto

- [ ] Abrir Neon Console (https://console.neon.tech)
- [ ] Abrir SQL Editor
- [ ] Copiar contenido de `fix-neon-utf8-data.sql`
- [ ] Pegar en editor de Neon
- [ ] Ejecutar script (Ctrl+Enter)
- [ ] Verificar resultados (ver ejemplo de query al final del script)
- [ ] Reiniciar servidor backend (`npm stop && npm start`)
- [ ] Hard refresh en navegador (Ctrl+Shift+R)
- [ ] Verificar que "Posición", "Martínez", "Académico", etc. aparecen correctamente
- [ ] Comentar en GitHub commit que completaste esta tarea

---

## 11. Archivos Confirmados como Correctos

✅ Frontend (ya arreglado con scripts Python):
- 43 archivos HTML
- 120+ archivos JavaScript
- 10+ archivos CSS

❌ Base de Datos Neon (pendiente):
- Datos en tablas (próximo paso: ejecutar SQL script)

---

## 12. Contacto

Si hay problemas ejecutando el script SQL en Neon:
1. Verificar que tienes permisos de WRITE en la BD
2. Revisar logs de Neon para errores específicos
3. Si la tabla no existe, revisar nombre exacto en Neon Console
4. Contactar al admin de la base de datos

---

**Estado: PENDIENTE DE EJECUCIÓN EN NEON**
**Próximo Paso:** Ejecutar script SQL en Neon Console
