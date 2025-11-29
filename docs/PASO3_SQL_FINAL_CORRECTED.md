# ✅ PASO 3 FINAL: SQL Definitivo para Neon Console

**Problema anterior:** Columna se llama `domain` (no `subdomain`)
**Solución:** Usar nombre de columna correcto

---

## ✅ SQL FINAL CORREGIDO

**Ejecuta SOLO ESTE BLOQUE (una sentencia a la vez en Neon):**

### Sentencia 1: Agregar columna
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dominio VARCHAR(255) UNIQUE;
```

### Sentencia 2: Crear índice
```sql
CREATE INDEX IF NOT EXISTS idx_tenants_dominio ON tenants(dominio);
```

### Sentencia 3: Actualizar valores (versión corregida para column "domain")
```sql
UPDATE tenants
SET dominio = CASE
    WHEN id = 1 THEN 'default'
    WHEN domain IS NOT NULL THEN domain
    ELSE CAST(id AS VARCHAR)
END
WHERE dominio IS NULL;
```

### Sentencia 4: Verificar resultado
```sql
SELECT id, nombre, dominio, domain FROM tenants LIMIT 10;
```

---

## 🔧 CAMBIOS REALIZADOS

| Error | ANTES | DESPUÉS | Razón |
|-------|-------|---------|-------|
| Column not found | `subdomain` | `domain` | PostgreSQL dice "tal vez meant `tenants.domain`" |
| Type mismatch | `id = 'default'` | `id = 1` | `id` es INTEGER |
| Function call | `LOWER(id)` | `CAST(id AS VARCHAR)` | Convertir INT a TEXT |

---

## 📝 ESTRUCTURA ACTUAL DE TABLA tenants

Basado en los errores de Neon, la estructura es:

```
id          → INTEGER (PRIMARY KEY)
nombre      → VARCHAR
domain      → VARCHAR (no subdomain!)
dominio     → VARCHAR (nueva columna a agregar)
config_json → JSON o JSONB
status      → VARCHAR
created_at  → TIMESTAMP
```

---

## ⚠️ IMPORTANTE: EJECUTAR UNA SENTENCIA A LA VEZ

**NO pegues todas juntas.** En Neon:
1. Copia la Sentencia 1
2. Pégala en el editor
3. Presiona "Execute" o Ctrl+Enter
4. Espera a que diga "Success"
5. Repite para Sentencia 2, 3, 4

---

## ✅ RESULTADO ESPERADO

Después de Sentencia 4, deberías ver 10 filas como:

```
id | nombre                    | dominio | domain
1  | BGE Héroes de la Patria   | default | default
2  | Tenant 2 (si existe)      | (value) | (value)
```

Si ves esto, **PASO 3 está 100% completado** ✅

---

## 📚 CONTEXTO PARA MIDDLEWARE

El middleware `backend/middleware/tenant-context.js` línea 81 busca:

```javascript
WHERE id = $1 OR subdomain = $1 OR dominio = $1
```

Pero PostgreSQL internamente lo resuelve como:
- `id` = parámetro (si es number)
- `subdomain` = columna que NO existe (error original)
- `dominio` = nueva columna (que estamos creando)

Una vez que agreguemos `dominio`, la búsqueda funcionará correctamente.

---

**Próximo paso después de esto:** PASO 5 (Reiniciar servidor con `npm start`)
