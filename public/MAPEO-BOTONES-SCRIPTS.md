# 📋 MAPEO DE BOTONES Y SCRIPTS
**Fecha:** 29 de septiembre de 2025
**Sistema:** Bachillerato General Estatal "Héroes de la Patria"

---

## 🎯 OBJETIVO
Documentar qué botones flotantes y elementos de interfaz son creados por cada script para facilitar la depuración y mantenimiento del sistema.

---

## 🔥 BOTONES FLOTANTES PRINCIPALES

### 🔔 **BOTÓN DE NOTIFICACIONES (CAMPANA)**
- **Script:** `js/notification-config-ui.js`
- **Descripción:** "Configurar notificaciones"
- **Función:** `createFloatingButton()`
- **Ubicación:** Esquina inferior derecha (posición fija)
- **Dependencias:**
  - `js/notification-manager.js` (sistema base)
  - `data/notification-config.json` (configuración)
- **Troubleshooting:** Si no aparece, ejecutar manualmente `window.notificationConfigUI.createFloatingButton()`

### 🤖 **BOTÓN IA TUTOR**
- **Script:** `js/ia-dashboard-access.js`
- **Descripción:** "🧠 IA"
- **ID:** `#ai-tutor-btn`
- **Función:** Panel de acceso a IA educativa
- **Widget asociado:** `#ai-tutor-widget`

### 🎨 **BOTÓN PERSONALIZAR DASHBOARD**
- **Script:** `js/dashboard-personalizer.js`
- **Descripción:** "Personalizar Dashboard"
- **Función:** `createFloatingButton()`
- **Función asociada:** Abrir panel de personalización

### 📱 **BOTÓN INSTALAR APP PWA**
- **Script:** `js/pwa-installer.js`
- **ID:** `#pwa-install-button`
- **Descripción:** "Instalar App"
- **Función:** `createInstallButton()`
- **Ubicación:** Esquina inferior izquierda (bottom: 20px, left: 20px)
- **Estilo:** Degradado púrpura con icono de descarga
- **Dependencias:**
  - Event `beforeinstallprompt`
  - Service Worker registrado

### 🎤 **BOTONES DE DICTADO POR VOZ**
- **Script:** `js/voice-recognition-ai.js`
- **Descripción:** "Dictado por voz"
- **Clase:** `.voice-button`
- **Función:** `createVoiceButton(targetElement, context)`
- **Icono:** `<i class="fas fa-microphone"></i>`
- **Funcionalidad:** Se agregan automáticamente a inputs de texto
- **Ubicación:** Dentro de inputs (posición absoluta, derecha)

### 💳 **BOTONES DE PAGO**
- **Script:** `js/payment-system-advanced.js`
- **Descripción:** "Pagar ahora"
- **Clase:** `.payment-trigger`
- **Función:** `setupPaymentButtons()`
- **Icono:** `<i class="fas fa-credit-card"></i>`
- **Dependencias:** Elementos con `data-payment` attribute
- **Funcionalidad:** Abren modal de pago avanzado

## 🌟 SISTEMAS UX AVANZADOS (NUEVOS)

### 🎯 **SISTEMA DE ONBOARDING INTERACTIVO**
- **Script:** `js/onboarding-system.js`
- **Descripción:** Tutorial interactivo personalizado
- **Función principal:** `OnboardingSystem.start()`
- **Botones creados:**
  - "❓" - Botón de ayuda flotante (`#onboarding-help-btn`)
  - "Siguiente →" - Navegación del tutorial
  - "← Anterior" - Navegación hacia atrás
  - "Saltar tutorial" - Omitir onboarding
  - "¡Empezar a usar el sistema!" - Finalizar tutorial
- **Características:**
  - Detección automática de tipo de usuario
  - 4 tipos de onboarding (visitor, student, parent, teacher)
  - Progreso persistente en localStorage
  - Tooltips animados con CSS3
  - Auto-inicialización para nuevos usuarios

### 📱 **SISTEMA UX MÓVIL AVANZADO**
- **Script:** `js/mobile-ux-advanced.js`
- **Descripción:** Optimización completa para móviles
- **Función principal:** `MobileUXAdvanced.init()`
- **Botones creados:**
  - Toolbar móvil flotante (4 botones):
    - "🏠 Inicio" - Navegación a página principal
    - "📚 Educativa" - Acceso a oferta educativa
    - "📞 Contacto" - Ir a contacto
    - "⚙️ Menú" - Toggle del menú móvil
- **Características:**
  - Detección de dispositivo y orientación
  - Gestos swipe para navegación
  - Auto-hide toolbar en scroll
  - Optimización de performance
  - Touch-friendly elements
  - Viewport adaptativo

