/**
 * 🔐 TWO FACTOR AUTH SERVICE - SEMANA 16
 * Autenticación de dos factores
 *
 * Features:
 * - TOTP (Time-based OTP)
 * - Backup codes
 * - QR code generation
 * - Verificación
 * - Recovery
 *
 * Fecha: 20 Noviembre 2025
 */

const crypto = require('crypto');
const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class TwoFactorService {
  constructor() {
    this.issuer = 'BGE Heroes de la Patria';
    this.algorithm = 'SHA1';
    this.digits = 6;
    this.period = 30;
  }

  async enable(userId) {
    // Generar secret
    const secret = this.generateSecret();

    // Generar backup codes
    const backupCodes = this.generateBackupCodes();

    // Guardar en BD
    await pool.query(`
      INSERT INTO user_2fa (user_id, secret, backup_codes, enabled, created_at)
      VALUES ($1, $2, $3, false, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET secret = $2, backup_codes = $3, enabled = false
    `, [userId, secret, JSON.stringify(backupCodes)]);

    // Obtener email del usuario para QR
    const user = await pool.query('SELECT email FROM usuarios WHERE id = $1', [userId]);
    const email = user.rows[0]?.email || 'user@bge.edu.mx';

    return {
      success: true,
      secret,
      qrUri: this.generateQRUri(email, secret),
      backupCodes
    };
  }

  async verify(userId, token) {
    const record = await pool.query(`
      SELECT secret, enabled FROM user_2fa WHERE user_id = $1
    `, [userId]);

    if (!record.rows.length) {
      return { success: false, message: '2FA no configurado' };
    }

    const { secret, enabled } = record.rows[0];

    if (this.verifyToken(token, secret)) {
      // Si es primera verificación, habilitar 2FA
      if (!enabled) {
        await pool.query(`
          UPDATE user_2fa SET enabled = true WHERE user_id = $1
        `, [userId]);
      }

      return { success: true };
    }

    return { success: false, message: 'Código inválido' };
  }

  async verifyBackupCode(userId, code) {
    const record = await pool.query(`
      SELECT backup_codes FROM user_2fa WHERE user_id = $1
    `, [userId]);

    if (!record.rows.length) {
      return { success: false };
    }

    let backupCodes = JSON.parse(record.rows[0].backup_codes || '[]');
    const index = backupCodes.indexOf(code);

    if (index === -1) {
      return { success: false, message: 'Código de respaldo inválido' };
    }

    // Eliminar código usado
    backupCodes.splice(index, 1);

    await pool.query(`
      UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2
    `, [JSON.stringify(backupCodes), userId]);

    return {
      success: true,
      remainingCodes: backupCodes.length
    };
  }

  async disable(userId) {
    await pool.query(`
      UPDATE user_2fa SET enabled = false WHERE user_id = $1
    `, [userId]);

    return { success: true };
  }

  async isEnabled(userId) {
    const result = await pool.query(`
      SELECT enabled FROM user_2fa WHERE user_id = $1
    `, [userId]);

    return result.rows[0]?.enabled || false;
  }

  generateSecret() {
    return crypto.randomBytes(20).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  }

  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  generateQRUri(email, secret) {
    const label = encodeURIComponent(`${this.issuer}:${email}`);
    const params = new URLSearchParams({
      secret,
      issuer: this.issuer,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period
    });

    return `otpauth://totp/${label}?${params}`;
  }

  verifyToken(token, secret) {
    // Verificar token actual y anterior (tolerancia de tiempo)
    const currentToken = this.generateToken(secret, 0);
    const previousToken = this.generateToken(secret, -1);
    const nextToken = this.generateToken(secret, 1);

    return token === currentToken || token === previousToken || token === nextToken;
  }

  generateToken(secret, offset = 0) {
    const counter = Math.floor(Date.now() / 1000 / this.period) + offset;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    const offsetByte = hash[hash.length - 1] & 0x0f;
    const code = (
      ((hash[offsetByte] & 0x7f) << 24) |
      ((hash[offsetByte + 1] & 0xff) << 16) |
      ((hash[offsetByte + 2] & 0xff) << 8) |
      (hash[offsetByte + 3] & 0xff)
    ) % Math.pow(10, this.digits);

    return code.toString().padStart(this.digits, '0');
  }

  async regenerateBackupCodes(userId) {
    const backupCodes = this.generateBackupCodes();

    await pool.query(`
      UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2
    `, [JSON.stringify(backupCodes), userId]);

    return {
      success: true,
      backupCodes
    };
  }
}

module.exports = new TwoFactorService();
