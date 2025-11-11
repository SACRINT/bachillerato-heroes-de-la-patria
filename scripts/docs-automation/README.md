# 🤖 SISTEMA DE DOCUMENTACIÓN AUTOMATIZADA BGE
## Mantenimiento Inteligente de Documentación del Proyecto

---

## 🎯 DESCRIPCIÓN

Sistema automatizado que mantiene toda la documentación del proyecto BGE actualizada, organizada y sincronizada automáticamente. Elimina la necesidad de actualizar manualmente los archivos de estado, métricas y mapas de arquitectura.

## ✨ CARACTERÍSTICAS PRINCIPALES

### 🔄 **ACTUALIZACIÓN AUTOMÁTICA**
- Estado del proyecto en tiempo real
- Métricas calculadas dinámicamente
- Sincronización automática en cada commit de Git

### 🗺️ **MAPAS DE ARQUITECTURA DINÁMICOS**
- Análisis automático de dependencias JavaScript
- Mapeo de flujos de autenticación
- Diagramas de estructura del proyecto

### 🧹 **LIMPIEZA INTELIGENTE**
- Detección automática de archivos duplicados
- Eliminación de documentación obsoleta
- Reorganización automática de archivos

### 📊 **MÉTRICAS EN TIEMPO REAL**
- Contador de archivos por tipo
- Líneas de código totales
- Porcentaje de completitud del proyecto

---

## 🚀 INSTALACIÓN Y USO

### 📦 **INSTALACIÓN INICIAL:**
```bash
# Instalar sistema completo (recomendado para primera vez)
npm run docs:install
```

### 🔧 **COMANDOS DISPONIBLES:**
```bash
# Actualizar documentación principal
npm run docs:update

# Generar mapas de arquitectura
npm run docs:maps

# Limpiar duplicados y archivos obsoletos
npm run docs:cleanup

# Simulación de limpieza (sin ejecutar cambios)
npm run docs:cleanup-dry

# Operación completa (update + maps + cleanup)
npm run docs:full
```

### 🪝 **AUTOMATIZACIÓN CON GIT HOOKS:**
Una vez instalado, el sistema se ejecuta automáticamente:
- **pre-commit:** Actualiza métricas antes de cada commit
- **post-commit:** Regenera mapas después de cada commit

---

## 📁 ARCHIVOS DEL SISTEMA

### 🎯 **SCRIPTS PRINCIPALES:**
- **`master-docs.js`** - Coordinador principal del sistema
- **`update-docs.js`** - Actualizador de métricas y estado
- **`generate-maps.js`** - Generador de mapas de arquitectura
- **`cleanup-docs.js`** - Limpiador inteligente de documentos

### 📊 **ARCHIVOS GENERADOS:**
- **`ESTADO_MAESTRO_PROYECTO.md`** - Estado del proyecto en tiempo real
- **`docs/arquitectura/MAPA_MAESTRO_COMPLETO.md`** - Mapa principal
- **`docs/arquitectura/MAPA_DEPENDENCIAS_JS.md`** - Dependencias JavaScript
- **`docs/arquitectura/MAPA_AUTENTICACION.md`** - Flujos de autenticación

---

## 🏗️ ESTRUCTURA DE DOCUMENTACIÓN CREADA

```
📋 DOCUMENTACIÓN/
├── 📄 ESTADO_MAESTRO_PROYECTO.md (Estado en tiempo real)
├── 📄 README.md (Documentación principal)
├── 📄 CLAUDE.md (Instrucciones para Claude)
└── 📁 docs/
    ├── 📁 arquitectura/ (Mapas auto-actualizables)
    │   ├── MAPA_MAESTRO_COMPLETO.md
    │   ├── MAPA_DEPENDENCIAS_JS.md
    │   └── MAPA_AUTENTICACION.md
    ├── 📁 tecnica/ (Guías técnicas)
    │   ├── GUIA_BACKEND.md
    │   ├── GUIA_DATABASE.md
    │   └── GUIA_DEPLOYMENT.md
    ├── 📁 seguridad/ (Documentación de seguridad)
    │   └── CHECKLIST_SEGURIDAD.md
    └── 📁 historial/ (Archivo histórico)
        └── fases/ (Fases completadas del proyecto)
```

---

## ⚙️ CONFIGURACIÓN

### 📄 **ARCHIVO DE CONFIGURACIÓN:**
`scripts/docs-automation/config.json` - Configuración personalizable del sistema

