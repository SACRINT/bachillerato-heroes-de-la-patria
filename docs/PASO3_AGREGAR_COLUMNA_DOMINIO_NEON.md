# 📋 PASO 3: AGREGAR COLUMNA "dominio" A TABLA tenants EN NEON

**Fecha:** 25 de Noviembre 2025
**Responsable:** Usuario
**Duración Estimada:** 5-10 minutos
**Crítico:** ✅ SÍ - El middleware tenant-context requiere esta columna

---

## 📊 Situación Actual

El middleware `backend/middleware/tenant-context.js` línea 75 busca la columna `dominio` en la tabla `tenants`:

```sql
SELECT id, nombre, dominio, subdomain, status, config_json, created_at
FROM tenants
WHERE id = $1 OR subdomain = $1 OR dominio = $1
```

**Error actual si se omite:** `column "dominio" does not exist`

---

## ✅ SQL A EJECUTAR EN NEON CONSOLE

Copia y pega este bloque SQL exacto en Neon Console:

```sql
-- Paso 1: Agregar columna dominio (si no existe)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255) UNIQUE;

-- Paso 2: Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tenants_dominio
ON tenants(dominio);

-- Paso 3: Actualizar valores existentes
UPDATE tenants
SET dominio = CASE
    WHEN id = 'default' THEN 'default'
    WHEN subdomain IS NOT NULL THEN subdomain
    ELSE LOWER(id)
END
WHERE dominio IS NULL;

-- Paso 4: Verificar que la columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name='tenants' AND column_name='dominio';
```

---

## 🔧 INSTRUCCIONES PASO A PASO

### Paso 1: Acceder a Neon Console

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto BGE
3. Ve a la sección "SQL Editor"

### Paso 2: Ejecutar SQL

1. Pega el SQL anterior en el editor
2. Haz clic en "Execute" o presiona `Ctrl+Enter`
3. **Espera confirmación:** Deberías ver un mensaje como:
   ```
   ✅ Query executed successfully
   ALTER TABLE: Success
   CREATE INDEX: Success
   UPDATE: Updated X rows
   ```

### Paso 3: Verificar el Resultado

Si aparece un resultado como este, ¡éxito! ✅

```
column_name: dominio
data_type: character varying
is_nullable: NO (o YES, ambos están bien)
```

---

## 📌 NOTAS IMPORTANTES

**Seguridad:**
- Todas las sentencias usan `IF NOT EXISTS` para evitar errores si ya existe
- Esto es seguro ejecutar múltiples veces sin daños

**Performance:**
- El índice `idx_tenants_dominio` optimizará búsquedas futuras
- Sin índice, cada búsqueda sería O(n) - O(1) con índice

**Valores por defecto:**
- Tenant "default" → dominio = "default"
- Otros tenants → dominio = subdomain o id (en minúsculas)

---

## ⏭️ PRÓXIMO PASO

Una vez completado, pasaremos a **PASO 5: Reiniciar servidor**

Los cambios se aplicarán cuando reinicies el backend con los 3 fixes:
1. ✅ **PASO 1:** DB_CONNECTION_LIMIT=500 (YA COMPLETADO)
2. ⏳ **PASO 3:** Agregar columna dominio (EN PROGRESO)
3. ✅ **PASO 4:** Reparar RLS SQL Syntax (YA COMPLETADO)

---

**Estado:** Aguardando ejecución del SQL en Neon Console
