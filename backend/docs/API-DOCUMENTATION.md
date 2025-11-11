# Documentación de la API - Bachillerato General Estatal "Héroes de la Patria"

## Información General

- **Base URL**: `/api/`
- **Versión**: 1.0
- **Fecha**: 18 de Octubre, 2025
- **Formato de respuesta**: JSON
- **Autenticación**: JWT Token (para endpoints administrativos)

## Endpoints Principales

### Sistema de Contenidos (CMS)

#### Noticias

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/noticias` | Listar todas las noticias | No |
| GET | `/noticias/stats` | Estadísticas de noticias | No |
| GET | `/noticias/:id` | Obtener noticia específica | No |
| POST | `/noticias` | Crear nueva noticia | Sí |
| PUT | `/noticias/:id` | Actualizar noticia | Sí |
| DELETE | `/noticias/:id` | Archivar noticia | Sí |

**Ejemplo de creación:**
```json
POST /api/noticias
{
  "titulo": "Nueva noticia",
  "contenido": "Contenido completo...",
  "resumen": "Resumen breve",
  "categoria": "Académico",
  "estado": "publicada",
  "autor": "Nombre del autor",
  "destacada": false
}
```

#### Eventos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/eventos` | Listar todos los eventos | No |
| GET | `/eventos/stats` | Estadísticas de eventos | No |
| GET | `/eventos/:id` | Obtener evento específico | No |
| POST | `/eventos` | Crear nuevo evento | Sí |
| PUT | `/eventos/:id` | Actualizar evento | Sí |
| DELETE | `/eventos/:id` | Cancelar evento | Sí |

**Ejemplo de creación:**
```json
POST /api/eventos
{
  "titulo": "Conferencia Virtual",
  "descripcion": "Descripción del evento",
  "fecha_inicio": "2025-12-01T10:00:00",
  "ubicacion": "Auditorio Principal",
  "modalidad": "presencial",
  "categoria": "Académico",
  "estado": "publicado",
  "organizador": "Departamento Académico",
  "capacidad_maxima": 100,
  "requiere_inscripcion": true
}
```

**Modalidades disponibles**: `presencial`, `virtual`, `híbrido`

#### Avisos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/avisos` | Listar todos los avisos | No |
| GET | `/avisos/stats` | Estadísticas de avisos | No |
| POST | `/avisos` | Crear nuevo aviso | Sí |
| PUT | `/avisos/:id` | Actualizar aviso | Sí |
| DELETE | `/avisos/:id` | Archivar aviso | Sí |

#### Comunicados

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/comunicados` | Listar todos los comunicados | No |
| GET | `/comunicados/stats` | Estadísticas de comunicados | No |
| POST | `/comunicados` | Crear nuevo comunicado | Sí |
| PUT | `/comunicados/:id` | Actualizar comunicado | Sí |
| DELETE | `/comunicados/:id` | Archivar comunicado | Sí |

### Sistema de Subida de Archivos

#### Imágenes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/upload/image` | Subir una imagen | Sí |
| POST | `/upload/multiple` | Subir múltiples imágenes | Sí |
| GET | `/upload/list/:contentType` | Listar imágenes | Sí |
| DELETE | `/upload/image/:contentType/:filename` | Eliminar imagen | Sí |

**Ejemplo de subida:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('contentType', 'noticias'); // o 'eventos', 'avisos', etc.

fetch('/api/upload/image', {
  method: 'POST',
  body: formData
});
```

**Tipos de contenido válidos**: `noticias`, `eventos`, `avisos`, `comunicados`, `general`

**Límites**: 5MB por archivo, formatos: JPG, PNG, GIF, WebP, SVG

### Formularios de Usuario

#### Quejas y Sugerencias

```json
POST /api/quejas
{
  "nombre": "Nombre completo",
  "email": "email@example.com",
  "subject": "queja", // o "sugerencia", "felicitacion", "otro"
  "message": "Mensaje detallado"
}
```

#### Recuperación de Contraseña

```json
POST /api/password-recovery
{
  "email": "usuario@example.com"
}
```

#### Notificaciones de Convocatorias

```json
POST /api/notificaciones
{
  "email": "email@example.com",
  "tipo_contenido": "noticias", // o "eventos", "convocatorias"
  "frecuencia": "diaria" // o "semanal", "mensual"
}
```

### Sistema de Gestión

#### Egresados

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/egresados/create` | Registrar egresado | No |
| GET | `/egresados/list` | Listar egresados | Sí |
| GET | `/egresados/stats` | Estadísticas | Sí |
| PUT | `/egresados/:id/approve` | Aprobar registro | Sí |
| PUT | `/egresados/:id/reject` | Rechazar registro | Sí |

#### Citas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/citas/create` | Solicitar cita | No |
| GET | `/citas/list` | Listar citas | Sí |
| GET | `/citas/stats` | Estadísticas | Sí |
| PUT | `/citas/:id/approve` | Aprobar cita | Sí |
| PUT | `/citas/:id/reject` | Rechazar cita | Sí |

## Respuestas Estándar

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "Descripción del error",
  "errors": [ ... ] // Para errores de validación
}
```

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Autenticación requerida |
| 404 | Not Found - Recurso no encontrado |
| 500 | Server Error - Error interno del servidor |

## Caché

Los siguientes endpoints implementan caché para mejorar el rendimiento:

- **Estadísticas** (TTL: 5 minutos): `/*/stats`
- **Listados** (TTL: 2 minutos): `/*/list`

Headers de caché:
- `X-Cache: HIT` - Respuesta servida desde caché
- `X-Cache: MISS` - Respuesta generada en tiempo real
- `X-Cache-Expires` - Fecha de expiración del caché

## Rate Limiting

- **Límite general**: 100 requests por 15 minutos por IP
- **Límite de autenticación**: 5 intentos por 15 minutos

## Notas de Implementación

1. Todas las fechas están en formato ISO 8601
2. Los slugs se generan automáticamente a partir de los títulos
3. El soft delete está implementado en todos los módulos del CMS
4. Los archivos subidos se almacenan en `/public/uploads/`
5. La autenticación usa JWT tokens almacenados en `localStorage`

## Ejemplos de Uso

### JavaScript (Fetch API)

```javascript
// GET Request
const noticias = await fetch('/api/noticias')
  .then(res => res.json());

// POST Request
const nuevaNoticia = await fetch('/api/noticias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    titulo: 'Nueva noticia',
    contenido: 'Contenido...',
    autor: 'Admin'
  })
}).then(res => res.json());
```

### cURL

```bash
# GET Request
curl http://localhost:3000/api/noticias

# POST Request
curl -X POST http://localhost:3000/api/noticias \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Nueva noticia",
    "contenido": "Contenido...",
    "autor": "Admin"
  }'
```

## Soporte

Para más información o reportar problemas:
- Email: soporte@heroesdelapatria.edu.mx
- GitHub: [Repositorio del proyecto]

---
**Última actualización**: 18 de Octubre, 2025
