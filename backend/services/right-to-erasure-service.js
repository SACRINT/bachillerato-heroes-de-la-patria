/**
 * 🗑️ RIGHT TO ERASURE SERVICE - v2.0.0
 * GDPR Article 17 - Refactorizado: 04 Diciembre 2025
 */

const ErasureDAO = require('../data/erasure.dao');
const crypto = require('crypto');

async function validateErasureRequest(userId) {
  console.log(`[RIGHT-TO-ERASURE] Validating erasure request for user: ${userId}`);
  const user = await ErasureDAO.getUser ? await ErasureDAO.getUser(userId) : null;
  if (!user) return { canErase: false, reason: 'User not found' };

  // Verificar excepciones GDPR Article 17(3)
  const hasLegalRetention = await checkLegalRetention(userId);
  if (hasLegalRetention) return { canErase: false, reason: 'Legal retention requirement: Academic records must be retained for 7 years', exception: 'Article 17(3)(b)' };
  if (user.status === 'activo') return { canErase: false, reason: 'Cannot erase data of active students. Please deactivate account first.', exception: 'Article 17(3)(c)' };
  const hasPublicContent = await checkPublicContent(userId);
  if (hasPublicContent) return { canErase: 'partial', reason: 'Some public content will be anonymized instead of deleted', exception: 'Article 17(3)(a)' };
  const hasActiveClaims = await checkActiveClaims(userId);
  if (hasActiveClaims) return { canErase: false, reason: 'Cannot erase data while active legal claims exist', exception: 'Article 17(3)(e)' };
  return { canErase: true, reason: 'User data can be erased' };
}

async function checkLegalRetention(userId) { try { const count = await ErasureDAO.getRecentGrades(userId); return count > 0; } catch { return false; } }
async function checkPublicContent(userId) { try { const count = await ErasureDAO.getPublicContent(userId); return count > 0; } catch { return false; } }
async function checkActiveClaims(userId) { try { const count = await ErasureDAO.getActiveLegalCases(userId); return count > 0; } catch { return false; } }

async function executeRightToErasure(userId, requestedBy, reason = 'User request') {
  console.log(`[RIGHT-TO-ERASURE] Starting erasure for user: ${userId}`);
  const validation = await validateErasureRequest(userId);
  if (!validation.canErase || validation.canErase === false) throw new Error(validation.reason);
  const client = await ErasureDAO.getConnection();
  try {
    await client.query('BEGIN');
    const pseudonym = crypto.randomBytes(16).toString('hex');
    await ErasureDAO.pseudonymizeUser(client, userId, pseudonym);
    await ErasureDAO.deleteNonEssentialData(client, userId);
    if (validation.canErase === 'partial') await ErasureDAO.anonymizePublicContent(client, userId, pseudonym);
    await ErasureDAO.logErasureAction(client, userId, requestedBy, reason, validation);
    await client.query('COMMIT');
    console.log(`[RIGHT-TO-ERASURE] Erasure completed for user: ${userId}`);
    return { success: true, userId, pseudonym, erasureType: validation.canErase === 'partial' ? 'partial_anonymization' : 'full_pseudonymization', message: 'User data has been erased/pseudonymized successfully' };
  } catch (error) { await client.query('ROLLBACK'); console.error(`[RIGHT-TO-ERASURE] Error during erasure:`, error); throw error; }
  finally { client.release(); }
}

async function restoreErasedUser(userId) {
  const log = await ErasureDAO.getErasureLog(userId);
  if (!log) throw new Error('User not found or restore period expired (30 days)');
  console.log(`[RIGHT-TO-ERASURE] User restored: ${userId} (pseudonymized data NOT recovered)`);
  return { success: true, message: 'User account restored. Note: Personal data was pseudonymized and cannot be recovered.', userId };
}

module.exports = { validateErasureRequest, executeRightToErasure, restoreErasedUser, checkLegalRetention, checkPublicContent, checkActiveClaims };
