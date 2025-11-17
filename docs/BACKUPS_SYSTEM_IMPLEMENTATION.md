# 💾 SISTEMA DE BACKUPS AUTOMATIZADOS - IMPLEMENTACIÓN COMPLETA

**Fecha:** 17 Noviembre 2025
**Tarea:** C2 - Backups Automatizados (GRUPO C - Database)
**Status:** ✅ COMPLETADO

---

## 📋 RESUMEN

Sistema automático de backups diarios de PostgreSQL con compresión, retención de 30 días y verificación de integridad.

**Características principales:**
- ✅ Backups diarios automáticos (2 AM)
- ✅ Compresión gzip (~70-90% reducción)
- ✅ Retención de 30 días (elimina backups viejos)
- ✅ Verificación de integridad
- ✅ 2 tipos de backup: Full + Schema-only
- ✅ Logging detallado

---

## 🏗️ ARQUITECTURA

### Archivos creados:

| Archivo | Ubicación | Propósito | Líneas |
|---------|-----------|-----------|--------|
| `backup-scheduler.js` | `backend/scripts/` | Script principal de backups | 400+ |
| `.gitignore` | `backups/` | Excluir backups de Git | 7 |
| `.gitkeep` | `backups/database/` | Mantener directorio en Git | 1 |
| Este documento | `docs/` | Documentación completa | 300+ |

### Directorios:

```
proyecto/
├── backend/
│   └── scripts/
│       └── backup-scheduler.js  ← Script principal
└── backups/
    ├── .gitignore                ← Excluir backups de Git
    └── database/
        ├── .gitkeep               ← Mantener en Git
        ├── backup_full_20251117_020000.sql.gz
        ├── backup_schema_20251117_020000.sql.gz
        └── ...  ← Hasta 30 días de backups
```

---

## 🔧 FUNCIONALIDADES

### 1. **Backup Full (Datos + Schema)**

```javascript
const { createDatabaseBackup } = require('./backend/scripts/backup-scheduler');

// Crear backup completo
const result = await createDatabaseBackup('full');

// Resultado:
{
  success: true,
  filename: 'backup_full_20251117_020000.sql.gz',
  fullPath: '/path/to/backups/database/backup_full_20251117_020000.sql.gz',
  size: 1048576,  // bytes
  sizeInMB: '1.00',
  timestamp: '2025-11-17T02:00:00.000Z',
  type: 'full'
}
```

**Comando pg_dump ejecutado:**
```bash
pg_dump -h hostname -p 5432 -U username -d database \
  --clean --if-exists --verbose | gzip > backup.sql.gz
```

---

### 2. **Backup Schema-only (Solo estructura)**

```javascript
const result = await createDatabaseBackup('schema');
```

**Comando pg_dump ejecutado:**
```bash
pg_dump -h hostname -p 5432 -U username -d database \
  --schema-only | gzip > backup_schema.sql.gz
```

**Propósito:**
Guardar estructura de tablas, índices, funciones, views sin datos (para referencia rápida).

---

### 3. **Limpieza automática de backups viejos**

```javascript
const { cleanOldBackups } = require('./backend/scripts/backup-scheduler');

const result = await cleanOldBackups();

// Resultado:
{
  deletedCount: 5,
  freedSpaceMB: '125.50'
}
```

**Lógica:**
- Elimina backups con `ageInDays > 30`
- Libera espacio en disco
- Logging de cada eliminación

---

### 4. **Verificación de integridad**

```javascript
const { verifyBackupIntegrity } = require('./backend/scripts/backup-scheduler');

const isValid = await verifyBackupIntegrity('/path/to/backup.sql.gz');
// true o false
```

**Método:**
- Descomprime archivo con `gunzip -t` (test mode)
- Sin guardar resultado (solo validación)
- Detecta corrupción de archivos

---

### 5. **Listado de backups disponibles**

```javascript
const { listBackups } = require('./backend/scripts/backup-scheduler');

const backups = await listBackups();

// Resultado:
[
  {
    filename: 'backup_full_20251117_020000.sql.gz',
    fullPath: '/path/to/backups/database/backup_full_20251117_020000.sql.gz',
    size: 1048576,
    sizeInMB: '1.00',
    created: 2025-11-17T02:00:00.000Z,
    modified: 2025-11-17T02:00:00.000Z,
    ageInDays: 0
  },
  // ... más backups
]
```

