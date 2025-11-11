# 📅 CONFIGURACIÓN DE BACKUPS AUTOMÁTICOS

Guía completa para configurar backups diarios automatizados en Windows.

---

## 🚀 Opción 1: Configuración Automática (Recomendada)

### Paso 1: Abrir PowerShell como Administrador

1. Presiona `Win + X`
2. Selecciona **"Windows PowerShell (Administrador)"** o **"Terminal (Administrador)"**
3. Si aparece un cuadro de control de cuentas, haz clic en **"Sí"**

### Paso 2: Navegar al directorio de scripts

```powershell
cd "C:\03 BachilleratoHeroesWeb\backend\scripts"
```

### Paso 3: Permitir ejecución de scripts (si es necesario)

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Paso 4: Ejecutar el script de configuración

```powershell
.\setup-scheduled-backup.ps1
```

### Paso 5: Seguir las instrucciones en pantalla

El script automáticamente:
- ✅ Creará una tarea programada llamada **"BGE_Backup_Diario"**
- ✅ Configurará ejecución diaria a las **2:00 AM**
- ✅ Configurará backup de base de datos y archivos
- ✅ Te permitirá ejecutar una prueba inmediata

---

## 🔧 Opción 2: Configuración Manual

### Paso 1: Abrir el Programador de Tareas

1. Presiona `Win + R`
2. Escribe `taskschd.msc`
3. Presiona Enter

### Paso 2: Crear nueva tarea

1. En el panel derecho, haz clic en **"Crear tarea..."**
2. En la pestaña **"General"**:
   - Nombre: `BGE_Backup_Diario`
   - Descripción: `Backup automático diario de base de datos y archivos`
   - Selecciona **"Ejecutar tanto si el usuario inició sesión como si no"**
   - Marca **"Ejecutar con los privilegios más altos"**

### Paso 3: Configurar desencadenador (Trigger)

1. Ve a la pestaña **"Desencadenadores"**
2. Haz clic en **"Nuevo..."**
3. Configuración:
   - Iniciar la tarea: **Según una programación**
   - Configuración: **Diariamente**
   - Hora: **02:00:00** (2:00 AM)
   - Repetir cada: (dejar en blanco)
4. Haz clic en **"Aceptar"**

### Paso 4: Configurar acción

1. Ve a la pestaña **"Acciones"**
2. Haz clic en **"Nueva..."**
3. Configuración:
   - Acción: **Iniciar un programa**
   - Programa/script: `cmd.exe`
   - Agregar argumentos: `/c "C:\03 BachilleratoHeroesWeb\backend\scripts\run-daily-backup.bat"`
   - Iniciar en: `C:\03 BachilleratoHeroesWeb`
4. Haz clic en **"Aceptar"**

### Paso 5: Configurar opciones

1. Ve a la pestaña **"Configuración"**
2. Marca:
   - ✅ **Permitir que se ejecute la tarea a petición**
   - ✅ **Ejecutar la tarea lo antes posible después de un inicio programado perdido**
   - ✅ **Si la tarea falla, reiniciar cada: 1 minuto**
3. Haz clic en **"Aceptar"**

---

## ✅ Verificación de la Configuración

### Verificar que la tarea existe

```powershell
Get-ScheduledTask -TaskName "BGE_Backup_Diario"
```

### Ejecutar backup manualmente (prueba)

```powershell
Start-ScheduledTask -TaskName "BGE_Backup_Diario"
```

### Ver estado de la última ejecución

```powershell
Get-ScheduledTask -TaskName "BGE_Backup_Diario" | Get-ScheduledTaskInfo
```

### Ver logs de backups

```cmd
type "C:\03 BachilleratoHeroesWeb\backup-history.log"
```

---

## 📂 Ubicación de los Backups

Los backups se guardan automáticamente en:

- **Base de Datos (SQL)**: `C:\03 BachilleratoHeroesWeb\backups\database-sql\`
- **Archivos (ZIP)**: `C:\03 BachilleratoHeroesWeb\backups\files\`

### Política de Retención

- **Backups Diarios**: Se mantienen por **7 días**
- **Backups Semanales**: Se mantienen por **30 días**
- **Backups Mensuales**: Se mantienen por **90 días**

Los backups antiguos se eliminan automáticamente.

---

## 🔄 Restauración de Backups

### Listar backups disponibles

```cmd
node backend\scripts\restore-backup.js --list
```

### Restaurar base de datos

```cmd
node backend\scripts\restore-backup.js --database backup-sql-2025-10-19T01-43-36-880Z.sql
```

### Restaurar archivos

```cmd
node backend\scripts\restore-backup.js --files files-backup-2025-10-19T01-42-40-807Z.zip
```

### Restaurar backups más recientes

```cmd
node backend\scripts\restore-backup.js --latest
```

---

## 🛠️ Solución de Problemas

### La tarea no se ejecuta

1. Verifica que Node.js esté instalado:
   ```cmd
   node --version
   ```

2. Verifica que la tarea existe:
   ```powershell
   Get-ScheduledTask -TaskName "BGE_Backup_Diario"
   ```

3. Verifica permisos de la tarea (debe ejecutarse como SYSTEM o Administrador)

### Error "pg_dump no encontrado"

El script `backup-database-sql.js` NO requiere pg_dump. Usa SQL directo.

Si aún ves este error, ejecuta:
```cmd
node backend\scripts\backup-database-sql.js
```

### Revisar errores

```cmd
type "C:\03 BachilleratoHeroesWeb\backup-errors.log"
```

---

## 📞 Soporte

Para más información sobre backups y restauración, consulta:
- `backend/scripts/backup-database-sql.js`
- `backend/scripts/backup-files.js`
- `backend/scripts/restore-backup.js`

---

**Fecha de creación**: 19 de Octubre, 2025
**Proyecto**: Bachillerato General Estatal "Héroes de la Patria"