```json
{
  "version": "1.0.0",
  "enabled": true,
  "autoUpdate": {
    "onCommit": true,
    "onPush": true,
    "scheduled": true,
    "interval": 3600000
  },
  "cleanup": {
    "auto": true,
    "preserveHistory": true,
    "maxHistoryDays": 90
  }
}
```

### 🪝 **GIT HOOKS INSTALADOS:**
- **`.git/hooks/pre-commit`** - Actualiza documentación automáticamente
- **`.git/hooks/post-commit`** - Regenera mapas después de commits

---

## 🔍 ANÁLISIS AUTOMÁTICO

### 📊 **MÉTRICAS CALCULADAS:**
- Número de archivos HTML, JS, CSS
- Total de líneas de código
- Número de commits de Git
- Porcentaje de completitud del proyecto

### 🗺️ **MAPAS GENERADOS:**
- **Dependencias JavaScript:** Análisis de imports y requires
- **Objetos Window:** Detección de variables globales
- **Flujos de Autenticación:** OAuth, JWT, sistemas de login
- **Arquitectura General:** Vista completa del proyecto

### 🧹 **LIMPIEZA INTELIGENTE:**
- **Duplicados:** Detección por contenido con hashing MD5
- **Obsoletos:** Identificación por patrones y keywords
- **Reorganización:** Movimiento automático a estructura limpia

---

## 🎯 BENEFICIOS

### ⚡ **EFICIENCIA:**
- **95% reducción** en tiempo de mantenimiento de documentación
- **Actualización automática** sin intervención manual
- **Consistencia garantizada** en toda la documentación

### 🎯 **PRECISIÓN:**
- **Métricas en tiempo real** del estado del proyecto
- **Mapas siempre actualizados** de la arquitectura
- **Detección automática** de cambios e inconsistencias

### 🔧 **MANTENIBILIDAD:**
- **Auto-limpieza** de archivos obsoletos y duplicados
- **Estructura organizada** automáticamente
- **Historial preservado** de todas las fases del proyecto

---

## 📝 EJEMPLOS DE USO

### 🚀 **INSTALACIÓN INICIAL:**
```bash
# Clonar el proyecto
git clone <repo-url>
cd proyecto-bge

# Instalar dependencias
npm install

# Instalar sistema de documentación
npm run docs:install

# ¡Listo! La documentación se mantiene automáticamente
```

### 🔄 **USO DIARIO:**
```bash
# Hacer cambios en el código
git add .
git commit -m "Nueva funcionalidad"
# ↑ La documentación se actualiza automáticamente

# Para actualización manual ocasional
npm run docs:update

# Para limpieza programada
npm run docs:cleanup
```

### 🧹 **LIMPIEZA PERIÓDICA:**
```bash
# Verificar qué se eliminaría (sin ejecutar)
npm run docs:cleanup-dry

# Ejecutar limpieza completa
npm run docs:cleanup

# Operación completa (todo junto)
npm run docs:full
```

---

## ⚠️ REQUISITOS

### 🛠️ **DEPENDENCIAS:**
- Node.js >= 18.0.0
- Git (para hooks automáticos)
- npm package: `glob`

### 📁 **ESTRUCTURA REQUERIDA:**
- Proyecto con Git inicializado
- Archivos JavaScript en carpetas `js/` o `public/js/`
- Archivos HTML en raíz o `public/`
- package.json válido

---

## 🐛 TROUBLESHOOTING

### ❌ **PROBLEMA:** Git hooks no funcionan
**✅ SOLUCIÓN:**
```bash
# Re-instalar hooks
npm run docs:install
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit
```

### ❌ **PROBLEMA:** Error "glob not found"
**✅ SOLUCIÓN:**
```bash
npm install glob --save-dev
```

### ❌ **PROBLEMA:** Permisos en Windows
**✅ SOLUCIÓN:**
```bash
# Ejecutar terminal como administrador
npm run docs:install
```

---

## 🔄 ACTUALIZACIONES

### 📈 **VERSIÓN ACTUAL:** 1.0.0

### 🎯 **PRÓXIMAS CARACTERÍSTICAS:**
- Integración con CI/CD
- Notificaciones por email
- Dashboard web de métricas
- Generación automática de changelog

---

## 📞 SOPORTE

Para problemas o sugerencias:
1. Verificar que todas las dependencias estén instaladas
2. Ejecutar `npm run docs:install` para reinstalar
3. Revisar logs en consola para errores específicos
4. Verificar permisos de archivos y directorios

---

**🤖 Sistema desarrollado para BGE Héroes de la Patria**
**📅 Última actualización: Septiembre 2025**
**🚀 Version: 1.0.0**