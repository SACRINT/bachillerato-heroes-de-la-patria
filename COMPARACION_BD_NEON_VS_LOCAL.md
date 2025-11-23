# 📊 COMPARACIÓN: BASE DE DATOS NEON vs LOCAL (BGE_LOCAL)

**Fecha:** 23 de Noviembre de 2025
**Generado por:** Claude Code
**Destinatario:** Arquitecto del Proyecto
**Estado:** Análisis Completo

---

## 🔴 PROBLEMA IDENTIFICADO

La BD local `bge_local` **NO CONTIENE TABLAS** (está vacía o estructura incompleta).

La BD Neon contiene una arquitectura enterprise de **65 tablas** con características avanzadas.

---

## 📈 ESTADÍSTICAS CRÍTICAS

### Comparación de Volumen

| Métrica | Neon (Producción) | Local (BGE_LOCAL) | Estado |
|---------|-------------------|-------------------|--------|
| **Total Tablas** | 65 | ❌ 0 detectadas | CRÍTICO |
| **Total Columnas** | 814 | ❌ 0 detectadas | CRÍTICO |
| **Secuencias** | 57 | ❌ No creadas | CRÍTICO |
| **Tipos ENUM Personalizados** | 5 | ❌ No creados | CRÍTICO |
| **Extensiones Requeridas** | pgcrypto, uuid-ossp | ❌ No instaladas | CRÍTICO |

---

## 🗂️ ESTRUCTURA DE NEON (65 TABLAS ORGANIZADAS POR MÓDULO)

### 1️⃣ CORE - USUARIOS Y AUTENTICACIÓN (9 tablas)

```
usuarios (21 cols) ..................... Usuarios principales + roles + status
├─ usuarios_activos (19 cols) ......... Vista de usuarios activos
├─ user_sessions (3 cols) ............. Sesiones activas
├─ deleted_users (8 cols) ............. GDPR - usuarios eliminados
├─ email_verification_tokens (7 cols) . Verificación email
├─ verification_tokens (10 cols) ...... Tokens genéricos
├─ webauthn_challenges (6 cols) ....... Autenticación sin contraseña
├─ webauthn_credentials (9 cols) ..... Credenciales biométricas
└─ rbac_permissions (6 cols) ......... Permisos granulares JSONB
```

**Características Especiales:**
- Tipos ENUM: `role_type`, `status_type`
- UUIDs para tokens (extensión pgcrypto)
- Soporte WebAuthn/Passkeys

---

### 2️⃣ ACADÉMICO - ESTUDIANTES, DOCENTES, CALIFICACIONES (10 tablas)

```
estudiantes (21 cols) ................. Información estudiante + status
├─ estudiantes_activos (21 cols) .... Vista de estudiantes activos
├─ docentes (14 cols) ................ Profesores + status
├─ docentes_activos (14 cols) ....... Vista de docentes activos
├─ parents (7 cols) .................. Padres de familia
├─ student_parents (2 cols) ......... Relación estudiante-padre
├─ calificaciones (15 cols) ......... Notas académicas
├─ materias (9 cols) ................ Materias + área (ENUM)
├─ inscripciones_actividades (16 cols) Inscripciones
└─ egresados (18 cols) .............. Alumni
```

**Tipos Especiales:**
- Tipos ENUM: `status_academico_type`, `genero`, `area_materias`
- Relaciones complejas: estudiante → padre, calificación → materia

---

### 3️⃣ IACOINS - SISTEMA DE GAMIFICACIÓN (10 tablas)

```
iacoins_achievements (13 cols) ....... Logros disponibles
iacoins_ai_generations (16 cols) .... Generaciones IA registradas
iacoins_balances (9 cols) ........... Saldos por usuario
├─ iacoins_challenge_progress (9 cols) Progreso en retos (JSONB)
├─ iacoins_challenges (16 cols) ..... Retos disponibles (JSONB)
├─ iacoins_pricing (8 cols) ........ Precios de servicios IA
├─ iacoins_prompt_templates (19 cols) Templates IA (JSONB x2)
├─ iacoins_transactions (12 cols) .. Transacciones
├─ iacoins_user_achievements (5 cols) Logros ganados
└─ achievements (12 cols) ........... Logros legacy
```

