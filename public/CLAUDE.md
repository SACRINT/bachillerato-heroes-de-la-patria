# 📋 CLAUDE CODE - NOTAS DEL PROYECTO

## 🤖 INSTRUCCIÓN DE CONTINUIDAD DEL PROYECTO

**⚠️ COMANDO ESPECIAL: "continua con el proyecto BGE"**

Cuando el usuario escriba **"continua con el proyecto BGE"**, DEBES:

1. **📖 LEER INMEDIATAMENTE estos documentos en orden**:
   - `docs/INVENTARIO_COMPLETO_FORMULARIOS_30_SEP_2025.md` (estado más reciente)
   - `docs/CORRECCION_FORMULARIO_QUEJAS_SEPTIEMBRE_30_2025.md` (último trabajo realizado)
   - `CLAUDE.md` (este archivo - instrucciones generales)

2. **🔍 IDENTIFICAR tareas pendientes**:
   - Buscar secciones marcadas con ⏳ PENDIENTE
   - Revisar "Plan de Acción" en documentos
   - Identificar formularios en estado ⚠️ o ❌

3. **📋 RETOMAR trabajo automáticamente**:
   - Continuar desde donde se quedó la última sesión
   - Priorizar tareas marcadas como "Prioridad Alta"
   - Mantener el contexto completo del proyecto

4. **📝 DOCUMENTAR TODO**:
   - Cada cambio debe documentarse en un archivo .md en `docs/`
   - Usar formato: `NOMBRE_TAREA_FECHA.md`
   - Incluir: problemas, soluciones, código antes/después, pruebas
   - Actualizar inventarios y checklists existentes

5. **🔄 SINCRONIZAR SIEMPRE**:
   - Cualquier cambio en raíz → copiar a `public/`
   - Cualquier cambio en `public/` → copiar a raíz
   - Verificar ambos servidores funcionando

## 🌍 INSTRUCCIONES DE IDIOMA

**⚠️ IMPORTANTE: CLAUDE DEBE RESPONDER SIEMPRE EN ESPAÑOL**
- Todas las conversaciones deben ser en español
- Todas las explicaciones técnicas en español
- Todos los comentarios de código en español
- Documentación y reportes en español

## 🎯 ESTADO ACTUAL DEL PROYECTO (ACTUALIZADO: 09 OCT 2025)

**📌 ÚLTIMA SESIÓN COMPLETADA: 09 de Octubre 2025** ⭐ NUEVA

### ✅ LOGROS DE SESIÓN 09 OCT 2025:
- ✅ **Sistema de Bolsa de Trabajo y Suscriptores COMPLETAMENTE FUNCIONAL** 🎉
- ✅ Backend API completo con endpoints CRUD para bolsa de trabajo y suscriptores
- ✅ Frontend managers implementados (BolsaTrabajoManager + SuscriptoresManager)
- ✅ **PROBLEMA CRÍTICO RESUELTO:** Tabs del dashboard ahora cargan correctamente
- ✅ Event-driven initialization implementada con Bootstrap tab events
- ✅ IDs de elementos HTML corregidos en ambos managers
- ✅ Funciones globales agregadas para onclick handlers
- ✅ Estados visuales (loading, empty, table) funcionando perfectamente
- ✅ Exportación a CSV implementada y funcional
- ✅ Filtros y búsquedas operativas en ambos paneles
- ✅ Archivos sincronizados entre raíz y public/
- ✅ Documentación completa creada: `REPORTE_CORRECCION_TABS_DASHBOARD_09_OCT_2025.md`

### ✅ LOGROS DE SESIÓN 02 OCT 2025:
- ✅ **TODOS LOS PROBLEMAS RESUELTOS (7/6 = 117%)** 🎉
- ✅ Error módulos duplicados eliminado en 23 páginas HTML
- ✅ Botón "Recordar sesión" funcional (24h o 30 días)
- ✅ **Sistema completo de registro de usuarios implementado**
- ✅ Tab "Contenido" con contadores reales funcionando
- ✅ Menús desplegables funcionando en todas las páginas
- ✅ Botones de login funcionando en todas las páginas
- ✅ **Backend completo con 6 endpoints de API**
- ✅ **Dashboard administrativo integrado con API**
- ✅ 10 tests automatizados (100% exitosos)

