(function(window, document) {
'use strict';
const APP_CONFIG = {
partials: {
header: 'partials/header.html',
footer: 'partials/footer.html'
},
selectors: {
header: '#main-header',
footer: '#main-footer',
backToTop: '#back-to-top',
darkModeToggle: '#darkModeToggle',
pwaInstallBanner: '#pwa-install-banner',
pwaInstallBtn: '#pwa-install-btn',
pwaCloseBtn: '#pwa-close-btn'
},
classes: {
darkMode: 'dark-mode',
navbarScrolled: 'scrolled',
visible: 'visible'
},
storage: {
darkMode: 'heroesPatria_darkMode',
pwaInstallDismissed: 'heroesPatria_pwaInstallDismissed'
}
};
class HeroesPatriaApp {
constructor() {
this.deferredPrompt = null;
this.init();
}
async init() {
try {
await this.loadPartials();
this.initNavbar();
this.initScrollEffects();
this.initDarkMode(); 
this.initPWA();
this.initBootstrapComponents();
this.initAccessibility();
this.initIntersectionObserver();
this.setCurrentYear();
} catch (error) {
console.error('❌ Error initializing app:', error);
}
}
async loadPartials() {
try {
await Promise.all([
this.loadPartial(APP_CONFIG.selectors.header, APP_CONFIG.partials.header),
this.loadPartial(APP_CONFIG.selectors.footer, APP_CONFIG.partials.footer)
]);
this.initNavbarEnhanced();
setTimeout(() => {
if (typeof window.initSimpleSearch === 'function') {
window.initSimpleSearch();
}
}, 200);
setTimeout(() => {
this.initDarkMode(); 
}, 500);
setTimeout(() => {
if (typeof window.initSecureAuthSystem === 'function') {
if (!window.secureAdminAuth) {
window.initSecureAuthSystem();
} else {
}
} else {
setTimeout(() => {
if (typeof window.initSecureAuthSystem === 'function') {
if (!window.secureAdminAuth) {
window.initSecureAuthSystem();
}
} else {
}
}, 1000);
}
}, 800);
} catch (error) {
console.error('Error loading partials:', error);
}
}
async loadPartial(selector, path) {
const element = document.querySelector(selector);
if (!element) return;
try {
const response = await fetch(path);
if (!response.ok) throw new Error(`Failed to load ${path}`);
const html = await response.text();
element.innerHTML = html;
} catch (error) {
console.warn(`⚠️ Could not load ${path}:`, error);
if (selector === APP_CONFIG.selectors.header) {
element.innerHTML = '<nav class="navbar navbar-light bg-light"><div class="container"><a class="navbar-brand" href="index.html">Héroes de la Patria</a></div></nav>';
}
}
}
initNavbar() {
const navbar = document.querySelector('.navbar');
if (!navbar) return;
let isScrolled = false;
window.addEventListener('scroll', () => {
const shouldScroll = window.scrollY > 50;
if (shouldScroll !== isScrolled) {
isScrolled = shouldScroll;
navbar.classList.toggle(APP_CONFIG.classes.navbarScrolled, isScrolled);
}
});
}
initNavbarEnhanced() {
this.setActiveNavItem();
this.initSmoothScroll();
this.initDropdownEnhancements();
}
setActiveNavItem() {
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
const href = link.getAttribute('href');
if (href && href.includes(currentPage)) {
link.classList.add('active');
}
});
}
initSmoothScroll() {
document.addEventListener('click', (e) => {
const link = e.target.closest('a[href^="#"]');
if (!link) return;
e.preventDefault();
const targetId = link.getAttribute('href').slice(1);
const targetElement = document.getElementById(targetId);
if (targetElement) {
targetElement.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
history.pushState(null, null, `#${targetId}`);
}
});
}
initDropdownEnhancements() {
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
toggle.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
const dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
dropdown.toggle();
}
});
});
}
initResponsiveNavbar() {
const checkAndRun = () => {
const navbar = document.querySelector('#mainNavList');
const masDropdown = document.querySelector('#masDropdownContainer');
const masDropdownMenu = document.querySelector('#masDropdownMenu');
if (!navbar || !masDropdown || !masDropdownMenu) {
setTimeout(checkAndRun, 100);
return;
}
const handleNavbarResize = () => {
const secondaryItems = document.querySelectorAll('.nav-secondary');
const screenWidth = window.innerWidth;
const existingDynamicItems = masDropdownMenu.querySelectorAll('.nav-secondary-in-dropdown, .nav-secondary-separator');
existingDynamicItems.forEach(item => item.remove());
if (screenWidth < 1200 && screenWidth >= 992) {
const dropdownSeparator = document.createElement('li');
dropdownSeparator.className = 'nav-secondary-separator';
dropdownSeparator.innerHTML = '<hr class="dropdown-divider">';
const firstStaticItem = masDropdownMenu.querySelector('li:first-child');
if (firstStaticItem) {
masDropdownMenu.insertBefore(dropdownSeparator, firstStaticItem);
}
secondaryItems.forEach((item) => {
const link = item.querySelector('a');
if (!link) return;
const isDropdown = item.classList.contains('dropdown');
if (isDropdown) {
const submenu = item.querySelector('.dropdown-menu');
const submenuItems = submenu ? submenu.querySelectorAll('li a') : [];
const headerItem = document.createElement('li');
headerItem.className = 'nav-secondary-in-dropdown';
headerItem.innerHTML = `<h6 class="dropdown-header">${link.textContent}</h6>`;
masDropdownMenu.insertBefore(headerItem, firstStaticItem);
submenuItems.forEach(subLink => {
const subDropdownItem = document.createElement('li');
subDropdownItem.className = 'nav-secondary-in-dropdown';
subDropdownItem.innerHTML = `<a class="dropdown-item" href="${subLink.href}">${subLink.innerHTML}</a>`;
masDropdownMenu.insertBefore(subDropdownItem, firstStaticItem);
});
} else {
const dropdownItem = document.createElement('li');
dropdownItem.className = 'nav-secondary-in-dropdown';
dropdownItem.innerHTML = `<a class="dropdown-item" href="${link.href}">${link.innerHTML}</a>`;
masDropdownMenu.insertBefore(dropdownItem, firstStaticItem);
}
});
}
};
setTimeout(handleNavbarResize, 100);
let resizeTimeout;
window.addEventListener('resize', () => {
clearTimeout(resizeTimeout);
resizeTimeout = setTimeout(handleNavbarResize, 150);
});
};
checkAndRun();
}
initScrollEffects() {
this.initBackToTop();
this.initScrollReveal();
}
initBackToTop() {
const backToTopBtn = document.querySelector(APP_CONFIG.selectors.backToTop);
if (!backToTopBtn) return;
let isVisible = false;
window.addEventListener('scroll', () => {
const shouldShow = window.scrollY > 300;
if (shouldShow !== isVisible) {
isVisible = shouldShow;
backToTopBtn.classList.toggle('d-none', !isVisible);
}
});
backToTopBtn.addEventListener('click', (e) => {
e.preventDefault();
window.scrollTo({
top: 0,
behavior: 'smooth'
});
});
}
initScrollReveal() {
const animatedElements = document.querySelectorAll('[data-aos], .hover-lift, .card');
if (animatedElements.length === 0) return;
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.style.animationDelay = '0.1s';
entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
observer.unobserve(entry.target);
}
});
}, {
threshold: 0.1,
rootMargin: '0px 0px -50px 0px'
});
animatedElements.forEach(el => {
el.style.opacity = '0';
el.style.transform = 'translateY(20px)';
observer.observe(el);
});
}
initDarkMode() {
let toggle = document.querySelector(APP_CONFIG.selectors.darkModeToggle);
if (!toggle) {
const floatingToggle = document.querySelector('.dark-mode-toggle');
if (floatingToggle) {
toggle = floatingToggle;
} else {
toggle = this.createDarkModeToggle();
if (!toggle) {
return; 
}
}
}
const isDarkMode = localStorage.getItem(APP_CONFIG.storage.darkMode) === 'true';
if (isDarkMode) {
document.body.classList.add(APP_CONFIG.classes.darkMode);
} else {
document.body.classList.remove(APP_CONFIG.classes.darkMode);
}
this.updateDarkModeIcon(toggle, isDarkMode);
const newToggle = toggle.cloneNode(true);
toggle.parentNode.replaceChild(newToggle, toggle);
toggle = newToggle;
toggle.addEventListener('click', () => {
const isCurrentlyDark = document.body.classList.contains(APP_CONFIG.classes.darkMode);
const newDarkState = !isCurrentlyDark;
document.body.classList.toggle(APP_CONFIG.classes.darkMode, newDarkState);
localStorage.setItem(APP_CONFIG.storage.darkMode, newDarkState.toString());
this.updateDarkModeIcon(toggle, newDarkState);
document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
setTimeout(() => {
document.body.style.transition = '';
}, 300);
});
}
createDarkModeToggle() {
const navbar = document.querySelector('.navbar-nav');
if (!navbar) return null;
const li = document.createElement('li');
li.className = 'nav-item';
const button = document.createElement('button');
button.className = 'nav-link btn btn-link border-0 bg-transparent';
button.id = 'darkModeToggle';
button.setAttribute('aria-label', 'Alternar modo oscuro');
const icon = document.createElement('i');
icon.className = 'fas fa-moon';
icon.id = 'darkModeIcon';
button.appendChild(icon);
li.appendChild(button);
const lastItem = navbar.lastElementChild;
if (lastItem) {
navbar.insertBefore(li, lastItem);
} else {
navbar.appendChild(li);
}
const self = this;
button.addEventListener('click', function() {
const isCurrentlyDark = document.body.classList.contains(APP_CONFIG.classes.darkMode);
const newDarkState = !isCurrentlyDark;
document.body.classList.toggle(APP_CONFIG.classes.darkMode, newDarkState);
localStorage.setItem(APP_CONFIG.storage.darkMode, newDarkState.toString());
self.updateDarkModeIcon(button, newDarkState);
document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
setTimeout(() => {
document.body.style.transition = '';
}, 300);
});
return button;
}
updateDarkModeIcon(toggle, isDark) {
const icon = toggle.querySelector('i');
if (icon) {
icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}
toggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
}
initPWA() {
this.initInstallPrompt();
this.initServiceWorker();
}
initInstallPrompt() {
const banner = document.querySelector(APP_CONFIG.selectors.pwaInstallBanner);
const installBtn = document.querySelector(APP_CONFIG.selectors.pwaInstallBtn);
const closeBtn = document.querySelector(APP_CONFIG.selectors.pwaCloseBtn);
if (!banner) return;
window.addEventListener('beforeinstallprompt', (e) => {
e.preventDefault();
this.deferredPrompt = e;
const dismissed = localStorage.getItem(APP_CONFIG.storage.pwaInstallDismissed);
if (!dismissed) {
setTimeout(() => {
banner.classList.remove('d-none');
}, 3000);
}
});
if (installBtn) {
installBtn.addEventListener('click', async () => {
if (!this.deferredPrompt) return;
this.deferredPrompt.prompt();
const { outcome } = await this.deferredPrompt.userChoice;
if (outcome === 'accepted') {
}
this.deferredPrompt = null;
banner.classList.add('d-none');
});
}
if (closeBtn) {
closeBtn.addEventListener('click', () => {
banner.classList.add('d-none');
localStorage.setItem(APP_CONFIG.storage.pwaInstallDismissed, 'true');
});
}
window.addEventListener('appinstalled', () => {
banner.classList.add('d-none');
});
}
initServiceWorker() {
if ('serviceWorker' in navigator) {
window.addEventListener('load', async () => {
try {
const registration = await navigator.serviceWorker.register('./sw-offline-first.js');
registration.addEventListener('updatefound', () => {
const newWorker = registration.installing;
if (newWorker) {
newWorker.addEventListener('statechange', () => {
if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
this.showUpdateNotification();
}
});
}
});
} catch (error) {
console.warn('ServiceWorker registration failed:', error);
}
});
}
}
showUpdateNotification() {
const notification = document.createElement('div');
notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
notification.innerHTML = `
<strong>¡Actualización disponible!</strong>
<br>Recarga la página para obtener la última versión.
<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
document.body.appendChild(notification);
setTimeout(() => {
if (notification.parentNode) {
notification.remove();
}
}, 10000);
}
initBootstrapComponents() {
this.initTooltips();
this.initPopovers();
this.initCarousels();
this.initModals();
}
initTooltips() {
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.forEach(tooltipTriggerEl => {
new bootstrap.Tooltip(tooltipTriggerEl);
});
}
initPopovers() {
const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
popoverTriggerList.forEach(popoverTriggerEl => {
new bootstrap.Popover(popoverTriggerEl);
});
}
initCarousels() {
const carousels = document.querySelectorAll('.carousel');
carousels.forEach(carousel => {
new bootstrap.Carousel(carousel, {
interval: 5000,
pause: 'hover'
});
});
}
initModals() {
const hash = window.location.hash;
if (hash && hash.startsWith('#modal-')) {
const modalId = hash.substring(1);
const modalElement = document.getElementById(modalId);
if (modalElement) {
const modal = new bootstrap.Modal(modalElement);
modal.show();
}
}
}
initAccessibility() {
this.initKeyboardNavigation();
this.initFocusManagement();
this.initAriaLabels();
}
initKeyboardNavigation() {
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
skipLink.addEventListener('click', (e) => {
e.preventDefault();
const target = document.querySelector(skipLink.getAttribute('href'));
if (target) {
target.focus();
target.scrollIntoView({ behavior: 'smooth' });
}
});
}
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
openDropdowns.forEach(dropdown => {
const toggle = dropdown.previousElementSibling;
if (toggle) {
bootstrap.Dropdown.getInstance(toggle)?.hide();
}
});
}
});
}
initFocusManagement() {
const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
focusableElements.forEach(element => {
element.addEventListener('focus', () => {
element.classList.add('focused');
});
element.addEventListener('blur', () => {
element.classList.remove('focused');
});
});
}
initAriaLabels() {
const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
buttons.forEach(button => {
const text = button.textContent?.trim();
if (text) {
button.setAttribute('aria-label', text);
}
});
}
initIntersectionObserver() {
const images = document.querySelectorAll('img[data-src]');
if (images.length === 0) return;
const imageObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
const img = entry.target;
img.src = img.dataset.src;
img.classList.add('fade-in');
imageObserver.unobserve(img);
}
});
});
images.forEach(img => imageObserver.observe(img));
}
setCurrentYear() {
const yearElements = document.querySelectorAll('[data-current-year], .current-year');
const currentYear = new Date().getFullYear();
yearElements.forEach(element => {
element.textContent = currentYear;
});
}
showNotification(message, type = 'info', duration = 5000) {
const notification = document.createElement('div');
notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
notification.innerHTML = `
${message}
<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
document.body.appendChild(notification);
setTimeout(() => {
if (notification.parentNode) {
notification.remove();
}
}, duration);
}
updatePageTitle(title) {
document.title = `${title} - Bachillerato General Estatal "Héroes de la Patria"`;
}
}
let app;
document.addEventListener('DOMContentLoaded', () => {
app = new HeroesPatriaApp();
});
window.HeroesPatria = {
showNotification: (message, type, duration) => app?.showNotification(message, type, duration),
updatePageTitle: (title) => app?.updatePageTitle(title)
};
if (!document.getElementById('dynamic-styles')) {
const style = document.createElement('style');
style.id = 'dynamic-styles';
style.textContent = `
@keyframes fadeInUp {
from {
opacity: 0;
transform: translateY(20px);
}
to {
opacity: 1;
transform: translateY(0);
}
}
.fade-in {
animation: fadeInUp 0.6s ease forwards;
}
.focused {
outline: 2px solid var(--bs-primary) !important;
outline-offset: 2px !important;
}
.hover-lift {
transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-lift:hover {
transform: translateY(-5px);
}
`;
document.head.appendChild(style);
}
class AdminPanelAuth {
constructor() {
this.config = {
password: 'CHANGE_IN_PRODUCTION', 
sessionDuration: 2 * 60 * 60 * 1000, 
storageKey: 'heroesPatria_adminPanelAuth',
maxAttempts: 3,
lockoutTime: 15 * 60 * 1000 
};
this.setupEventListeners();
}
initializeAuth() {
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
} else {
setTimeout(() => this.setupEventListeners(), 100);
}
}
setupEventListeners() {
const authForm = document.getElementById('adminPanelAuthForm');
if (authForm) {
authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
} else {
console.warn('Admin panel form not found, retrying...');
setTimeout(() => this.setupEventListeners(), 500);
}
this.updateSessionIndicator(this.isAuthenticated());
}
showAuthModal() {
if (this.isAuthenticated()) {
this.openAdminPanel();
return;
}
if (this.isLockedOut()) {
this.showLockoutMessage();
return;
}
this.clearAuthForm();
const modal = new bootstrap.Modal(document.getElementById('adminPanelAuthModal'));
modal.show();
setTimeout(() => {
document.getElementById('adminPanelPassword').focus();
}, 500);
}
handleAuthSubmit(e) {
e.preventDefault();
const password = document.getElementById('adminPanelPassword').value;
if (this.validatePassword(password)) {
this.grantAccess();
} else {
this.denyAccess();
}
}
validatePassword(password) {
return password === this.config.password;
}
grantAccess() {
const authData = {
authenticated: true,
timestamp: Date.now(),
expires: Date.now() + this.config.sessionDuration
};
localStorage.setItem(this.config.storageKey, JSON.stringify(authData));
localStorage.removeItem(this.config.storageKey + '_attempts');
this.updateSessionIndicator(true);
const modal = bootstrap.Modal.getInstance(document.getElementById('adminPanelAuthModal'));
modal.hide();
this.showSuccessMessage('Acceso concedido. Abriendo Panel de Administración...');
setTimeout(() => {
this.openAdminPanel();
}, 1500);
}
denyAccess() {
const attempts = this.getFailedAttempts() + 1;
const attemptsData = {
count: attempts,
lastAttempt: Date.now()
};
localStorage.setItem(this.config.storageKey + '_attempts', JSON.stringify(attemptsData));
const errorDiv = document.getElementById('adminPanelAuthError');
const errorText = document.getElementById('adminPanelAuthErrorText');
if (attempts >= this.config.maxAttempts) {
const lockoutData = {
lockedOut: true,
lockoutTime: Date.now(),
unlockTime: Date.now() + this.config.lockoutTime
};
localStorage.setItem(this.config.storageKey + '_lockout', JSON.stringify(lockoutData));
errorText.textContent = `Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.`;
setTimeout(() => {
const modal = bootstrap.Modal.getInstance(document.getElementById('adminPanelAuthModal'));
modal.hide();
this.showLockoutMessage();
}, 3000);
} else {
const remainingAttempts = this.config.maxAttempts - attempts;
errorText.textContent = `Contraseña incorrecta. Te quedan ${remainingAttempts} intento(s).`;
}
errorDiv.classList.remove('d-none');
document.getElementById('adminPanelPassword').value = '';
document.getElementById('adminPanelPassword').focus();
}
isAuthenticated() {
const authData = localStorage.getItem(this.config.storageKey);
if (!authData) return false;
try {
const data = JSON.parse(authData);
if (data.authenticated && Date.now() < data.expires) {
return true;
} else {
localStorage.removeItem(this.config.storageKey);
return false;
}
} catch (error) {
localStorage.removeItem(this.config.storageKey);
return false;
}
}
isLockedOut() {
const lockoutData = localStorage.getItem(this.config.storageKey + '_lockout');
if (!lockoutData) return false;
try {
const data = JSON.parse(lockoutData);
if (data.lockedOut && Date.now() < data.unlockTime) {
return true;
} else {
localStorage.removeItem(this.config.storageKey + '_lockout');
localStorage.removeItem(this.config.storageKey + '_attempts');
return false;
}
} catch (error) {
localStorage.removeItem(this.config.storageKey + '_lockout');
return false;
}
}
getFailedAttempts() {
const attemptsData = localStorage.getItem(this.config.storageKey + '_attempts');
if (!attemptsData) return 0;
try {
const data = JSON.parse(attemptsData);
return data.count || 0;
} catch (error) {
return 0;
}
}
showLockoutMessage() {
const lockoutData = JSON.parse(localStorage.getItem(this.config.storageKey + '_lockout') || '{}');
const remainingTime = Math.ceil((lockoutData.unlockTime - Date.now()) / (60 * 1000));
this.showErrorMessage(`Acceso bloqueado por seguridad. Intenta nuevamente en ${remainingTime} minuto(s).`);
}
openAdminPanel() {
try {
const popup = window.open('admin/manual.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
if (popup === null || typeof(popup) === 'undefined') {
this.showErrorMessage('Popup bloqueado. Abriendo en nueva pestaña...');
setTimeout(() => {
window.open('admin/manual.html', '_blank');
}, 1000);
} else {
popup.focus();
}
} catch (error) {
console.error('Error abriendo panel:', error);
window.open('admin/manual.html', '_blank');
}
}
clearAuthForm() {
document.getElementById('adminPanelPassword').value = '';
document.getElementById('adminPanelAuthError').classList.add('d-none');
}
showSuccessMessage(message) {
this.showToast(message, 'success');
}
showErrorMessage(message) {
this.showToast(message, 'danger');
}
showToast(message, type = 'info') {
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
toastContainer = document.createElement('div');
toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
toastContainer.style.zIndex = '9999';
document.body.appendChild(toastContainer);
}
const toastElement = document.createElement('div');
toastElement.className = `toast align-items-center text-bg-${type} border-0`;
toastElement.innerHTML = `
<div class="d-flex">
<div class="toast-body">${message}</div>
<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
</div>
`;
toastContainer.appendChild(toastElement);
const toast = new bootstrap.Toast(toastElement, {
autohide: true,
delay: 5000
});
toast.show();
toastElement.addEventListener('hidden.bs.toast', () => {
toastElement.remove();
});
}
updateSessionIndicator(isAuthenticated) {
const statusBadge = document.getElementById('adminPanelSessionStatus');
const logoutOption = document.getElementById('adminPanelLogoutOption');
const menuLink = document.getElementById('adminPanelMenuLink');
if (isAuthenticated) {
if (statusBadge) statusBadge.classList.remove('d-none');
if (logoutOption) logoutOption.classList.remove('d-none');
if (menuLink) menuLink.innerHTML = '<i class="fas fa-edit me-2"></i>Abrir Panel <span class="badge bg-success ms-2">Sesión Activa</span>';
} else {
if (statusBadge) statusBadge.classList.add('d-none');
if (logoutOption) logoutOption.classList.add('d-none');
if (menuLink) menuLink.innerHTML = '<i class="fas fa-edit me-2"></i>Panel de Administración';
}
}
logout() {
localStorage.removeItem(this.config.storageKey);
this.updateSessionIndicator(false);
this.showSuccessMessage('Sesión cerrada correctamente.');
}
}
function handleKeyPress(event) {
if (event.key === 'Enter') {
event.preventDefault();
if (typeof sendMessage !== 'undefined') {
sendMessage();
}
}
}
window.handleKeyPress = handleKeyPress;
(function() {
'use strict';
const searchDatabase = [
{ title: "Inicio", desc: "Página principal del Bachillerato General Estatal Héroes de la Patria", url: "index.html", keywords: "inicio home principal bachillerato heroes patria bienvenida" },
{ title: "Conócenos", desc: "Información institucional completa", url: "conocenos.html", keywords: "conocenos acerca sobre institución información" },
{ title: "Historia Institucional", desc: "Historia desde 1996 hasta la actualidad", url: "conocenos.html#historia", keywords: "historia fundación 1996 trayectoria institucional años evolución" },
{ title: "Misión y Visión", desc: "Misión, visión y valores institucionales", url: "conocenos.html#mision-vision", keywords: "misión visión valores objetivo meta propósito filosofía" },
{ title: "Organigrama", desc: "Estructura organizacional y jerarquías administrativas", url: "conocenos.html#organigrama", keywords: "organigrama estructura organizacional jerarquías administrativas organización personal" },
{ title: "Mensaje del Director", desc: "Mensaje oficial del Ing. Samuel Cruz Interial", url: "conocenos.html#mensaje-director", keywords: "director samuel cruz interial mensaje bienvenida líder" },
{ title: "Infraestructura", desc: "Instalaciones, aulas, laboratorios y espacios del plantel", url: "conocenos.html#infraestructura", keywords: "infraestructura instalaciones aulas laboratorios espacios edificios plantel" },
{ title: "Video Institucional", desc: "Video oficial de presentación de la institución", url: "conocenos.html#video-institucional", keywords: "video institucional multimedia presentación oficial" },
{ title: "Oferta Educativa", desc: "Plan de estudios completo del Bachillerato General", url: "oferta-educativa.html", keywords: "oferta educativa plan estudios materias semestres académico" },
{ title: "Modelo Educativo", desc: "Enfoque educativo por competencias y pilares", url: "oferta-educativa.html#modelo-educativo", keywords: "modelo competencias educativo pilares metodología enfoque" },
{ title: "Plan de Estudios", desc: "Materias por semestre y áreas de conocimiento", url: "oferta-educativa.html#plan-estudios", keywords: "plan estudios materias asignaturas semestre áreas curricular" },
{ title: "Capacitación para el Trabajo", desc: "Talleres y capacitación técnica especializada", url: "oferta-educativa.html#capacitacion-trabajo", keywords: "capacitación trabajo talleres técnica especializada oficios" },
{ title: "Perfil de Egreso", desc: "Competencias y habilidades que desarrollarán los estudiantes", url: "oferta-educativa.html#perfil-egreso", keywords: "perfil egreso competencias habilidades graduado características" },
{ title: "Proceso de Admisión", desc: "Requisitos y pasos para inscribirse al bachillerato", url: "oferta-educativa.html#proceso-admision", keywords: "admisión inscripción proceso requisitos nuevo ingreso trámites" },
{ title: "Servicios", desc: "Servicios institucionales y escolares", url: "servicios.html", keywords: "servicios institucionales escolares ofrecidos disponibles" },
{ title: "Sistema de Citas Online", desc: "Agenda citas con diferentes departamentos", url: "citas.html", keywords: "citas agenda reservas online departamentos orientación dirección servicios" },
{ title: "Sistema de Pagos", desc: "Pagos de colegiaturas y servicios en línea", url: "pagos.html", keywords: "pagos colegiaturas inscripciones online seguro tarjeta transferencia" },
{ title: "Centro de Descargas", desc: "Documentos oficiales, formatos y recursos", url: "descargas.html", keywords: "descargas documentos formatos reglamentos recursos PDF oficiales" },
{ title: "Servicios Escolares", desc: "Trámites, certificados y constancias", url: "servicios.html#servicios-principales", keywords: "servicios escolares trámites certificados constancias documentos oficiales" },
{ title: "Biblioteca", desc: "Acervo bibliográfico y recursos digitales", url: "servicios.html#biblioteca", keywords: "biblioteca libros acervo estudio préstamos recursos digitales" },
{ title: "Laboratorios", desc: "Laboratorio de ciencias, cómputo y talleres", url: "servicios.html#laboratorios", keywords: "laboratorios ciencias cómputo talleres equipos prácticas" },
{ title: "Becas y Apoyos", desc: "Programas de becas y apoyo económico", url: "servicios.html#becas", keywords: "becas apoyos económico aprovechamiento programas ayuda financiera" },
{ title: "Orientación Vocacional", desc: "Apoyo para elección de carrera profesional", url: "servicios.html#orientacion-vocacional", keywords: "orientación vocacional carrera profesional apoyo elección" },
{ title: "Portal del Estudiante", desc: "Recursos académicos, horarios y herramientas estudiantiles", url: "estudiantes.html", keywords: "estudiantes portal académico recursos horarios herramientas" },
{ title: "Recursos Académicos", desc: "Materiales y herramientas de aprendizaje", url: "estudiantes.html#recursos-academicos", keywords: "recursos académicos materiales aprendizaje herramientas" },
{ title: "Horarios de Clase", desc: "Consulta de horarios por semestre y grupo", url: "estudiantes.html#horarios", keywords: "horarios clase semestre grupo consulta programación" },
{ title: "Actividades Extracurriculares", desc: "Deportes, cultura y actividades complementarias", url: "estudiantes.html#actividades-extracurriculares", keywords: "actividades extracurriculares deportes cultura complementarias" },
{ title: "Calculadora de Promedio", desc: "Herramienta para calcular promedios académicos", url: "estudiantes.html#calculadora", keywords: "calculadora promedio calificaciones notas matemáticas" },
{ title: "Técnicas de Estudio", desc: "Consejos y métodos para mejorar el rendimiento", url: "estudiantes.html#tecnicas", keywords: "técnicas estudio aprendizaje métodos consejos rendimiento" },
{ title: "Portal de Padres", desc: "Seguimiento académico y comunicación", url: "padres.html", keywords: "padres familia portal seguimiento comunicación académico" },
{ title: "Seguimiento Académico", desc: "Herramientas para dar seguimiento al progreso", url: "padres.html#seguimiento-academico", keywords: "seguimiento académico progreso hijos padres" },
{ title: "Comunicación con Docentes", desc: "Canales directos con los maestros", url: "padres.html#comunicacion-docentes", keywords: "comunicación docentes maestros contacto diálogo" },
{ title: "Plataforma de Calificaciones", desc: "Consulta de calificaciones y reportes académicos", url: "calificaciones.html", keywords: "calificaciones notas académico reportes evaluación boletas seguimiento" },
{ title: "Portal de Egresados", desc: "Servicios exclusivos para graduados", url: "egresados.html", keywords: "egresados graduados portal servicios exclusivos" },
{ title: "Bolsa de Trabajo", desc: "Portal de empleos exclusivo para egresados", url: "bolsa-trabajo.html", keywords: "bolsa trabajo empleos oportunidades laboral egresados CV postular" },
{ title: "Testimonios de Egresados", desc: "Experiencias y casos de éxito", url: "egresados.html#testimonios-egresados", keywords: "testimonios egresados experiencias éxito casos graduados" },
{ title: "Comunidad", desc: "Vida estudiantil, noticias y actividades", url: "comunidad.html", keywords: "comunidad vida estudiantil noticias actividades eventos" },
{ title: "Noticias", desc: "Noticias y comunicados recientes", url: "comunidad.html#noticias", keywords: "noticias comunicados recientes avisos actualizaciones" },
{ title: "Noticias Recientes", desc: "Últimas noticias de la institución", url: "index.html#noticias-recientes", keywords: "noticias recientes últimas comunicados avisos" },
{ title: "Eventos", desc: "Eventos y actividades institucionales", url: "comunidad.html#eventos", keywords: "eventos actividades calendario próximos fechas" },
{ title: "Próximos Eventos", desc: "Calendario de eventos próximos", url: "index.html#proximos-eventos", keywords: "próximos eventos calendario actividades fechas" },
{ title: "Galería", desc: "Galería fotográfica de eventos y actividades", url: "comunidad.html#galeria", keywords: "galería fotos imágenes eventos actividades fotografías" },
{ title: "Testimonios", desc: "Testimonios de la comunidad educativa", url: "comunidad.html#testimonios", keywords: "testimonios experiencias comunidad educativa" },
{ title: "Vida Estudiantil", desc: "Actividades y experiencias estudiantiles", url: "comunidad.html#vida-estudiantil", keywords: "vida estudiantil experiencias actividades cultura" },
{ title: "Actividades Deportivas", desc: "Deportes y competencias", url: "comunidad.html#deportes", keywords: "deportes actividades físicas competencias equipos" },
{ title: "Actividades Culturales", desc: "Arte, música, teatro y cultura", url: "comunidad.html#cultura", keywords: "cultura arte música teatro expresión cultural" },
{ title: "Transparencia", desc: "Información pública y rendición de cuentas", url: "transparencia.html", keywords: "transparencia rendición cuentas pública información financiera" },
{ title: "Información Financiera", desc: "Estados financieros y presupuestos", url: "transparencia.html#informacion-financiera", keywords: "información financiera estados presupuestos institucionales" },
{ title: "Normatividad", desc: "Reglamentos, lineamientos y normativa legal", url: "normatividad.html", keywords: "normatividad reglamentos lineamientos normas legal reglamento" },
{ title: "Reglamento Escolar", desc: "Reglamento interno de la institución", url: "normatividad.html#reglamento", keywords: "reglamento escolar interno normas estudiantes" },
{ title: "Manual de Convivencia", desc: "Lineamientos para la sana convivencia", url: "normatividad.html#convivencia", keywords: "manual convivencia lineamientos sana escolar" },
{ title: "Calendario Escolar", desc: "Fechas importantes del ciclo escolar", url: "calendario.html", keywords: "calendario escolar fechas importantes evaluaciones eventos vacaciones" },
{ title: "Convocatorias", desc: "Convocatorias vigentes y procesos", url: "convocatorias.html", keywords: "convocatorias vigentes becas concursos programas nuevo ingreso" },
{ title: "Sitios de Interés", desc: "Enlaces externos de utilidad", url: "sitios-interes.html", keywords: "sitios interés enlaces externos utilidad recursos" },
{ title: "Contacto", desc: "Información de contacto y ubicación", url: "contacto.html", keywords: "contacto ayuda dirección teléfono email ubicación" },
{ title: "Ubicación", desc: "Dirección y ubicación del plantel", url: "contacto.html#ubicacion", keywords: "ubicación dirección plantel coronel tito hernández puebla" },
{ title: "Directorio Telefónico", desc: "Números telefónicos de departamentos", url: "contacto.html#directorio", keywords: "directorio telefónico números teléfono departamentos" },
{ title: "Horarios de Atención", desc: "Lunes a Viernes de 8:00 AM a 1:30 PM", url: "contacto.html#horarios", keywords: "horarios atención servicios 8:00 1:30 lunes viernes" },
{ title: "Mapa de Ubicación", desc: "Mapa interactivo de ubicación", url: "contacto.html#mapa", keywords: "mapa ubicación interactivo llegar dirección" },
{ title: "Dashboard Administrativo", desc: "Panel de control integral para administradores", url: "admin-dashboard.html", keywords: "administración dashboard gestión control académico reportes estadísticas admin" },
{ title: "Gestión de Estudiantes", desc: "Administración de expedientes estudiantiles", url: "admin-dashboard.html#estudiantes", keywords: "gestión estudiantes expedientes matrículas administración" },
{ title: "Gestión de Docentes", desc: "Administración del personal académico", url: "admin-dashboard.html#docentes", keywords: "gestión docentes personal académico administración maestros" },
{ title: "Reportes Estadísticos", desc: "Generación de reportes institucionales", url: "admin-dashboard.html#reportes", keywords: "reportes estadísticos generación institucionales datos" },
{ title: "Preguntas Frecuentes", desc: "Respuestas a las dudas más comunes", url: "index.html#faq", keywords: "faq preguntas frecuentes ayuda dudas respuestas" },
{ title: "Quejas y Sugerencias", desc: "Formulario para comentarios y sugerencias", url: "index.html#quejas-sugerencias", keywords: "quejas sugerencias comentarios formulario buzón" },
{ title: "Mapa del Sitio", desc: "Navegación completa del sitio web", url: "index.html#mapa-sitio", keywords: "mapa sitio navegación páginas índice" },
{ title: "Chatbot", desc: "Asistente virtual para resolver dudas", url: "#chatbot", keywords: "chatbot asistente virtual ayuda dudas automático" },
{ title: "Términos y Condiciones", desc: "Términos de uso del sitio web", url: "terminos.html", keywords: "términos condiciones uso sitio web legal" },
{ title: "Política de Privacidad", desc: "Manejo y protección de datos personales", url: "privacidad.html", keywords: "privacidad datos personales protección manejo" }
];
let searchTimer = null;
function performSearch(query) {
if (!query || query.length < 2) return [];
const terms = query.toLowerCase().split(' ').filter(t => t.length > 0);
const results = [];
searchDatabase.forEach(item => {
let score = 0;
const searchText = (item.title + ' ' + item.desc + ' ' + item.keywords).toLowerCase();
terms.forEach(term => {
if (item.title.toLowerCase().includes(term)) score += 10;
if (item.desc.toLowerCase().includes(term)) score += 5;
if (item.keywords.includes(term)) score += 3;
});
if (score > 0) {
results.push({ ...item, score });
}
});
return results.sort((a, b) => b.score - a.score).slice(0, 8);
}
function createResultsHTML(results, query) {
if (!results.length) {
return `<div class="search-no-results">
<i class="fas fa-search"></i>
<div>No se encontraron resultados para "<strong>${query}</strong>"</div>
<small>Intenta con otros términos</small>
</div>`;
}
return results.map(result => `
<div class="search-result-item" data-url="${result.url}">
<div class="search-result-title">${result.title}</div>
<div class="search-result-desc">${result.desc}</div>
<div class="search-result-url">${result.url}</div>
</div>
`).join('');
}
function handleResultClick(event) {
const item = event.target.closest('.search-result-item');
if (!item) return;
const url = item.getAttribute('data-url');
if (url === '#chatbot') {
const chatbotToggle = document.getElementById('chatbotToggle');
if (chatbotToggle) chatbotToggle.click();
} else if (url) {
window.location.href = url;
}
clearSearch();
}
function clearSearch() {
const input = document.getElementById('siteSearch');
const results = document.getElementById('searchResults');
if (input) input.value = '';
if (results) results.classList.add('d-none');
if (searchTimer) {
clearTimeout(searchTimer);
searchTimer = null;
}
}
function showResults(results, query) {
const resultsContainer = document.getElementById('searchResults');
const resultsContent = resultsContainer?.querySelector('.search-content');
if (!resultsContainer || !resultsContent) return;
resultsContent.innerHTML = createResultsHTML(results, query);
resultsContainer.classList.remove('d-none');
resultsContent.addEventListener('click', handleResultClick);
}
function initSearch() {
const input = document.getElementById('siteSearch');
const results = document.getElementById('searchResults');
if (!input || !results) {
setTimeout(initSearch, 500);
return;
}
input.addEventListener('input', function(e) {
const query = e.target.value.trim();
if (searchTimer) clearTimeout(searchTimer);
if (query.length < 2) {
results.classList.add('d-none');
return;
}
searchTimer = setTimeout(() => {
const searchResults = performSearch(query);
showResults(searchResults, query);
}, 300);
});
document.addEventListener('click', function(e) {
if (!e.target.closest('.search-container')) {
results.classList.add('d-none');
}
});
input.addEventListener('keydown', function(e) {
if (e.key === 'Escape') {
clearSearch();
input.blur();
}
});
}
const style = document.createElement('style');
style.textContent = `
.search-no-results {
padding: 2rem;
text-align: center;
color: #6c757d;
}
.search-no-results i {
font-size: 2rem;
margin-bottom: 1rem;
display: block;
}
.search-result-item {
padding: 12px 16px;
border-bottom: 1px solid #eee;
cursor: pointer;
transition: background-color 0.2s;
}
.search-result-item:hover {
background-color: #f8f9fa;
}
.search-result-item:last-child {
border-bottom: none;
}
.search-result-title {
font-weight: 600;
color: #007bff;
margin-bottom: 4px;
}
.search-result-desc {
font-size: 0.875rem;
color: #6c757d;
margin-bottom: 4px;
}
.search-result-url {
font-size: 0.75rem;
color: #28a745;
}
.dark-mode .search-result-item {
border-color: #404040;
}
.dark-mode .search-result-item:hover {
background-color: #404040;
}
.dark-mode .search-result-desc {
color: #a0aec0;
}
.dark-mode .search-no-results {
color: #a0aec0;
}
`;
document.head.appendChild(style);
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initSearch);
} else {
initSearch();
}
setInterval(() => {
const input = document.getElementById('siteSearch');
if (input && !input.dataset.searchInitialized) {
input.dataset.searchInitialized = 'true';
initSearch();
}
}, 2000);
window.initSimpleSearch = initSearch;
})();
})();