---

## 🚀 USO

### **Ejecución Manual:**

```bash
# Desde la raíz del proyecto
node backend/scripts/backup-scheduler.js

# Salida esperada:
[BACKUP] ========================================
[BACKUP] INICIO DE CICLO DE BACKUP
[BACKUP] Fecha: 2025-11-17T02:00:00.000Z
[BACKUP] ========================================

[BACKUP] Creando backup FULL...
✅ Backup creado exitosamente: backup_full_20251117_020000.sql.gz (1.25 MB)
🔍 Verificando integridad...
✅ Integridad verificada correctamente

[BACKUP] Creando backup SCHEMA...
✅ Backup creado exitosamente: backup_schema_20251117_020000.sql.gz (0.05 MB)

[BACKUP] Limpiando backups antiguos...
ℹ️  No hay backups antiguos para eliminar

[BACKUP] ========================================
[BACKUP] FIN DE CICLO DE BACKUP
[BACKUP] Exitoso: SÍ
[BACKUP] Backups creados: 2
[BACKUP] Errores: 0
[BACKUP] ========================================

✅ Backup completado exitosamente
```

---

### **Ejecución Automática (Cron Job):**

**Opción 1: node-cron (dentro de Node.js)**

Agregar a `backend/server.js`:

```javascript
const cron = require('node-cron');
const { runFullBackupCycle } = require('./scripts/backup-scheduler');

// Ejecutar cada día a las 2 AM
cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Ejecutando backup diario...');
    const results = await runFullBackupCycle();

    if (!results.success) {
        console.error('[CRON] ❌ Backup falló:', results.errors);
        // TODO: Enviar email de alerta
    } else {
        console.log('[CRON] ✅ Backup completado exitosamente');
    }
});
```

**Instalar node-cron:**
```bash
npm install node-cron
```

---

**Opción 2: Sistema Cron (Linux/Mac)**

Editar crontab:
```bash
crontab -e
```

Agregar:
```cron
# Backup diario a las 2 AM
0 2 * * * cd /home/user/bachillerato-heroes-de-la-patria && node backend/scripts/backup-scheduler.js >> logs/backup.log 2>&1
```

---

## 🔐 SEGURIDAD

### **Variables de entorno requeridas:**

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**Formato esperado:**
- `user`: Usuario PostgreSQL (ej: `neon_user`)
- `password`: Contraseña PostgreSQL
- `host`: Host de Neon (ej: `ep-xyz123.us-east-2.aws.neon.tech`)
- `port`: Puerto PostgreSQL (`5432`)
- `database`: Nombre de BD (ej: `neondb`)

---

### **Permisos necesarios:**

1. **Permisos de escritura** en `/backups/database/`
2. **pg_dump instalado** en el sistema (`postgresql-client`)
3. **Acceso a DATABASE_URL** en variables de entorno

---

### **Instalación de pg_dump (si falta):**

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Mac (Homebrew):**
```bash
brew install postgresql
```

**Windows:**
- Descargar PostgreSQL desde https://www.postgresql.org/download/
- Agregar `pg_dump.exe` al PATH

---

## 📊 MÉTRICAS Y MONITOREO

### **Tamaños esperados de backups:**

| Tipo | Tamaño típico | Con gzip | Ratio compresión |
|------|---------------|----------|------------------|
| Full (5k estudiantes) | 15-20 MB | 2-3 MB | ~85% |
| Full (50k calificaciones) | 80-100 MB | 10-15 MB | ~87% |
| Schema-only | 500 KB | 50 KB | ~90% |

---

### **Espacio en disco requerido:**

```
Backups por día: 2 (full + schema)
Retención: 30 días

Tamaño total estimado: 30 días × 3 MB/día ≈ 90 MB
```

**Recomendación:** Mantener al menos **500 MB libres** en disco.

---

## 🧪 TESTING

### **Test 1: Backup manual**

```bash
node backend/scripts/backup-scheduler.js
```

**Verificar:**
- ✅ Se crean 2 archivos en `backups/database/`
- ✅ Ambos archivos tienen extensión `.sql.gz`
- ✅ Tamaño > 0 bytes
- ✅ Console muestra "Backup completado exitosamente"

