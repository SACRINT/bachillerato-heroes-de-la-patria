/**
 * 🔐 WEBAUTHN DAO - TypeScript
 * Data Access Object para autenticación biométrica FIDO2/WebAuthn
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface WebAuthnCredential {
    id: number;
    user_id: number;
    credential_id: string; // Base64URL string likely
    public_key: string;
    counter: number;
    transports: string[];
    device_name: string;
    aaguid: string;
    created_at: Date;
    last_used: Date;
}

export interface StoreCredentialInput {
    userId: number;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    deviceName: string;
    aaguid: string;
}

// =====================================================
// WEBAUTHN DAO CLASS
// =====================================================

class WebAuthnDAO {

    static async storeChallenge(userId: number, challenge: string, type: string): Promise<void> {
        await pool.query(`INSERT INTO webauthn_challenges (user_id, challenge, challenge_type, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, challenge_type) DO UPDATE SET challenge = $2, created_at = NOW()`, [userId, challenge, type]);
    }

    static async getChallenge(userId: number, type: string): Promise<string | undefined> {
        const result = await pool.query('SELECT challenge FROM webauthn_challenges WHERE user_id = $1 AND challenge_type = $2 AND created_at > NOW() - INTERVAL \'5 minutes\'', [userId, type]);
        return result.rows[0]?.challenge;
    }

    static async clearChallenge(userId: number, type: string): Promise<void> {
        await pool.query('DELETE FROM webauthn_challenges WHERE user_id = $1 AND challenge_type = $2', [userId, type]);
    }

    static async storeCredential(data: StoreCredentialInput): Promise<WebAuthnCredential> {
        const { userId, credentialId, publicKey, counter, transports, deviceName, aaguid } = data;
        const result = await pool.query(`INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports, device_name, aaguid, created_at, last_used) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`, [userId, credentialId, publicKey, counter, JSON.stringify(transports || []), deviceName, aaguid]);
        return result.rows[0];
    }

    static async getUserCredentials(userId: number): Promise<WebAuthnCredential[]> {
        const result = await pool.query('SELECT * FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return result.rows;
    }

    static async getCredentialByCredentialId(credentialId: string): Promise<WebAuthnCredential | null> {
        const result = await pool.query('SELECT * FROM webauthn_credentials WHERE credential_id = $1', [credentialId]);
        return result.rows[0] || null;
    }

    static async updateCounter(id: number, newCounter: number): Promise<void> {
        await pool.query('UPDATE webauthn_credentials SET counter = $1, last_used = NOW() WHERE id = $2', [newCounter, id]);
    }

    static async updateLastUsed(id: number): Promise<void> {
        await pool.query('UPDATE webauthn_credentials SET last_used = NOW() WHERE id = $1', [id]);
    }

    static async deleteCredential(id: number, userId: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
        return (result.rowCount || 0) > 0;
    }

    static async hasCredentials(userId: number): Promise<boolean> {
        const result = await pool.query('SELECT COUNT(*) FROM webauthn_credentials WHERE user_id = $1', [userId]);
        return parseInt(result.rows[0].count) > 0;
    }
}

export default WebAuthnDAO;
module.exports = WebAuthnDAO;
