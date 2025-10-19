# ================================================================
# SCRIPT DE CONFIGURACION DE BACKUP AUTOMATICO
# Crea una tarea programada en Windows para ejecutar backups diarios
# Fecha: 19 de Octubre, 2025
# ================================================================

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION DE BACKUP AUTOMATICO" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Cierra esta ventana de PowerShell" -ForegroundColor Yellow
    Write-Host "2. Haz clic derecho en PowerShell" -ForegroundColor Yellow
    Write-Host "3. Selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    Write-Host "4. Ejecuta este script nuevamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Configuracion de la tarea
$taskName = "BGE_Backup_Diario"
$taskDescription = "Backup automatico diario de base de datos y archivos del sistema BGE"
$scriptPath = "C:\03 BachilleratoHeroesWeb\backend\scripts\run-daily-backup.bat"
$workingDirectory = "C:\03 BachilleratoHeroesWeb"

# Horario de ejecucion (2:00 AM todos los dias)
$triggerTime = "02:00"

Write-Host "Configuracion de la tarea programada:" -ForegroundColor Green
Write-Host "  Nombre: $taskName"
Write-Host "  Descripcion: $taskDescription"
Write-Host "  Script: $scriptPath"
Write-Host "  Horario: $triggerTime (diario)"
Write-Host ""

# Verificar que el script batch existe
if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: No se encontro el script de backup en:" -ForegroundColor Red
    Write-Host "  $scriptPath" -ForegroundColor Red
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Eliminar tarea existente si existe
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Tarea existente encontrada. Eliminando..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Tarea anterior eliminada" -ForegroundColor Green
    Write-Host ""
}

# Crear trigger (ejecutar diariamente a las 2:00 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At $triggerTime

# Crear accion (ejecutar el script batch)
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`"" -WorkingDirectory $workingDirectory

# Configuracion principal de la tarea
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Configuracion adicional
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -DontStopOnIdleEnd

# Registrar la tarea
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Description $taskDescription `
        -Trigger $trigger `
        -Action $action `
        -Principal $principal `
        -Settings $settings `
        -Force | Out-Null

    Write-Host "Tarea programada creada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "La tarea '$taskName' se ejecutara automaticamente:" -ForegroundColor Green
    Write-Host "  - Todos los dias a las $triggerTime" -ForegroundColor White
    Write-Host "  - Respaldara la base de datos y archivos" -ForegroundColor White
    Write-Host "  - Se ejecutara incluso si la PC esta en bateria" -ForegroundColor White
    Write-Host ""
    Write-Host "Para verificar la tarea:" -ForegroundColor Yellow
    Write-Host "  1. Abre 'Programador de tareas' (taskschd.msc)" -ForegroundColor White
    Write-Host "  2. Busca '$taskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "Para ejecutar la tarea manualmente:" -ForegroundColor Yellow
    Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
    Write-Host ""

    # Preguntar si desea ejecutar prueba
    $runTest = Read-Host "Deseas ejecutar una prueba de backup ahora? (S/N)"

    if ($runTest -eq "S" -or $runTest -eq "s") {
        Write-Host ""
        Write-Host "Ejecutando backup de prueba..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName $taskName
        Start-Sleep -Seconds 2
        Write-Host "Tarea iniciada. Verifica los logs en:" -ForegroundColor Green
        Write-Host "  $workingDirectory\backup-history.log" -ForegroundColor White
        Write-Host ""
    }

} catch {
    Write-Host "ERROR al crear la tarea programada:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Read-Host "Presiona Enter para salir"
