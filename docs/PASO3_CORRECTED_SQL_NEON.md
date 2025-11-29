# 🔧 PASO 3 CORREGIDO: SQL para Neon Console

**Problema:** La columna `id` es INTEGER, no VARCHAR
**Error:** `invalid input syntax for type integer: "default"`
**Solución:** Usar formato correcto para comparación

---

## ✅ SQL CORREGIDO (Copiar y ejecutar en Neon)

```sql
-- Paso 1: Agregar columna dominio (si no existe)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255) UNIQUE;

-- Paso 2: Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tenants_dominio
ON tenants(dominio);

-- Paso 3: Actualizar valores existentes (versión corregida para INTEGER id)
UPDATE tenants
SET dominio = CASE
    WHEN id = 1 THEN 'default'
    WHEN subdomain IS NOT NULL THEN subdomain
    ELSE CAST(id AS VARCHAR)
END
WHERE dominio IS NULL;

-- Paso 4: Verificar que la columna existe y tiene datos
SELECT id, nombre, dominio, subdomain
FROM tenants
LIMIT 10;
```

---

## 📝 CAMBIOS REALIZADOS

| Línea | ANTES | DESPUÉS | Razón |
|-------|-------|---------|-------|
| CASE WHEN id = 'default' | id='default' (string) | id=1 (integer) | `id` es INTEGER, no VARCHAR |
| ELSE LOWER(id) | LOWER(id) (string fn) | CAST(id AS VARCHAR) | `id` es número, necesita conversión |

---

## 🎯 CONTEXTO

La tabla `tenants` tiene estructura:
- `id` → INTEGER (PRIMARY KEY)
- `nombre` → VARCHAR
- `dominio` → VARCHAR (nueva columna)
- `subdomain` → VARCHAR

El middleware `tenant-context.js` busca por cualquiera de estos:
```javascript
WHERE id = $1 OR subdomain = $1 OR dominio = $1
```

Esto funciona porque PostgreSQL hace coerción automática cuando se pasa un parámetro.

---

## ✅ DESPUÉS DE EJECUTAR

Deberías ver:

```
Query executed successfully
ALTER TABLE: Success
CREATE INDEX: Success
UPDATE: Updated X rows
```

Y luego 10 filas con datos como:
```
id=1, nombre='BGE Héroes de la Patria', dominio='default', subdomain='default'
```

---

**Próximo paso:** Una vez confirmado, procede con PASO 5 (reiniciar servidor)
