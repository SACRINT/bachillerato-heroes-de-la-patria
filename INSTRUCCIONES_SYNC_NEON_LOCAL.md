# 🔄 Instrucciones: Sincronizar Neon → PostgreSQL Local

## ¿Qué Hace Este Script?

✅ **Backup completo** de tu BD de Neon
✅ **Crea BD local** si no existe
✅ **Restaura TODOS los datos** (tablas, índices, constraints, datos)
✅ **Verifica sincronización** al finalizar
✅ **Genera logs** de todo el proceso

---

## Requisitos Previos

### 1. PostgreSQL Instalado Localmente
```bash
# Verificar versión
psql --version
# Debe mostrar: psql (PostgreSQL) 18.0 (o similar)
```

Si NO está instalado:
- Descarga: https://www.postgresql.org/download/windows/
- Instala la versión 13+ (recomendado 15+)
- **Importante:** Durante la instalación, guarda la contraseña del usuario `postgres`

### 2. PostgreSQL en PATH de Windows
```bash
# Verifica que pg_dump funciona
pg_dump --version
# Debe mostrar: pg_dump (PostgreSQL) 18.0 (o similar)
```

Si dice "comando no encontrado", agrega PostgreSQL al PATH:
1. Panel de Control → Sistema → Variables de Entorno
2. Busca "Path" en variables de usuario
3. Haz clic en Editar
4. Agrega: `C:\Program Files\PostgreSQL\18\bin`
5. Reinicia PowerShell

### 3. Acceso a Neon
Tu URL de conexión está guardada en el script (ya la incluí)

---

## Ejecución del Script

### Opción A: PowerShell (Recomendado)

**Paso 1: Abre PowerShell como Administrador**
```
1. Presiona Windows + X
2. Selecciona "Windows PowerShell (Admin)" o "Terminal (Admin)"
```

**Paso 2: Navega al directorio del script**
```powershell
cd "C:\03_BachilleratoHeroesWeb\backend\scripts"
```

**Paso 3: Ejecuta el script**
```powershell
# IMPORTANTE: Si es la primera vez, puede que necesites habilitar scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Luego ejecuta:
.\sync-neon-to-local.ps1
```

**Paso 4: Espera a que termine**
- El backup puede tomar **2-5 minutos** (depende del tamaño)
- La restauración puede tomar **2-5 minutos**
- Verás mensajes de progreso en la pantalla

### Opción B: Git Bash (Alternativa)

```bash
cd C:/03_BachilleratoHeroesWeb/backend/scripts
# Convertir script para Bash
pwsh -File sync-neon-to-local.ps1
```

---

## Qué Ver Durante la Ejecución

✅ **Mensajes esperados:**
```
[23:45:30] [SUCCESS] Todas las herramientas PostgreSQL están disponibles
[23:45:35] [INFO] Haciendo backup de Neon a: C:\03_BachilleratoHeroesWeb\backups\neon_backup_2025-11-23_234535.dump
[23:45:40] [INFO] Esto puede tomar varios minutos...
[23:47:45] [SUCCESS] Backup completado exitosamente
[23:47:45] [INFO] Tamaño del backup: 45.32 MB
...
[23:50:00] [SUCCESS] Restauración completada
[23:50:05] [SUCCESS] Verificación exitosa - BD sincronizada correctamente
```

❌ **Si ves errores:**
```
❌ Error: 'pg_dump' no encontrado
Solución: Instala PostgreSQL o agrega al PATH
```

---

## Después de Ejecutar el Script

### ✅ Verificar que Funcionó

```bash
# Abre PowerShell y ejecuta:
psql -h localhost -U postgres -d bge_local -c "SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema='public';"

# Debe mostrar un número > 0 (el número de tablas)
# Ej: total_tablas: 25
```

### 🔧 Configurar tu Backend para Usar BD Local

**Archivo: `.env.local` (en raíz del proyecto)**

