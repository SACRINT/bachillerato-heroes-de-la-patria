---
Versión: 1.1
Fecha: 20-09-2025
---

# CLAUDE.md

Claude, este proyecto corresponde a: **Portal Web Héroes de la Patria**.
Nombre de la PWA: "Héroes Conectados"

Tu tarea es actuar como mi **asistente de desarrollo profesional**, generando, revisando y mejorando todo el código y configuraciones necesarias.  
Usa los MCP instalados y los agentes que se definan aquí.

---

## 🎯 Objetivos del proyecto

### Propósito Principal:
Diseñar, desarrollar y desplegar una plataforma web y una Aplicación Web Progresiva (PWA) de alta calidad para el Bachillerato General Estatal "Héroes de la Patria", con el fin de fortalecer su identidad digital, optimizar la comunicación con su comunidad y servir como una herramienta educativa y de gestión esencial.

### Propósitos Específicos:

1. **Establecer una Presencia Digital Profesional:**
   - Crear un sitio web moderno, rápido, accesible y visualmente atractivo que refleje la misión, visión y valores de la institución, generando confianza y prestigio ante aspirantes, padres de familia y la comunidad en general.

2. **Centralizar la Información Institucional:**
   - Servir como la fuente oficial de información sobre la oferta educativa, plan de estudios, proceso de admisión, normatividad, convocatorias y eventos, asegurando que los datos sean claros, consistentes y de fácil acceso para todos.

3. **Mejorar la Experiencia del Estudiante y la Comunidad:**
   - Ofrecer herramientas útiles y accesibles a través de la PWA "Héroes Conectados", tales como horarios de clase, calendario escolar interactivo, avisos importantes y recursos educativos, mejorando el involucramiento y la organización del estudiante.

4. **Optimizar los Canales de Comunicación:**
   - Facilitar la interacción entre la escuela, los alumnos y los padres de familia a través de formularios de contacto, buzón de sugerencias, directorio escolar y (en futuras iteraciones) notificaciones push.

5. **Servir como Caso de Estudio Educativo:**
   - Utilizar el propio proyecto como una herramienta de enseñanza práctica para los estudiantes del bachillerato, demostrando el ciclo de vida completo del desarrollo web, desde la planificación y el diseño con HTML, CSS y JavaScript, hasta el despliegue en un servidor real, fomentando así las competencias digitales y la resolución de problemas.

---

## Project Overview

This is a Progressive Web App (PWA) for "Bachillerato General Estatal Héroes de la Patria", a high school in Puebla, Mexico. It's a multi-page static website built with Bootstrap 5, featuring offline-first PWA capabilities, a chatbot system, and dynamic content loading.

---

## ⚙️ Tecnologías principales
- **Frontend**: HTML5, CSS3, Bootstrap 5.3.2, Vanilla JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest, Offline-first strategy
- **Base de datos**: JSON-based CMS system (estático)
- **UI/UX**: Bootstrap components, Font Awesome icons, responsive design
- **Infraestructura**: Static hosting, GitHub Pages compatible
- **Chatbot**: Custom JavaScript implementation with knowledge base
- **Admin Panel**: Dashboard administrativo completo con autenticación

---

## 🔑 MCP que debes usar
- ESLint MCP (para análisis de código JavaScript)
- Prettier MCP (para formateo de código)
- SonarQube MCP (para análisis de calidad)
- CodeQL MCP (para análisis de seguridad)
- OWASP Dependency-Check MCP (para vulnerabilidades en dependencias)
- Swagger/OpenAPI MCP (para documentación de APIs futuras)
- Git MCP (para control de versiones)
- Docker MCP (para contenedorización si es necesario)

---

## 🤖 Agentes esperados
- **Agente Arquitecto**: Revisa la arquitectura PWA y propone mejoras de rendimiento.
- **Agente Seguridad**: Escanea el código y configuraciones para detectar vulnerabilidades web.
- **Agente Frontend**: Optimiza HTML, CSS, JavaScript, UX/UI y accesibilidad web.
- **Agente PWA**: Gestiona Service Worker, manifest, y funcionalidades offline.
- **Agente DevOps**: Configura despliegue estático, optimización de assets y CI/CD.
- **Agente Contenido**: Estructura y optimiza el contenido educativo y CMS JSON.

---

## 📂 Tareas que debes realizar
1. Mantener y optimizar la estructura multi-página con componentes dinámicos.
2. Mejorar el rendimiento del Service Worker y estrategias de cache.
3. Optimizar el sistema CMS basado en JSON para fácil mantenimiento.
4. Perfeccionar el dashboard administrativo y sus funcionalidades.
5. Expandir las capacidades del chatbot educativo.
6. Mejorar la accesibilidad y SEO del sitio web.
7. Optimizar la experiencia PWA en dispositivos móviles.
8. Revisar y mejorar la seguridad del frontend.

---

## ✅ Criterios de calidad
- Código HTML/CSS/JS limpio y bien documentado.
- PWA que funcione perfectamente offline.
- Diseño responsivo y accesible (WCAG compliance).
- Rendimiento óptimo (Core Web Vitals).
- Seguridad frontend (CSP, validación, sanitización).
- Experiencia de usuario excepcional.
- Documentación clara para mantenimiento educativo.

---

## 📌 Instrucciones adicionales
- Siempre mantén la filosofía educativa del proyecto.
- Prioriza la simplicidad y facilidad de mantenimiento.
- Considera que será usado como herramienta de enseñanza.
- Optimiza para usuarios con diferentes niveles técnicos.
- Mantén compatibilidad con navegadores modernos.
- Usa ejemplos de código listos para producción educativa.

---

## Architecture

