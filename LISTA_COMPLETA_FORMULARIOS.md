# 📋 LISTA COMPLETA DE FORMULARIOS - PROYECTO BGE HÉROES DE LA PATRIA

**Última actualización:** 17 Diciembre 2025
**Total de formularios encontrados:** 33

---

## 📑 TABLA DE CONTENIDOS

1. [Formularios por Página](#formularios-por-página)
2. [Formularios por Tipo](#formularios-por-tipo)
3. [Formularios de Acción de Usuario](#formularios-de-acción-de-usuario)
4. [Formularios Administrativos](#formularios-administrativos)
5. [Resumen Estadístico](#resumen-estadístico)

---

## 📄 FORMULARIOS POR PÁGINA

### **1. index.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Quejas y Sugerencias | `quejas-form` | Contacto | Nombre, Email, Asunto, Mensaje | POST `/api/quejas` |

**Ubicación:** Sección inferior de la página (footer section)
**Descripción:** Usuarios envían quejas, sugerencias y comentarios sobre la institución

---

### **2. comunidad.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Mantente Conectado | `newsletter-subscription-form` | Suscripción | Email | POST `/api/subscriptions/subscribe` |

**Ubicación:** Sección "Mantente Conectado" (newsletter)
**Descripción:** Usuarios se suscriben a newsletter de noticias, eventos y comunicados
**Nota:** Usa `class="professional-form"` sin ID específico

---

### **3. contacto.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Envíanos un Mensaje Directo | `contactForm` | Contacto/Soporte | Nombre, Email, Teléfono, Asunto, Mensaje | POST `/api/contact/send` |

**Ubicación:** Sección principal de la página
**Descripción:** Formulario para que usuarios envíen mensajes directos a la escuela
**Validación:** Email, teléfono requeridos

---

### **4. bolsa-trabajo.html** (2 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Búsqueda de Ofertas | `jobSearchForm` | Búsqueda/Filtro | Palabra clave, Categoría, Tipo de empleo, Ubicación | GET (filtros locales) |
| 2 | Envío de CV | `cvUploadForm` | Envío de Documento | Nombre, Email, Teléfono, CV (archivo), Mensaje | POST `/api/cv/upload` |

**Ubicación:** Bolsa de trabajo (ofertas laborales)
**Descripción 1:** Búsqueda y filtrado de ofertas de empleo
**Descripción 2:** Estudiantes envían su CV y datos para oportunidades laborales
**Nota:** Formulario de CV usa `class="professional-form cv-form"`

---

### **5. citas.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Agendamiento de Citas | `appointmentForm` | Reserva/Citas | Nombre, Email, Teléfono, Asunto, Fecha, Hora | POST `/api/appointments/create` |

**Ubicación:** Sección principal de citas
**Descripción:** Usuarios agenda citas con docentes, directivos o departamentos
**Validación:** Fecha futura, hora disponible, máximo 5 citas por usuario/mes
**Nota:** Usa `class="professional-form"`

---

### **6. biblioteca.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Carga de Documentos | `uploadDocumentForm` | Envío de Documento | Título, Descripción, Categoría, Archivo | POST `/api/biblioteca/upload` |

**Ubicación:** Sección de gestión de biblioteca
**Descripción:** Personal autorizado sube documentos y recursos a la biblioteca digital
**Acceso:** Restringido a administradores/bibliotecarios

---

### **7. descargas.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Solicitud de Documentos | `documentRequestForm` | Solicitud | Tipo de documento, Nombre estudiante, Descripción | POST `/api/solicitudes` |

**Ubicación:** Sección de descargas y solicitudes
**Descripción:** Estudiantes solicitan documentos (constancias, certificados, etc.)
**Nota:** Usa `class="professional-form"`

---

### **8. egresados.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Actualizar Datos Egresados | `actualizarDatosForm` | Actualización de Perfil | Nombre, Email, Teléfono, Ocupación, Universidad, Logros | POST `/api/egresados/update` |

**Ubicación:** Sección principal de egresados
**Descripción:** Egresados actualizan sus datos y logros posteriores a la graduación
**Nota:** Usa `class="egresados-form"`

---

### **9. mensajeria.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Nueva Conversación | `newConversationForm` | Mensajería | Destinatario, Asunto, Mensaje | POST `/api/messages/send` |

**Ubicación:** Sección de mensajería/chat
**Descripción:** Usuarios inician nuevas conversaciones/mensajes
**Acceso:** Requiere autenticación

---

### **10. pagos.html** (2 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Login de Pagos | `paymentLoginForm` | Autenticación | Email, Contraseña | POST `/api/payments/login` |
| 2 | Consulta de Pagos | `consultForm` | Consulta | Número de estudiante, Nombre, Periodo | GET `/api/pagos/consult` |

**Ubicación:** Sección de pagos y colegiaturas
**Descripción 1:** Acceso al portal de pagos
**Descripción 2:** Consulta de estado de pagos y colegiaturas

---

### **11. soporte.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Crear Nuevo Ticket | `newTicketForm` | Soporte Técnico | Asunto, Descripción, Prioridad, Categoría, Archivo adjunto | POST `/api/support-tickets/create` |

**Ubicación:** Sección de soporte técnico
**Descripción:** Usuarios reportan problemas técnicos y crean tickets de soporte
**Acceso:** Requiere autenticación

---

### **12. docentes.html** (3 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Login Docentes | `loginForm` | Autenticación | Email, Contraseña | POST `/api/docentes/login` |
| 2 | Agregar Clase | `addClassForm` | Gestión Académica | Nombre clase, Descripción, Horario, Estudiantes | POST `/api/docentes/classes/create` |
| 3 | Agregar Recurso | `addResourceForm` | Contenido Educativo | Título recurso, Descripción, Archivo, Tipo | POST `/api/docentes/resources/create` |
| 4 | Nuevo Mensaje | `newMessageForm` | Comunicación | Destinatario, Asunto, Mensaje | POST `/api/docentes/messages/send` |

**Ubicación:** Portal de docentes
**Descripción:** Docentes gestionan clases, recursos educativos y comunicación
**Acceso:** Autenticación requerida

---

### **13. admin-dashboard.html** (7 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Login Admin | `adminLoginForm` | Autenticación | Email, Contraseña | POST `/api/auth/admin-login` |
| 2 | Cambiar Contraseña | `changePasswordForm` | Seguridad | Contraseña actual, Nueva contraseña, Confirmar | POST `/api/auth/change-password` |
| 3 | Configurar Estadísticas | `statisticsConfigForm` | Configuración | Parámetros de gráficos, Período, Filtros | POST `/api/admin/stats/config` |
| 4 | Crear Noticia | `noticiaForm` | Contenido CMS | Título, Descripción, Imagen, Fecha, Categoría | POST `/api/admin/noticias/create` |
| 5 | Crear Evento | `eventoForm` | Eventos | Nombre, Descripción, Fecha inicio, Fecha fin, Ubicación | POST `/api/admin/eventos/create` |
| 6 | Crear Aviso | `avisoForm` | Comunicados | Título, Contenido, Fechas, Destinatarios | POST `/api/admin/avisos/create` |
| 7 | Crear Comunicado | `comunicadoForm` | Comunicación | Título, Mensaje, Tipo, Prioridad | POST `/api/admin/comunicados/create` |
| 8 | Generar Credenciales | `generateCredentialsForm` | Seguridad | Tipo usuario, Cantidad, Parámetros | POST `/api/admin/credentials/generate` |

**Ubicación:** Dashboard administrativo
**Descripción:** Panel de control para administradores con gestión de contenido, usuarios y configuración
**Acceso:** Requiere rol admin

---

### **14. padres.html** (2 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Recuperación de Cuenta | `recoveryForm` | Seguridad | Email, Pregunta de seguridad, Respuesta | POST `/api/padres/account-recovery` |
| 2 | Activación de Cuenta | `accountActivationForm` | Seguridad | Email, Código de activación, Nueva contraseña | POST `/api/padres/activate-account` |

**Ubicación:** Portal de padres
**Descripción:** Formularios de seguridad y recuperación de acceso
**Acceso:** Sin autenticación (recovery/activation)

---

### **15. calificaciones.html** (3 formularios)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Login Estudiantes | `studentLoginForm` | Autenticación | Número de cuenta, Contraseña | POST `/api/calificaciones/student-login` |
| 2 | Login Padres | `parentLoginForm` | Autenticación | Email padre, Contraseña | POST `/api/calificaciones/parent-login` |
| 3 | Reportar Calificación | `reportForm` | Soporte | Materia, Calificación reportada, Descripción del problema | POST `/api/calificaciones/report` |

**Ubicación:** Portal de calificaciones
**Descripción:** Acceso a calificaciones y reporte de discrepancias
**Acceso:** Estudiantes y padres

---

### **16. estudiantes.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Clase PWA Test | `form-clase-pwa` | Testing | Campos de prueba para PWA | POST (local/testing) |

**Ubicación:** Sección de pruebas
**Descripción:** Formulario de testing para funcionalidad PWA
**Nota:** Aparenta ser un formulario de pruebas internas

---

### **17. tenants-admin.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Gestión de Tenants | `tenantForm` | Admin/Multi-tenant | Nombre tenant, Dominio, Configuración, Logo | POST `/api/tenants/create` |

**Ubicación:** Panel de administración multi-tenant
**Descripción:** Crear y configurar nuevos tenants (instancias de escuelas)
**Acceso:** Super admin

---

### **18. test-login-debug.html** (1 formulario)

| # | Nombre del Formulario | ID del Form | Tipo | Campos Principales | Acción |
|---|----------------------|-------------|------|-------------------|--------|
| 1 | Test de Login | `loginForm` | Testing | Email, Contraseña | Función JavaScript local (return false) |

**Ubicación:** Página de debugging/testing
**Descripción:** Formulario para debugging del sistema de login
**Nota:** No envía datos reales (testing only)

---

## 📊 FORMULARIOS POR TIPO

### **Tipo: AUTENTICACIÓN / LOGIN** (8 formularios)
1. Login Admin - `admin-dashboard.html`
2. Login Docentes - `docentes.html`
3. Login Estudiantes - `calificaciones.html`
4. Login Padres - `calificaciones.html`
5. Login de Pagos - `pagos.html`
6. Login para Padres - `padres.html` (en recoveryForm)
7. Test de Login - `test-login-debug.html`
8. Google OAuth - Unified (global)

---

### **Tipo: CONTACTO / COMUNICACIÓN** (5 formularios)
1. Quejas y Sugerencias - `index.html`
2. Envíanos un Mensaje Directo - `contacto.html`
3. Nueva Conversación - `mensajeria.html`
4. Nuevo Mensaje (Docentes) - `docentes.html`
5. Nuevo Ticket de Soporte - `soporte.html`

---

### **Tipo: SUSCRIPCIÓN / NEWSLETTER** (1 formulario)
1. Mantente Conectado - `comunidad.html`

---

### **Tipo: SOLICITUDES / TRAMITES** (3 formularios)
1. Agendamiento de Citas - `citas.html`
2. Solicitud de Documentos - `descargas.html`
3. Reportar Calificación - `calificaciones.html`

---

### **Tipo: ENVÍO DE DOCUMENTOS / ARCHIVOS** (4 formularios)
1. Envío de CV - `bolsa-trabajo.html`
2. Carga de Documentos - `biblioteca.html`
3. Nuevo Ticket (con adjuntos) - `soporte.html`
4. Actualizar Datos Egresados - `egresados.html`

---

### **Tipo: BÚSQUEDA / FILTROS** (2 formularios)
1. Búsqueda de Ofertas - `bolsa-trabajo.html`
2. Consulta de Pagos - `pagos.html`

---

### **Tipo: GESTIÓN ACADÉMICA / CONTENIDO** (7 formularios)
1. Agregar Clase - `docentes.html`
2. Agregar Recurso - `docentes.html`
3. Crear Noticia - `admin-dashboard.html`
4. Crear Evento - `admin-dashboard.html`
5. Crear Aviso - `admin-dashboard.html`
6. Crear Comunicado - `admin-dashboard.html`
7. Generar Credenciales - `admin-dashboard.html`

---

### **Tipo: CONFIGURACIÓN / ADMIN** (3 formularios)
1. Cambiar Contraseña - `admin-dashboard.html`
2. Configurar Estadísticas - `admin-dashboard.html`
3. Gestión de Tenants - `tenants-admin.html`

---

### **Tipo: SEGURIDAD / RECUPERACIÓN** (2 formularios)
1. Recuperación de Cuenta - `padres.html`
2. Activación de Cuenta - `padres.html`

---

## 🎯 FORMULARIOS DE ACCIÓN DE USUARIO

### **Formularios que usan `class="professional-form"`** (Estándar del proyecto)

1. ✅ Quejas y Sugerencias - `index.html`
2. ✅ Envío de CV - `bolsa-trabajo.html`
3. ✅ Agendamiento de Citas - `citas.html`
4. ✅ Envíanos un Mensaje - `contacto.html`
5. ✅ Solicitud de Documentos - `descargas.html`
6. ✅ Mantente Conectado (newsletter) - `comunidad.html`

**Características comunes:**
- Validación de datos del lado del cliente
- Styling bootstrap 5.3
- Animaciones y feedback visual
- Mensajes de error/éxito
- Manejo de archivos adjuntos (algunos)
- Rate limiting en endpoints

---

## 🔐 FORMULARIOS ADMINISTRATIVOS

### **Solo para usuarios autenticados con rol ADMIN:**

1. Cambiar Contraseña
2. Configurar Estadísticas
3. Crear Noticia
4. Crear Evento
5. Crear Aviso
6. Crear Comunicado
7. Generar Credenciales
8. Gestión de Tenants
9. Agregar Clase (Docentes)
10. Agregar Recurso (Docentes)
11. Carga de Documentos (Bibliotecarios)

---

## 📈 RESUMEN ESTADÍSTICO

### **Total de Formularios: 33**

| Categoría | Cantidad | Porcentaje |
|-----------|----------|-----------|
| Autenticación/Login | 8 | 24% |
| Contacto/Comunicación | 5 | 15% |
| Gestión Académica | 7 | 21% |
| Solicitudes/Trámites | 3 | 9% |
| Envío de Documentos | 4 | 12% |
| Configuración/Admin | 3 | 9% |
| Seguridad/Recuperación | 2 | 6% |
| Búsqueda/Filtros | 2 | 6% |
| **TOTAL** | **33** | **100%** |

---

### **Por Página HTML:**

| Página | Cantidad | Formularios |
|--------|----------|------------|
| admin-dashboard.html | 8 | Login, Cambiar Password, Stats, Noticia, Evento, Aviso, Comunicado, Credenciales |
| bolsa-trabajo.html | 2 | Búsqueda, CV Upload |
| calificaciones.html | 3 | Student Login, Parent Login, Reportar |
| contacto.html | 1 | Envíanos Mensaje |
| comunidad.html | 1 | Mantente Conectado |
| citas.html | 1 | Agendamiento |
| descargas.html | 1 | Solicitud Documentos |
| docentes.html | 4 | Login, Agregar Clase, Agregar Recurso, Mensaje |
| egresados.html | 1 | Actualizar Datos |
| index.html | 1 | Quejas y Sugerencias |
| mensajeria.html | 1 | Nueva Conversación |
| pagos.html | 2 | Login Pagos, Consulta |
| padres.html | 2 | Recovery, Activation |
| soporte.html | 1 | Nuevo Ticket |
| biblioteca.html | 1 | Upload Documento |
| estudiantes.html | 1 | Clase PWA (test) |
| tenants-admin.html | 1 | Gestión Tenants |
| test-login-debug.html | 1 | Test Login |
| **TOTAL** | **33** | |

---

### **Métodos HTTP utilizados:**

| Método | Cantidad | Ejemplos |
|--------|----------|----------|
| POST | 28 | Crear, Actualizar, Enviar datos |
| GET | 3 | Búsqueda, Filtros, Consultas |
| Local/Testing | 2 | PWA Test, Login Debug |

---

### **Validación implementada:**

- ✅ Email (mayoría de formularios)
- ✅ Campos requeridos
- ✅ Longitud mínima/máxima
- ✅ Fecha (citas, eventos)
- ✅ Archivo (CV, documentos)
- ✅ Teléfono (algunos formularios)
- ✅ Contraseña (criterios de fuerza)

---

## 🔗 ENDPOINTS DE BACKEND ASOCIADOS

```
POST /api/quejas                          → Quejas y Sugerencias
POST /api/subscriptions/subscribe         → Newsletter
POST /api/contact/send                    → Mensajes de Contacto
POST /api/cv/upload                       → Envío de CV
POST /api/appointments/create             → Agendamiento de Citas
POST /api/biblioteca/upload               → Carga de Documentos
POST /api/solicitudes                     → Solicitud de Documentos
POST /api/egresados/update                → Actualizar Datos Egresados
POST /api/messages/send                   → Mensajería
POST /api/payments/login                  → Login Pagos
POST /api/support-tickets/create          → Tickets de Soporte
POST /api/docentes/login                  → Login Docentes
POST /api/docentes/classes/create         → Agregar Clase
POST /api/docentes/resources/create       → Agregar Recurso
POST /api/docentes/messages/send          → Mensaje Docentes
POST /api/admin/stats/config              → Configurar Estadísticas
POST /api/admin/noticias/create           → Crear Noticia
POST /api/admin/eventos/create            → Crear Evento
POST /api/admin/avisos/create             → Crear Aviso
POST /api/admin/comunicados/create        → Crear Comunicado
POST /api/admin/credentials/generate      → Generar Credenciales
POST /api/auth/admin-login                → Login Admin
POST /api/auth/change-password            → Cambiar Contraseña
POST /api/auth/admin-login                → Login Admin
POST /api/calificaciones/student-login    → Student Login
POST /api/calificaciones/parent-login     → Parent Login
POST /api/calificaciones/report           → Reportar Calificación
POST /api/padres/account-recovery         → Account Recovery
POST /api/padres/activate-account         → Activación de Cuenta
POST /api/tenants/create                  → Gestión Tenants
POST /api/messages/send                   → Nueva Conversación
GET  /api/pagos/consult                   → Consulta de Pagos
```

---

## 📌 NOTAS IMPORTANTES

1. **Validación del lado del cliente:** La mayoría de formularios usan `professional-forms.js` para validación
2. **CSRF Protection:** Los formularios utilizan tokens CSRF cuando es aplicable
3. **Rate Limiting:** Endpoints críticos tienen protección contra ataques de fuerza bruta
4. **Archivos adjuntos:** Solo CV, documentos y tickets de soporte permiten adjuntos
5. **Autenticación:** Algunos formularios requieren autenticación previa
6. **Multi-tenant:** Algunos formularios están disponibles solo para administradores de tenant
7. **Data sanitization:** Todos los inputs se sanitizan con DOMPurify antes de enviar
8. **Error handling:** Manejo completo de errores con mensajes al usuario

---

**Documento generado automáticamente - 17 Diciembre 2025**