```env
# Antes (Neon):
DB_HOST=ep-twilight-flower-ad06bxa9-pooler.c-2.us-east-1.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_0jAz8lMRXYqW
DB_NAME=neondb
DB_PORT=5432
DB_SSL=true

# Después (Local):
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=        # (dejalo vacío si no tiene contraseña, o pon tu contraseña)
DB_NAME=bge_local
DB_PORT=5432
DB_SSL=false
```

### 📝 Actualizar `backend/config/database.js`

```javascript
// Antes (siempre Neon):
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Después (detecta automáticamente):
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bge_local',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
```

### 🚀 Reiniciar Backend

```bash
# Detén el servidor si está corriendo (Ctrl+C)
# Luego reinicia:
npm start

# Debe conectarse a BD local sin errores
```

---

## Archivos Generados

El script crea automáticamente:

```
C:\03_BachilleratoHeroesWeb\backups\
├── neon_backup_2025-11-23_234535.dump    (Archivo backup ~45 MB)
└── sync_log_2025-11-23_234535.txt        (Log de ejecución)
```

**Guarda el archivo `.dump`** - Es tu backup completo de Neon. Si algo sale mal, puedes restaurar desde aquí.

---

## Solución de Problemas

### Error: "Cannot connect to Neon"
```
Causas posibles:
1. Neon está caído (poco probable)
2. Tu IP está bloqueada (rara)
3. URL incorrecta (verificada en script)
4. Sin conexión a internet

Solución: Verifica que puedes acceder a Neon desde:
https://console.neon.tech
```

### Error: "pg_dump: command not found"
```
Causas:
- PostgreSQL no instalado
- PostgreSQL no en PATH de Windows

Solución:
1. Instala PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Selecciona todas las herramientas (pg_dump, psql, etc)
3. Reinicia PowerShell después de instalar
```

### Error: "database bge_local already exists"
```
Causas:
- Ya ejecutaste el script antes
- BD local ya tiene datos viejos

Solución:
El script automáticamente dropea y recrea la BD
Solo ejecuta de nuevo
```

### Error: "role 'postgres' does not exist"
```
Causas:
- PostgreSQL instalado pero usuario 'postgres' no creado
- SQL Server instalado en lugar de PostgreSQL

Solución:
- Crea usuario manualmente:
  psql -h localhost -d postgres -c "CREATE USER postgres SUPERUSER;"
- O reinstala PostgreSQL
```

---

## Logs y Debugging

Si algo falla, el script crea un archivo de log:

```
C:\03_BachilleratoHeroesWeb\backups\sync_log_2025-11-23_234535.txt
```

Abre este archivo y busca las líneas con `[ERROR]`:
```
[2025-11-23 23:45:30] [ERROR] Failed to backup Neon...
```

Copia el error completo y puedo ayudarte a solucionarlo.

---

## Próximos Pasos (Si Todo Funciona)

1. ✅ Verifica BD local: `psql -h localhost -U postgres -d bge_local -c "\dt"`
2. ✅ Actualiza `.env.local` apuntando a BD local
3. ✅ Actualiza `backend/config/database.js`
4. ✅ Reinicia backend: `npm start`
5. ✅ Verifica endpoints funcionen: `curl http://localhost:3000/api/health`
6. ✅ Opcional: Elimina backups antiguos en `backups/` para ahorrar espacio

---

## Script de Sincronización Continua (Opcional)

Si quieres sincronizar Neon → Local **automáticamente cada mañana**:

```powershell
# Abre Task Scheduler de Windows
# Crea tarea programada:
# - Acción: PowerShell -File C:\03_BachilleratoHeroesWeb\backend\scripts\sync-neon-to-local.ps1
# - Horario: 02:00 AM diariamente
# - Detalles: Ejecutar aunque nadie esté conectado
```

---

## Contacto

Si el script falla y no puedes resolverlo, proporciona:
1. El archivo de log completo (`sync_log_*.txt`)
2. Output de `psql --version`
3. Output de `pg_dump --version`
4. Si está instalado PostgreSQL: `dir "C:\Program Files\PostgreSQL"`

---

**Creado por:** Claude Code
**Fecha:** 23 NOV 2025
**Versión:** 1.0
**Estado:** ✅ Listo para ejecutar
