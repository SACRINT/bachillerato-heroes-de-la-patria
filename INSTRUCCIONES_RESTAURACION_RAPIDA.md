# ⚡ INSTRUCCIONES: RESTAURAR BD LOCAL DESDE NEON

**Objetivo:** Sincronizar `bge_local` con Neon en 5 minutos

**Requisito:** PostgreSQL 13+ instalado en Windows

---

## PASO 1: Verificar Backup Existente

Abre PowerShell o CMD y ejecuta:

```bash
dir C:\03_BachilleratoHeroesWeb\backups\neon_backup*.dump
```

**Esperado:** Debería mostrar un archivo como `neon_backup_20251123_094204.dump`

Si **NO existe**, ir a **PASO 5 (Alternativa)**.

---

## PASO 2: Eliminar BD Anterior (Vaciar)

```bash
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS bge_local;"
```

**Output esperado:**
```
DROP DATABASE
```

---

## PASO 3: Recrear BD Vacía

```bash
psql -h localhost -U postgres -c "CREATE DATABASE bge_local ENCODING 'UTF8';"
```

**Output esperado:**
```
CREATE DATABASE
```

---

## PASO 4: Restaurar desde Backup

Este es el paso crítico. Reemplaza `neon_backup_20251123_094204.dump` con el nombre real de tu archivo:

```bash
pg_restore -h localhost -U postgres -d bge_local --no-privileges \
  "C:\03_BachilleratoHeroesWeb\backups\neon_backup_20251123_094204.dump"
```

**⏳ Espera 2-5 minutos** mientras se restauran 65 tablas.

**Output esperado:** Sin errores (o errores no-críticos de índices)

---

## PASO 5: Verificar Restauración

Ejecuta este comando para verificar que se restauraron las tablas:

```bash
psql -h localhost -U postgres -d bge_local -c "\dt"
```

**Esperado:** Debería listar 60+ tablas (usuarios, estudiantes, docentes, etc.)

---

## ✅ CONFIRMACIÓN DE ÉXITO

Si ves algo como esto:

```
                    List of relations
 Schema |            Name            | Type  | Owner
--------+----------------------------+-------+----------
 public | achievements               | table | postgres
 public | audit_logs                 | table | postgres
 public | bolsa_trabajo              | table | postgres
 public | calificaciones             | table | postgres
 public | citas                      | table | postgres
 public | comunicados                | table | postgres
 public | consents                   | table | postgres
 public | data_breaches              | table | postgres
 public | docentes                   | table | postgres
 public | egresados                  | table | postgres
 public | estudiantes                | table | postgres
 public | eventos                    | table | postgres
 public | iacoins_achievements       | table | postgres
 public | ingresos                   | table | postgres
 public | noticias                   | table | postgres
 public | pagos_pendientes           | table | postgres
 public | suscriptores_notificaciones| table | postgres
 ... (más tablas)

(65 rows)
```

**✅ ÉXITO TOTAL** - BD local está sincronizada con Neon.

---

## ❌ SI FALLA LA RESTAURACIÓN

### Error 1: "relación no existe"
```
ERROR: relation "public.usuarios" does not exist
```

**Solución:** El archivo de backup está dañado. Ir a **PASO 5 (Alternativa)**.

---

### Error 2: "archivo no encontrado"
```
pg_restore: error: could not stat file "...\neon_backup_*.dump"
```

**Solución:** Nombre incorrecto del archivo. Ejecutar:
```bash
dir C:\03_BachilleratoHeroesWeb\backups\
```
y usar el nombre exacto en el comando.

---

### Error 3: "no se puede conectar a PostgreSQL"
```
pg_restore: [archiver] could not connect to server
```

**Solución:** PostgreSQL no está corriendo:
```bash
# Verificar estado
sc query PostgreSQL

# Iniciar si está detenido
net start PostgreSQL-x64-15
```

---

## ALTERNATIVA (Si backup no existe o está dañado)

### Opción A: Descargar DDL desde Neon y ejecutar

1. Ve a **Neon Console** → Tu proyecto → SQL Editor
2. Ejecuta query para obtener DDL:
```sql
SELECT pg_dump('neondb');
```
3. Copia el output y guárdalo en `neon_schema.sql`
4. Ejecuta localmente:
```bash
psql -h localhost -U postgres -d bge_local -f neon_schema.sql
```

---

### Opción B: Usar archivo JSON de schema

Ya tienes: `C:\03_BachilleratoHeroesWeb\frosty-night-96901888_main_neondb_2025-11-23_10-41-42.json`

Este contiene la estructura. Podrías:
1. Escribir script Python para generar CREATE TABLE statements
2. Ejecutar en PostgreSQL local
3. Datos vacíos pero estructura completa

---

## VERIFICACIÓN FINAL (5 COMANDOS)

Ejecuta estos 5 comandos para confirmar sincronización total:

```bash
# 1. Contar tablas
psql -h localhost -U postgres -d bge_local -c \
  "SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema='public';"

# 2. Contar columnas
psql -h localhost -U postgres -d bge_local -c \
  "SELECT COUNT(*) as total_columnas FROM information_schema.columns WHERE table_schema='public';"

# 3. Contar secuencias
psql -h localhost -U postgres -d bge_local -c \
  "SELECT COUNT(*) as total_sequences FROM information_schema.sequences WHERE sequence_schema='public';"

# 4. Verificar tipos ENUM
psql -h localhost -U postgres -d bge_local -c \
  "SELECT typname FROM pg_type WHERE typtype='e' ORDER BY typname;"

# 5. Verificar extensiones
psql -h localhost -U postgres -d bge_local -c \
  "SELECT extname FROM pg_extension;"
```

**Esperado:**
- Total tablas: **65** (o cercano)
- Total columnas: **814** (o cercano)
- Total sequences: **57** (o cercano)
- Tipos ENUM: `role_type`, `status_type`, `docente_status_type`, `status_academico_type`, `rarity_type`
- Extensiones: `plpgsql`, `pgcrypto` (opcional)

---

## PRÓXIMOS PASOS

Una vez restaurada:

1. **Actualizar .env.local:**
   ```env
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=(vacío si no tiene)
   DB_NAME=bge_local
   DB_PORT=5432
   DB_SSL=false
   ```

2. **Reiniciar backend:**
   ```bash
   npm start
   ```

3. **Verificar que conecta:**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 📞 TROUBLESHOOTING RÁPIDO

| Problema | Causa | Solución |
|----------|-------|----------|
| 0 tablas después de restaurar | Backup vacío o corrupto | Usar Opción B (DDL from Neon) |
| pg_restore no encuentra archivo | Nombre incorrecto | Ejecutar `dir backups/` para ver nombre exacto |
| PostgreSQL no responde | Servicio parado | `net start PostgreSQL-x64-15` |
| "permission denied" | Permisos de usuario | Ejecutar CMD como administrador |
| Archivo dump muy pequeño (<1KB) | Backup incompleto | Volver a hacer backup de Neon |

---

**Tiempo estimado:** 5-10 minutos
**Dificultad:** Baja (solo comandos copy-paste)
**Resultado:** BD local idéntica a Neon