### ✅ LOGROS PREVIOS (30 SEP 2025):
- ✅ Sistema de formularios con verificación de email **FUNCIONANDO**
- ✅ Formulario "Quejas y Sugerencias" (index.html) **PROBADO Y OPERATIVO**
- ✅ Formulario "Contacto General" (contacto.html) **PROBADO Y OPERATIVO**
- ✅ Email final llegando correctamente a `21ebh0200x.sep@gmail.com`
- ✅ Eliminadas APIs externas bloqueadas por CSP
- ✅ Corregido error nodemailer.createTransporter
- ✅ Inventario completo de 11 formularios documentado
- ✅ Corregido mismatch de nombres de campos (español ↔ inglés)

### ⏳ TAREAS PENDIENTES (Prioridad Alta):
1. **Probar formulario de Actualización de Egresados** (`egresados.html`)
   - Estado: Configurado con muchos campos
   - Requiere verificación de todos los campos
   - Tiempo estimado: 10 minutos

### ⏳ TAREAS PENDIENTES (Prioridad Media):
2. **Configurar formulario de CV** (`bolsa-trabajo.html`)
   - Problema: Envía FormData en lugar de JSON
   - Requiere: Agregar clase `professional-form` y convertir a JSON
   - Tiempo estimado: 30 minutos

3. **Configurar formulario de Notificaciones** (`convocatorias.html`)
   - Requiere: Agregar clase `professional-form` y action
   - Tiempo estimado: 15 minutos

### 📊 ESTADÍSTICAS DEL PROYECTO:
- **11 formularios** identificados
- **3 funcionando** (27%) ⬆️ +9%
- **1 parcialmente configurado** (9%) ⬇️
- **7 pendientes o no requieren config** (64%)

### 📄 DOCUMENTACIÓN CREADA:
- `REPORTE_CORRECCION_TABS_DASHBOARD_09_OCT_2025.md` (25 KB) ⭐ NUEVO
- `IMPLEMENTACION_FRONTEND_BOLSA_TRABAJO_SUSCRIPTORES_09_OCT_2025.md` (22 KB)
- `docs/CORRECCION_FORMULARIO_QUEJAS_SEPTIEMBRE_30_2025.md` (55 KB)
- `docs/CORRECCION_FORMULARIO_CONTACTO_30_SEP_2025.md` (18 KB)
- `docs/INVENTARIO_COMPLETO_FORMULARIOS_30_SEP_2025.md` (30 KB)

**⚠️ RECORDATORIO CRÍTICO PARA CLAUDE:**
**AL INICIO DE CADA SESIÓN, LEER:**
1. `docs/INVENTARIO_COMPLETO_FORMULARIOS_30_SEP_2025.md` (más reciente)
2. Este archivo (`CLAUDE.md`)

### 📊 **RESUMEN ESTADO ACTUAL:**
- ✅ **Radiografía completa FINALIZADA** (7/7 fases, 179 archivos, 125,143 líneas)
- 🚨 **5 vulnerabilidades críticas** identificadas (bloquean producción)
- 💰 **Fase 1 Seguridad** ($5,600 USD) - **PENDIENTE APROBACIÓN**
- 🌟 **Proyecto de vanguardia mundial** - Sin competencia en educación

### 📋 **DOCUMENTOS CLAVE CREADOS:**
- `ESTADO-PROYECTO-Y-SECUENCIA.md` - **LEER SIEMPRE PRIMERO**
- `RADIOGRAFIA-COMPLETA-FINAL-7-FASES.md` - Análisis completo
- `PLAN-PRECISO-IMPLEMENTACION.md` - Plan detallado
- `MAPEO-BOTONES-SCRIPTS.md` - **MAPEO DE BOTONES Y SCRIPTS** 🔔

