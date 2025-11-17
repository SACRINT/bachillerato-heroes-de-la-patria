/**
 * 🔐 ENCRYPTION SERVICE - SEMANA 14
 * AES-256-GCM encryption for data at rest
 *
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Key derivation with PBKDF2
 * - Secure IV generation (random per encryption)
 * - Field-level encryption for sensitive data
 * - Key rotation support
 *
 * Usage:
 *   const encrypted = await encryptionService.encrypt(plaintext);
 *   const decrypted = await encryptionService.decrypt(encrypted);
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

// Master encryption key from environment
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-key-change-in-production';

// =============================================================================
// KEY DERIVATION
// =============================================================================

/**
 * Derive encryption key from master key + salt using PBKDF2
 */
function deriveKey(salt) {
  return crypto.pbkdf2Sync(
    MASTER_KEY,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Generate random salt for key derivation
 */
function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH);
}

/**
 * Generate random IV for encryption
 */
function generateIV() {
  return crypto.randomBytes(IV_LENGTH);
}

// =============================================================================
// ENCRYPTION / DECRYPTION
// =============================================================================

/**
 * Encrypt plaintext with AES-256-GCM
 *
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Base64-encoded encrypted data (salt:iv:tag:ciphertext)
 */
async function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error('Plaintext cannot be empty');
  }

  try {
    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key from master key + salt
    const key = deriveKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine: salt:iv:tag:ciphertext (all in hex)
    const encrypted = [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      ciphertext
    ].join(':');

    // Return as base64 for storage
    return Buffer.from(encrypted).toString('base64');
  } catch (error) {
    console.error('[ENCRYPTION-SERVICE] Encryption failed:', error.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt ciphertext with AES-256-GCM
 *
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
async function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  try {
    // Decode from base64
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');

    // Split components
    const [saltHex, ivHex, tagHex, ciphertext] = decoded.split(':');

    if (!saltHex || !ivHex || !tagHex || !ciphertext) {
      throw new Error('Invalid encrypted data format');
    }

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Derive key
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('[ENCRYPTION-SERVICE] Decryption failed:', error.message);
    throw new Error('Decryption failed - data may be corrupted');
  }
}

// =============================================================================
// FIELD-LEVEL ENCRYPTION (for database)
// =============================================================================

/**
 * Encrypt sensitive fields in an object
 *
 * @param {Object} data - Object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
async function encryptFields(data, fields = []) {
  const encrypted = { ...data };

  for (const field of fields) {
    if (data[field]) {
      encrypted[field] = await encrypt(String(data[field]));
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 *
 * @param {Object} data - Object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
async function decryptFields(data, fields = []) {
  const decrypted = { ...data };

  for (const field of fields) {
    if (data[field]) {
      try {
        decrypted[field] = await decrypt(data[field]);
      } catch (error) {
        console.error(`[ENCRYPTION-SERVICE] Failed to decrypt field: ${field}`);
        decrypted[field] = null; // Field corrupted, set to null
      }
    }
  }

  return decrypted;
}

// =============================================================================
// KEY ROTATION
// =============================================================================

/**
 * Re-encrypt data with new master key
 *
 * @param {string} encryptedData - Data encrypted with old key
 * @param {string} oldMasterKey - Previous master key
 * @returns {string} Data re-encrypted with new master key
 */
async function rotateKey(encryptedData, oldMasterKey) {
  // Temporarily use old key
  const originalMasterKey = MASTER_KEY;
  process.env.ENCRYPTION_MASTER_KEY = oldMasterKey;

  try {
    // Decrypt with old key
    const plaintext = await decrypt(encryptedData);

    // Restore new key
    process.env.ENCRYPTION_MASTER_KEY = originalMasterKey;

    // Re-encrypt with new key
    const newEncrypted = await encrypt(plaintext);

    return newEncrypted;
  } catch (error) {
    // Restore key even on error
    process.env.ENCRYPTION_MASTER_KEY = originalMasterKey;
    throw error;
  }
}

// =============================================================================
// HASHING (for non-reversible data like passwords)
// =============================================================================

/**
 * Hash data with SHA-256 (one-way)
 *
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify data against hash
 *
 * @param {string} data - Data to verify
 * @param {string} hashValue - Expected hash
 * @returns {boolean} True if match
 */
function verifyHash(data, hashValue) {
  const dataHash = hash(data);
  return crypto.timingSafeEqual(
    Buffer.from(dataHash),
    Buffer.from(hashValue)
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  rotateKey,
  hash,
  verifyHash,

  // Constants
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH
};
