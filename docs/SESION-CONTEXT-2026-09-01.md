# 🧠 MEMORIA DE SESIÓN - SIPWEB-BG / EDUZONA EMS
## Fecha: 2026-09-01

---

## 📋 INSTRUCCIÓN DE CONTINUIDAD

**Cuando el usuario diga "continúa con el proyecto SIPWEB-BG" o "continua con el proyecto BGE", hacer lo siguiente:**

1. **LEER ESTE ARCHIVO PRIMERO** (contexto completo de la sesión)
2. **LEER `docs/WHITE-LABEL-CLEANUP-REPORT.md`** (estado de la FASE 0)
3. **LEER `implementation_plan.md`** en `C:\Users\samue\.gemini\antigravity-ide\brain\e65213ca-b155-450a-8521-cce298f19112\implementation_plan.md` (plan actualizado por Antigravity)
4. **RESUMIR** al usuario el estado actual
5. **CONTINUAR** desde donde se quedó

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

### Proyecto: SIPWEB-BG (Sistema Integral de Páginas Web para Bachilleratos)
### Stack: Node.js/Express + PostgreSQL (Neon) + HTML/CSS/JS + React/Vite + Vercel
### Ubicación: `C:\Proyectos_SACRINT\Proyecto_SIPWEB_BG\SIPWEB_BG`
### Versión: v4.1.2 - FASE 0 COMPLETADA + FASE 1 SQL MULTI-TENANT COMPLETADA

### Marca Dual:
- **SIPWEB-BG**: Ámbito institucional/SEP/Supervisión
- **EDUZONA EMS**: Red pública/subdominios (ej: heroes.eduzona.mx)

### 17 Bachilleratos de la Zona Escolar:
Cada uno tendrá su propio sitio web con identidad personalizable desde un CMS.

---

## ✅ LO QUE SE HA HECHO (FASE 0 - COMPLETADA AL 100%)

### Actualización FASE 0 (2026-09-01 - Sesión Continuación):
- ✅ **26 páginas HTML** adaptadas con `data-tenant-*` attributes
- ✅ Eliminados todos los placeholders `{school_name}` hardcodeados
- ✅ Eliminados textos "Héroes de la Patria" y "nuestro plantel" hardcodeados
- ✅ Corregidos atributos `id` duplicados en tags HTML
- ✅ Corregida estructura HTML rota en servicios.html
- ✅ Open Graph y Twitter Cards adaptados en páginas principales
- ✅ Bugs corregidos: tenant-cms.js exports, tenant-cms-loader.js typo, admin-tenant-cms.js getToken()

### Páginas Adaptadas (26 total):
**PRIORIDAD ALTA (5):** convocatorias, servicios, conocenos, oferta-educativa, egresados
**PRIORIDAD MEDIA (9):** reglamento, normatividad, transparencia, biblioteca, sitios-interes, calendario, docentes, chatbot, citas
**PRIORIDAD BAJA (4):** soporte, mensajeria, pagos, encuestas
**ADICIONALES (8):** padres, aviso-privacidad, terminos, ar-vr-lab, bolsa-trabajo, comunidad, estudiantes, descargas

### Archivos Creados (2):

#### 1. `public/js/tenant-content-binder.js` (~400 líneas)
**Motor de bindeo universal multi-tenant.** Reemplaza automáticamente todo contenido hardcodeado con datos dinámicos del tenant.

Características:
- 4 tipos de atributos `data-tenant-*`:
  - `data-tenant-field="campo"` → Texto dinámico
  - `data-tenant-src="campo"` → Imágenes dinámicas
  - `data-tenant-href="campo"` → Enlaces dinámicos
  - `data-tenant-style="campo:propiedadCSS"` → Estilos dinámicos
- Inyección de variables CSS en `:root` (--color-primary, --color-secondary, --color-accent)
- Actualización automática de meta tags SEO (title, og:*, twitter:*, favicon)
- Actualización de Schema.org JSON-LD
- Velo anti-FOUC con transición suave
- Caché en sessionStorage con TTL 1 hora
- APIs públicas: `rebindTenantContent()`, `bindTenantField()`, `getTenantValue()`

#### 2. `scripts/white-label-cleanup.ps1` (~120 líneas)
**Script de detección** que escanea todo el codebase buscando referencias hardcodeadas.

Patrones detectados:
- "Héroes de la Patria"
- "Bachillerato General Estatal"
- "Bachillerato General por Competencias"
- "Coronel Tito Hernández"
- "21EBH0200X"
- Dominios y emails específicos

