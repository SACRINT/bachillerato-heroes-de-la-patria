# 🏫 Bachillerato General Estatal "Héroes de la Patria"

## Sistema Educativo Digital Avanzado - Visión 2025-2030

### 📍 **ESTADO ACTUAL:** Plataforma Base Estable y Funcional, con Módulos Avanzados en Desarrollo

### 📅 **ÚLTIMA ACTUALIZACIÓN:** 14 de Octubre de 2025

---

## 🌟 **Visión del Proyecto: Un Futuro Educativo Transformado**

El Bachillerato General Estatal "Héroes de la Patria" se ha consolidado como una institución educativa digital líder, ofreciendo un ecosistema tecnológico integral que redefine la experiencia educativa. Nuestra visión es ser un referente nacional en innovación pedagógica y tecnológica, preparando a nuestros estudiantes para los desafíos del siglo XXI.

---

## 📖 **Fuente Única de Verdad: La Historia del Proyecto**

**Toda la historia, arquitectura, fases de desarrollo, guías técnicas y reportes del proyecto han sido consolidados en un único documento maestro.**

Para entender completamente el proyecto, su estado actual, y su evolución, por favor consulta:

### 📄 **[docs/historia_del_proyecto.md](docs/historia_del_proyecto.md)**

Este documento es el punto de partida obligatorio para cualquier desarrollador, colaborador o agente de IA que trabaje en este proyecto.

### 🛠️ **[docs/MIGRATION_REPORT.md](docs/MIGRATION_REPORT.md)**

Reporte técnico detallado sobre la migración del backend a TypeScript (Diciembre 2025).

---

## 🚀 **Capacidades Actuales de la Plataforma**

La plataforma cuenta con una base robusta y funcional que incluye:

- ✅ **Arquitectura Modular (Framework BGE):** Un sistema de carga de módulos optimizado que ha reemplazado la carga masiva de scripts individuales.
- ✅ **PWA Optimizada:** Experiencia offline, instalable y con un rendimiento mejorado.
- ✅ **Seguridad Robusta:** Autenticación mediante JWT, variables de entorno para secretos y un sistema de roles y permisos.
- ✅ **Backend Funcional:** Más de 60 endpoints operativos que gestionan desde la autenticación hasta los datos de los egresados.
- ✅ **Formularios Profesionales:** Todos los formularios de contacto y suscripción son funcionales y cuentan con un sistema de verificación por email.
- ✅ **Panel de Administración:** Un dashboard funcional para la gestión de usuarios, egresados y otras entidades.
- ✅ **Bases para Funcionalidades Avanzadas:** La estructura para sistemas de IA, Gamificación y AR/VR está presente, aunque su implementación completa es parte del roadmap a futuro.

---

## 🛠️ **TECNOLOGÍAS PRINCIPALES**

### **Frontend:**

- **HTML5, CSS3, JavaScript ES6+**
- **Bootstrap 5.3.2**
- **Progressive Web App (PWA)** con Service Workers

### **Backend:**

- **Node.js + Express**
- **TypeScript** (Rutas migradas)
- **MySQL Database** (con Neon/PlanetScale para despliegue serverless)
- **Autenticación JWT**

### **Integraciones:**

- **Google OAuth 2.0**
- **API de OpenAI/Claude** (para el chatbot)
- **Nodemailer** (para el sistema de correos)

---

## 📁 **ESTRUCTURA DEL PROYECTO**

La estructura del proyecto ha sido optimizada para separar el código fuente, los archivos públicos, la documentación y los artefactos históricos.

```
📦 BGE-HeroesPatria/
├── 📄 README.md               # Visión general del proyecto
├── 📄 CLAUDE.md       # Instrucciones para agentes de IA
├── 📁 backend/                # Lógica de negocio, APIs y conexión a BD
├── 📁 public/                 # Copia de archivos estáticos para despliegue
├── 📁 js/                     # Módulos JavaScript del frontend (Framework BGE)
├── 📁 css/                    # Estilos CSS
├── 📁 docs/                   # Documentación del proyecto
│   ├── 📄 historia_del_proyecto.md  # 👈 DOCUMENTO MAESTRO
│   └── 📁 historico_archivado/     # Archivos de documentación originales
└── 📁 no_usados/              # Scripts y demos obsoletos archivados
```

---

## 🚀 **Cómo Empezar**

1. **Leer la documentación maestra:** `docs/historia_del_proyecto.md`.
2. Configurar el entorno de desarrollo local (Node.js, MySQL).
3. Instalar las dependencias del backend: `cd backend && npm install`.
4. Configurar el archivo `.env` con las credenciales necesarias.
5. Iniciar el servidor: `npm start` dentro de la carpeta `backend`.

---

*README actualizado para reflejar la consolidación del proyecto.*
