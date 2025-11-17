/**
 * 📚 SWAGGER/OPENAPI CONFIGURATION v2.0
 * Documentación automática de API REST con Multi-Tenancy
 * Semana 14 - REST API Avanzada
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// =============================================================================
// CONFIGURACIÓN BASE
// =============================================================================

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BGE Multi-Tenant API',
      version: '2.0.0',
      description: `
        API REST para la plataforma educativa BGE (Bachillerato General por Competencias).

        ## Características
        - Multi-tenancy con aislamiento completo
        - Row-Level Security (RLS) en PostgreSQL
        - Autenticación JWT
        - Rate limiting
        - Audit logging
        - Real-time notifications con Socket.IO

        ## Autenticación
        Usa JWT Bearer tokens en el header Authorization:
        \`\`\`
        Authorization: Bearer <token>
        \`\`\`

        ## Multi-Tenancy
        Especifica el tenant usando el header X-Tenant-ID:
        \`\`\`
        X-Tenant-ID: <tenant-uuid>
        \`\`\`

        ## Versiones
        - v1: API estable (deprecada en 6 meses)
        - v2: API actual con todas las features
      `,
      contact: {
        name: 'BGE Support',
        email: 'support@bge.edu.mx',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api-staging.bge.edu.mx',
        description: 'Staging server',
      },
      {
        url: 'https://api.bge.edu.mx',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/v2/auth/login',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key para integraciones externas',
        },
        TenantHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Tenant-ID',
          description: 'UUID del tenant (opcional si se detecta por subdomain)',
        },
      },
      schemas: {
        // Schemas comunes
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Código de error',
              example: 'VALIDATION_ERROR',
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del error',
              example: 'El email es requerido',
            },
            details: {
              type: 'object',
              description: 'Detalles adicionales del error',
            },
          },
          required: ['error', 'message'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {},
              description: 'Datos paginados',
            },
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total de registros',
                },
                page: {
                  type: 'integer',
                  description: 'Página actual',
                },
                limit: {
                  type: 'integer',
                  description: 'Registros por página',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total de páginas',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            username: {
              type: 'string',
              description: 'Nombre de usuario',
            },
            role: {
              type: 'string',
              enum: ['admin', 'docente', 'estudiante', 'padre'],
              description: 'Rol del usuario',
            },
            status: {
              type: 'string',
              enum: ['activo', 'inactivo', 'suspendido'],
              description: 'Estado del usuario',
            },
            tenant_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del tenant al que pertenece',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Nombre del tenant/institución',
            },
            subdomain: {
              type: 'string',
              description: 'Subdomain único (ej: school1)',
            },
            domain: {
              type: 'string',
              description: 'Domain completo (ej: escuela.com)',
            },
            plan: {
              type: 'string',
              enum: ['starter', 'pro', 'enterprise'],
              description: 'Plan de suscripción',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'Estado del tenant',
            },
            config: {
              type: 'object',
              description: 'Configuración personalizada',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'No autenticado - Token JWT faltante o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'UNAUTHORIZED',
                message: 'Token JWT requerido',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Acceso denegado - Sin permisos suficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'FORBIDDEN',
                message: 'No tienes permisos para realizar esta acción',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'NOT_FOUND',
                message: 'El recurso solicitado no existe',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'VALIDATION_ERROR',
                message: 'Los datos proporcionados son inválidos',
                details: {
                  email: 'Email inválido',
                  password: 'La contraseña debe tener al menos 8 caracteres',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Límite de tasa excedido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Has excedido el límite de solicitudes',
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
      {
        TenantHeader: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y autorización',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios',
      },
      {
        name: 'Students',
        description: 'Gestión de estudiantes',
      },
      {
        name: 'Teachers',
        description: 'Gestión de docentes',
      },
      {
        name: 'Tenants',
        description: 'Gestión de tenants (solo super-admin)',
      },
      {
        name: 'Grades',
        description: 'Calificaciones',
      },
      {
        name: 'News',
        description: 'Noticias y avisos',
      },
      {
        name: 'Webhooks',
        description: 'Gestión de webhooks',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/**/*.js'),
    path.join(__dirname, '../routes/v1/**/*.js'),
    path.join(__dirname, '../routes/v2/**/*.js'),
  ],
};

// Generar especificación OpenAPI
const specs = swaggerJsdoc(options);

module.exports = specs;