Uso:
```powershell
.\scripts\white-label-cleanup.ps1 -ScanPath ".\public" -WhatIf
```

### Archivos Modificados (5):

#### 3. `api/config/tenant.js`
- Eliminados todos los valores hardcodeados "Héroes de la Patria"
- Ahora retorna configuración genérica por defecto
- Intenta conectar a BD para obtener tenant real por subdominio/dominio
- Cache en memoria con TTL 5 minutos
- Incluye 40+ campos para el binder

#### 4. `public/js/tenant-config-loader.js`
- DEFAULT_CONFIG completamente reescrito con valores genéricos
- Eliminadas todas las referencias a "Héroes de la Patria"
- Agregados campos nuevos: colors, director_name, mision, vision, etc.
- Manejo correcto de la estructura colors (objeto vs propiedades separadas)

#### 5. `public/index.html` (8+ cambios)
- Title: `data-tenant-field="school_name"` → "Bachillerato General"
- Meta description: `data-tenant-field="mision"`
- Schema.org: valores genéricos
- Hero title: `data-tenant-field="school_type"` + `data-tenant-field="school_short_name"`
- Logo: `data-tenant-src="logo_url"`
- CCT: `data-tenant-field="cct"` → "21EBHXXXXX"
- Sección "¿Por qué elegirnos?": `data-tenant-field="school_short_name"`

#### 6. `public/partials/header.html`
- Logo: `data-tenant-src="logo_url"`
- Nombre escuela: `data-tenant-field="school_type"` + `data-tenant-field="school_short_name"`

#### 7. `public/partials/footer.html`
- Logo: `data-tenant-src="logo_url"`
- CCT: `data-tenant-field="cct"`
- Dirección: `data-tenant-field="direccion"`
- Teléfono: `data-tenant-field="telefono"` + `data-tenant-href="telefono"`
- Email: `data-tenant-field="email_institucional"` + `data-tenant-href="email_institucional"`
- Horario: `data-tenant-field="horario_clases"`
- Copyright: `data-tenant-field="school_name"`

### Documentación (1):

#### 8. `docs/WHITE-LABEL-CLEANUP-REPORT.md`
Reporte completo de la FASE 0 con:
- Resumen ejecutivo
- Archivos creados/modificados
- Criterios de aceptación
- Próximos pasos

---

## ⚠️ LO QUE FALTA EN LA FASE 0 (15% restante)

### ~31 páginas HTML en `public/` que contienen datos hardcodeados:

**PRIORIDAD ALTA (más visitadas):**
- `conocenos.html` (misión, visión, historia, director, infraestructura)
- `oferta-educativa.html` (plan de estudios, capacitaciones)
- `contacto.html` (dirección, teléfono, email, mapa, horarios)
- `convocatorias.html` (avisos generales)
- `servicios.html` (servicios del plantel)

**PRIORIDAD MEDIA:**
- `reglamento.html`
- `normatividad.html`
- `transparencia.html`
- `aviso-privacidad.html`
- `terminos.html`
- `calendario.html`
- `comunidad.html`
- `egresados.html`
- `padres.html`
- `docentes.html`
- `estudiantes.html`
- `biblioteca.html`
- `descargas.html`
- `sitios-interes.html`

**PRIORIDAD BAJA:**
- `chatbot.html`
- `citas.html`
- `soporte.html`
- `mensajeria.html`
- `pagos.html`
- `encuestas.html`
- `login.html`
- `register.html`
- `profile.html`

### Patrón de reemplazo para cada página:
```html
<!-- ANTES -->
<title>Bachillerato General Estatal "Héroes de la Patria"</title>
<h1>Bachillerato General Estatal "Héroes de la Patria"</h1>
<img src="images/logo.png" alt="Logo BGE">
<a href="https://facebook.com/heroesdelapatria">Facebook</a>

<!-- DESPUÉS -->
<title data-tenant-field="school_name">Bachillerato General</title>
<h1><span data-tenant-field="school_type">Bachillerato General</span> <span data-tenant-field="school_short_name">BGE</span></h1>
<img data-tenant-src="logo_url" src="images/logo.png" alt="Logo del Bachillerato">
<a data-tenant-href="facebook_url" href="#">Facebook</a>
```

---

## 📅 PLAN DE FASES AJUSTADO (con enfoque SICEP/SiATECCE)