**Características:**
- 16 columnas JSONB para metadatos flexibles
- Templates con inputs requeridos y opcionales

---

### 4️⃣ CMS - CONTENIDO Y COMUNICACIÓN (7 tablas)

```
avisos (26 cols) .................... Avisos + etiquetas + destinatarios (ARRAY)
comunicados (19 cols) ............... Comunicados + etiquetas (ARRAY)
eventos (27 cols) .................. Eventos calendario + etiquetas (ARRAY)
noticias (20 cols) ................. Noticias + etiquetas (ARRAY)
notificaciones_convocatorias (13 cols) Notificaciones push
suscriptores_notificaciones (27 cols) Suscriptores + preferencias
└─ contactos (19 cols) ............ Formulario contacto
```

**Tipos Especiales:**
- Columnas ARRAY (texto[]) para etiquetas y destinatarios
- 27 columnas en suscriptores_notificaciones

---

### 5️⃣ SOLICITUDES Y APROBACIONES (9 tablas)

```
citas (21 cols) ..................... Agenda citas (JSONB metadata)
pendientes_aprobacion (13 cols) .... Pendientes de aprobación (JSONB)
pending_approvals (10 cols) ........ Aprobaciones genéricas (JSONB)
pending_inscriptions (6 cols) ...... Inscripciones pendientes (JSONB)
pending_registrations (6 cols) .... Registros pendientes (JSONB)
pending_submissions (15 cols) ..... Envíos pendientes (JSONB)
solicitudes_documentos (15 cols) .. Trámites documentos
quejas (14 cols) .................. Sistema de quejas
└─ bolsa_trabajo (12 cols) ....... CVs recibidos
```

**Patrón:** Cada tabla "pending_*" almacena datos en JSONB para flexibilidad

---

### 6️⃣ CONFIRMACIÓN EMAIL (3 tablas)

```
bolsa_trabajo_pending_confirmation (8 cols) . CVs pendiente email (JSONB, UUID)
egresados_pending_confirmation (8 cols) .... Egresados pendiente email (JSONB)
└─ user_achievements (5 cols) ............. Logros usuario
```

---

### 7️⃣ FINANZAS (4 tablas)

```
gastos (14 cols) ................... Gastos del sistema
ingresos (14 cols) ................ Ingresos
pagos_pendientes (16 cols) ........ Pagos pendientes
└─ user_gamification_stats (10 cols) Stats de gamificación
```

---

### 8️⃣ SEGURIDAD Y COMPLIANCE (8 tablas)

```
audit_logs (9 cols) ............... Auditoría general (JSONB)
change_management_log (12 cols) .. Cambios con before/after (JSONB x3)
consents (9 cols) ................ Consentimientos GDPR (JSONB)
data_breaches (11 cols) ......... Brechas de datos (JSONB)
data_exports (8 cols) .......... Exportaciones GDPR (JSONB)
encryption_keys (10 cols) ..... Llaves de encriptación (JSONB)
soc2_audit_logs (13 cols) .... Auditoría SOC2 (JSONB)
└─ soc2_incidents (15 cols) .. Incidentes SOC2 (JSONB)
```

---

### 9️⃣ SISTEMA (5 tablas)

```
logs_sistema (8 cols) ..................... Logs aplicación (JSONB)
tenants (12 cols) ....................... Multi-tenancy config (JSONB UUID)
privacy_policies (7 cols) ............... Políticas privacidad
user_privacy_policy_acceptance (6 cols) Aceptaciones
└─ vendor_risk_assessments (11 cols) ... Evaluación proveedores (ARRAY JSONB)
```

---

## 🔴 CRÍTICOS: TIPOS DE DATOS ESPECIALES EN NEON

### 1. TIPOS ENUM PERSONALIZADOS (5 tipos)

Estos **DEBEN SER CREADOS PRIMERO** antes de las tablas que los usan:

```sql
-- 1. role_type
CREATE TYPE role_type AS ENUM (
  'estudiante',
  'docente',
  'padre',
  'administrativo',
  'director',
  'super_admin'
);

-- 2. status_type
CREATE TYPE status_type AS ENUM (
  'activo',
  'inactivo',
  'suspendido',
  'eliminado'
);

-- 3. docente_status_type
CREATE TYPE docente_status_type AS ENUM (
  'activo',
  'licencia',
  'jubilado',
  'suspendido'
);

-- 4. status_academico_type
CREATE TYPE status_academico_type AS ENUM (
  'inscrito',
  'activo',
  'pasante',
  'egresado',
  'retirado',
  'suspendido'
);

-- 5. rarity_type
CREATE TYPE rarity_type AS ENUM (
  'comun',
  'raro',
  'epico',
  'legendario',
  'mitico'
);
```

**Tablas afectadas (13 columnas con tipos ENUM):**
- `usuarios.role`, `usuarios.status`
- `usuarios_activos.role`, `usuarios_activos.status`
- `docentes.status`, `docentes_activos.status`
- `estudiantes.genero`, `estudiantes.status_academico`
- `estudiantes_activos.genero`, `estudiantes_activos.status_academico`
- `materias.area`
- `achievements.category`, `achievements.rarity`

---

### 2. EXTENSIONES POSTGRESQL REQUERIDAS

```sql
-- Para UUIDs (6 columnas):
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Para algunas funciones avanzadas:
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
```

**Columnas UUID generadas con:**
- `gen_random_uuid()` (recomendado)
- `uuid_generate_v4()` (legacy)

---

### 3. COLUMNAS JSONB (29 columnas)

Requieren almacenamiento de datos semi-estructurados:

```sql
-- Ejemplos de uso:
audit_logs.metadata          -- {action, ip, user_agent, ...}
citas.metadata               -- {notas, documentos, ...}
consents.metadata            -- {timestamp, version, ip, ...}
data_breaches.metadata       -- {affected_records, description, ...}
encryption_keys.metadata     -- {version, algorithm, ...}
iacoins_challenges.requirements    -- {min_score, max_time, ...}
iacoins_prompt_templates.required_inputs    -- {field_name, type, ...}
pending_approvals.submission_data  -- {valores_form, ...}
tenants.config_json          -- {color, logo_url, domain, ...}
```

---

### 4. COLUMNAS ARRAY (6 columnas)

Requieren almacenamiento de colecciones:

```sql
avisos.etiquetas[]           -- TEXT[] de etiquetas
avisos.destinatarios[]       -- TEXT[] de usuarios destino
comunicados.etiquetas[]      -- TEXT[] de etiquetas
eventos.etiquetas[]          -- TEXT[] de etiquetas
noticias.etiquetas[]         -- TEXT[] de etiquetas
vendor_risk_assessments.data_shared[]  -- TEXT[] de datos compartidos
```

---

## ❌ BD LOCAL (BGE_LOCAL): ESTADO ACTUAL

### Hallazgos Principales

```
✗ NO TIENE TABLAS PÚBLICAS (schema vacío)
✗ NO TIENE TIPOS ENUM PERSONALIZADOS
✗ NO TIENE EXTENSIONES POSTGRESQL
✗ NO TIENE SEQUENCES/SECUENCIAS
✗ Parece ser una BD NUEVA SIN RESTAURACIÓN COMPLETADA
```

### Diagnóstico

El script `sync-neon-local-simple.bat` que ejecutaste:
1. ✅ Creó la BD `bge_local`
2. ✅ Realizó backup de Neon (aunque con nombre de archivo incorrecto)
3. ❌ **NO completó la restauración de datos** (pg_restore no se ejecutó exitosamente)

**Evidencia:** La query `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` retorna 0 resultados.

---

## 🔧 SOLUCIÓN RECOMENDADA

### OPCIÓN A: Restaurar desde Backup (Recomendado si existe backup válido)

