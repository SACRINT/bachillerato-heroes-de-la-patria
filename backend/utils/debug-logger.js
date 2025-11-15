/**
 * Debug Logger Backend - Logging condicional para Node.js
 * Solo loguea si NODE_ENV es 'development'
 */

const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = {
  log: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${tag}] ${message}`, data || '');
  },

  warn: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`[${timestamp}] [${tag}] ${message}`, data || '');
  },

  error: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] [${tag}] ${message}`, data || '');
  }
};

module.exports = { debugLog };
