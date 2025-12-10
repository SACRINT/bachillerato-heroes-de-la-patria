export = openApiGenerator;
declare const openApiGenerator: OpenAPIGenerator;
declare class OpenAPIGenerator {
    constructor(config?: {});
    config: {
        title: any;
        version: any;
        description: any;
        serverUrls: any;
        includeExamples: boolean;
        includeSecurity: boolean;
        autoGenerateSchemas: boolean;
    };
    spec: {
        openapi: string;
        info: {
            title: any;
            version: any;
            description: any;
            contact: {
                name: string;
                email: string;
            };
            license: {
                name: string;
                url: string;
            };
        };
        servers: any;
        paths: {};
        components: {
            schemas: {};
            parameters: {};
            responses: {};
            securitySchemes: {};
        };
        tags: any[];
        security: any[];
    };
    /**
     * GENERATE COMPLETE OPENAPI SPEC
     */
    generateSpec(app: any): Promise<{
        openapi: string;
        info: {
            title: any;
            version: any;
            description: any;
            contact: {
                name: string;
                email: string;
            };
            license: {
                name: string;
                url: string;
            };
        };
        servers: any;
        paths: {};
        components: {
            schemas: {};
            parameters: {};
            responses: {};
            securitySchemes: {};
        };
        tags: any[];
        security: any[];
    }>;
    /**
     * EXTRACT ROUTES FROM EXPRESS APP
     */
    extractRoutes(app: any): any[];
    /**
     * CLEAN PATH (convert Express params to OpenAPI params)
     */
    cleanPath(path: any): any;
    /**
     * ADD PATH TO SPEC
     */
    addPath(route: any): void;
    /**
     * GENERATE OPERATION OBJECT
     */
    generateOperation(route: any): {
        tags: any[];
        summary: any;
        description: any;
        operationId: string;
        parameters: any[];
        responses: {
            200: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            type: string;
                        };
                    };
                };
            };
            400: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            401: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            500: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
        };
    };
    /**
     * GET TAG FROM PATH
     */
    getTagFromPath(path: any): any;
    /**
     * EXTRACT PARAMETERS FROM PATH
     */
    extractParameters(path: any): any[];
    /**
     * INFER PARAMETER TYPE
     */
    inferParamType(paramName: any): "string" | "integer";
    /**
     * GENERATE SUMMARY AND DESCRIPTION
     */
    generateSummaryAndDescription(path: any, method: any): {
        summary: any;
        description: any;
    };
    /**
     * GET RESOURCE FROM PATH
     */
    getResourceFromPath(path: any): any;
    /**
     * GENERATE OPERATION ID
     */
    generateOperationId(path: any, method: any): string;
    /**
     * GENERATE REQUEST BODY
     */
    generateRequestBody(path: any): {
        required: boolean;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
            };
        };
    };
    /**
     * GENERATE RESPONSES
     */
    generateResponses(method: any): {
        200: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        type: string;
                    };
                };
            };
        };
        400: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
        401: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
        500: {
            description: string;
            content: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
    };
    /**
     * IS AUTH REQUIRED
     */
    isAuthRequired(path: any): boolean;
    /**
     * GENERATE EXAMPLE
     */
    generateExample(path: any, method: any): any;
    /**
     * ADD COMMON SCHEMAS
     */
    addCommonSchemas(): void;
    /**
     * ADD SECURITY SCHEMES
     */
    addSecuritySchemes(): void;
    /**
     * ADD TAGS
     */
    addTags(): void;
    /**
     * CAPITALIZE STRING
     */
    capitalize(str: any): any;
    /**
     * EXPORT SPEC AS JSON
     */
    exportJSON(): string;
    /**
     * EXPORT SPEC AS YAML
     */
    exportYAML(): string;
}
//# sourceMappingURL=openApiGenerator.d.ts.map