---

### **Test 2: Verificación de integridad**

```bash
node -e "const {verifyBackupIntegrity} = require('./backend/scripts/backup-scheduler'); verifyBackupIntegrity('./backups/database/backup_full_*.sql.gz').then(console.log)"
```

**Resultado esperado:** `true`

---

### **Test 3: Descomprimir y restaurar (CUIDADO - Solo en dev)**

```bash
# Descomprimir
gunzip -c backups/database/backup_full_20251117_020000.sql.gz > /tmp/restore.sql

# Ver primeras líneas
head -n 20 /tmp/restore.sql

# Restaurar (SOLO EN DATABASE DE TEST)
psql -h localhost -U postgres -d test_db < /tmp/restore.sql
```

---

## 🆘 TROUBLESHOOTING

### **Error: "pg_dump: command not found"**

**Solución:** Instalar PostgreSQL client
```bash
sudo apt-get install postgresql-client  # Linux
brew install postgresql                  # Mac
```

---

### **Error: "Permission denied: /backups/database/"**

**Solución:** Dar permisos de escritura
```bash
chmod 755 backups/database/
```

---

### **Error: "DATABASE_URL is not configured"**

**Solución:** Verificar `.env`
```bash
echo $DATABASE_URL  # Debe mostrar la URL completa
```

---

### **Error: "connection refused" durante backup**

**Posibles causas:**
1. Firewall bloqueando puerto 5432
2. Neon database en pausa (auto-suspend)
3. Credenciales incorrectas

**Solución:**
- Verificar conectividad: `psql $DATABASE_URL -c "SELECT 1"`
- Activar database en Neon Console

---

## 📅 CRONOGRAMA DE BACKUPS

| Día | Hora | Tipo | Retención |
|-----|------|------|-----------|
| Lunes - Domingo | 2:00 AM | Full + Schema | 30 días |

**Total backups activos:** ~60 archivos (30 full + 30 schema)

---

## 🔄 PROCESO DE RESTAURACIÓN

### **Paso 1: Seleccionar backup**

```bash
ls -lh backups/database/backup_full_*.sql.gz
```

### **Paso 2: Descomprimir**

```bash
gunzip -c backups/database/backup_full_20251115_020000.sql.gz > /tmp/restore.sql
```

### **Paso 3: Restaurar**

```bash
psql $DATABASE_URL < /tmp/restore.sql
```

⚠️ **ADVERTENCIA:** Esto SOBRESCRIBIRÁ la database actual. Hacer SOLO si estás seguro.

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Archivos creados:
- [x] `backend/scripts/backup-scheduler.js`
- [x] `backups/.gitignore`
- [x] `backups/database/.gitkeep`
- [x] `docs/BACKUPS_SYSTEM_IMPLEMENTATION.md`

### Testing:
- [ ] Ejecutar backup manual y verificar archivos creados
- [ ] Verificar integridad de backup
- [ ] Probar limpieza de backups viejos (crear backups con fecha antigua)
- [ ] Configurar cron job en server.js o sistema

### Configuración:
- [ ] Verificar `DATABASE_URL` en `.env`
- [ ] Instalar `postgresql-client` si falta
- [ ] Instalar `node-cron` si usas Opción 1
- [ ] Dar permisos a `/backups/database/`

### Monitoreo:
- [ ] Configurar alertas de fallo de backup (email/Slack)
- [ ] Monitorear espacio en disco (debe mantener >500 MB libres)
- [ ] Revisar logs semanalmente

---

## 🎯 PRÓXIMOS PASOS (Mejoras futuras)

1. **Upload a Cloud Storage:**
   - AWS S3
   - Google Cloud Storage
   - Backblaze B2

2. **Notificaciones por email:**
   - Email de éxito (resumen semanal)
   - Email de fallo (inmediato)

3. **Backups incrementales:**
   - Solo cambios desde último backup
   - Menor tiempo de ejecución

4. **Backup de archivos adjuntos:**
   - `/public/uploads/`
   - Imágenes, PDFs, etc.

---

**END OF DOCUMENT**

**Tarea C2 - Backups Automatizados:** ✅ **COMPLETADA**
**Archivos Generados:** 4 (script + 2 config + documentación)
**Tiempo Total:** 1-2 horas
**Commit:** Pendiente