### 🎯 **PRÓXIMA ACCIÓN ESPERADA:**
**Decisión sobre Fase 1 Seguridad ($5,600 USD) para resolver vulnerabilidades**

---

## 🚨 ESTRUCTURA DUAL CRÍTICA DEL PROYECTO

**⚠️ IMPORTANTE: Este proyecto tiene una estructura DUAL que debe mantenerse sincronizada:**

### 📁 Estructura Dual:
- **Raíz del proyecto** (`C:\03 BachilleratoHeroesWeb\`) - Servido por **localhost:3000** (Node.js backend)
- **Carpeta public** (`C:\03 BachilleratoHeroesWeb\public\`) - Servido por **127.0.0.1:8080** (servidor estático)

### 🔄 REGLA DE SINCRONIZACIÓN OBLIGATORIA:

**CUANDO HAGAS UN CAMBIO EN LA RAÍZ, SIEMPRE COPIARLO A PUBLIC Y VICEVERSA**

```bash
# Copiar cambios de raíz a public:
cp archivo.html public/
cp -r js/ public/
cp -r css/ public/

# Copiar cambios de public a raíz:
cp public/archivo.html ./
cp -r public/js/ ./
cp -r public/css/ ./
```

### 🐛 Problemas Resueltos:

#### Problema: Dashboard JavaScript no cargaba
- **Causa**: Referencias a `admin-dashboard.js` (archivo eliminado)
- **Solución**: Actualizar referencias a `dashboard-manager-2025.js`
- **Archivos afectados**:
  - `admin-dashboard.html` (raíz y public)
  - `js/resource-optimizer.js` (raíz y public)
  - `js/build-optimizer.js` (raíz y public)

#### Problema: Caché del navegador/Service Worker
- **Causa**: Service Worker cachéaba versiones antiguas
- **Solución**: Implementar limpieza de Service Worker en dashboard HTML

### 📝 Lista de archivos que SIEMPRE deben estar sincronizados:

#### HTML Files:
- `*.html` (todos los archivos HTML)
- Especialmente: `admin-dashboard.html`, `index.html`

#### JavaScript Files:
- `js/*.js` (toda la carpeta)
- Críticos: `dashboard-manager-2025.js`, `resource-optimizer.js`

#### CSS Files:
- `css/*.css` (toda la carpeta)

#### Assets:
- `images/` (todas las imágenes)
- `partials/` (componentes HTML)

### 🚀 Comandos de Sincronización Completa:

```bash
# Sincronizar TODO de raíz a public:
cp *.html public/
cp -r js/ public/
cp -r css/ public/
cp -r images/ public/
cp -r partials/ public/

# Verificar sincronización:
curl -s "http://localhost:3000/admin-dashboard.html" | grep "dashboard-manager-2025.js"
curl -s "http://127.0.0.1:8080/admin-dashboard.html" | grep "dashboard-manager-2025.js"
```

### 🔧 Servidores:

#### Backend Node.js (localhost:3000):
- Directorio: Raíz del proyecto
- Comando: `npm start` (desde raíz)
- Archivos servidos desde: `C:\03 BachilleratoHeroesWeb\`

#### Servidor Estático (127.0.0.1:8080):
- Directorio: Carpeta public
- Archivos servidos desde: `C:\03 BachilleratoHeroesWeb\public\`

### ✅ Estado Actual (2025-09-16):
- ✅ Ambos servidores sincronizados
- ✅ Dashboard funciona en localhost:3000
- ✅ Referencias a `dashboard-manager-2025.js` actualizadas
- ✅ Service Worker cleanup implementado
- ✅ Sin errores MIME type

### 🎯 Próximos pasos siempre:
1. Hacer cambios en UN directorio
2. INMEDIATAMENTE copiar al otro directorio
3. Verificar que ambos servidores sirvan el mismo contenido
4. Probar funcionalidad en ambos servidores

**💡 RECORDAR: UN CAMBIO EN UN LUGAR = CAMBIO EN AMBOS LUGARES**