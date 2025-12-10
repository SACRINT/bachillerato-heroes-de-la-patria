export = accessibilityAuditor;
declare const accessibilityAuditor: AccessibilityAuditor;
declare class AccessibilityAuditor {
    constructor(config?: {});
    config: {
        contrastRatioNormal: any;
        contrastRatioLarge: any;
        checkARIA: boolean;
        checkKeyboardNav: boolean;
        checkColorContrast: boolean;
        checkSemanticHTML: boolean;
        checkFormLabels: boolean;
        checkImageAlt: boolean;
        checkHeadingStructure: boolean;
        checkLinkText: boolean;
        autoFixEnabled: boolean;
    };
    stats: {
        auditsPerformed: number;
        issuesFound: number;
        issuesFixed: number;
        byCategory: {};
    };
    /**
     * AUDIT HTML CONTENT
     */
    auditHTML(html: any, options?: {}): Promise<{
        totalIssues: number;
        issues: any[];
        byCategory: {};
        compliance: {
            score: number;
            grade: string;
        };
        wcagLevel: string;
    }>;
    /**
     * AUDIT ARIA LABELS AND ROLES
     * WCAG 2.1: 4.1.2 Name, Role, Value
     */
    auditARIA($: any): any[];
    /**
     * AUDIT IMAGE ALT TEXT
     * WCAG 2.1: 1.1.1 Non-text Content
     */
    auditImageAlt($: any): any[];
    /**
     * AUDIT FORM LABELS
     * WCAG 2.1: 3.3.2 Labels or Instructions
     */
    auditFormLabels($: any): any[];
    /**
     * AUDIT HEADING STRUCTURE
     * WCAG 2.1: 1.3.1 Info and Relationships
     */
    auditHeadingStructure($: any): any[];
    /**
     * AUDIT LINK TEXT
     * WCAG 2.1: 2.4.4 Link Purpose (In Context)
     */
    auditLinkText($: any): any[];
    /**
     * AUDIT KEYBOARD NAVIGATION
     * WCAG 2.1: 2.1.1 Keyboard
     */
    auditKeyboardNavigation($: any): any[];
    /**
     * AUDIT SEMANTIC HTML
     * WCAG 2.1: 1.3.1 Info and Relationships
     */
    auditSemanticHTML($: any): {
        category: string;
        severity: string;
        wcagCriterion: string;
        element: string;
        message: string;
        html: string;
        fix: string;
    }[];
    /**
     * GROUP ISSUES BY CATEGORY
     */
    groupIssuesByCategory(issues: any): {};
    /**
     * CALCULATE COMPLIANCE SCORE
     */
    calculateComplianceScore(issues: any): {
        score: number;
        grade: string;
    };
    /**
     * DETERMINE WCAG LEVEL
     */
    determineWCAGLevel(issues: any): "WCAG 2.1 Level AA Compliant" | "Partially Compliant (few critical issues)" | "Non-Compliant (multiple critical issues)";
    /**
     * AUTO-FIX ACCESSIBILITY ISSUES
     */
    autoFix(html: any): Promise<{
        html: string;
        fixedCount: number;
    }>;
    /**
     * GET STATISTICS
     */
    getStats(): {
        auditsPerformed: number;
        issuesFound: number;
        issuesFixed: number;
        byCategory: {};
    };
}
//# sourceMappingURL=accessibilityAuditor.d.ts.map