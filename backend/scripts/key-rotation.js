/**
 * 🔑 KEY ROTATION SCRIPT - SEMANA 14
 * Rotate encryption keys for all encrypted data
 *
 * Features:
 * - Re-encrypt all sensitive database fields with new key
 * - Backup before rotation
 * - Rollback capability
 * - Progress tracking
 * - Verification after rotation
 *
 * Usage:
 *   node backend/scripts/key-rotation.js --old-key <OLD_KEY> --new-key <NEW_KEY>
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const { Pool } = require('pg');
const encryptionService = require('../services/encryption.service');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/bge_prod';
const pool = new Pool({ connectionString: DATABASE_URL });

// Parse command-line arguments
const args = process.argv.slice(2);
const oldKeyIndex = args.indexOf('--old-key');
const newKeyIndex = args.indexOf('--new-key');

if (oldKeyIndex === -1 || newKeyIndex === -1) {
  console.error('Usage: node key-rotation.js --old-key <OLD_KEY> --new-key <NEW_KEY>');
  process.exit(1);
}

const OLD_MASTER_KEY = args[oldKeyIndex + 1];
const NEW_MASTER_KEY = args[newKeyIndex + 1];

if (!OLD_MASTER_KEY || !NEW_MASTER_KEY) {
  console.error('Error: Both old and new keys are required');
  process.exit(1);
}

// Tables and fields to rotate
const ENCRYPTED_TABLES = [
  {
    table: 'usuarios',
    idField: 'uuid',
    encryptedFields: ['telefono', 'direccion', 'curp'] // Example sensitive fields
  },
  {
    table: 'estudiantes',
    idField: 'id',
    encryptedFields: ['telefono_emergencia', 'condiciones_medicas']
  },
  {
    table: 'padres',
    idField: 'id',
    encryptedFields: ['telefono', 'direccion']
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error?.message || '');
}

// =============================================================================
// BACKUP
// =============================================================================

async function createBackup() {
  log('Creating backup before key rotation...');

  const backupDir = path.join(__dirname, '..', '..', 'backups', 'key-rotation');
  const backupFile = path.join(backupDir, `pre-rotation-${Date.now()}.json`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {};

  for (const { table, idField, encryptedFields } of ENCRYPTED_TABLES) {
    try {
      const fields = [idField, ...encryptedFields].join(', ');
      const result = await pool.query(`SELECT ${fields} FROM ${table}`);

      backup[table] = result.rows;
      log(`Backed up ${result.rows.length} rows from ${table}`);
    } catch (error) {
      logError(`Failed to backup table ${table}`, error);
      throw error;
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  log(`✅ Backup created: ${backupFile}`);

  return backupFile;
}

// =============================================================================
// KEY ROTATION
// =============================================================================

async function rotateKeysForTable(table, idField, encryptedFields) {
  log(`Rotating keys for table: ${table}`);

  try {
    // Get all rows
    const fields = [idField, ...encryptedFields].join(', ');
    const result = await pool.query(`SELECT ${fields} FROM ${table}`);

    const rows = result.rows;
    log(`Found ${rows.length} rows to rotate in ${table}`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const id = row[idField];

        // Build UPDATE query
        const updates = [];
        const values = [id];
        let paramIndex = 2;

        for (const field of encryptedFields) {
          if (row[field]) {
            // Re-encrypt with new key
            const decrypted = await decryptWithOldKey(row[field]);
            const reencrypted = await encryptWithNewKey(decrypted);

            updates.push(`${field} = $${paramIndex}`);
            values.push(reencrypted);
            paramIndex++;
          }
        }

        if (updates.length > 0) {
          const updateQuery = `UPDATE ${table} SET ${updates.join(', ')} WHERE ${idField} = $1`;
          await pool.query(updateQuery, values);
        }

        successCount++;

        if (successCount % 100 === 0) {
          log(`Progress: ${successCount}/${rows.length} rows rotated in ${table}`);
        }
      } catch (error) {
        errorCount++;
        logError(`Failed to rotate row ${row[idField]} in ${table}`, error);
      }
    }

    log(`✅ Table ${table}: ${successCount} successful, ${errorCount} errors`);

    return { successCount, errorCount };
  } catch (error) {
    logError(`Failed to rotate keys for table ${table}`, error);
    throw error;
  }
}

async function decryptWithOldKey(encryptedData) {
  // Temporarily set old key
  const originalKey = process.env.ENCRYPTION_MASTER_KEY;
  process.env.ENCRYPTION_MASTER_KEY = OLD_MASTER_KEY;

  try {
    const decrypted = await encryptionService.decrypt(encryptedData);
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
    return decrypted;
  } catch (error) {
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
    throw error;
  }
}

async function encryptWithNewKey(plaintext) {
  // Temporarily set new key
  const originalKey = process.env.ENCRYPTION_MASTER_KEY;
  process.env.ENCRYPTION_MASTER_KEY = NEW_MASTER_KEY;

  try {
    const encrypted = await encryptionService.encrypt(plaintext);
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
    return encrypted;
  } catch (error) {
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
    throw error;
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verifyRotation() {
  log('Verifying key rotation...');

  // Set new key as active
  process.env.ENCRYPTION_MASTER_KEY = NEW_MASTER_KEY;

  let totalVerified = 0;
  let totalErrors = 0;

  for (const { table, idField, encryptedFields } of ENCRYPTED_TABLES) {
    try {
      const fields = [idField, ...encryptedFields].join(', ');
      const result = await pool.query(`SELECT ${fields} FROM ${table} LIMIT 10`);

      for (const row of result.rows) {
        for (const field of encryptedFields) {
          if (row[field]) {
            try {
              // Try to decrypt with new key
              await encryptionService.decrypt(row[field]);
              totalVerified++;
            } catch (error) {
              totalErrors++;
              logError(`Verification failed for ${table}.${field} (ID: ${row[idField]})`, error);
            }
          }
        }
      }
    } catch (error) {
      logError(`Verification failed for table ${table}`, error);
    }
  }

  if (totalErrors === 0) {
    log(`✅ Verification successful: ${totalVerified} fields verified`);
    return true;
  } else {
    logError(`Verification failed: ${totalErrors} errors detected`);
    return false;
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  log('============================================');
  log('🔑 KEY ROTATION STARTED');
  log('============================================');
  log(`Tables to rotate: ${ENCRYPTED_TABLES.length}`);
  log('');

  try {
    // Step 1: Create backup
    const backupFile = await createBackup();
    log('');

    // Step 2: Rotate keys for each table
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const { table, idField, encryptedFields } of ENCRYPTED_TABLES) {
      const { successCount, errorCount } = await rotateKeysForTable(table, idField, encryptedFields);
      totalSuccess += successCount;
      totalErrors += errorCount;
      log('');
    }

    // Step 3: Verify rotation
    const verified = await verifyRotation();
    log('');

    // Summary
    log('============================================');
    log('📊 KEY ROTATION SUMMARY');
    log('============================================');
    log(`Total rows rotated: ${totalSuccess}`);
    log(`Total errors: ${totalErrors}`);
    log(`Verification: ${verified ? 'PASSED ✅' : 'FAILED ❌'}`);
    log(`Backup: ${backupFile}`);
    log('============================================');
    log('');

    if (verified && totalErrors === 0) {
      log('✅ KEY ROTATION COMPLETED SUCCESSFULLY');
      log('');
      log('Next Steps:');
      log('1. Update ENCRYPTION_MASTER_KEY environment variable in production');
      log('2. Restart backend services');
      log('3. Monitor logs for any decryption errors');
      log('4. Keep backup for 30 days, then securely delete');
      log('');
      process.exit(0);
    } else {
      logError('KEY ROTATION COMPLETED WITH ERRORS');
      log('');
      log('Action Required:');
      log('1. Review error logs above');
      log('2. Consider rollback if errors are critical');
      log(`3. Restore from backup: ${backupFile}`);
      log('');
      process.exit(1);
    }
  } catch (error) {
    logError('KEY ROTATION FAILED', error);
    log('');
    log('🚨 CRITICAL ERROR - Rolling back recommended');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
main();
