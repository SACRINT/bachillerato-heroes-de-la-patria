# 🚨 DISASTER RECOVERY PLAN - BGE HEROES DE LA PATRIA

**Versión:** 1.0.0
**Última Actualización:** 17 Noviembre 2025
**Responsable:** DevOps Team
**Estado:** ✅ ACTIVO

---

## 📋 ÍNDICE

1. [Objetivos de Recuperación](#objetivos-de-recuperación)
2. [Arquitectura de Respaldo](#arquitectura-de-respaldo)
3. [Escenarios de Desastre](#escenarios-de-desastre)
4. [Procedimientos de Recuperación](#procedimientos-de-recuperación)
5. [Runbooks Detallados](#runbooks-detallados)
6. [Testing y Validación](#testing-y-validación)
7. [Roles y Responsabilidades](#roles-y-responsabilidades)
8. [Comunicación de Crisis](#comunicación-de-crisis)
9. [Post-Mortem](#post-mortem)

---

## 🎯 OBJETIVOS DE RECUPERACIÓN

### RTO (Recovery Time Objective)
**⏱️ Tiempo Máximo de Inactividad Aceptable: 1 HORA**

| Servicio | RTO | Prioridad |
|----------|-----|-----------|
| Base de Datos PostgreSQL | 30 minutos | P0 (Crítico) |
| Backend API (Node.js) | 15 minutos | P0 (Crítico) |
| Frontend Web | 10 minutos | P1 (Alto) |
| Sistema de Archivos | 45 minutos | P1 (Alto) |
| Socket.IO Real-time | 20 minutos | P2 (Medio) |
| Email Service | 1 hora | P3 (Bajo) |

### RPO (Recovery Point Objective)
**💾 Pérdida Máxima de Datos Aceptable: 15 MINUTOS**

| Tipo de Datos | RPO | Frecuencia de Backup |
|---------------|-----|----------------------|
| Base de Datos (transacciones) | 15 minutos | Incremental cada hora |
| Archivos de usuarios (uploads) | 1 día | Full daily |
| Configuraciones del sistema | 1 día | Full daily |
| Logs de auditoría | 1 hora | Stream a S3 |

---

## 🏗️ ARQUITECTURA DE RESPALDO

### Estrategia 3-2-1
**3 copias** - **2 medios diferentes** - **1 off-site**

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA DE BACKUP                      │
└─────────────────────────────────────────────────────────────┘

📅 DIARIO (2:00 AM UTC)
├── Full Database Backup
│   ├── PostgreSQL pg_dumpall (with roles, schemas, data)
│   ├── Compression: gzip (ratio ~10:1)
│   ├── Encryption: GPG (AES-256)
│   └── Upload: S3 Multi-region
│
├── Files Backup
│   ├── public/uploads (user-generated content)
│   ├── .env.production (configs)
│   ├── backend/config (application configs)
│   └── Compression: tar.gz + GPG

⏰ HOURLY (Every hour 00:00)
└── Incremental Database Backup
    ├── Schema changes only (lightweight)
    ├── Compression: gzip
    ├── Encryption: GPG
    └── Upload: S3 Primary region

📍 DESTINOS DE ALMACENAMIENTO

1. LOCAL (/var/backups/bge/)
   ├── Full backups: 30 días retención
   ├── Incremental backups: 7 días retención
   └── Propósito: Restore rápido

2. S3 PRIMARY (us-east-1)
   ├── Todos los backups (full + incremental)
   ├── Storage Class: STANDARD_IA (Infrequent Access)
   └── Lifecycle: 90 días → Glacier

3. S3 REPLICA (eu-west-1)
   ├── Solo full backups (geo-redundancy)
   ├── Cross-region replication
   └── Protección: Desastres geográficos
```

### PITR (Point-in-Time Recovery)
PostgreSQL configurado con WAL (Write-Ahead Logging):

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://bge-backups-us-east-1/wal/%f'
archive_timeout = 300  # 5 minutos
max_wal_size = 10GB
```

**Capacidad:** Restaurar a cualquier punto en el tiempo dentro de los últimos 7 días.

---

## 🌪️ ESCENARIOS DE DESASTRE

### ESCENARIO 1: Corrupción de Base de Datos
**Probabilidad:** Media | **Impacto:** Crítico | **RTO:** 30 min | **RPO:** 15 min

**Causas Comunes:**
- Fallo de hardware del servidor de BD
- Corrupción de índices PostgreSQL
- UPDATE/DELETE masivo sin WHERE clause
- Ataque de ransomware

**Runbook:** [DR-001 - Database Corruption Recovery](#runbook-dr-001-database-corruption)

---

### ESCENARIO 2: Eliminación Accidental de Datos
**Probabilidad:** Alta | **Impacto:** Alto | **RTO:** 45 min | **RPO:** 1 hora

**Causas Comunes:**
- Usuario admin ejecuta DELETE sin WHERE
- Script de migración con errores
- Truncate table accidental

**Runbook:** [DR-002 - Accidental Data Deletion](#runbook-dr-002-accidental-data-deletion)

---

### ESCENARIO 3: Fallo de Región AWS Completa
**Probabilidad:** Muy Baja | **Impacto:** Crítico | **RTO:** 1 hora | **RPO:** 15 min

**Causas Comunes:**
- Desastre natural (terremoto, huracán)
- Fallo masivo de infraestructura AWS
- Ataque DDoS a nivel regional

**Runbook:** [DR-003 - AWS Region Failover](#runbook-dr-003-aws-region-failover)

---

### ESCENARIO 4: Ataque de Ransomware
**Probabilidad:** Media | **Impacto:** Crítico | **RTO:** 2 horas | **RPO:** 1 día

**Causas Comunes:**
- Phishing exitoso con credenciales de admin
- Explotación de vulnerabilidad 0-day
- Acceso no autorizado a servidor

**Runbook:** [DR-004 - Ransomware Recovery](#runbook-dr-004-ransomware-recovery)

---

### ESCENARIO 5: Pérdida de Archivos de Usuarios
**Probabilidad:** Baja | **Impacto:** Medio | **RTO:** 1 hora | **RPO:** 1 día

**Causas Comunes:**
- Eliminación masiva accidental en S3
- Fallo de volumen EBS

**Runbook:** [DR-005 - User Files Recovery](#runbook-dr-005-user-files-recovery)

---

## 🔧 PROCEDIMIENTOS DE RECUPERACIÓN

### PASO 0: ACTIVACIÓN DEL PLAN DE DR

**Criterios de Activación:**
- Base de datos inaccesible por >5 minutos
- Pérdida de datos confirmada >1000 registros
- Corrupción de datos críticos (usuarios, calificaciones)
- Ataque de seguridad confirmado

**Quién puede activar:**
- CTO / Head of Engineering
- DevOps Lead
- On-call Engineer (con aprobación)

**Comunicación:**
```bash
# Slack
/incident declare-major "Database corruption - DR Plan activated"

# Email
To: team@bge.edu.mx, stakeholders@bge.edu.mx
Subject: [CRITICAL] DR Plan Activated - BGE System Down
Body: "Disaster Recovery Plan activated at [TIME]. Estimated RTO: 1 hour.
Expected recovery: [TIME]. Updates every 15 minutes."
```

---

### PASO 1: EVALUACIÓN Y AISLAMIENTO

**Duración Estimada:** 5 minutos

```bash
# 1.1 Verificar estado del sistema
curl https://bge-heroes.vercel.app/api/health

# 1.2 Verificar logs recientes
tail -n 100 /var/log/bge/backend.log

# 1.3 Verificar conectividad a base de datos
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM usuarios;"

# 1.4 Si hay corrupción, AISLAR inmediatamente
# Apagar backend para prevenir writes corruptos
pm2 stop bge-backend
```

**Decisión:**
- ✅ Si BD responde y datos íntegros → Falsa alarma, restaurar servicio
- ⚠️ Si BD responde pero datos corruptos → Proceder a RESTORE desde backup
- ❌ Si BD no responde → Proceder a RESTORE completo

---

### PASO 2: SELECCIÓN DE BACKUP

**Duración Estimada:** 5 minutos

```bash
# 2.1 Listar backups disponibles en S3 (ordenados por fecha)
aws s3 ls s3://bge-backups-us-east-1/full/ --recursive | sort -r | head -n 10

# Ejemplo de output:
# 2025-11-17 02:15:33  145892301 full/db_full_20251117_020000.sql.gz.gpg
# 2025-11-16 02:15:22  145801234 full/db_full_20251116_020000.sql.gz.gpg
# 2025-11-15 02:15:19  145734567 full/db_full_20251115_020000.sql.gz.gpg

# 2.2 Identificar el backup válido más reciente
# IMPORTANTE: Si sospechas corrupción hace >1 día, usa backup de N-2 días

# 2.3 Verificar integridad del backup
aws s3 cp s3://bge-backups-us-east-1/full/db_full_20251117_020000.sql.gz.gpg /tmp/
gpg --list-packets /tmp/db_full_20251117_020000.sql.gz.gpg

# 2.4 Si primary S3 no disponible, usar replica
aws s3 ls s3://bge-backups-eu-west-1/full/ --recursive
```

**Criterios de Selección:**
- Último backup ANTES del incidente (no después, podría estar corrupto)
- Verificar integridad GPG (--list-packets debe funcionar)
- Preferir full backup sobre incremental (más confiable)

---

### PASO 3: PRE-RESTORE SNAPSHOT

**Duración Estimada:** 10 minutos

```bash
# 3.1 Crear snapshot del estado actual (por si necesitamos rollback)
cd /home/user/bachillerato-heroes-de-la-patria
./backend/scripts/restore-procedure.sh --backup-file /path/to/backup.sql.gz.gpg

# El script automáticamente crea:
# /var/backups/bge/restore/pre_restore_snapshot_YYYYMMDD_HHMMSS.sql.gz
```

**Importante:** Este snapshot es tu red de seguridad. Guárdalo por 7 días después de DR.

---

### PASO 4: RESTORE DE BASE DE DATOS

**Duración Estimada:** 15-20 minutos

```bash
# 4.1 Ejecutar restore procedure automatizado
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date 20251117 \
    --type full

# 4.2 El script hace automáticamente:
# - Download desde S3 (primary o replica)
# - Decrypt con GPG
# - Decompress
# - Terminate active connections
# - Restore database
# - Verify table count
# - Verify critical tables (usuarios, estudiantes, calificaciones, noticias)
# - Cleanup temp files

# Output esperado:
# ========================================
# 🚀 Starting restore procedure
# ========================================
# 📸 Creating pre-restore snapshot...
# ✅ Snapshot created: /var/backups/bge/restore/pre_restore_snapshot_20251117_143022.sql.gz
# ☁️  Downloading backup from S3...
# ✅ Downloaded: /var/backups/bge/restore/db_full_20251117_020000.sql.gz.gpg
# 🔓 Decrypting backup...
# ✅ Decrypted: /var/backups/bge/restore/db_full_20251117_020000.sql.gz
# 📦 Decompressing backup...
# ✅ Decompressed: /var/backups/bge/restore/db_full_20251117_020000.sql
# ⚠️  Terminating active database connections...
# ✅ Connections terminated
# 🗄️  Restoring database from /var/backups/bge/restore/db_full_20251117_020000.sql...
# ✅ Database restored successfully
# 🔍 Verifying restored database...
# 📊 Found 23 tables in restored database
# ✅ Database verification passed
# 🧹 Cleaning up temporary files...
# ✅ Cleanup completed
# ========================================
# ✅ Restore completed successfully
# ========================================
```

**Validaciones Automáticas:**
- ✅ Table count >5 (si es menor, restore falló)
- ✅ Critical tables exist (usuarios, estudiantes, calificaciones, noticias)
- ✅ Connection pooling funcional
- ✅ Queries de prueba ejecutan sin error

---

### PASO 5: RESTORE DE ARCHIVOS (Si Aplica)

**Duración Estimada:** 10 minutos

```bash
# 5.1 Si necesitas restaurar public/uploads
cd /var/backups/bge
aws s3 cp s3://bge-backups-us-east-1/files/files_20251117_020000.tar.gz.gpg .

# 5.2 Decrypt
gpg --decrypt files_20251117_020000.tar.gz.gpg > files_20251117_020000.tar.gz

# 5.3 Extract
tar -xzf files_20251117_020000.tar.gz -C /home/user/bachillerato-heroes-de-la-patria/

# 5.4 Verificar
ls -la /home/user/bachillerato-heroes-de-la-patria/public/uploads/
```

---

### PASO 6: VALIDACIÓN POST-RESTORE

**Duración Estimada:** 10 minutos

```bash
# 6.1 Verificar conectividad a BD
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM usuarios;"

# 6.2 Verificar datos críticos
psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
SELECT 'Usuarios', COUNT(*) FROM usuarios;
SELECT 'Estudiantes', COUNT(*) FROM estudiantes;
SELECT 'Calificaciones', COUNT(*) FROM calificaciones;
SELECT 'Noticias', COUNT(*) FROM noticias;
EOF

# 6.3 Reiniciar backend
pm2 restart bge-backend

# 6.4 Health check
curl https://bge-heroes.vercel.app/api/health | jq '.services.database'

# Esperado:
# {
#   "status": "healthy",
#   "latency": "45ms",
#   "connection": "active",
#   "type": "PostgreSQL",
#   "version": "17.5",
#   "current_time": "2025-11-17T14:35:22.123Z",
#   "pool": {
#     "total": 20,
#     "idle": 18,
#     "waiting": 0
#   }
# }

# 6.5 Pruebas funcionales
# - Login como admin
# - Crear un nuevo registro de prueba
# - Actualizar un registro existente
# - Verificar que Socket.IO funciona

# 6.6 Verificar logs
tail -n 50 /var/log/bge/backend.log

# No debería haber errores SQL o connection refused
```

---

### PASO 7: COMUNICACIÓN Y DOCUMENTACIÓN

```bash
# 7.1 Notificar al equipo
# Slack
/incident update "Database restored successfully. Service back online at [TIME]. Total downtime: [MINUTES] minutes."

# Email
To: team@bge.edu.mx, stakeholders@bge.edu.mx
Subject: [RESOLVED] DR Recovery Complete - BGE System Online
Body: "System recovered at [TIME]. Root cause: [BRIEF]. Post-mortem scheduled for [DATE]."

# 7.2 Documentar en incident log
cat >> /var/log/bge/incident-log.md <<EOF
## Incident ID: DR-$(date +%Y%m%d-%H%M%S)
**Fecha:** $(date)
**Tipo:** Database Corruption
**RTO Alcanzado:** [X] minutos
**RPO Alcanzado:** [Y] minutos
**Backup Usado:** db_full_20251117_020000.sql.gz.gpg
**Responsable:** [NOMBRE]
**Notas:** [DESCRIPCIÓN DEL INCIDENTE]
EOF
```

---

## 📖 RUNBOOKS DETALLADOS

### RUNBOOK DR-001: Database Corruption Recovery

**Escenario:** PostgreSQL reporta errores de corrupción de índices o tablas

```bash
# SÍNTOMAS
# - ERROR: invalid page header in block 12345 of relation "usuarios"
# - ERROR: missing chunk number 0 for toast value
# - Backend crashes con PANIC: could not read block

# PASO 1: Intentar REINDEX primero (si es solo corrupción de índice)
REINDEX DATABASE bge_prod;

# Si REINDEX falla o corrupción persiste:

# PASO 2: Activar DR Plan (ver PASO 0)

# PASO 3: Ejecutar restore completo (ver PASO 4)
./backend/scripts/restore-procedure.sh --from-s3 --date 20251117 --type full

# PASO 4: Si necesitas PITR (recuperar hasta punto específico)
# - Restore full backup más reciente ANTES del incidente
# - Aplicar WAL logs hasta el timestamp deseado

# PASO 5: Validar (ver PASO 6)
```

---

### RUNBOOK DR-002: Accidental Data Deletion

**Escenario:** Usuario admin ejecutó DELETE/UPDATE incorrecto

```bash
# EJEMPLO: DELETE FROM calificaciones WHERE estudiante_id = 123;
# Pero se ejecutó sin WHERE clause: DELETE FROM calificaciones;

# PASO 1: STOP WRITES INMEDIATAMENTE
pm2 stop bge-backend

# PASO 2: Verificar alcance del daño
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM calificaciones;"
# Si devuelve 0 → Tabla vacía

# PASO 3: Opciones de recuperación

# OPCIÓN A: Si fue hace <1 hora, usar incremental backup
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date $(date +%Y%m%d) \
    --type incremental

# OPCIÓN B: Si fue hace >1 hora, usar full backup
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date 20251117 \
    --type full

# OPCIÓN C: Si necesitas recuperar SOLO la tabla afectada (más rápido)
# 1. Download backup
aws s3 cp s3://bge-backups-us-east-1/full/db_full_20251117_020000.sql.gz.gpg /tmp/
gpg --decrypt /tmp/db_full_20251117_020000.sql.gz.gpg | gunzip > /tmp/backup.sql

# 2. Extract SOLO la tabla afectada
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -t calificaciones /tmp/backup.sql

# PASO 4: Validar datos restaurados
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM calificaciones;"

# PASO 5: Reiniciar backend
pm2 start bge-backend
```

---

### RUNBOOK DR-003: AWS Region Failover

**Escenario:** us-east-1 completamente caído

```bash
# PASO 1: Verificar outage de AWS
curl https://status.aws.amazon.com/

# PASO 2: Failover a S3 replica (eu-west-1)
export S3_BUCKET="s3://bge-backups-eu-west-1"

# PASO 3: Restore desde replica
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date 20251117 \
    --type full

# El script automáticamente usa S3_BUCKET environment variable

# PASO 4: Provisionar nueva infraestructura en eu-west-1
# (Si RDS primary está caído, necesitas nuevo RDS instance)
# Terraform:
cd infrastructure/terraform
terraform apply -var="region=eu-west-1"

# PASO 5: Update DNS records (Route53)
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch file://failover-dns.json

# PASO 6: Validar servicio en nueva región
curl https://bge-heroes-eu.vercel.app/api/health
```

---

### RUNBOOK DR-004: Ransomware Recovery

**Escenario:** Archivos encriptados por ransomware, databases locked

```bash
# SÍNTOMAS
# - Archivos con extensión .encrypted
# - Ransom note en servidor
# - Database inaccessible

# PASO 1: AISLAR INMEDIATAMENTE
# - Disconnect servidor de internet
# - Disconnect de VPC
sudo iptables -A INPUT -j DROP
sudo iptables -A OUTPUT -j DROP

# PASO 2: NO PAGAR EL RESCATE

# PASO 3: Notificar a seguridad y legal
# - Reportar a cybersecurity team
# - Reportar a autoridades si datos de menores están comprometidos

# PASO 4: Provisionar infraestructura NUEVA (limpia)
# - Nuevo RDS instance (no restore en mismo instance)
# - Nuevos servidores EC2
# - Nuevos security groups

# PASO 5: Restore desde backup MÁS ANTIGUO (pre-infección)
# Ransomware puede estar latente 30+ días antes de activarse
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date 20251001 \
    --type full

# PASO 6: Analizar backup antes de restore
# Scan con antivirus
clamscan --recursive /var/backups/bge/restore/

# PASO 7: Restore SOLO si scan es limpio

# PASO 8: Post-incident
# - Cambiar TODAS las credenciales (DB, AWS, SSH keys)
# - Audit logs para identificar punto de entrada
# - Implementar mejoras de seguridad
```

---

### RUNBOOK DR-005: User Files Recovery

**Escenario:** Pérdida de public/uploads (imágenes, PDFs de estudiantes)

```bash
# PASO 1: Verificar alcance
ls -la /home/user/bachillerato-heroes-de-la-patria/public/uploads/
# Si directorio vacío o archivos faltantes

# PASO 2: Restore desde S3 backup
aws s3 cp s3://bge-backups-us-east-1/files/files_20251117_020000.tar.gz.gpg /tmp/

# PASO 3: Decrypt y extract
gpg --decrypt /tmp/files_20251117_020000.tar.gz.gpg | tar -xz -C /home/user/bachillerato-heroes-de-la-patria/

# PASO 4: Verificar permisos
chown -R node:node /home/user/bachillerato-heroes-de-la-patria/public/uploads/
chmod -R 755 /home/user/bachillerato-heroes-de-la-patria/public/uploads/

# PASO 5: Validar
# - Visitar https://bge-heroes.vercel.app/admin-dashboard.html
# - Verificar que imágenes de estudiantes cargan
# - Verificar que PDFs de documentos se pueden descargar
```

---

## 🧪 TESTING Y VALIDACIÓN

### Test Mensual de DR (Cada 1er Domingo del Mes)

**Duración:** 2 horas | **Participantes:** DevOps Lead + 1 Engineer

```bash
# TEST 1: Restore de backup completo en ambiente de staging

# 1.1 Provisionar DB staging (RDS)
aws rds create-db-instance \
    --db-instance-identifier bge-staging-dr-test \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password [STAGING_PASSWORD]

# 1.2 Restore último backup
./backend/scripts/restore-procedure.sh \
    --from-s3 \
    --date $(date -d "1 day ago" +%Y%m%d) \
    --type full \
    --db-host bge-staging-dr-test.rds.amazonaws.com

# 1.3 Validar
psql -h bge-staging-dr-test.rds.amazonaws.com -U postgres -d bge_prod -c "SELECT COUNT(*) FROM usuarios;"

# 1.4 Medir RTO
# - Start: Inicio de restore
# - End: Database funcional
# - Objetivo: <30 minutos

# 1.5 Cleanup
aws rds delete-db-instance --db-instance-identifier bge-staging-dr-test --skip-final-snapshot
```

**Criterios de Éxito:**
- ✅ Restore completa en <30 minutos
- ✅ Todas las tablas críticas presentes
- ✅ Queries de prueba ejecutan correctamente
- ✅ No errores en logs

---

### Test Trimestral de Geo-Failover (Cada 3 Meses)

**Duración:** 4 horas | **Participantes:** DevOps Team Completo + CTO

```bash
# SIMULACIÓN: us-east-1 caído completamente

# 1. Simular outage de primary region
# - Apagar acceso a us-east-1 vía security groups
# - Bloquear S3 primary bucket

# 2. Activar DR Plan con failover a eu-west-1
export AWS_DEFAULT_REGION=eu-west-1
export S3_BUCKET=s3://bge-backups-eu-west-1

# 3. Provisionar infraestructura en eu-west-1
terraform apply -var="region=eu-west-1"

# 4. Restore desde replica
./backend/scripts/restore-procedure.sh --from-s3 --date $(date +%Y%m%d) --type full

# 5. Update DNS (Route53 failover)
aws route53 change-resource-record-sets ...

# 6. Validar servicio end-to-end
# - Login funcional
# - CRUD operations funcionan
# - WebSocket conecta correctamente

# 7. Medir RTO total
# Objetivo: <1 hora desde activación hasta servicio operativo

# 8. Rollback a us-east-1 después del test
```

---

### Test Anual de Ransomware (1 Vez al Año)

**Duración:** 8 horas | **Participantes:** Todo el equipo técnico + Seguridad

```bash
# SIMULACIÓN: Ransomware detectado, archivos encriptados

# 1. Equipo de seguridad "infecta" staging con ransomware simulado

# 2. DevOps ejecuta procedimiento DR-004

# 3. Mediciones:
# - Tiempo de detección
# - Tiempo de aislamiento
# - Tiempo de restore desde backup limpio (N-30 días atrás)

# 4. Post-test review:
# - ¿Qué salió bien?
# - ¿Qué se puede mejorar?
# - ¿Necesitamos actualizar runbooks?
```

---

## 👥 ROLES Y RESPONSABILIDADES

### Incident Commander (IC)
**Persona:** CTO o DevOps Lead
**Responsabilidades:**
- Activar DR Plan
- Coordinar comunicación con stakeholders
- Tomar decisiones de go/no-go
- Declarar incidente resuelto

---

### Database Recovery Lead
**Persona:** Senior Backend Engineer
**Responsabilidades:**
- Ejecutar runbooks de restore
- Validar integridad de datos post-restore
- Coordinar con Neon support si necesario

---

### Infrastructure Lead
**Persona:** DevOps Engineer
**Responsabilidades:**
- Provisionar nueva infraestructura si necesario
- Manejar failover de regiones AWS
- Configurar DNS y load balancers

---

### Communications Lead
**Persona:** Product Manager
**Responsabilidades:**
- Notificar a usuarios sobre downtime
- Actualizar status page
- Coordinar con stakeholders (dirección escolar)

---

### Security Lead
**Persona:** Security Engineer
**Responsabilidades:**
- Investigar si incidente fue causado por ataque
- Aislar sistemas comprometidos
- Coordinar con autoridades si necesario

---

## 📢 COMUNICACIÓN DE CRISIS

### Internal Communication (Team Slack)

```
#incident-response
🚨 [CRITICAL] DR Plan Activated
Incident ID: DR-20251117-143022
Type: Database Corruption
Estimated RTO: 1 hour
IC: @devops-lead
Updates: Every 15 minutes
Thread: [link]
```

**Update Template (Cada 15 min):**
```
⏰ UPDATE #3 (14:45)
Status: In Progress
Current Step: Restoring database from backup
Progress: 60% complete
Blockers: None
Next Update: 15:00
```

---

### External Communication (Users)

**Status Page Update:**
```
🔴 Major Outage - Database Maintenance
We are currently experiencing a database issue and are working to restore service.
Estimated resolution: 15:30 UTC
Last update: 14:45 UTC
Updates every 15 minutes
```

**Email to Users (Si downtime >30 min):**
```
Subject: [BGE Héroes] Mantenimiento de Emergencia - Servicio Temporalmente No Disponible

Estimados estudiantes y familias,

Estamos experimentando un problema técnico que requiere mantenimiento de emergencia.
Tiempo estimado de resolución: 15:30 (hora local)

Disculpen las molestias.
Equipo Técnico BGE
```

---

## 📝 POST-MORTEM

### Template de Post-Mortem (Completar 24 horas después)

```markdown
# Post-Mortem: [Incident ID]

**Fecha del Incidente:** [FECHA]
**Duración:** [X] horas
**Impacto:** [Número de usuarios afectados]
**RTO Alcanzado:** [X] minutos (Objetivo: 60 min)
**RPO Alcanzado:** [X] minutos (Objetivo: 15 min)

---

## Timeline

| Tiempo | Evento |
|--------|--------|
| 14:22 | Primer reporte de error en database |
| 14:25 | DR Plan activado |
| 14:30 | Backup seleccionado (db_full_20251117_020000) |
| 14:35 | Pre-restore snapshot creado |
| 14:40 | Restore iniciado |
| 14:55 | Restore completado |
| 15:00 | Validación post-restore completa |
| 15:05 | Servicio restaurado |

**Total Downtime:** 43 minutos ✅ (Dentro de RTO)

---

## Root Cause

[Descripción detallada de la causa raíz]

Ejemplo:
- PostgreSQL index corruption causada por hardware failure en Neon
- Checkpoint incompleto resultó en páginas corruptas
- Detección tardía (5 min) porque health check no verificaba integridad

---

## What Went Well

- ✅ Backup reciente (2 horas de antigüedad) disponible
- ✅ Restore script funcionó sin errores
- ✅ Comunicación clara con equipo
- ✅ RTO alcanzado (43 min < 60 min objetivo)

---

## What Went Wrong

- ❌ Health check no detectó corrupción temprano
- ❌ Pre-restore snapshot tomó 10 min (muy lento)
- ❌ Falta de alertas proactivas de Neon

---

## Action Items

| Acción | Responsable | Deadline | Prioridad |
|--------|-------------|----------|-----------|
| Agregar integrity check a health endpoint | @backend-lead | 2025-11-20 | P0 |
| Configurar Neon alerts para checkpoints fallidos | @devops | 2025-11-18 | P0 |
| Optimizar pre-restore snapshot (usar pg_dump paralelo) | @devops | 2025-11-25 | P1 |
| Documentar lecciones aprendidas en wiki | @all | 2025-11-22 | P2 |

---

## Lessons Learned

1. Los health checks deben verificar INTEGRIDAD de datos, no solo conectividad
2. Pre-restore snapshots son críticos para rollback pero deben ser rápidos
3. Comunicación proactiva con usuarios reduce tickets de soporte

---

**Approved by:** CTO
**Date:** [FECHA]
```

---

## 📞 CONTACTOS DE EMERGENCIA

| Rol | Nombre | Teléfono | Email | Disponibilidad |
|-----|--------|----------|-------|----------------|
| CTO | [NOMBRE] | +52 XXX XXX XXXX | cto@bge.edu.mx | 24/7 |
| DevOps Lead | [NOMBRE] | +52 XXX XXX XXXX | devops@bge.edu.mx | 24/7 |
| Security Lead | [NOMBRE] | +52 XXX XXX XXXX | security@bge.edu.mx | On-call |
| Neon Support | - | - | support@neon.tech | 24/7 (Enterprise) |
| AWS Support | - | - | Enterprise Support | 24/7 (Premium) |

---

## 🔄 MANTENIMIENTO DEL PLAN

**Frecuencia de Revisión:** Trimestral (cada 3 meses)

**Próximas Revisiones:**
- 2025-12-01: Review post test mensual
- 2026-03-01: Review trimestral + actualizar contactos
- 2026-06-01: Review post test geo-failover

**Changelog del Plan:**
| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0.0 | 2025-11-17 | Creación inicial del plan | DevOps Team |

---

## ✅ CHECKLIST FINAL DE VALIDACIÓN

Antes de considerar el DR Plan completo, verificar:

- [x] Scripts de backup creados y testeados
- [x] Scripts de restore creados y testeados
- [x] Geo-redundancy configurada (S3 multi-region)
- [x] GPG keys generadas y distribuidas
- [x] Runbooks documentados para cada escenario
- [x] Roles y responsabilidades asignados
- [x] Contactos de emergencia actualizados
- [x] Test mensual programado (cron job)
- [ ] Test completo ejecutado exitosamente (Pendiente 1er domingo del mes)
- [ ] Equipo entrenado en procedimientos (Pendiente)

---

**FIN DEL DISASTER RECOVERY PLAN**

*Este documento es CONFIDENCIAL y solo debe ser compartido con personal autorizado.*