```bash
# 1. Verificar que existe el archivo de backup
dir C:\03_BachilleratoHeroesWeb\backups\neon_backup_*.dump

# 2. Ejecutar restauración manual
pg_restore -h localhost -U postgres -d bge_local --no-privileges \
  "C:\03_BachilleratoHeroesWeb\backups\neon_backup_YYYYMMDD_HHMMSS.dump"

# 3. Verificar que se restauraron las tablas
psql -h localhost -U postgres -d bge_local -c "\dt"
```

---

### OPCIÓN B: Usar Scripts SQL de Recreación (Si backup no está disponible)

**Pasos:**
1. Descargar schema completo de Neon (DDLS)
2. Ejecutar scripts en orden:
   - Crear tipos ENUM
   - Crear extensiones
   - Crear tablas
   - Crear índices
   - Crear secuencias

**Archivos necesarios:**
- `backend/scripts/01-create-types.sql` (tipos ENUM)
- `backend/scripts/02-create-extensions.sql` (extensiones)
- `backend/scripts/03-create-tables.sql` (65 tablas)
- `backend/scripts/04-create-indexes.sql` (índices)

---

### OPCIÓN C: Usar Neon Directamente (Actual - Producción)

**Recomendado para desarrollo:**
- Mantener `.env.local` apuntando a Neon
- BD local solo para testing/backup local
- No sincronizar automáticamente

**Ventajas:**
- Siempre tienes datos actualizados
- No necesitas mantener 2 BDs sincronizadas
- Menos complejidad

---

## 📋 CHECKLIST DE VERIFICACIÓN

Para confirmar si se necesita restauración:

- [ ] Verificar que `bge_local` tiene 65 tablas (o cercano)
- [ ] Verificar que existen tipos ENUM: `role_type`, `status_type`, etc.
- [ ] Verificar que extensión `pgcrypto` está instalada
- [ ] Verificar que tabla `usuarios` tiene 21 columnas
- [ ] Verificar que tabla `estudiantes` tiene 21 columnas
- [ ] Verificar que tabla `iacoins_achievements` existe
- [ ] Verificar secuencias: `usuarios_id_seq`, `estudiantes_id_seq`, etc.

**Script rápido de verificación:**
```bash
psql -h localhost -U postgres -d bge_local -c "
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public') as total_tablas,
  (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema='public') as total_sequences,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema='public') as total_constraints
;"
```

---

## 📊 REPORTE FINAL PARA ARQUITECTO

### Resumen Ejecutivo

| Aspecto | Neon | Local | Diferencia |
|---------|------|-------|-----------|
| Tablas | 65 | 0 | ❌ CRÍTICO |
| Columnas | 814 | 0 | ❌ CRÍTICO |
| Tipos ENUM | 5 | 0 | ❌ CRÍTICO |
| Secuencias | 57 | 0 | ❌ CRÍTICO |
| Complejidad | Enterprise | Vacío | 100% diferencia |

### Conclusión

**La BD local NO está sincronizada con Neon.**

La restauración mediante `sync-neon-local-simple.bat` no se completó exitosamente.

### Recomendaciones

1. ✅ **Inmediato:** Ejecutar restauración manual con `pg_restore` usando backup de Neon
2. ✅ **Verificación:** Confirmar que todas 65 tablas se restauraron
3. ✅ **Alternativa:** Si no existe backup válido, obtener DDL de Neon y recrear localmente
4. ✅ **Mejor práctica:** Mantener `.env.local` apuntando a Neon, local solo para testing

---

## 📎 ARCHIVOS RELACIONADOS

- **Schema Neon completo:** `C:\03_BachilleratoHeroesWeb\frosty-night-96901888_main_neondb_2025-11-23_10-41-42.json`
- **Backup (si existe):** `C:\03_BachilleratoHeroesWeb\backups\neon_backup_*.dump`
- **Documentación anterior:** `C:\03_BachilleratoHeroesWeb\COMIENZA_AQUI.txt`
- **Logs de sincronización:** `C:\03_BachilleratoHeroesWeb\backups\sync_log_*.txt`

---

**Generado por:** Claude Code
**Fecha:** 23 de Noviembre de 2025
**Versión:** 1.0
