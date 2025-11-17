# 🔐 ENCRYPTION & KEY MANAGEMENT GUIDE

**Versión:** 1.0.0
**Última Actualización:** 17 Noviembre 2025
**Responsable:** Security Team
**Estado:** ✅ PRODUCTION-READY

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Encryption Strategy](#encryption-strategy)
3. [Key Management](#key-management)
4. [Implementation Guide](#implementation-guide)
5. [Key Rotation](#key-rotation)
6. [Best Practices](#best-practices)

---

## 🎯 INTRODUCCIÓN

Este documento describe la estrategia de encriptación de datos en reposo (data at rest) y la gestión de claves de encriptación para el sistema BGE Heroes de la Patria.

**Compliance:** GDPR, HIPAA, PCI-DSS

---

## 🛡️ ENCRYPTION STRATEGY

### Data Classification

| Categoría | Nivel de Sensibilidad | Encriptación | Ejemplo |
|-----------|----------------------|--------------|---------|
| **PII (Personally Identifiable Information)** | CRÍTICO | AES-256-GCM | CURP, teléfono, dirección |
| **PHI (Protected Health Information)** | CRÍTICO | AES-256-GCM | Condiciones médicas |
| **Financial Data** | CRÍTICO | AES-256-GCM | Información bancaria |
| **Authentication Credentials** | CRÍTICO | bcrypt (one-way) | Passwords |
| **General Data** | BAJO | No encriptado | Nombres, emails (indexables) |

### Encryption Algorithms

**Data at Rest:**
- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, random per encryption)
- **Authentication Tag:** 128 bits (prevents tampering)

**Data in Transit:**
- **Protocol:** TLS 1.3
- **Provided by:** Vercel (automatic HTTPS)
- **Certificate:** Let's Encrypt (auto-renewal)

**Why AES-256-GCM?**
- ✅ Authenticated encryption (prevents tampering)
- ✅ NIST approved (FIPS 140-2 compliant)
- ✅ Hardware acceleration (AES-NI on modern CPUs)
- ✅ Parallel processing (faster than CBC)

---

## 🔑 KEY MANAGEMENT

### Key Hierarchy

```
┌────────────────────────────────────────────────────┐
│         MASTER ENCRYPTION KEY (MEK)                │
│         - 512-bit entropy                          │
│         - Stored in: Environment variable          │
│         - Rotation: Every 90 days                  │
└────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Key Derivation (PBKDF2)     │
        │   - Iterations: 100,000       │
        │   - Hash: SHA-512             │
        │   - Salt: Random 64 bytes     │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Data Encryption Key (DEK)   │
        │   - Unique per encryption     │
        │   - Never stored               │
        └───────────────────────────────┘
```

### Master Key Storage

**Development:**
```bash
# .env.local
ENCRYPTION_MASTER_KEY=dev-key-not-for-production-use
```

**Production (Vercel):**
```bash
# Settings > Environment Variables
ENCRYPTION_MASTER_KEY=<512-bit-random-key>
```

**Generate Secure Master Key:**
```bash
# Option 1: OpenSSL
openssl rand -hex 64

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Output (example):
# a7f3e8d9c2b4f1a6e5d8c7b9f2a3e6d1c4b7f0a9e2d5c8b1f4a7e0d3c6b9f2a5e8d1c4b7f0a3e6d9c2b5f8a1e4d7c0b3f6a9e2d5c8b1f4a7e0d3c6b9f2a5
```

### Key Derivation Process

```javascript
// PBKDF2 (Password-Based Key Derivation Function 2)
const derivedKey = crypto.pbkdf2Sync(
  masterKey,      // Master encryption key
  salt,           // Random 64-byte salt (unique per encryption)
  100000,         // Iterations (computational cost)
  32,             // Key length (256 bits / 32 bytes)
  'sha512'        // Hash algorithm
);
```

**Why PBKDF2?**
- ✅ Industry standard (NIST SP 800-132)
- ✅ Computationally expensive (slows brute-force)
- ✅ Unique keys per encryption (different salts)

---

## 💻 IMPLEMENTATION GUIDE

### 1. Encrypt Sensitive Data

```javascript
const encryptionService = require('./backend/services/encryption-service');

// Encrypt single field
const encryptedPhone = await encryptionService.encrypt('555-1234');

// Store in database
await pool.query(
  'UPDATE usuarios SET telefono = $1 WHERE id = $2',
  [encryptedPhone, userId]
);
```

### 2. Decrypt Sensitive Data

```javascript
// Retrieve from database
const result = await pool.query(
  'SELECT telefono FROM usuarios WHERE id = $1',
  [userId]
);

// Decrypt
const decryptedPhone = await encryptionService.decrypt(result.rows[0].telefono);

console.log(decryptedPhone); // '555-1234'
```

### 3. Field-Level Encryption (Multiple Fields)

```javascript
const userData = {
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  telefono: '555-1234',
  direccion: 'Calle Falsa 123',
  curp: 'PEJO900101HDFRNN09'
};

// Encrypt sensitive fields only
const encrypted = await encryptionService.encryptFields(userData, [
  'telefono',
  'direccion',
  'curp'
]);

// Insert into database
await pool.query(
  'INSERT INTO usuarios (nombre, email, telefono, direccion, curp) VALUES ($1, $2, $3, $4, $5)',
  [encrypted.nombre, encrypted.email, encrypted.telefono, encrypted.direccion, encrypted.curp]
);
```

### 4. Decrypt Multiple Fields

```javascript
// Retrieve from database
const result = await pool.query(
  'SELECT * FROM usuarios WHERE id = $1',
  [userId]
);

// Decrypt sensitive fields
const decrypted = await encryptionService.decryptFields(result.rows[0], [
  'telefono',
  'direccion',
  'curp'
]);

console.log(decrypted);
// {
//   nombre: 'Juan Pérez',
//   email: 'juan@example.com',
//   telefono: '555-1234',       // Decrypted
//   direccion: 'Calle Falsa 123', // Decrypted
//   curp: 'PEJO900101HDFRNN09'    // Decrypted
// }
```

### 5. Database Schema for Encrypted Fields

```sql
-- Create table with encrypted fields
CREATE TABLE usuarios (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Encrypted fields (TEXT to store base64-encoded ciphertext)
  telefono TEXT,           -- Encrypted
  direccion TEXT,          -- Encrypted
  curp TEXT,              -- Encrypted

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ⚠️ IMPORTANT: Do NOT index encrypted fields
-- Reason: Indexing encrypted data is ineffective (ciphertext is random)
```

**Column Type:** Use `TEXT` instead of `VARCHAR(n)` because encrypted data is variable length (base64-encoded).

---

## 🔄 KEY ROTATION

### Why Rotate Keys?

- **Security Best Practice:** Limit exposure window if key is compromised
- **Compliance:** GDPR, HIPAA require periodic key rotation
- **Key Lifecycle:** Keys have limited lifetime (90 days recommended)

### Rotation Schedule

| Key Type | Rotation Frequency | Automation |
|----------|-------------------|------------|
| Master Encryption Key | Every 90 days | Manual (scheduled) |
| JWT Secret | Every 365 days | Manual |
| Database Password | Every 180 days | Manual |
| API Keys (third-party) | Every 365 days | Manual |

### Rotation Procedure

**Step 1: Generate New Master Key**
```bash
# Generate new 512-bit key
NEW_KEY=$(openssl rand -hex 64)
echo "New key: $NEW_KEY"

# Save to secure location (password manager)
```

**Step 2: Run Key Rotation Script**
```bash
# Dry-run (preview changes)
node backend/scripts/key-rotation.js \
  --old-key <OLD_KEY> \
  --new-key <NEW_KEY> \
  --dry-run

# Execute rotation
node backend/scripts/key-rotation.js \
  --old-key <OLD_KEY> \
  --new-key <NEW_KEY>

# Output:
# ============================================
# 🔑 KEY ROTATION STARTED
# ============================================
# Tables to rotate: 3
#
# Creating backup before key rotation...
# ✅ Backup created: backups/key-rotation/pre-rotation-1700000000000.json
#
# Rotating keys for table: usuarios
# Found 1250 rows to rotate in usuarios
# Progress: 100/1250 rows rotated in usuarios
# Progress: 200/1250 rows rotated in usuarios
# ...
# ✅ Table usuarios: 1250 successful, 0 errors
#
# ✅ KEY ROTATION COMPLETED SUCCESSFULLY
```

**Step 3: Update Environment Variable**
```bash
# Vercel Dashboard
# Settings > Environment Variables > ENCRYPTION_MASTER_KEY
# Update value to NEW_KEY
```

**Step 4: Restart Backend**
```bash
# Vercel auto-deploys on environment variable change
# Or manually trigger redeploy
vercel --prod
```

**Step 5: Verify**
```bash
# Test decryption with new key
curl -H "Authorization: Bearer <token>" \
  https://bge-heroes.vercel.app/api/profile

# Should return decrypted data successfully
```

---

## ✅ BEST PRACTICES

### 1. Never Hardcode Keys

❌ **WRONG:**
```javascript
const MASTER_KEY = 'my-secret-key-123'; // NEVER DO THIS
```

✅ **CORRECT:**
```javascript
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY;

if (!MASTER_KEY) {
  throw new Error('ENCRYPTION_MASTER_KEY environment variable not set');
}
```

### 2. Use Different Keys Per Environment

```bash
# Development
ENCRYPTION_MASTER_KEY=dev-key-12345

# Staging
ENCRYPTION_MASTER_KEY=staging-key-67890

# Production
ENCRYPTION_MASTER_KEY=<strong-random-key>
```

### 3. Encrypt Only What's Necessary

**Encrypt:**
- ✅ Phone numbers
- ✅ Addresses
- ✅ CURP
- ✅ Medical conditions
- ✅ Financial data

**Do NOT Encrypt:**
- ❌ Names (needed for search)
- ❌ Emails (needed for login, indexes)
- ❌ UUIDs (primary keys)
- ❌ Timestamps

**Why?** Encrypted data cannot be indexed or searched efficiently.

### 4. Always Use Authenticated Encryption

✅ **Use AES-GCM** (includes authentication tag)

❌ **Don't use AES-CBC** (no tamper detection)

### 5. Generate Random IV Per Encryption

```javascript
// ✅ CORRECT: New IV each time
function encrypt(plaintext) {
  const iv = crypto.randomBytes(16); // Random IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  // ...
}

// ❌ WRONG: Reusing IV
const STATIC_IV = Buffer.from('1234567890123456'); // NEVER REUSE IV
```

### 6. Backup Before Key Rotation

```javascript
// Always create backup before rotation
const backupFile = await createBackup();

try {
  await rotateKeys();
} catch (error) {
  console.error('Rotation failed. Restore from:', backupFile);
  throw error;
}
```

### 7. Monitor Decryption Errors

```javascript
try {
  const decrypted = await encryptionService.decrypt(ciphertext);
} catch (error) {
  // Log decryption failures (may indicate key rotation needed)
  logger.error('[ENCRYPTION] Decryption failed', {
    field: 'telefono',
    userId: user.id,
    error: error.message
  });

  // Alert if >10 failures per hour
  if (decryptionErrorCount > 10) {
    sendSlackAlert('🚨 High decryption error rate - check encryption keys');
  }
}
```

---

## 🚨 INCIDENT RESPONSE

### Scenario: Master Key Compromised

**Immediate Actions (0-15 min):**
1. Revoke compromised key immediately
2. Generate new master key
3. Notify security team
4. Review access logs for unauthorized activity

**Remediation (15-60 min):**
1. Run emergency key rotation script
2. Update environment variables in production
3. Redeploy backend services
4. Verify all decryption works

**Post-Incident (1-24 hours):**
1. Investigate how key was compromised
2. Review and strengthen key storage practices
3. Audit who has access to production environment variables
4. Update incident response documentation

---

## 📚 REFERENCES

- [NIST SP 800-132: Recommendation for Password-Based Key Derivation](https://csrc.nist.gov/publications/detail/sp/800-132/final)
- [NIST SP 800-38D: Recommendation for Block Cipher Modes (GCM)](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [GDPR Article 32: Security of Processing](https://gdpr-info.eu/art-32-gdpr/)

---

**FIN DEL ENCRYPTION & KEY MANAGEMENT GUIDE**

*Última actualización: 17 Noviembre 2025*
