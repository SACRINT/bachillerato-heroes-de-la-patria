# BGE v5.0-5.2 Enterprise Tables Migration - FIXED VERSION

## 📋 Problema Original

El script `v5_enterprise_tables.sql` fallaba con estos errores:

```
ERROR: column "user_id" does not exist (SQLSTATE 42703)
ERROR: syntax error at or near "BIGSERIAL" (SQLSTATE 42601)
```

### Causa Raíz

La tabla `usuarios` **no existía en tu base de datos Neon**, y el script intentaba crear tablas que dependían de ella:

```sql
-- ❌ INCORRECTO: Intenta referenciar usuarios sin crearla primero
REFERENCES usuarios(id) ON DELETE CASCADE
```

## ✅ Solución Implementada

Se creó **`v5_enterprise_tables_FIXED.sql`** que:

### 1. Crea la Tabla `usuarios` Primero

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'estudiante' CHECK (rol IN ('admin', 'docente', 'estudiante', 'padre')),
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Después Crea las Tablas Dependientes

Ahora todas las referencias a `usuarios(id)` funcionarán correctamente:

```sql
-- ✅ CORRECTO: usuarios ya existe
user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
```

### 3. Cambios de Tipos de Datos

| Antes | Después | Razón |
|-------|---------|-------|
| `UUID` | `INTEGER` | Tabla usuarios usa `id SERIAL` |
| `BIGSERIAL` para chat_messages | `BIGSERIAL` | Compatible con PostgreSQL |
| `UUID session_id` | `VARCHAR(100)` | No necesita UUID real |
| Falta `TIMESTAMP WITH TIME ZONE` | Agregado | Best practice PostgreSQL |

## 🚀 Cómo Usar el Script Corregido

### Opción 1: Copiar en Neon Console (Recomendado)

1. Abre **Neon Console** → Tu proyecto → SQL Editor
2. Copia **todo el contenido** de `v5_enterprise_tables_FIXED.sql`
3. Pega en el editor SQL
4. Haz clic en **Run**
5. Deberías ver ✅ Si ves errores, revisa el Apéndice

### Opción 2: Ejecutar en Línea de Comandos

```bash
# Desde tu terminal, reemplaza los valores
psql -h [tu-host-neon].postgres.vercel-storage.com \
     -U [tu-usuario] \
     -d [tu-base-de-datos] \
     -f backend/scripts/migrations/v5_enterprise_tables_FIXED.sql
```

## 📊 Tablas Que Se Crearán

| Sección | Tablas | Propósito |
|---------|--------|-----------|
| **Users** | `usuarios` | Autenticación (prerequisito) |
| **Security** | `user_2fa`, `user_sessions`, `password_history`, `security_threats` | Seguridad avanzada |
| **Collaboration** | `collaboration_rooms`, `room_participants`, `chat_messages`, `collaborative_documents` | Trabajo colaborativo |
| **Audit** | `audit_logs` | Registro de acciones |
| **GDPR** | `gdpr_requests`, `gdpr_consents` | Cumplimiento regulatorio |
| **Backup** | `backup_history` | Historial de backups |
| **SMS** | `sms_history`, `sms_verification_codes` | Notificaciones SMS |
| **Email** | `email_history` | Historial de emails |
| **i18n** | `custom_translations` | Traducciones personalizadas |
| **Performance** | `performance_metrics` | Métricas de rendimiento |

**Total: 15 tablas nuevas + índices optimizados**

## ⚠️ Notas Importantes

### Si la Tabla `usuarios` Ya Existe

El script usa `CREATE TABLE IF NOT EXISTS`, así que:
- ✅ No habrá error si `usuarios` ya existe
- ✅ Las nuevas tablas se crearán igualmente
- ✅ Es seguro ejecutar múltiples veces

### Datos Existentes

- `usuarios` existente: **Se preservan completamente**
- No se eliminan tablas
- No se modifican datos

### Performance

- Se crean **15 índices** para optimizar queries
- Cada tabla tiene índices en las columnas más consultadas
- Constraints para integridad referencial

## 🔧 Troubleshooting

### Error: "relation usuarios already exists"

**Solución:** Ignora, es normal. El script crea las otras tablas exitosamente.

### Error: "user_id does NOT match type integer"

**Causa:** Tus datos en `usuarios` usan otro tipo de ID
**Solución:** Usa `v5_enterprise_tables.sql` original (sin FIXED)

### Error: "permission denied for schema public"

**Solución:** Tu usuario Neon no tiene permisos. Usa el usuario default del proyecto.

## 📁 Archivos Relacionados

- `v5_enterprise_tables.sql` - Versión original (requiere usuarios previo)
- `v5_enterprise_tables_FIXED.sql` - **Usa esta** (crea usuarios)
- `v5_enterprise_tables_MINIMAL.sql` - Solo tablas críticas (si necesitas)

## ✨ Validación Post-Ejecución

Después de ejecutar, verifica que las tablas existan:

```sql
-- Listar todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%user_%' OR table_name LIKE '%audit_%' OR table_name LIKE '%gdpr_%'
ORDER BY table_name;
```

Deberías ver:
- ✅ `usuarios`
- ✅ `user_2fa`
- ✅ `user_sessions`
- ✅ `password_history`
- ✅ `security_threats`
- ✅ `audit_logs`
- ✅ `gdpr_requests`
- ✅ `gdpr_consents`
- ✅ Y más...

## 📞 Soporte

Si aún tienes errores:

1. Copia el **error exacto** que ves
2. Verifica que estés en la **base de datos correcta**
3. Asegúrate de tener **permisos de DDL** (CREATE TABLE)
4. Prueba ejecutando solo la sección de `usuarios` primero

---

**Versión:** v5_enterprise_tables_FIXED v1.0
**Última actualización:** 2025-12-07
**Compatible con:** PostgreSQL 12+, Neon, Vercel Postgres, Supabase