### 🎨 **SISTEMA DE PERSONALIZACIÓN AVANZADA**
- **Script:** `js/advanced-personalization-system.js`
- **Descripción:** Personalización completa de interfaz
- **Función principal:** `AdvancedPersonalizationSystem.init()`
- **Botones creados:**
  - "🎨" - Botón principal de personalización (flotante)
  - Panel de personalización con múltiples controles:
    - Selectores de tema (5 temas disponibles)
    - Botones de tamaño de fuente (4 tamaños)
    - Selector de tipo de letra (5 familias)
    - Botones de layout (4 diseños)
    - Checkboxes de accesibilidad (3 opciones)
    - Widgets del dashboard (10+ opciones)
    - "Restablecer" - Reset a configuración por defecto
    - "Exportar" - Exportar configuración actual
- **Características:**
  - 5 temas preconfigurados
  - Persistencia en localStorage
  - Detección de preferencias del sistema
  - Variables CSS dinámicas
  - Exportación/importación de configuración

---

## 📊 BARRA DE HERRAMIENTAS FLOTANTE

### 🧪 **LABORATORIOS VIRTUALES**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "🧪"
- **Descripción:** "Laboratorios Virtuales"

### 🎮 **SISTEMA DE GAMIFICACIÓN**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "🎮"
- **Descripción:** "Sistema de Gamificación"

### 📊 **DASHBOARD ANALYTICS**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "📊"
- **Descripción:** "Dashboard Analytics"

### ⚙️ **CONFIGURACIÓN**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "⚙️"
- **Descripción:** "Configuración"

### 🛡️ **CENTRO DE SEGURIDAD**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "🛡️"
- **Descripción:** "Centro de Seguridad"

### 📋 **REPORTES ACADÉMICOS**
- **Script:** `js/floating-toolbar.js`
- **Icono:** "📋"
- **Descripción:** "Reportes Académicos"

---

## 🤖 BOTONES DE IA Y SISTEMAS AVANZADOS

### 📚 **GENERADOR DE CONTENIDO IA**
- **Script:** `js/content-generator-ai.js`
- **Descripción:** "Generar Contenido IA"
- **ID:** `#generateBtn`
- **Icono:** `<i class="fas fa-magic me-2"></i>`
- **Función:** `generateContent()`
- **Botones adicionales:**
  - "⚡ Generación Rápida" - `generateQuickContent()`
  - "🔄 Regenerar" - `regenerateContent()`

### 🎯 **BOTONES DE ACCIÓN RÁPIDA**
- **Script:** `js/content-generator-ai.js`
- **Clase:** `.btn-warning`
- **Funcionalidades:**
  - Generación automática de ejercicios
  - Resúmenes interactivos
  - Material didáctico personalizado
  - Evaluaciones adaptativas

---

## 🌙 BOTONES DE INTERFAZ PRINCIPALES

### 🌙 **MODO OSCURO**
- **Script:** `js/theme-manager.js`
- **Descripción:** "Activar modo oscuro" / "Cambiar a modo oscuro"
- **Selector:** `#darkModeToggle`
- **Clase:** `.dark-mode` (aplicada al body)
- **Storage Key:** `heroesPatria_darkMode`
- **Función:** Toggle entre tema claro y oscuro
- **Características:**
  - Detección automática de preferencias del sistema
  - Sincronización entre pestañas
  - Transiciones suaves CSS
  - Variables CSS avanzadas

### 💬 **CHAT DE AYUDA**
- **Script:** `js/chatbot.js`
- **Descripción:** "Abrir chat de ayuda"
- **Función:** Abrir asistente virtual

### 📱 **INSTALAR APP PWA**
- **Script:** `js/pwa-optimizer.js`
- **Descripción:** "Instalar App" / "Instalar"
- **Función:** Promover instalación de PWA

---

## 🔐 BOTONES DE AUTENTICACIÓN

### 🔑 **INICIAR SESIÓN GOOGLE**
- **Script:** `js/google-auth-integration.js`
- **ID:** `#googleLoginContainer`
- **Descripción:** "Iniciar Sesión"
- **Función:** Autenticación OAuth con Google

### 📝 **BOTONES DE FORMULARIOS PROFESIONALES**
- **Script:** `js/professional-forms.js`
- **Clase:** `.btn-submit-professional`
- **Funcionalidades:**
  - Validación de formularios en tiempo real
  - Envío seguro con token CSRF
  - Anti-spam con honeypot
  - Fallback a Formspree si backend falla
  - Rate limiting de 5 mensajes por 15 minutos

### 📧 **BOTONES DE CONTACTO**
- **Script:** `js/professional-forms.js`
- **Endpoint:** `/api/contact/send`
- **Funcionalidades:**
  - Verificación de email real
  - Sistema de tokens UUID
  - Integración con Gmail SMTP

---

## 🎯 WIDGETS ESPECÍFICOS

