# 🗄️ INSTRUCCIONES: Ejecutar SQL en Neon Console

**Archivo:** `fix-tenants-table-add-nombre.sql`
**Razón:** El middleware `tenant-context.js` requiere columna `nombre` en tabla `tenants`
**Tiempo:** 5 minutos

---

## 📋 PASOS PARA EJECUTAR

### 1. Conecta a Neon Console

1. Abre navegador
2. Ve a: **https://console.neon.tech**
3. Inicia sesión con tu cuenta
4. Selecciona el proyecto **BGE** (Bachillerato Heroes de la Patria)
5. Haz clic en **SQL Editor** en el menú lateral

---

### 2. Ejecuta el Script SQL

1. **Copia TODO el contenido** del archivo `fix-tenants-table-add-nombre.sql`
2. **Pega** en el SQL Editor de Neon
3. Haz clic en **Run** (o presiona `Ctrl+Enter`)
4. Espera 2-5 segundos

---

### 3. Verifica el Resultado

Deberías ver mensajes como:

```
✅ NOTICE: Columna "nombre" agregada exitosamente
✅ CREATE INDEX
✅ UPDATE 1 (o el número de tenants que tengas)
```

**Y en la tabla de resultados:**

| column_name | data_type    | is_nullable |
|-------------|-------------|-------------|
| nombre      | varchar(255) | YES         |

---

### 4. Verifica Datos de Tenants

El último query muestra los tenants existentes:

```sql
SELECT id, nombre, subdomain, dominio, status
FROM tenants
LIMIT 5;
```

**Resultado esperado:**

| id      | nombre                     | subdomain | dominio              | status |
|---------|---------------------------|-----------|---------------------|--------|
| default | BGE Héroes de la Patria   | default   | localhost           | activo |
| ...     | ...                       | ...       | ...                 | ...    |

---

### 5. Cierra Neon Console

Ya está, el SQL se ejecutó correctamente.

---

## ✅ VERIFICACIÓN FINAL

Después de ejecutar el SQL:

1. **Reinicia el servidor backend:**
   ```bash
   npm stop
   npm start
   ```

2. **Verifica en los logs:**
   ```
   ✅ [TENANT-CONTEXT] Tenant detectado: default (BGE Héroes de la Patria)
   ```

3. **NO debe haber error:**
   ```
   ❌ column "nombre" does not exist
   ```

---

## ❓ SI HAY ERRORES

### Error: "column nombre already exists"

**Solución:** La columna ya existe, no necesitas ejecutar el script.

---

### Error: "relation tenants does not exist"

**Solución:** La tabla `tenants` no existe. Necesitas ejecutar primero:

```bash
node backend/scripts/run-create-multi-tenant-tables.js
```

---

### Error: "permission denied"

**Solución:** Verifica que estás usando la cuenta correcta de Neon con permisos de **Owner** o **Admin**.

---

## 📊 QUÉ HACE ESTE SCRIPT

1. **Verifica** estructura actual de tabla `tenants`
2. **Agrega** columna `nombre` VARCHAR(255) si no existe
3. **Crea** índice `idx_tenants_nombre` para performance
4. **Actualiza** tenants existentes con nombre descriptivo desde `config_json`
5. **Verifica** que todo se ejecutó correctamente

---

**Generado:** 17 Noviembre 2025
**Fix:** #3 - Tenant Context
