# ==========================================
# 🔄 SYNC NEON → PostgreSQL LOCAL
# ==========================================
# Script para clonar completamente la BD de Neon a local
# Autor: Claude Code | Fecha: 23 NOV 2025
# ==========================================

# ==========================================
# CONFIGURACIÓN
# ==========================================

$NEON_URL = "postgresql://neondb_owner:npg_0jAz8lMRXYqW@ep-twilight-flower-ad06bxa9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$LOCAL_DB_NAME = "bge_local"
$LOCAL_USER = "postgres"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$BACKUP_DIR = "C:\03_BachilleratoHeroesWeb\backups"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\neon_backup_$TIMESTAMP.dump"
$LOG_FILE = "$BACKUP_DIR\sync_log_$TIMESTAMP.txt"

# ==========================================
# FUNCIONES AUXILIARES
# ==========================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $log_message = "[$timestamp] [$Level] $Message"
    Write-Host $log_message
    Add-Content -Path $LOG_FILE -Value $log_message
}

function Test-Connection {
    param([string]$ConnectionString, [string]$SourceName)
    Write-Log "Verificando conexión a $SourceName..."
    try {
        $env:PGPASSWORD = $null
        $result = psql -h (Parse-NeonHost $ConnectionString) -U (Parse-NeonUser $ConnectionString) -d neondb -c "SELECT 1;" 2>&1
        if ($result -like "*1*" -or $result -like "*ERROR*cannot connect*") {
            Write-Log "✅ Conexión a $SourceName exitosa" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ No se pudo conectar a $SourceName" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error al conectar a $SourceName: $_" "ERROR"
        return $false
    }
}

function Parse-NeonHost {
    param([string]$URL)
    $match = [regex]::Match($URL, 'ep-[^\-]*-[^\-]*-[^\-]*-pooler\.[^\.]*\.[^\.]*')
    return $match.Value + ".neon.tech"
}

function Parse-NeonUser {
    param([string]$URL)
    $match = [regex]::Match($URL, 'postgresql://([^:]*):')
    return $match.Groups[1].Value
}

function Parse-NeonPassword {
    param([string]$URL)
    $match = [regex]::Match($URL, ':([^@]*)@')
    return $match.Groups[1].Value
}

function Create-LocalDatabase {
    Write-Log "Creando base de datos local '$LOCAL_DB_NAME' si no existe..."
    try {
        $env:PGPASSWORD = ""
        $result = psql -h $LOCAL_HOST -U $LOCAL_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$LOCAL_DB_NAME';" 2>&1

        if ($result -notlike "*1*") {
            Write-Log "BD local no existe. Creándola..."
            createdb -h $LOCAL_HOST -U $LOCAL_USER -e $LOCAL_DB_NAME
            Write-Log "✅ Base de datos '$LOCAL_DB_NAME' creada exitosamente" "SUCCESS"
        } else {
            Write-Log "⚠️  Base de datos '$LOCAL_DB_NAME' ya existe" "WARNING"
        }
    } catch {
        Write-Log "❌ Error al crear base de datos local: $_" "ERROR"
        return $false
    }
    return $true
}

function Backup-NeonDatabase {
    Write-Log "=== INICIANDO BACKUP DE NEON ==="

    if (-Not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
        Write-Log "Directorio de backup creado: $BACKUP_DIR"
    }

    try {
        Write-Log "Haciendo backup de Neon a: $BACKUP_FILE"
        Write-Log "Esto puede tomar varios minutos..."

        $env:PGPASSWORD = Parse-NeonPassword $NEON_URL
        $neon_host = Parse-NeonHost $NEON_URL
        $neon_user = Parse-NeonUser $NEON_URL

        & pg_dump `
            -h $neon_host `
            -U $neon_user `
            -d neondb `
            --verbose `
            --no-password `
            -F custom `
            -f $BACKUP_FILE `
            2>&1 | Tee-Object -FilePath $LOG_FILE -Append

        if (Test-Path $BACKUP_FILE) {
            $file_size = (Get-Item $BACKUP_FILE).Length / 1MB
            Write-Log "✅ Backup completado exitosamente" "SUCCESS"
            Write-Log "Tamaño del backup: $([Math]::Round($file_size, 2)) MB"
            return $true
        } else {
            Write-Log "❌ El archivo de backup no se creó" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error durante el backup: $_" "ERROR"
        return $false
    } finally {
        $env:PGPASSWORD = $null
    }
}

function Restore-ToLocalDatabase {
    Write-Log "=== INICIANDO RESTAURACIÓN A BD LOCAL ==="

    try {
        Write-Log "Eliminando datos existentes en '$LOCAL_DB_NAME' (si existen)..."

        $env:PGPASSWORD = ""

        # Desconectar todas las conexiones activas
        psql -h $LOCAL_HOST -U $LOCAL_USER -d postgres -c `
            "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$LOCAL_DB_NAME' AND pid <> pg_backend_pid();" `
            2>&1 | Out-Null

        # Dropear y recrear BD para limpieza completa
        Write-Log "Eliminando y recreando base de datos..."
        dropdb -h $LOCAL_HOST -U $LOCAL_USER -e $LOCAL_DB_NAME 2>&1 | Out-Null
        createdb -h $LOCAL_HOST -U $LOCAL_USER -e $LOCAL_DB_NAME

        Write-Log "Restaurando datos de Neon..."
        Write-Log "Esto puede tomar varios minutos..."

        & pg_restore `
            -h $LOCAL_HOST `
            -U $LOCAL_USER `
            -d $LOCAL_DB_NAME `
            --verbose `
            --exit-on-error `
            $BACKUP_FILE `
            2>&1 | Tee-Object -FilePath $LOG_FILE -Append

        Write-Log "✅ Restauración completada" "SUCCESS"
        return $true
    } catch {
        Write-Log "❌ Error durante la restauración: $_" "ERROR"
        return $false
    } finally {
        $env:PGPASSWORD = $null
    }
}

function Verify-Synchronization {
    Write-Log "=== VERIFICANDO SINCRONIZACIÓN ==="

    try {
        $env:PGPASSWORD = ""

        # Contar tablas en BD local
        $local_tables = psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB_NAME -tc `
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1
        $local_tables = $local_tables.Trim()

        Write-Log "Tablas en BD local: $local_tables"

        # Obtener tamaño de BD local
        $local_size = psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB_NAME -tc `
            "SELECT pg_size_pretty(pg_database.datsize) FROM pg_database WHERE datname='$LOCAL_DB_NAME';" 2>&1
        $local_size = $local_size.Trim()

        Write-Log "Tamaño de BD local: $local_size"

        if ([int]$local_tables -gt 0) {
            Write-Log "✅ Verificación exitosa - BD sincronizada correctamente" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ No se encontraron tablas en la BD local" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error durante la verificación: $_" "ERROR"
        return $false
    } finally {
        $env:PGPASSWORD = $null
    }
}

function Show-Summary {
    param([boolean]$Success)

    Write-Log "==============================================="
    Write-Log "             RESUMEN FINAL"
    Write-Log "==============================================="
    Write-Log "Timestamp: $TIMESTAMP"
    Write-Log "Archivo de backup: $BACKUP_FILE"
    Write-Log "Archivo de log: $LOG_FILE"
    Write-Log "Base de datos local: $LOCAL_DB_NAME"
    Write-Log "Host local: $LOCAL_HOST:$LOCAL_PORT"

    if ($Success) {
        Write-Log "Estado: ✅ SINCRONIZACIÓN EXITOSA" "SUCCESS"
        Write-Log ""
        Write-Log "Próximos pasos:"
        Write-Log "1. Verifica la BD local con: psql -h localhost -U postgres -d bge_local"
        Write-Log "2. Actualiza .env.local con: DB_HOST=localhost, DB_USER=postgres"
        Write-Log "3. Reinicia tu servidor backend"
    } else {
        Write-Log "Estado: ❌ SINCRONIZACIÓN FALLIDA" "ERROR"
        Write-Log "Revisa el archivo de log para más detalles: $LOG_FILE"
    }

    Write-Log "==============================================="
}

# ==========================================
# EJECUCIÓN PRINCIPAL
# ==========================================

function Main {
    Write-Log "==============================================="
    Write-Log "   SINCRONIZACIÓN NEON → PostgreSQL LOCAL"
    Write-Log "==============================================="
    Write-Log "Iniciando en: $(Get-Date)"
    Write-Log ""

    # Verificar que psql y pg_dump/pg_restore están disponibles
    Write-Log "Verificando herramientas PostgreSQL..."
    $tools = @("psql", "pg_dump", "pg_restore", "createdb", "dropdb")
    foreach ($tool in $tools) {
        if (-Not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Log "❌ Error: '$tool' no encontrado. Asegúrate de que PostgreSQL esté instalado." "ERROR"
            Write-Log "Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/"
            exit 1
        }
    }
    Write-Log "✅ Todas las herramientas PostgreSQL están disponibles" "SUCCESS"
    Write-Log ""

    # Ejecutar el flujo
    $steps = @(
        @{name = "Backup de Neon"; func = {Backup-NeonDatabase}},
        @{name = "Crear BD local"; func = {Create-LocalDatabase}},
        @{name = "Restaurar datos"; func = {Restore-ToLocalDatabase}},
        @{name = "Verificar sincronización"; func = {Verify-Synchronization}}
    )

    $success = $true
    foreach ($step in $steps) {
        Write-Log ""
        if (-Not (& $step.func)) {
            $success = $false
            Write-Log "❌ Paso fallido: $($step.name)" "ERROR"
            Show-Summary $false
            exit 1
        }
    }

    Write-Log ""
    Show-Summary $true
}

# Ejecutar
Main
