/**
 * Encrypt plaintext with AES-256-GCM
 *
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Base64-encoded encrypted data (salt:iv:tag:ciphertext)
 */
export function encrypt(plaintext: string): string;
/**
 * Decrypt ciphertext with AES-256-GCM
 *
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData: string): string;
/**
 * Encrypt sensitive fields in an object
 *
 * @param {Object} data - Object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptFields(data: any, fields?: Array<string>): any;
/**
 * Decrypt sensitive fields in an object
 *
 * @param {Object} data - Object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptFields(data: any, fields?: Array<string>): any;
/**
 * Re-encrypt data with new master key
 *
 * @param {string} encryptedData - Data encrypted with old key
 * @param {string} oldMasterKey - Previous master key
 * @returns {string} Data re-encrypted with new master key
 */
export function rotateKey(encryptedData: string, oldMasterKey: string): string;
/**
 * Hash data with SHA-256 (one-way)
 *
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
export function hash(data: string): string;
/**
 * Verify data against hash
 *
 * @param {string} data - Data to verify
 * @param {string} hashValue - Expected hash
 * @returns {boolean} True if match
 */
export function verifyHash(data: string, hashValue: string): boolean;
export const ALGORITHM: "aes-256-gcm";
export const KEY_LENGTH: 32;
export const IV_LENGTH: 16;
//# sourceMappingURL=encryption-service.d.ts.map