### Core Structure
- **Multi-page architecture** with shared components loaded dynamically
- **Bootstrap 5.3.2** as the primary CSS framework (loaded from CDN)
- **Vanilla JavaScript** with modern ES6+ features
- **PWA offline-first** strategy with comprehensive service worker
- **Responsive design** with mobile-first approach

### Key Files and Directories
```
├── index.html                    # Main homepage
├── conocenos.html               # About us page  
├── oferta-educativa.html        # Educational offerings
├── servicios.html               # Services
├── comunidad.html               # Community
├── contacto.html                # Contact
├── offline.html                 # PWA offline fallback page
├── partials/
│   ├── header.html              # Shared navigation header
│   └── footer.html              # Shared footer
├── js/
│   ├── script.js                # Main app logic with partials injection
│   ├── cms-integration.js       # Dynamic content loading system
│   ├── chatbot.js               # Intelligent chatbot with knowledge base
│   └── [page-specific].js       # Individual page functionality
├── css/
│   └── style.css                # Custom styles layered over Bootstrap
├── images/                      # Optimized images (WebP + fallbacks)
├── data/                        # JSON data files for CMS
├── manifest.json                # PWA configuration
└── sw-offline-first.js          # Service Worker for offline functionality
```

### Component System
- **Header/Footer injection**: `js/script.js` dynamically loads `partials/header.html` and `partials/footer.html` into every page
- **Bootstrap components**: Uses native Bootstrap 5 JavaScript APIs (no jQuery dependency)
- **Modular architecture**: Each major feature has its own JavaScript file

## Development Commands

Since this is a static website, there are no build commands. However, for development:

```bash
# Serve locally (use any static server)
npx serve .
# or
python -m http.server 8000

# For production optimization, minify assets:
npx html-minifier --input-dir . --output-dir dist --file-ext html
npx uglifycss css/style.css > css/style.min.css
npx uglifyjs js/script.js -o js/script.min.js
```

## Key Technical Features

### PWA Implementation
- **Service Worker**: `sw-offline-first.js` implements cache-first for static assets, network-first for HTML pages
- **App Shell**: Critical resources are precached for offline functionality
- **Install prompts**: Native PWA installation with custom UI
- **Manifest**: Comprehensive PWA manifest with shortcuts, file handlers, and screenshots

### Content Management
- **CMS Integration**: `js/cms-integration.js` loads content from JSON files in `/data/` directory
- **Caching system**: In-memory cache with 5-minute timeout for dynamic content
- **Fallback data**: Graceful degradation when data files aren't available

### Chatbot System
- **Knowledge base**: Comprehensive FAQ system in `js/chatbot.js`
- **Keyword matching**: Intelligent response matching based on user input
- **School-specific**: Contains information about admissions, schedules, location, etc.

### Performance Optimizations
- **Preloading**: Critical resources preloaded in HTML head
- **Image optimization**: WebP format with JPEG fallbacks
- **Lazy loading**: Images load as needed
- **Font optimization**: Google Fonts with proper preconnects

## Development Guidelines

### HTML Structure
- All pages follow semantic HTML5 structure
- ARIA labels and roles implemented for accessibility
- Skip links for keyboard navigation
- Structured data (JSON-LD) for SEO

### CSS Architecture  
- **Bootstrap 5** as base framework (never modify Bootstrap classes)
- **Custom CSS** in `css/style.css` uses CSS custom properties for theming
- **Dark mode** support through CSS variables
- **Mobile-first** responsive design principles

### JavaScript Patterns
- **ES6+ modules**: Use modern JavaScript features
- **Class-based architecture**: Main app uses `HeroesPatriaApp` class
- **Event-driven**: Bootstrap event APIs for component interactions
- **Error handling**: Comprehensive try-catch blocks with fallbacks

### Image Handling
- **WebP first**: Always provide WebP with fallback formats
- **Responsive images**: Use `<picture>` elements and srcset
- **Lazy loading**: Implement `loading="lazy"` for non-critical images
- **Optimization**: Keep images under 200KB for performance

### Accessibility Standards
- **WCAG 2.1 AA** compliance maintained throughout
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Screen reader support**: Proper ARIA labels and semantic markup
- **Color contrast**: Maintains 4.5:1 ratio minimum

## Content Updates

### Adding New Pages
1. Create HTML file following existing page structure
2. Ensure header/footer injection points exist: `<header id="main-header"></header>`
3. Add page to service worker's `PRECACHE_RESOURCES` array
4. Update sitemap.xml and navigation in `partials/header.html`

### CMS Content Updates
- Edit JSON files in `/data/` directory
- Content automatically refreshes due to cache timeout
- Follow existing JSON structure for consistency

### Chatbot Knowledge Base
- Update `KNOWLEDGE_DATABASE` object in `js/chatbot.js`
- Follow existing pattern: keywords array + response string
- Test keyword matching for optimal user experience

## Deployment

This is a static site ready for deployment to:
- **GitHub Pages** (current setup)
- **Netlify** 
- **Traditional web hosting**

### Pre-deployment Checklist
1. Verify all external CDN links are working
2. Test PWA functionality (offline mode, install prompt)
3. Run Lighthouse audit (target: 90+ in all categories)
4. Update any hardcoded URLs to production domain
5. Ensure service worker cache version is updated

### Domain Configuration
When changing domains, update:
- `manifest.json` (start_url, scope)
- Service worker cache origins
- Structured data URLs
- Any hardcoded URLs in JavaScript

## Browser Support
- **Modern browsers**: Full PWA and ES6+ support
- **Older browsers**: Graceful degradation with polyfills
- **Mobile**: Optimized for iOS Safari and Android Chrome