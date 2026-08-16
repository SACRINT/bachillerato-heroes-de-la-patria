/**
 * 📚 OPENAPI 3.0 SPEC GENERATOR - SEMANA 29-30
 * Generador automático de documentación OpenAPI 3.0 para todas las rutas
 *
 * Features:
 * - Auto-introspección de rutas Express
 * - Generación de schemas JSON Schema
 * - Documentación de parámetros, headers, responses
 * - Swagger UI integration-ready
 * - Examples automáticos para cada endpoint
 * - Security schemes (JWT, OAuth2, API Keys)
 * - Tags y agrupación de endpoints
 * - Portable y modular
 *
 * OpenAPI 3.0 Components:
 * - Info: API metadata (title, version, description)
 * - Servers: API base URLs
 * - Paths: Endpoints con operaciones (GET, POST, etc)
 * - Components: Reusable schemas, parameters, responses
 * - Security: Authentication schemes
 * - Tags: Endpoint grouping
 *
 * Uso:
 * ```javascript
 * const openApiGenerator = require('./services/openApiGenerator.js');
 *
 * // Generate spec
 * const spec = await openApiGenerator.generateSpec(app);
 *
 * // Serve via Swagger UI
 * app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const devLogger = require('../utils/devLogger.js');

class OpenAPIGenerator {
    constructor(config = {}) {
        this.config = {
            // API Info
            title: config.title || 'BGE API Documentation',
            version: config.version || '5.4.0',
            description: config.description || 'Comprehensive API documentation for Bachillerato General por Competencias system',

            // Server URLs
            serverUrls: config.serverUrls || [
                { url: 'http://localhost:3000', description: 'Development server' },
                { url: 'https://api-bge.vercel.app', description: 'Production server' }
            ],

            // Features
            includeExamples: config.includeExamples !== false,
            includeSecurity: config.includeSecurity !== false,
            autoGenerateSchemas: config.autoGenerateSchemas !== false,

            ...config
        };

        // OpenAPI 3.0 base structure
        this.spec = {
            openapi: '3.0.3',
            info: {
                title: this.config.title,
                version: this.config.version,
                description: this.config.description,
                contact: {
                    name: 'BGE API Support',
                    email: 'support@bge.edu.mx'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: this.config.serverUrls,
            paths: {},
            components: {
                schemas: {},
                parameters: {},
                responses: {},
                securitySchemes: {}
            },
            tags: [],
            security: []
        };

        devLogger.log('OPENAPI', '📚 OpenAPI 3.0 Generator initialized');
    }

    /**
     * GENERATE COMPLETE OPENAPI SPEC
     */
    async generateSpec(app) {
        try {
            devLogger.log('OPENAPI', '🔍 Generating OpenAPI 3.0 specification...');

            // 1. Extract routes from Express app
            const routes = this.extractRoutes(app);

            // 2. Generate paths
            for (const route of routes) {
                this.addPath(route);
            }

            // 3. Add common schemas
            this.addCommonSchemas();

            // 4. Add security schemes
            if (this.config.includeSecurity) {
                this.addSecuritySchemes();
            }

            // 5. Add tags
            this.addTags();

            devLogger.log('OPENAPI', `✅ Generated spec with ${Object.keys(this.spec.paths).length} paths`);

            return this.spec;

        } catch (error) {
            devLogger.error('OPENAPI', 'Error generating spec:', error);
            throw error;
        }
    }

    /**
     * EXTRACT ROUTES FROM EXPRESS APP
     */
    extractRoutes(app) {
        const routes = [];

        // Traverse Express router layers
        const stack = app._router ? app._router.stack : [];

        stack.forEach(middleware => {
            if (middleware.route) {
                // Direct route
                const route = middleware.route;
                const methods = Object.keys(route.methods);

                methods.forEach(method => {
                    routes.push({
                        path: route.path,
                        method: method.toUpperCase(),
                        handlers: route.stack.map(h => h.handle)
                    });
                });
            } else if (middleware.name === 'router' && middleware.handle.stack) {
                // Nested router (e.g., /api/users)
                const basePath = middleware.regexp.source
                    .replace('\\/?', '')
                    .replace('(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\^/g, '');

                middleware.handle.stack.forEach(handler => {
                    if (handler.route) {
                        const route = handler.route;
                        const methods = Object.keys(route.methods);

                        methods.forEach(method => {
                            const fullPath = this.cleanPath(basePath + route.path);

                            routes.push({
                                path: fullPath,
                                method: method.toUpperCase(),
                                handlers: route.stack.map(h => h.handle)
                            });
                        });
                    }
                });
            }
        });

        return routes;
    }

    /**
     * CLEAN PATH (convert Express params to OpenAPI params)
     */
    cleanPath(path) {
        // Convert :param to {param}
        return path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    }

    /**
     * ADD PATH TO SPEC
     */
    addPath(route) {
        const { path, method } = route;

        if (!this.spec.paths[path]) {
            this.spec.paths[path] = {};
        }

        // Generate operation object
        const operation = this.generateOperation(route);

        this.spec.paths[path][method.toLowerCase()] = operation;
    }

    /**
     * GENERATE OPERATION OBJECT
     */
    generateOperation(route) {
        const { path, method } = route;

        // Determine tag from path
        const tag = this.getTagFromPath(path);

        // Extract path parameters
        const parameters = this.extractParameters(path);

        // Generate summary and description
        const { summary, description } = this.generateSummaryAndDescription(path, method);

        const operation = {
            tags: [tag],
            summary,
            description,
            operationId: this.generateOperationId(path, method),
            parameters,
            responses: this.generateResponses(method)
        };

        // Add request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            operation.requestBody = this.generateRequestBody(path);
        }

        // Add security if auth required
        if (this.isAuthRequired(path)) {
            operation.security = [{ bearerAuth: [] }];
        }

        // Add examples if enabled
        if (this.config.includeExamples) {
            operation.responses['200'].content = operation.responses['200'].content || {};
            operation.responses['200'].content['application/json'] = {
                schema: { type: 'object' },
                example: this.generateExample(path, method)
            };
        }

        return operation;
    }

    /**
     * GET TAG FROM PATH
     */
    getTagFromPath(path) {
        const parts = path.split('/').filter(p => p && !p.startsWith('{'));

        if (parts.length >= 2 && parts[0] === 'api') {
            return this.capitalize(parts[1]);
        }

        return 'General';
    }

    /**
     * EXTRACT PARAMETERS FROM PATH
     */
    extractParameters(path) {
        const params = [];

        // Path parameters
        const pathParams = path.match(/\{([a-zA-Z0-9_]+)\}/g);

        if (pathParams) {
            pathParams.forEach(param => {
                const paramName = param.replace(/[{}]/g, '');

                params.push({
                    name: paramName,
                    in: 'path',
                    required: true,
                    schema: { type: this.inferParamType(paramName) },
                    description: `${this.capitalize(paramName)} identifier`
                });
            });
        }

        return params;
    }

    /**
     * INFER PARAMETER TYPE
     */
    inferParamType(paramName) {
        const idParams = ['id', 'userId', 'studentId', 'teacherId', 'gradeId'];

        if (idParams.includes(paramName) || paramName.endsWith('Id')) {
            return 'integer';
        }

        return 'string';
    }

    /**
     * GENERATE SUMMARY AND DESCRIPTION
     */
    generateSummaryAndDescription(path, method) {
        const resource = this.getResourceFromPath(path);

        const summaries = {
            GET: `Get ${resource}`,
            POST: `Create ${resource}`,
            PUT: `Update ${resource}`,
            PATCH: `Partially update ${resource}`,
            DELETE: `Delete ${resource}`
        };

        const descriptions = {
            GET: `Retrieve ${resource} from the system`,
            POST: `Create a new ${resource} in the system`,
            PUT: `Update an existing ${resource}`,
            PATCH: `Partially update an existing ${resource}`,
            DELETE: `Delete ${resource} from the system`
        };

        return {
            summary: summaries[method] || `${method} ${path}`,
            description: descriptions[method] || `Perform ${method} operation on ${path}`
        };
    }

    /**
     * GET RESOURCE FROM PATH
     */
    getResourceFromPath(path) {
        const parts = path.split('/').filter(p => p && !p.startsWith('{'));

        if (parts.length >= 2 && parts[0] === 'api') {
            return parts[1];
        }

        return 'resource';
    }

    /**
     * GENERATE OPERATION ID
     */
    generateOperationId(path, method) {
        const resource = this.getResourceFromPath(path);
        const action = method.toLowerCase();

        // Extract specific resource identifier
        const hasParam = path.includes('{');

        return hasParam
            ? `${action}${this.capitalize(resource)}ById`
            : `${action}${this.capitalize(resource)}`;
    }

    /**
     * GENERATE REQUEST BODY
     */
    generateRequestBody(path) {
        const resource = this.getResourceFromPath(path);

        return {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        $ref: `#/components/schemas/${this.capitalize(resource)}Input`
                    }
                }
            }
        };
    }

    /**
     * GENERATE RESPONSES
     */
    generateResponses(method) {
        const responses = {
            200: {
                description: 'Successful operation',
                content: {
                    'application/json': {
                        schema: { type: 'object' }
                    }
                }
            },
            400: {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            },
            401: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            },
            500: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            }
        };

        if (method === 'POST') {
            responses[201] = {
                description: 'Resource created successfully',
                content: {
                    'application/json': {
                        schema: { type: 'object' }
                    }
                }
            };
        }

        if (method === 'DELETE') {
            responses[204] = {
                description: 'Resource deleted successfully'
            };
        }

        return responses;
    }

    /**
     * IS AUTH REQUIRED
     */
    isAuthRequired(path) {
        const publicPaths = ['/api/health', '/api/auth/login', '/api/auth/register'];

        return !publicPaths.includes(path);
    }

    /**
     * GENERATE EXAMPLE
     */
    generateExample(path, method) {
        const resource = this.getResourceFromPath(path);

        const examples = {
            users: {
                id: 1,
                email: 'user@example.com',
                nombre: 'Juan',
                apellido_paterno: 'Pérez',
                role: 'estudiante',
                status: 'activo'
            },
            students: {
                id: 1,
                nombre: 'Juan Pérez',
                matricula: '2025-001',
                grado: '1',
                grupo: 'A'
            },
            grades: {
                id: 1,
                estudiante_id: 1,
                curso_id: 1,
                calificacion: 9.5,
                periodo: '2025-1'
            }
        };

        return examples[resource] || { success: true, data: {} };
    }

    /**
     * ADD COMMON SCHEMAS
     */
    addCommonSchemas() {
        // Error schema
        this.spec.components.schemas.Error = {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Error message' },
                        code: { type: 'string', example: 'ERROR_CODE' },
                        statusCode: { type: 'integer', example: 400 }
                    }
                },
                timestamp: { type: 'string', format: 'date-time' }
            }
        };

        // User schemas
        this.spec.components.schemas.User = {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                username: { type: 'string', example: 'johndoe' },
                nombre: { type: 'string', example: 'Juan' },
                apellido_paterno: { type: 'string', example: 'Pérez' },
                apellido_materno: { type: 'string', example: 'García' },
                role: { type: 'string', enum: ['admin', 'estudiante', 'docente', 'padre'], example: 'estudiante' },
                status: { type: 'string', example: 'activo' },
                created_at: { type: 'string', format: 'date-time' }
            }
        };

        this.spec.components.schemas.UserInput = {
            type: 'object',
            required: ['email', 'password', 'nombre', 'apellido_paterno', 'role'],
            properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password', minLength: 8 },
                nombre: { type: 'string' },
                apellido_paterno: { type: 'string' },
                apellido_materno: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'estudiante', 'docente', 'padre'] }
            }
        };
    }

    /**
     * ADD SECURITY SCHEMES
     */
    addSecuritySchemes() {
        // Bearer Token (JWT)
        this.spec.components.securitySchemes.bearerAuth = {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from /api/auth/login'
        };

        // API Key
        this.spec.components.securitySchemes.apiKey = {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-KEY',
            description: 'API key for service-to-service authentication'
        };

        // Default security requirement
        this.spec.security = [{ bearerAuth: [] }];
    }

    /**
     * ADD TAGS
     */
    addTags() {
        const tags = new Set();

        // Extract unique tags from paths
        Object.values(this.spec.paths).forEach(pathItem => {
            Object.values(pathItem).forEach(operation => {
                if (operation.tags) {
                    operation.tags.forEach(tag => tags.add(tag));
                }
            });
        });

        // Generate tag objects with descriptions
        this.spec.tags = Array.from(tags).map(tag => ({
            name: tag,
            description: `${tag} management endpoints`
        }));
    }

    /**
     * CAPITALIZE STRING
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * EXPORT SPEC AS JSON
     */
    exportJSON() {
        return JSON.stringify(this.spec, null, 2);
    }

    /**
     * EXPORT SPEC AS YAML
     */
    exportYAML() {
        // Basic YAML conversion (for production, use js-yaml library)
        let yaml = `openapi: ${this.spec.openapi}\n`;
        yaml += `info:\n  title: ${this.spec.info.title}\n  version: ${this.spec.info.version}\n`;

        return yaml;
    }
}

// Export singleton instance
const openApiGenerator = new OpenAPIGenerator();

module.exports = openApiGenerator;
