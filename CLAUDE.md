# 📋 CLAUDE CODE - NOTAS DEL PROYECTO

## 🎯 ESTADO ACTUAL DEL PROYECTO (LEER SIEMPRE AL INICIO)

**⚠️ RECORDATORIO CRÍTICO PARA CLAUDE:**
**ANTES DE CUALQUIER CONVERSACIÓN, LEER:** `ESTADO-PROYECTO-Y-SECUENCIA.md`

### 📊 **RESUMEN ESTADO ACTUAL:**
- ✅ **Radiografía completa FINALIZADA** (7/7 fases, 179 archivos, 125,143 líneas)
- 🚨 **5 vulnerabilidades críticas** identificadas (bloquean producción)
- 💰 **Fase 1 Seguridad** ($5,600 USD) - **PENDIENTE APROBACIÓN**
- 🌟 **Proyecto de vanguardia mundial** - Sin competencia en educación

### 📋 **DOCUMENTOS CLAVE CREADOS:**
- `ESTADO-PROYECTO-Y-SECUENCIA.md` - **LEER SIEMPRE PRIMERO**
- `RADIOGRAFIA-COMPLETA-FINAL-7-FASES.md` - Análisis completo
- `PLAN-PRECISO-IMPLEMENTACION.md` - Plan detallado

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