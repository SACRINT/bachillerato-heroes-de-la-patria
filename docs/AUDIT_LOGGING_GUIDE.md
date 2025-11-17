# 📝 AUDIT LOGGING GUIDE - BGE HEROES DE LA PATRIA

**Versión:** 1.0.0
**Última Actualización:** 17 Noviembre 2025
**Responsable:** Compliance & Security Team
**Estado:** ✅ PRODUCTION-READY

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Blockchain-Style Hash Chain](#blockchain-style-hash-chain)
3. [Implementation](#implementation)
4. [Audit Report Generation](#audit-report-generation)
5. [Compliance](#compliance)
6. [Best Practices](#best-practices)

---

## 🎯 INTRODUCCIÓN

El sistema de audit logging de BGE implementa un mecanismo **tamper-proof** (a prueba de manipulación) para registrar todas las operaciones críticas del sistema.

**Propósito:**
- ✅ Compliance (GDPR, SOC 2, HIPAA)
- ✅ Security incident investigation
- ✅ Forensic analysis
- ✅ User activity tracking

**Retention Period:** 7 años (compliance requirement)

---

## 🔗 BLOCKCHAIN-STYLE HASH CHAIN

### Cómo Funciona

Similar a blockchain, cada log entry está vinculado al anterior mediante hash criptográfico:

```
┌─────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN-STYLE HASH CHAIN                 │
└─────────────────────────────────────────────────────────────┘

Log Entry 1:
├── ID: 1
├── User: admin@example.com
├── Action: CREATE
├── Resource: usuarios
├── Timestamp: 2025-11-17T10:00:00Z
├── Previous Hash: 0 (genesis)
└── Hash: SHA256(entry 1 + "0") = a7f3e8d9c2...

Log Entry 2:
├── ID: 2
├── User: admin@example.com
├── Action: UPDATE
├── Resource: usuarios
├── Timestamp: 2025-11-17T10:05:00Z
├── Previous Hash: a7f3e8d9c2...  ← Links to Entry 1
└── Hash: SHA256(entry 2 + "a7f3e8d9c2...") = b4c1f6a9e2...

Log Entry 3:
├── ID: 3
├── User: student@example.com
├── Action: READ
├── Resource: calificaciones
├── Timestamp: 2025-11-17T10:10:00Z
├── Previous Hash: b4c1f6a9e2...  ← Links to Entry 2
└── Hash: SHA256(entry 3 + "b4c1f6a9e2...") = c8d5b2f7a1...
```

**Tamper Detection:**

Si alguien modifica Entry 2:
- Hash of Entry 2 cambia
- Previous Hash de Entry 3 ya NO coincide
- Toda la cadena se rompe desde Entry 2 en adelante
- ✅ Tampering es **inmediatamente detectable**

### Hash Computation

```javascript
function computeHash(entry, previousHash) {
  const data = JSON.stringify({
    timestamp: entry.timestamp,
    user_id: entry.user_id,
    action: entry.action,
    resource: entry.resource,
    resource_id: entry.resource_id,
    ip_address: entry.ip_address,
    previous_hash: previousHash
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}
```

**Why SHA-256?**
- ✅ Cryptographically secure (collision-resistant)
- ✅ Fast to compute
- ✅ Deterministic (same input = same output)
- ✅ Widely used in blockchain systems

---

## 💻 IMPLEMENTATION

### 1. Database Schema

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Who (quien)
  user_id VARCHAR(255) NOT NULL,

  -- What (qué)
  action VARCHAR(50) NOT NULL,  -- CREATE, READ, UPDATE, DELETE
  resource VARCHAR(100) NOT NULL, -- usuarios, estudiantes, etc
  resource_id VARCHAR(255) NOT NULL,

  -- When (cuándo)
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Where (dónde)
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,

  -- Changes (detalles)
  changes JSONB,

  -- Blockchain-style hash chain
  hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL
);

-- Prevent UPDATE/DELETE (append-only)
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();
```

**Append-Only:** No se pueden modificar o eliminar logs (solo insertar).

### 2. Automatic Logging (Middleware)

```javascript
// backend/server.js
const auditLogger = require('./middleware/audit-logger');

// Enable audit logging for all routes
app.use(auditLogger.middleware);

// Now all CRUD operations are automatically logged!
```

**What Gets Logged:**
- ✅ POST /api/usuarios → CREATE action
- ✅ GET /api/usuarios/123 → READ action
- ✅ PUT /api/usuarios/123 → UPDATE action
- ✅ DELETE /api/usuarios/123 → DELETE action

### 3. Manual Logging (Special Events)

```javascript
const auditLogger = require('./middleware/audit-logger');

// Log login
app.post('/api/auth/login', async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);

  if (user) {
    await auditLogger.logLogin(user.id, req.ip, true);
    res.json({ token: generateJWT(user) });
  } else {
    await auditLogger.logLogin(req.body.email, req.ip, false);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Log permission change
app.post('/api/admin/change-role', async (req, res) => {
  const { userId, newRole } = req.body;
  const user = await getUserById(userId);

  await auditLogger.logPermissionChange(
    req.user.id,      // Admin performing action
    userId,           // Target user
    user.role,        // Old role
    newRole,          // New role
    req.ip
  );

  await updateUserRole(userId, newRole);
  res.json({ success: true });
});

// Log data export
app.get('/api/admin/export-data', async (req, res) => {
  const data = await exportAllData();

  await auditLogger.logDataExport(
    req.user.id,
    'all_tables',
    data.length,
    req.ip
  );

  res.json(data);
});
```

---

## 📊 AUDIT REPORT GENERATION

### Generate Report (CLI)

```bash
# CSV report (last 30 days)
node backend/scripts/generate-audit-report.js \
  --start 2025-11-01 \
  --end 2025-11-30 \
  --format csv

# JSON report (specific user)
node backend/scripts/generate-audit-report.js \
  --start 2025-01-01 \
  --end 2025-12-31 \
  --user admin@example.com \
  --format json

# HTML report (failed login attempts)
node backend/scripts/generate-audit-report.js \
  --start 2025-11-01 \
  --end 2025-11-30 \
  --action LOGIN_FAILED \
  --format html
```

### Report Contents

**1. Metadata:**
- Generated timestamp
- Date range
- Filters applied

**2. Statistics:**
- Total logs
- Unique users
- Unique IPs
- Top actions (most frequent)
- Top resources (most accessed)
- Top users (most active)

**3. Integrity Check:**
- ✅ PASSED: No tampering detected
- ❌ FAILED: Tampering detected at log ID X

**4. Log Entries:**
- ID, Timestamp, User, Action, Resource, IP

### Example HTML Report

```html
📊 Audit Report
Date Range: 2025-11-01 to 2025-11-30
Generated: 2025-11-17T15:30:00Z

📈 Statistics
Total Logs: 12,543
Unique Users: 87
Unique IPs: 134

Top Actions:
  - READ: 8,234 (66%)
  - CREATE: 2,103 (17%)
  - UPDATE: 1,876 (15%)
  - DELETE: 330 (2%)

Top Resources:
  - calificaciones: 4,567 (36%)
  - usuarios: 3,234 (26%)
  - estudiantes: 2,876 (23%)

🔒 Integrity Check
✅ PASSED - No tampering detected

📋 Audit Logs (top 100)
[Table with logs...]
```

---

## ✅ COMPLIANCE

### GDPR (General Data Protection Regulation)

**Article 30:** Records of processing activities

> Controllers shall maintain a record of all processing activities.

✅ **Compliance:** Audit logs record WHO processed WHAT data and WHEN.

**Article 32:** Security of processing

> Implement technical measures to ensure ongoing confidentiality and integrity.

✅ **Compliance:** Blockchain-style hash chain ensures integrity.

### SOC 2 (Service Organization Control 2)

**CC6.1:** Logical and physical access controls

> The entity implements logical access security measures to protect information from unauthorized access.

✅ **Compliance:** All access logged and monitored.

**CC7.2:** System monitoring

> The entity monitors system components and operations of the system.

✅ **Compliance:** Comprehensive audit logging + integrity verification.

### HIPAA (Health Insurance Portability and Accountability Act)

**§164.312(b):** Audit controls

> Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems.

✅ **Compliance:** Tamper-proof audit logs with 7-year retention.

---

## 📌 BEST PRACTICES

### 1. Log Strategically (Not Everything)

❌ **Don't Log:**
- Password values (log "password changed", not the password)
- Credit card numbers
- Full request/response bodies (too verbose)

✅ **Do Log:**
- Login/logout events
- CRUD operations on sensitive data
- Permission changes
- Data exports
- Failed authentication attempts
- Config changes

### 2. Verify Integrity Periodically

```bash
# Run monthly via cron
0 0 1 * * node backend/scripts/verify-audit-integrity.js
```

If tampering detected:
1. Alert security team immediately
2. Investigate last known good hash
3. Review backup logs
4. Determine when tampering occurred

### 3. Protect Audit Logs

**Database Permissions:**
```sql
-- Application user can only INSERT, SELECT (not UPDATE, DELETE)
GRANT INSERT, SELECT ON audit_logs TO bge_app_user;
REVOKE UPDATE, DELETE ON audit_logs FROM bge_app_user;
```

**Separate Database (Optional):**
- Store audit logs in dedicated database
- Further isolation from application database

### 4. Archive Old Logs

```bash
# Run monthly
SELECT cleanup_old_audit_logs();

# Archives logs older than 7 years to cold storage
# Then deletes from active database
```

**7-Year Retention:**
- Active database: 0-2 years
- Cold storage (S3 Glacier): 2-7 years
- After 7 years: Securely delete

### 5. Monitor for Anomalies

**Alert on:**
- ❌ >10 failed login attempts from same IP (brute force)
- ❌ User accessing 100+ records in 1 minute (data scraping)
- ❌ Admin permission change outside business hours
- ❌ Data export by non-admin user
- ❌ Integrity check failure

---

## 🚨 INCIDENT RESPONSE

### Scenario: Audit Log Tampering Detected

**Immediate Actions (0-15 min):**
1. Verify tampering with manual hash recomputation
2. Identify tampered log ID and timestamp
3. Alert security team
4. Freeze write access to audit_logs table

**Investigation (15-60 min):**
1. Review backup logs to find original values
2. Check database access logs (who modified?)
3. Review application logs for anomalies
4. Identify attack vector

**Remediation (1-4 hours):**
1. Restore audit logs from backup (if possible)
2. Patch security vulnerability
3. Enhance database access controls
4. Review and strengthen audit log protection

**Post-Incident:**
1. Document findings in post-mortem
2. Update incident response procedures
3. Conduct security training for team
4. Consider additional monitoring tools

---

## 📚 REFERENCES

- [GDPR Article 30 & 32](https://gdpr-info.eu/)
- [SOC 2 Trust Service Criteria](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)
- [HIPAA Audit Controls](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)

---

**FIN DEL AUDIT LOGGING GUIDE**

*Última actualización: 17 Noviembre 2025*
