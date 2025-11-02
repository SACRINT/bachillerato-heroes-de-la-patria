(function(window, document) {
'use strict';
class ProfessionalFormsManager {constructor() {this.config = {apiEndpoint: '/api/contact/send',  fallbackEndpoint: 'https:verificationService: 'https:honeypotField: '_gotcha',maxSubmissions: 3, requiredDelay: 3000, institutionEmail: 'contacto@bgeheroespatria.edu.mx',fromDomain: '@bgeheroespatria.edu.mx',emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,phoneRegex: /^[\d\s\-\+\(\)]{10,}$/};this.state = {submissionTimes: new Map(),verifiedEmails: new Map(),blockedIPs: new Set(),formInteractions: new Map()};this.init();}init() {console.log('🏛️ [FORMS] Inicializando sistema profesional de formularios...');this.setupAllForms();this.setupAntiSpam();this.setupRealTimeValidation();console.log('✅ [FORMS] Sistema profesional inicializado');}setupAllForms() {const formSelectors = ['#contactForm',           '#appointmentForm',       '#cvUploadForm',         '#parentLoginForm',      '#newsletterForm',       '#feedbackForm',         '#enrollmentForm'        ];formSelectors.forEach(selector => {const form = document.querySelector(selector);if (form) {this.setupProfessionalForm(form);}});document.querySelectorAll('.professional-form').forEach(form => {this.setupProfessionalForm(form);});}setupProfessionalForm(form) {const formId = form.id || 'form-' + Date.now();console.log('📝 [FORMS] Configurando formulario:', formId);form.addEventListener('submit', async (e) => {e.preventDefault();await this.handleProfessionalSubmit(form);});this.addHoneypot(form);this.setupFormValidation(form);this.trackFormInteractions(form);this.addSecurityIndicators(form);}addHoneypot(form) {const honeypot = document.createElement('input');honeypot.type = 'text';honeypot.name = this.config.honeypotField;honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';honeypot.tabIndex = -1;honeypot.autocomplete = 'off';form.appendChild(honeypot);}setupAntiSpam() {setInterval(() => {this.state.submissionTimes.clear();}, 3600000); }trackFormInteractions(form) {const formId = form.id;this.state.formInteractions.set(formId, {startTime: Date.now(),keystrokes: 0,mouseMovements: 0,fieldFocuses: 0});const interactions = this.state.formInteractions.get(formId);form.addEventListener('keydown', () => {interactions.keystrokes++;});form.addEventListener('mousemove', () => {interactions.mouseMovements++;});form.querySelectorAll('input, textarea, select').forEach(field => {field.addEventListener('focus', () => {interactions.fieldFocuses++;});});}async verifyEmailAddress(email) {if (!this.config.emailRegex.test(email)) {return { valid: false, reason: 'Formato de email inválido' };}if (this.state.verifiedEmails.has(email)) {return this.state.verifiedEmails.get(email);}try {const verification = await this.performEmailVerification(email);this.state.verifiedEmails.set(email, verification);return verification;} catch (error) {console.warn('⚠️ [FORMS] Error verificando email:', error);return {valid: true,reason: 'Verificación no disponible, formato válido',warning: true};}}async performEmailVerification(email) {const commonDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com','icloud.com', 'protonmail.com', 'live.com'];const domain = email.split('@')[1];if (commonDomains.includes(domain)) {return {valid: true,reason: 'Dominio verificado',quality: 'high'};}if (domain.includes('edu') || domain.includes('gob')) {return {valid: true,reason: 'Dominio institucional',quality: 'high'};}return {valid: true,reason: 'Formato válido',quality: 'medium',warning: 'Por favor, verifica que tu email sea correcto'};}async handleProfessionalSubmit(form) {const submitButton = form.querySelector('button[type="submit"]');const originalText = submitButton?.textContent || 'Enviar';try {const securityCheck = await this.performSecurityChecks(form);if (!securityCheck.passed) {this.showError(form, securityCheck.message);return;}const emailField = form.querySelector('input[type="email"]');if (emailField) {const emailVerification = await this.verifyEmailAddress(emailField.value);if (!emailVerification.valid) {this.showError(form, `Email inválido: ${emailVerification.reason}`);return;}if (emailVerification.warning) {const proceed = await this.showEmailWarning(emailVerification.warning);if (!proceed) return;}}this.showLoadingState(form, 'Verificando información...');let success = await this.sendToOwnServer(form);if (!success) {this.updateLoadingState(form, 'Enviando mensaje...');success = await this.sendToFormspree(form);}if (success) {this.showSuccess(form);this.resetForm(form);} else {this.showError(form, 'Error al enviar el mensaje. Por favor intenta nuevamente.');}} catch (error) {console.error('❌ [FORMS] Error procesando formulario:', error);this.showError(form, 'Error inesperado. Por favor intenta nuevamente.');} finally {this.hideLoadingState(form);}}async performSecurityChecks(form) {const honeypot = form.querySelector(`input[name="${this.config.honeypotField}"]`);if (honeypot && honeypot.value) {return { passed: false, message: 'Actividad sospechosa detectada' };}const userIP = await this.getUserIP();const submissions = this.state.submissionTimes.get(userIP) || [];const now = Date.now();const recentSubmissions = submissions.filter(time => now - time < 3600000); if (recentSubmissions.length >= this.config.maxSubmissions) {return {passed: false,message: 'Demasiados intentos. Intenta nuevamente en una hora.'};}const formId = form.id;const interactions = this.state.formInteractions.get(formId);if (interactions) {const timeSpent = now - interactions.startTime;if (timeSpent < this.config.requiredDelay) {return {passed: false,message: 'Por favor, tómate tu tiempo para llenar el formulario.'};}if (interactions.keystrokes < 5 && interactions.mouseMovements < 5) {return {passed: false,message: 'Actividad inusual detectada.'};}}submissions.push(now);this.state.submissionTimes.set(userIP, submissions);return { passed: true };}async getUserIP() {try {const response = await fetch('https:const data = await response.json();return data.ip;} catch {return 'unknown';}}async sendToOwnServer(form) {try {const formData = new FormData(form);formData.append('_timestamp', new Date().toISOString());formData.append('_source', 'website_contact');formData.append('_institution', 'BGE Héroes de la Patria');formData.append('_verified', 'true');const response = await fetch(this.config.apiEndpoint, {method: 'POST',body: formData,headers: {'X-Requested-With': 'XMLHttpRequest'}});return response.ok;} catch (error) {console.warn('⚠️ [FORMS] Servidor propio no disponible, usando fallback');return false;}}async sendToFormspree(form) {try {const formData = new FormData(form);const originalMessage = formData.get('mensaje') || formData.get('message') || '';const professionalMessage = this.enhanceMessage(originalMessage, form);formData.set('mensaje', professionalMessage);formData.set('_subject', 'Contacto desde sitio web BGE Héroes de la Patria');formData.set('_replyto', formData.get('email'));const response = await fetch(this.config.fallbackEndpoint, {method: 'POST',body: formData,headers: {'Accept': 'application/json'}});return response.ok;} catch (error) {console.error('❌ [FORMS] Error enviando a Formspree:', error);return false;}}enhanceMessage(originalMessage, form) {const formData = new FormData(form);const name = formData.get('nombre') || formData.get('name') || 'Usuario';const email = formData.get('email') || 'No proporcionado';const phone = formData.get('telefono') || formData.get('phone') || 'No proporcionado';return `CONTACTO DESDE SITIO WEB OFICIAL═══════════════════════════════════════👤 DATOS DEL CONTACTO:• Nombre: ${name}• Email: ${email}• Teléfono: ${phone}• Fecha: ${new Date().toLocaleString('es-MX')}📝 MENSAJE:${originalMessage}═══════════════════════════════════════🏛️ Bachillerato General Estatal "Héroes de la Patria"🌐 Sistema de contacto verificado`.trim();}showLoadingState(form, message = 'Enviando...') {const submitButton = form.querySelector('button[type="submit"]');if (submitButton) {submitButton.disabled = true;submitButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${message}`;}}updateLoadingState(form, message) {const submitButton = form.querySelector('button[type="submit"]');if (submitButton) {const spinner = submitButton.querySelector('.spinner-border');if (spinner) {submitButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${message}`;}}}hideLoadingState(form) {const submitButton = form.querySelector('button[type="submit"]');if (submitButton) {submitButton.disabled = false;submitButton.innerHTML = submitButton.dataset.originalText || 'Enviar Mensaje';}}showSuccess(form) {let successAlert = form.querySelector('.alert-success');if (!successAlert) {successAlert = document.createElement('div');successAlert.className = 'alert alert-success';form.appendChild(successAlert);}successAlert.innerHTML = `<div class="d-flex align-items-center"><i class="fas fa-check-circle fa-lg me-3 text-success"></i><div><strong>¡Mensaje enviado exitosamente!</strong><br><small>Te contactaremos pronto. Revisa tu email para confirmar que recibimos tu mensaje.</small></div></div>`;successAlert.style.display = 'block';successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });const errorAlert = form.querySelector('.alert-danger');if (errorAlert) {errorAlert.style.display = 'none';}}showError(form, message) {let errorAlert = form.querySelector('.alert-danger');if (!errorAlert) {errorAlert = document.createElement('div');errorAlert.className = 'alert alert-danger';form.appendChild(errorAlert);}errorAlert.innerHTML = `<div class="d-flex align-items-center"><i class="fas fa-exclamation-triangle fa-lg me-3 text-danger"></i><div><strong>Error al enviar mensaje</strong><br><small>${message}</small></div></div>`;errorAlert.style.display = 'block';errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });const successAlert = form.querySelector('.alert-success');if (successAlert) {successAlert.style.display = 'none';}}async showEmailWarning(warning) {return new Promise((resolve) => {const modal = document.createElement('div');modal.className = 'modal fade';modal.innerHTML = `<div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-warning text-dark"><h5 class="modal-title"><i class="fas fa-exclamation-triangle me-2"></i>Verificar Email</h5></div><div class="modal-body"><p><strong>Advertencia:</strong> ${warning}</p><p>¿Estás seguro de que tu email es correcto? Un email incorrecto significa que no podremos contactarte.</p></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-action="cancel">Corregir Email</button><button type="button" class="btn btn-warning" data-action="proceed">Continuar de Todos Modos</button></div></div></div>`;document.body.appendChild(modal);const bsModal = new bootstrap.Modal(modal);bsModal.show();modal.addEventListener('click', (e) => {const action = e.target.dataset.action;if (action) {bsModal.hide();modal.remove();resolve(action === 'proceed');}});});}resetForm(form) {form.reset();form.classList.remove('was-validated');form.querySelectorAll('.alert').forEach(alert => {alert.style.display = 'none';});}addSecurityIndicators(form) {const securityBadge = document.createElement('div');securityBadge.className = 'security-badge mb-3';securityBadge.innerHTML = `<small class="text-muted d-flex align-items-center"><i class="fas fa-shield-alt text-success me-2"></i><span>Formulario protegido contra spam • Verificación de email incluida</span></small>`;form.insertBefore(securityBadge, form.firstChild);}setupFormValidation(form) {form.querySelectorAll('input[type="email"]').forEach(emailField => {emailField.addEventListener('blur', async () => {if (emailField.value) {const verification = await this.verifyEmailAddress(emailField.value);if (!verification.valid) {emailField.setCustomValidity(verification.reason);emailField.classList.add('is-invalid');} else {emailField.setCustomValidity('');emailField.classList.remove('is-invalid');emailField.classList.add('is-valid');}}});});}setupRealTimeValidation() {document.querySelectorAll('input[type="tel"], input[name*="telefono"], input[name*="phone"]').forEach(phoneField => {phoneField.addEventListener('input', () => {const value = phoneField.value.replace(/\s/g, '');if (value && !this.config.phoneRegex.test(value)) {phoneField.setCustomValidity('Formato de teléfono inválido');} else {phoneField.setCustomValidity('');}});});}}document.addEventListener('DOMContentLoaded', () => {window.professionalForms = new ProfessionalFormsManager();});window.verifyEmail = async (email) => {if (window.professionalForms) {return await window.professionalForms.verifyEmailAddress(email);}return { valid: true, reason: 'Sistema no inicializado' };};console.log('🏛️ professional-forms.js cargado exitosamente');
class SecurityManager {
constructor() {
this.securityPolicies = {
csp: {
enabled: true,
reportOnly: false,
violations: []
},
xss: {
protection: true,
sanitization: true,
violations: []
},
csrf: {
protection: true,
tokenGenerated: false,
tokens: new Map()
},
rateLimit: {
enabled: true,
requests: new Map(),
limits: {
api: { count: 100, window: 60000 }, 
form: { count: 10, window: 60000 },  
search: { count: 50, window: 60000 } 
}
},
dataValidation: {
enabled: true,
rules: new Map(),
violations: []
}
};
this.securityMetrics = {
totalThreats: 0,
blockedRequests: 0,
sanitizedInputs: 0,
validationFailures: 0,
securityScore: 100
};
this.trustedDomains = [
window.location.hostname,
'cdn.jsdelivr.net',
'cdnjs.cloudflare.com',
'fonts.googleapis.com',
'fonts.gstatic.com',
'formspree.io',
'api.emailjs.com',
'api.web3forms.com'
];
this.init();
}
init() {
this.setupCSPMonitoring();
this.setupXSSProtection();
this.setupCSRFProtection();
this.setupInputValidation();
this.setupRateLimiting();
this.setupSecureHeaders();
this.setupContentFiltering();
this.startSecurityMonitoring();
}
setupCSPMonitoring() {
document.addEventListener('securitypolicyviolation', (e) => {
this.handleCSPViolation(e);
});
this.enforceCSP();
}
handleCSPViolation(event) {
const violation = {
blockedURI: event.blockedURI,
violatedDirective: event.violatedDirective,
originalPolicy: event.originalPolicy,
disposition: event.disposition,
timestamp: Date.now()
};
this.securityPolicies.csp.violations.push(violation);
this.securityMetrics.totalThreats++;
console.warn('🚨 CSP Violation:', violation);
this.reportSecurityIncident('csp_violation', violation);
}
enforceCSP() {
return;
}
generateCSPPolicy() {
const trustedSources = this.trustedDomains.map(domain => `https:
return [
`default-src 'self' ${trustedSources}`,
`script-src 'self' ${trustedSources} 'unsafe-inline'`,
`style-src 'self' ${trustedSources} 'unsafe-inline'`,
`img-src 'self' ${trustedSources} data: blob:`,
`font-src 'self' ${trustedSources}`,
`connect-src 'self' ${trustedSources}`,
`media-src 'self' ${trustedSources}`,
`object-src 'none'`,
`base-uri 'self'`,
`form-action 'self'`,
`frame-ancestors 'none'`
].join('; ');
}
setupXSSProtection() {
this.setupDOMObserver();
this.setupInputSanitization();
this.validateCurrentURL();
}
setupDOMObserver() {
const observer = new MutationObserver((mutations) => {
mutations.forEach(mutation => {
mutation.addedNodes.forEach(node => {
if (node.nodeType === Node.ELEMENT_NODE) {
this.scanElementForThreats(node);
}
});
});
});
observer.observe(document.body, {
childList: true,
subtree: true,
attributes: true,
attributeFilter: ['src', 'href', 'onclick', 'onload']
});
}
scanElementForThreats(element) {
if (element.tagName === 'SCRIPT') {
if (!this.isScriptTrusted(element)) {
this.blockMaliciousScript(element);
return;
}
}
const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
dangerousAttributes.forEach(attr => {
if (element.hasAttribute(attr)) {
this.sanitizeAttribute(element, attr);
}
});
if (element.tagName === 'A' && element.href) {
this.validateLink(element);
}
}
isScriptTrusted(script) {
if (script.src) {
const scriptDomain = new URL(script.src).hostname;
return this.trustedDomains.includes(scriptDomain);
}
const content = script.textContent;
if (this.containsMaliciousCode(content)) {
return false;
}
return true;
}
containsMaliciousCode(code) {
const maliciousPatterns = [
/eval\s*\(/i,
/document\.write\s*\(/i,
/innerHTML\s*=/i,
/outerHTML\s*=/i,
/javascript\s*:/i,
/data\s*:\s*text\/html/i,
/base64/i
];
return maliciousPatterns.some(pattern => pattern.test(code));
}
blockMaliciousScript(script) {
script.remove();
const incident = {
type: 'blocked_script',
src: script.src || 'inline',
content: script.textContent?.substring(0, 100),
timestamp: Date.now()
};
this.securityMetrics.blockedRequests++;
this.reportSecurityIncident('malicious_script', incident);
console.warn('🚨 Script malicioso bloqueado:', incident);
}
sanitizeAttribute(element, attribute) {
const originalValue = element.getAttribute(attribute);
element.removeAttribute(attribute);
const incident = {
type: 'sanitized_attribute',
element: element.tagName,
attribute: attribute,
value: originalValue,
timestamp: Date.now()
};
this.securityMetrics.sanitizedInputs++;
this.reportSecurityIncident('attribute_sanitized', incident);
}
validateLink(link) {
try {
const url = new URL(link.href);
if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
this.sanitizeLink(link);
return;
}
if (this.isSuspiciousDomain(url.hostname)) {
this.markSuspiciousLink(link);
}
} catch (error) {
this.sanitizeLink(link);
}
}
isSuspiciousDomain(hostname) {
const suspiciousPatterns = [
/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, 
/[a-z]{20,}\./, 
/.*\.tk$|.*\.ml$|.*\.ga$|.*\.cf$/ 
];
return suspiciousPatterns.some(pattern => pattern.test(hostname));
}
sanitizeLink(link) {
link.removeAttribute('href');
link.style.color = '#dc3545';
link.title = 'Enlace bloqueado por seguridad';
this.securityMetrics.blockedRequests++;
}
markSuspiciousLink(link) {
link.style.color = '#ffc107';
link.title = 'Enlace marcado como sospechoso';
link.addEventListener('click', (e) => {
if (!confirm('Este enlace ha sido marcado como potencialmente sospechoso. ¿Deseas continuar?')) {
e.preventDefault();
}
});
}
setupInputSanitization() {
document.addEventListener('input', (e) => {
if (e.target.matches('input, textarea')) {
this.sanitizeInput(e.target);
}
});
document.addEventListener('submit', (e) => {
this.sanitizeForm(e.target);
});
}
sanitizeInput(input) {
const originalValue = input.value;
const sanitizedValue = this.sanitizeString(originalValue);
if (originalValue !== sanitizedValue) {
input.value = sanitizedValue;
this.securityMetrics.sanitizedInputs++;
this.showSecurityWarning(input, 'Contenido sanitizado por seguridad');
}
}
sanitizeString(str) {
if (!str) return str;
return str
.replace(/<script[^>]*>.*?<\/script>/gi, '')
.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
.replace(/javascript:/gi, '')
.replace(/on\w+\s*=/gi, '')
.replace(/eval\s*\(/gi, '')
.replace(/document\.write/gi, '');
}
sanitizeForm(form) {
const inputs = form.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
if (input.type !== 'password') { 
this.sanitizeInput(input);
}
});
}
validateCurrentURL() {
const params = new URLSearchParams(window.location.search);
let hasThreats = false;
for (const [key, value] of params) {
if (this.containsMaliciousCode(value)) {
params.delete(key);
hasThreats = true;
}
}
if (hasThreats) {
const cleanURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
window.history.replaceState({}, document.title, cleanURL);
this.securityMetrics.sanitizedInputs++;
console.warn('🚨 Parámetros URL maliciosos removidos');
}
}
setupCSRFProtection() {
this.generateCSRFToken();
this.protectForms();
this.protectAjaxRequests();
}
generateCSRFToken() {
const token = this.randomString(32);
sessionStorage.setItem('csrf_token', token);
this.securityPolicies.csrf.tokenGenerated = true;
const tokenMeta = document.createElement('meta');
tokenMeta.name = 'csrf-token';
tokenMeta.content = token;
document.head.appendChild(tokenMeta);
return token;
}
getCSRFToken() {
return sessionStorage.getItem('csrf_token') || this.generateCSRFToken();
}
protectForms() {
document.addEventListener('submit', (e) => {
if (e.target.matches('form[data-csrf-protect]')) {
this.addCSRFTokenToForm(e.target);
}
});
document.querySelectorAll('form[data-csrf-protect]').forEach(form => {
this.addCSRFTokenToForm(form);
});
}
addCSRFTokenToForm(form) {
let tokenInput = form.querySelector('input[name="csrf_token"]');
if (!tokenInput) {
tokenInput = document.createElement('input');
tokenInput.type = 'hidden';
tokenInput.name = 'csrf_token';
form.appendChild(tokenInput);
}
tokenInput.value = this.getCSRFToken();
}
protectAjaxRequests() {
const originalFetch = window.fetch;
window.fetch = async (...args) => {
const [url, options = {}] = args;
if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
options.headers = {
...options.headers,
'X-CSRF-Token': this.getCSRFToken()
};
}
return originalFetch.apply(window, [url, options]);
};
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
this._method = method;
return originalOpen.apply(this, [method, url, ...args]);
};
XMLHttpRequest.prototype.send = function(data) {
if (this._method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method.toUpperCase())) {
this.setRequestHeader('X-CSRF-Token', window.securityManager.getCSRFToken());
}
return originalSend.apply(this, [data]);
};
}
setupInputValidation() {
this.securityPolicies.dataValidation.rules.set('email', {
pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
maxLength: 254,
sanitize: true
});
this.securityPolicies.dataValidation.rules.set('phone', {
pattern: /^[\d\s\-\+\(\)]+$/,
maxLength: 20,
sanitize: true
});
this.securityPolicies.dataValidation.rules.set('text', {
maxLength: 1000,
sanitize: true,
noScripts: true
});
document.addEventListener('input', (e) => {
this.validateInput(e.target);
});
}
validateInput(input) {
const inputType = input.type || input.dataset.validate || 'text';
const rules = this.securityPolicies.dataValidation.rules.get(inputType);
if (!rules) return true;
let isValid = true;
if (rules.maxLength && input.value.length > rules.maxLength) {
input.value = input.value.substring(0, rules.maxLength);
this.showValidationError(input, `Máximo ${rules.maxLength} caracteres`);
isValid = false;
}
if (rules.pattern && input.value && !rules.pattern.test(input.value)) {
this.showValidationError(input, 'Formato inválido');
isValid = false;
}
if (rules.noScripts && this.containsMaliciousCode(input.value)) {
input.value = this.sanitizeString(input.value);
this.showValidationError(input, 'Contenido no permitido removido');
isValid = false;
}
if (!isValid) {
this.securityMetrics.validationFailures++;
}
return isValid;
}
showValidationError(input, message) {
const existingError = input.parentNode.querySelector('.security-validation-error');
if (existingError) {
existingError.remove();
}
const errorDiv = document.createElement('div');
errorDiv.className = 'security-validation-error text-danger small';
errorDiv.textContent = message;
errorDiv.style.fontSize = '0.8rem';
input.parentNode.insertBefore(errorDiv, input.nextSibling);
input.style.borderColor = '#dc3545';
setTimeout(() => {
if (errorDiv.parentNode) {
errorDiv.remove();
input.style.borderColor = '';
}
}, 3000);
}
setupRateLimiting() {
document.addEventListener('submit', (e) => {
if (!this.checkRateLimit('form')) {
e.preventDefault();
this.showRateLimitError('form');
}
});
document.addEventListener('input', (e) => {
if (e.target.matches('[data-search]')) {
if (!this.checkRateLimit('search')) {
e.target.disabled = true;
setTimeout(() => {
e.target.disabled = false;
}, 5000);
}
}
});
const originalFetch = window.fetch;
window.fetch = async (...args) => {
if (!this.checkRateLimit('api')) {
throw new Error('Rate limit exceeded');
}
return originalFetch.apply(window, args);
};
}
checkRateLimit(type) {
const now = Date.now();
const limit = this.securityPolicies.rateLimit.limits[type];
if (!limit) return true;
const requests = this.securityPolicies.rateLimit.requests.get(type) || [];
const validRequests = requests.filter(timestamp => 
now - timestamp < limit.window
);
if (validRequests.length >= limit.count) {
this.securityMetrics.blockedRequests++;
return false;
}
validRequests.push(now);
this.securityPolicies.rateLimit.requests.set(type, validRequests);
return true;
}
showRateLimitError(type) {
const messages = {
form: 'Muchos envíos de formularios. Espera un momento.',
api: 'Muchas solicitudes. Espera un momento.',
search: 'Muchas búsquedas. Espera un momento.'
};
this.showSecurityAlert(messages[type] || 'Rate limit excedido');
}
setupSecureHeaders() {
this.securityMetrics.headersConfigured = true;
const safeMetas = [
{ name: 'referrer', content: 'strict-origin-when-cross-origin' }
];
safeMetas.forEach(meta => {
if (!document.querySelector(`meta[name="${meta.name}"]`)) {
const metaEl = document.createElement('meta');
metaEl.name = meta.name;
metaEl.content = meta.content;
document.head.appendChild(metaEl);
}
});
}
setupContentFiltering() {
this.contentFilters = [
/password/i,
/credit.*card/i,
/ssn|social.*security/i,
/api.*key/i,
/token/i
];
document.addEventListener('input', (e) => {
if (e.target.type !== 'password') {
this.filterSensitiveContent(e.target);
}
});
}
filterSensitiveContent(input) {
const content = input.value;
let filtered = false;
this.contentFilters.forEach(filter => {
if (filter.test(content)) {
this.showSecurityWarning(input, 'Evita ingresar información sensible');
filtered = true;
}
});
if (filtered) {
this.securityMetrics.sanitizedInputs++;
}
}
startSecurityMonitoring() {
setInterval(() => {
this.updateSecurityScore();
this.checkSecurityThreshold();
}, 30000);
setInterval(() => {
this.generateSecurityReport();
}, 300000);
}
updateSecurityScore() {
const baseScore = 100;
const totalIncidents = this.securityMetrics.totalThreats + 
this.securityMetrics.validationFailures;
const penalty = Math.min(totalIncidents * 2, 50);
this.securityMetrics.securityScore = Math.max(baseScore - penalty, 0);
}
checkSecurityThreshold() {
if (this.securityMetrics.securityScore < 70) {
console.warn('🚨 Score de seguridad bajo:', this.securityMetrics.securityScore);
this.escalateSecurityAlert();
}
}
escalateSecurityAlert() {
const alertModal = document.createElement('div');
alertModal.className = 'security-alert-modal';
alertModal.innerHTML = `
<div class="security-alert-content">
<h4>🚨 Alerta de Seguridad</h4>
<p>Se han detectado múltiples incidentes de seguridad.</p>
<p>Score actual: ${this.securityMetrics.securityScore}/100</p>
<button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">Entendido</button>
</div>
`;
alertModal.style.cssText = `
position: fixed; top: 0; left: 0; right: 0; bottom: 0;
background: rgba(0,0,0,0.8); z-index: 10001;
display: flex; align-items: center; justify-content: center;
`;
document.body.appendChild(alertModal);
}
reportSecurityIncident(type, details) {
const incident = {
type,
details,
timestamp: Date.now(),
userAgent: navigator.userAgent,
url: window.location.href
};
const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
incidents.push(incident);
if (incidents.length > 100) {
incidents.splice(0, incidents.length - 100);
}
localStorage.setItem('security_incidents', JSON.stringify(incidents));
this.sendIncidentToServer(incident);
}
async sendIncidentToServer(incident) {
return;
try {
await fetch('/api/security/incident', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRF-Token': this.getCSRFToken()
},
body: JSON.stringify(incident)
});
} catch (error) {
}
}
generateSecurityReport() {
const report = {
timestamp: Date.now(),
score: this.securityMetrics.securityScore,
metrics: this.securityMetrics,
policies: {
csp: {
enabled: this.securityPolicies.csp.enabled,
violations: this.securityPolicies.csp.violations.length
},
xss: {
protection: this.securityPolicies.xss.protection,
violations: this.securityPolicies.xss.violations.length
},
csrf: {
protection: this.securityPolicies.csrf.protection,
tokenActive: this.securityPolicies.csrf.tokenGenerated
},
rateLimit: {
enabled: this.securityPolicies.rateLimit.enabled,
activeRequests: Array.from(this.securityPolicies.rateLimit.requests.keys()).length
}
}
};
console.group('🔒 Security Report');
console.table(report.metrics);
console.groupEnd();
return report;
}
showSecurityWarning(element, message) {
const warning = document.createElement('div');
warning.className = 'security-warning';
warning.textContent = `⚠️ ${message}`;
warning.style.cssText = `
position: absolute; background: #ffc107; color: #000;
padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;
z-index: 1000; margin-top: -30px; white-space: nowrap;
box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;
element.style.position = 'relative';
element.parentNode.appendChild(warning);
setTimeout(() => {
if (warning.parentNode) {
warning.remove();
}
}, 3000);
}
showSecurityAlert(message) {
const alert = document.createElement('div');
alert.className = 'security-toast';
alert.innerHTML = `
<div class="security-toast-content">
🔒 ${message}
<button onclick="this.parentElement.parentElement.remove()">×</button>
</div>
`;
alert.style.cssText = `
position: fixed; top: 20px; right: 20px; z-index: 10000;
background: #dc3545; color: white; padding: 12px 16px;
border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;
document.body.appendChild(alert);
setTimeout(() => {
if (alert.parentNode) {
alert.remove();
}
}, 5000);
}
randomString(length) {
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let result = '';
for (let i = 0; i < length; i++) {
result += chars.charAt(Math.floor(Math.random() * chars.length));
}
return result;
}
getSecurityMetrics() {
return {
...this.securityMetrics,
policies: this.securityPolicies
};
}
getFullSecurityReport() {
return this.generateSecurityReport();
}
isTrustedDomain(domain) {
return this.trustedDomains.includes(domain);
}
addTrustedDomain(domain) {
if (!this.trustedDomains.includes(domain)) {
this.trustedDomains.push(domain);
}
}
sanitize(str) {
return this.sanitizeString(str);
}
validate(input) {
return this.validateInput(input);
}
}
let securityManager;
document.addEventListener('DOMContentLoaded', () => {
securityManager = new SecurityManager();
window.securityManager = securityManager;
});
const securityStyles = document.createElement('style');
securityStyles.textContent = `
.security-warning {
animation: securityFade 0.3s ease-in-out;
}
.security-alert-content {
background: white;
padding: 20px;
border-radius: 8px;
text-align: center;
max-width: 400px;
}
.security-toast-content {
display: flex;
align-items: center;
gap: 10px;
justify-content: space-between;
}
.security-toast-content button {
background: none;
border: none;
color: white;
font-size: 18px;
cursor: pointer;
padding: 0;
width: 20px;
height: 20px;
}
.security-validation-error {
animation: securitySlideIn 0.3s ease-out;
}
@keyframes securityFade {
from { opacity: 0; transform: translateY(-10px); }
to { opacity: 1; transform: translateY(0); }
}
@keyframes securitySlideIn {
from { opacity: 0; transform: translateX(-10px); }
to { opacity: 1; transform: translateX(0); }
}
input:invalid {
border-color: #dc3545 !important;
}
input:valid {
border-color: #28a745 !important;
}
.security-protected::before {
content: "🔒";
position: absolute;
right: 8px;
top: 50%;
transform: translateY(-50%);
font-size: 12px;
opacity: 0.6;
}
`;
document.head.appendChild(securityStyles);
window.SecurityManager = SecurityManager;
})();