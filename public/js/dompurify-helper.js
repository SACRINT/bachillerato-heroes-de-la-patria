/**
 * 🛡️ DOMPURIFY HELPER - Wrapper para sanitización XSS
 * Sistema unificado de sanitización con configuraciones por contexto
 * Fase 2 Bloque 4 - XSS Remediation
 */

// ============================================
// CONFIGURACIONES DOMPURIFY POR CONTEXTO
// ============================================

const DOMPURIFY_CONFIG_TABLAS = {
  ALLOWED_TAGS: ['div', 'p', 'span', 'table', 'tr', 'td', 'thead', 'tbody', 'th', 'strong', 'em', 'a', 'br', 'ul', 'li', 'ol', 'button', 'i'],
  ALLOWED_ATTR: ['class', 'id', 'data-*', 'href', 'target', 'rel', 'aria-*', 'role', 'type', 'disabled'],
  ALLOW_DATA_ATTR: true,
  ALLOW_ARIA_ATTR: true,
  KEEP_CONTENT: true
};

const DOMPURIFY_CONFIG_FORMULARIOS = {
  ALLOWED_TAGS: ['span', 'div', 'p', 'em', 'strong', 'small', 'a', 'i', 'button'],
  ALLOWED_ATTR: ['class', 'id', 'role', 'aria-*', 'type'],
  ALLOW_ARIA_ATTR: true,
  KEEP_CONTENT: true
};

const DOMPURIFY_CONFIG_UGC = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  RETURN_DOM: false
};

const DOMPURIFY_CONFIG_SIMPLE = {
  ALLOWED_TAGS: ['div', 'p', 'span', 'a', 'strong', 'em', 'i', 'br', 'small'],
  ALLOWED_ATTR: ['class', 'id', 'role', 'aria-*'],
  ALLOW_ARIA_ATTR: true,
  KEEP_CONTENT: true
};

// ✅ CONFIGURACIÓN PARA HEADER/FOOTER (18 Nov 2025)
// Header y footer son contenido NUESTRO (no user-generated), necesitan más tags
const DOMPURIFY_CONFIG_PARTIALS = {
  ALLOWED_TAGS: ['nav', 'header', 'footer', 'div', 'ul', 'li', 'a', 'button', 'span', 'img', 'i', 'small', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'br', 'hr', 'input', 'label', 'form', 'select', 'option', 'textarea', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'script', 'link', 'style'],
  ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'title', 'target', 'rel', 'type', 'data-*', 'aria-*', 'role', 'style', 'placeholder', 'value', 'name', 'for', 'width', 'height', 'tabindex', 'data-bs-toggle', 'data-bs-target', 'data-bs-dismiss', 'data-action', 'data-tenant', 'onclick'],
  ALLOW_DATA_ATTR: true,
  ALLOW_ARIA_ATTR: true,
  KEEP_CONTENT: true,
  ADD_TAGS: ['script', 'link'],  // Permitir scripts y links del header
  ADD_ATTR: ['src', 'rel', 'href'],  // Atributos para scripts y links
  FORCE_BODY: false
};

// ============================================
// FUNCIÓN HELPER: sanitizeHTML()
// ============================================

/**
 * Sanitizar HTML usando DOMPurify con configuración automática
 * @param {string} html - HTML a sanitizar
 * @param {string} context - Contexto: 'tablas' | 'formularios' | 'ugc' | 'simple'
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(html, context = 'tablas') {
  // Verificar si DOMPurify está disponible
  if (typeof DOMPurify === 'undefined') {
    console.error('[XSS] DOMPurify no disponible. Retornando string vacío por seguridad.');
    return '';
  }

  // Si html es null o undefined, retornar string vacío
  if (html === null || html === undefined) {
    return '';
  }

  // Convertir a string si no lo es
  html = String(html);

  // Seleccionar configuración según contexto
  let config;
  switch (context.toLowerCase()) {
    case 'tablas':
    case 'table':
    case 'data':
      config = DOMPURIFY_CONFIG_TABLAS;
      break;

    case 'formularios':
    case 'forms':
    case 'form':
      config = DOMPURIFY_CONFIG_FORMULARIOS;
      break;

    case 'ugc':
    case 'user':
    case 'content':
      config = DOMPURIFY_CONFIG_UGC;
      break;

    case 'simple':
    case 'basic':
      config = DOMPURIFY_CONFIG_SIMPLE;
      break;

    case 'partials':
    case 'header':
    case 'footer':
    case 'partial':
      config = DOMPURIFY_CONFIG_PARTIALS;
      break;

    default:
      // Si no se reconoce el contexto, usar configuración más restrictiva
      console.warn(`[XSS] Contexto "${context}" no reconocido. Usando config SIMPLE por seguridad.`);
      config = DOMPURIFY_CONFIG_SIMPLE;
  }

  // Sanitizar y retornar
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitizar texto plano (sin tags HTML permitidos)
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado (solo texto, sin HTML)
 */
function sanitizeText(text) {
  if (typeof DOMPurify === 'undefined') {
    console.error('[XSS] DOMPurify no disponible.');
    return String(text || '').replace(/[<>]/g, '');
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

// ============================================
// EXPORTAR A WINDOW PARA USO GLOBAL
// ============================================

if (typeof window !== 'undefined') {
  window.sanitizeHTML = sanitizeHTML;
  window.sanitizeText = sanitizeText;

  // También exportar configuraciones para uso directo
  window.DOMPURIFY_CONFIG = {
    TABLAS: DOMPURIFY_CONFIG_TABLAS,
    FORMULARIOS: DOMPURIFY_CONFIG_FORMULARIOS,
    UGC: DOMPURIFY_CONFIG_UGC,
    SIMPLE: DOMPURIFY_CONFIG_SIMPLE,
    PARTIALS: DOMPURIFY_CONFIG_PARTIALS
  };

  console.log('✅ [DOMPURIFY-HELPER] Funciones de sanitización cargadas globalmente');
}

// Para módulos (si se usa en Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    sanitizeText,
    DOMPURIFY_CONFIG_TABLAS,
    DOMPURIFY_CONFIG_FORMULARIOS,
    DOMPURIFY_CONFIG_UGC,
    DOMPURIFY_CONFIG_SIMPLE,
    DOMPURIFY_CONFIG_PARTIALS
  };
}