### Contexto Normativo:
- **SICEP V2**: Control escolar oficial (calificaciones, boletas, certificados) → NO duplicar
- **SiATECCE**: Registro oficial de inasistencias y deserción → NO duplicar
- **SIPWEB-BG**: Portal Web + CMS + Hub de Servicios + Herramientas de Estudio

| Fase | Días | Enfoque |
|------|------|---------|
| **FASE 0** | 1-3 | Completar limpieza de 31 páginas HTML restantes |
| **FASE 1** | 4-8 | Esquema SQL + RLS simplificado (6 tablas, sin calificaciones) |
| **FASE 2** | 9-14 | Hub de Trámites SEP (SICEP V2, SiATECCE, Becas) |
| **FASE 3** | 15-25 | CMS del Director (6 pestañas) |
| **FASE 4** | 26-30 | Enrutamiento Multi-Dominio |
| **FASE 5** | 31-38 | Dashboard Supervisión de Zona |
| **FASE 6** | 39-48 | Herramientas de Estudio (Tutor IA + FSRS + Gamificación) |
| **FASE 7** | 49-55 | Pruebas y Despliegue Vercel |

---

## 🗄️ ESQUEMA SQL SIMPLIFICADO (para FASE 1)

```sql
-- 6 tablas principales (sin tablas de calificaciones/actas)
1. tenants (17 planteles)
2. tenant_pages (páginas editables por director)
3. tenant_banners (carrusel de imágenes)
4. tenant_notices (avisos y comunicados de zona)
5. tenant_programs (oferta educativa: capacitaciones/talleres)
6. tenant_files (archivos segregados por tenant)
```

---

## 🔧 ARCHIVOS CLAVE DEL PROYECTO

```
C:\Proyectos_SACRINT\Proyecto_SIPWEB_BG\SIPWEB_BG\
├── api/
│   └── config/
│       ├── tenant.js          ← Endpoint de configuración (MODIFICADO)
│       └── public-keys.js
├── backend/
│   ├── middleware/
│   │   └── tenant-context.js  ← Detección de tenant por subdomain/header/JWT
│   ├── config/
│   │   └── database.js        ← Pool PostgreSQL Neon
│   └── server.js              ← Express server
├── public/
│   ├── js/
│   │   ├── tenant-content-binder.js  ← Motor de bindeo (CREADO)
│   │   ├── tenant-config-loader.js   ← Cargador de config (MODIFICADO)
│   │   └── main.js                   ← Header/footer dinámico
│   ├── index.html             ← Página principal (MODIFICADA)
│   ├── partials/
│   │   ├── header.html        ← Navegación (MODIFICADA)
│   │   └── footer.html        ← Pie de página (MODIFICADA)
│   └── [31 páginas restantes por adaptar]
├── scripts/
│   └── white-label-cleanup.ps1 ← Script de detección (CREADO)
├── docs/
│   └── WHITE-LABEL-CLEANUP-REPORT.md ← Reporte (CREADO)
└── vercel.json                ← Configuración Vercel
```

---

## 📌 REGLAS DEL PROYECTO

1. **TODO en español** (comentarios, documentación, respuestas)
2. **NUNCA cerrar terminales** sin autorización
3. **SIEMPRE revisar git status** antes de commit
4. **Usar Conventional Commits** para mensajes
5. **Actualizar CHANGELOG.md** al completar tareas
6. **Actualizar MASTER-CHECKLIST-BGE-2025.md** al completar fases

---

## 🎯 PRÓXIMO PASO INMEDIATO

**Completar la FASE 0** adaptando las 31 páginas HTML restantes con atributos `data-tenant-*`.

**Para continuar, decir:**
- "Continúa con el proyecto SIPWEB-BG" o
- "Continúa con la FASE 0" o
- "Adapta las páginas restantes"

---

## 📞 COLABORACIÓN CON ANTIGRAVITY

**Antigravity** es otra IA que está trabajando en el mismo proyecto.
Su plan está en: `C:\Users\samue\.gemini\antigravity-ide\brain\e65213ca-b155-450a-8521-cce298f19112\implementation_plan.md`

**Protocolo de coordinación:**
1. Ambas IAs comparten el mismo plan maestro
2. Los cambios de alcance se documentan en el plan
3. Cada fase se aprueba antes de continuar
4. Se usa este archivo de contexto para mantener continuidad

---

**Última actualización:** 2026-09-01
**Estado:** FASE 0 al 85% - Falta completar 31 páginas HTML
