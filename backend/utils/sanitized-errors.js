/**
 * Sanitized Errors - Remover datos sensibles de error logs
 * GDPR Compliance: Nunca loguear PII
 */

function sanitizeError(error, context = 'unknown') {
  // Solo preservar información no-sensible
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    context: context,
    timestamp: new Date().toISOString(),
    // NO INCLUIR: error.stack, error.sql, user data, passwords, tokens
  };
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***';
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '***-****';
  return `${phone.substring(phone.length - 4)}`;
}

function maskToken(token) {
  if (!token) return '***';
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

module.exports = {
  sanitizeError,
  maskEmail,
  maskPhone,
  maskToken
};
