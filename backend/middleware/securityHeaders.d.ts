export = securityHeaders;
declare const securityHeaders: SecurityHeaders;
declare class SecurityHeaders {
    isProduction: boolean;
    cspConfig: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            fontSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            frameSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            workerSrc: string[];
            childSrc: string[];
            formAction: string[];
            frameAncestors: string[];
            baseUri: string[];
            upgradeInsecureRequests: any[];
        };
    };
    /**
     * MIDDLEWARE PRINCIPAL
     */
    middleware(): (req: any, res: any, next: any) => void;
    /**
     * BUILD CONTENT SECURITY POLICY HEADER
     */
    buildCSP(): string;
    /**
     * UPDATE CSP FOR SPECIFIC ROUTE
     */
    updateCSP(req: any, res: any, additionalDirectives: any): void;
    /**
     * BUILD CSP FROM CUSTOM DIRECTIVES
     */
    buildCSPFromDirectives(directives: any): string;
    /**
     * GET SECURITY SCORE
     */
    getSecurityScore(headers: any): {
        score: number;
        maxScore: number;
        percentage: number;
        grade: string;
    };
    /**
     * GET SECURITY GRADE
     */
    getGrade(score: any, maxScore: any): "A" | "D" | "F" | "A+" | "B" | "C";
    /**
     * LOG SECURITY HEADERS STATUS
     */
    logStatus(): void;
}
//# sourceMappingURL=securityHeaders.d.ts.map