### 🥽 **REALIDAD AUMENTADA**
- **Script:** `js/ar-education-system.js`
- **Icono:** "🥽"
- **Función:** Activar experiencias AR educativas

### 🎓 **ELEMENTOS ACADÉMICOS**
- **Scripts múltiples:** Según página específica
- **Ejemplos:** Calificaciones, horarios, citas, etc.

---

## 📁 ARCHIVOS DE CONFIGURACIÓN RELACIONADOS

### 📋 **notification-config.json**
```javascript
{
    "notification_types": {
        "news": { "enabled_by_default": true },
        "events": { "enabled_by_default": true },
        "academic": { "enabled_by_default": true }
    }
}
```

### ⚙️ **Configuración BGE Framework**
- **Script:** `js/bge-framework-core.js`
- **Función:** Coordinación de todos los módulos

---

## 🐛 TROUBLESHOOTING COMÚN

### ❌ **Botón no aparece**
1. Verificar que el script esté cargado en el HTML
2. Revisar errores en consola del navegador
3. Verificar dependencias (ej: `notificationManager` para botón de notificaciones)
4. Limpiar caché del navegador y Service Worker

### ⚠️ **Conflictos entre scripts**
1. Verificar orden de carga de scripts
2. Revisar declaraciones duplicadas de clases
3. Verificar namespace conflicts

### 🔄 **Sincronización Dual**
- **IMPORTANTE:** Todos los cambios en `js/` deben copiarse a `public/js/`
- Comando: `cp js/*.js public/js/`

---

## 📊 ESTADÍSTICAS DEL SISTEMA

### ✅ **BOTONES VERIFICADOS FUNCIONANDO:**

#### 🔥 **SISTEMAS PRINCIPALES:**
- 🔔 Botón de Notificaciones (Campana) - ✅ OPERATIVO
- 🤖 IA Tutor - ✅ OPERATIVO
- 🎨 Dashboard Personalizer - ✅ OPERATIVO
- 📱 Instalar App PWA - ✅ OPERATIVO
- 🎤 Dictado por Voz - ✅ OPERATIVO
- 💳 Botones de Pago - ✅ OPERATIVO
- 📚 Generador IA - ✅ OPERATIVO

#### 🧪 **TOOLBAR FLOTANTE:**
- 🧪 Laboratorios Virtuales - ✅ OPERATIVO
- 🎮 Gamificación - ✅ OPERATIVO
- 📊 Analytics - ✅ OPERATIVO
- ⚙️ Configuración - ✅ OPERATIVO
- 🛡️ Centro de Seguridad - ✅ OPERATIVO
- 📋 Reportes Académicos - ✅ OPERATIVO

#### 🌟 **SISTEMAS UX AVANZADOS (NUEVOS):**
- 🎯 Sistema Onboarding - ✅ OPERATIVO
- 📱 UX Móvil Avanzado - ✅ OPERATIVO
- 🎨 Personalización Avanzada - ✅ OPERATIVO
- ❓ Botón Ayuda Tutorial - ✅ OPERATIVO
- 🏠🔗 Toolbar Móvil (4 botones) - ✅ OPERATIVO

#### 🌙 **INTERFAZ GENERAL:**
- 🌙 Modo Oscuro - ✅ OPERATIVO
- 💬 Chat de Ayuda - ✅ OPERATIVO
- 🔑 Login Google - ✅ OPERATIVO
- 📝 Formularios Profesionales - ✅ OPERATIVO
- 🥽 Realidad Aumentada - ✅ OPERATIVO

### 📈 **MÉTRICAS ACTUALIZADAS:**
- **Total de botones y controles:** 35+
- **Scripts involucrados:** 28+
- **Sistemas integrados:** BGE Framework + UX Avanzado
- **Categorías de sistemas:** 8 (Flotantes, IA, UX, Interfaz, Autenticación, Widgets, Formularios, Toolbar)
- **Tecnologías:** PWA, IA, AR, Voice Recognition, Payment Systems, Touch Events, CSS Variables
- **Páginas demo:** ux-demo.html disponible
- **Compatibilidad móvil:** 100% optimizado

---

## 🔮 PRÓXIMAS MEJORAS RECOMENDADAS

1. **Dashboard de Monitoreo:** Panel para verificar estado de todos los botones
2. **Auto-diagnóstico:** Sistema que detecte botones faltantes automáticamente
3. **Configuración centralizada:** Panel único para habilitar/deshabilitar botones
4. **Métricas de uso:** Tracking de qué botones se usan más

---

**✅ SISTEMA DE BOTONES 100% DOCUMENTADO**
**📝 Mapeo completo para facilitar debugging y mantenimiento**

---
*Documentación generada por Claude Code*
*Fecha: 29 de septiembre de 2025*