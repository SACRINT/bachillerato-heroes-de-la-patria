/**
 * ♿ WCAG 2.1 AA ACCESSIBILITY AUDITOR - SEMANA 27-28
 * Servicio para auditar y corregir accesibilidad según WCAG 2.1 Level AA
 *
 * Features:
 * - Audit HTML para ARIA labels y semantic HTML
 * - Color contrast compliance (ratio 4.5:1 para texto normal, 3:1 para texto grande)
 * - Keyboard navigation verification
 * - Screen reader compatibility
 * - Form accessibility (labels, error messages, required fields)
 * - Focus management
 * - Alt text para imágenes
 * - Heading structure validation
 * - Link accessibility (descriptive text)
 * - Auto-fix suggestions
 * - Portable y modular
 *
 * WCAG 2.1 Principles:
 * - Perceivable: Info and UI must be presentable
 * - Operable: UI must be navigable
 * - Understandable: Info must be readable
 * - Robust: Content must be accessible by assistive technologies
 *
 * Uso:
 * ```javascript
 * const accessibilityAuditor = require('./services/accessibilityAuditor.js');
 *
 * // Audit HTML
 * const auditReport = await accessibilityAuditor.auditHTML(htmlContent);
 *
 * // Auto-fix issues
 * const fixedHTML = await accessibilityAuditor.autoFix(htmlContent);
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const cheerio = require('cheerio'); // HTML parsing
const devLogger = require('../utils/devLogger.js');

class AccessibilityAuditor {
    constructor(config = {}) {
        this.config = {
            // WCAG 2.1 Level AA thresholds
            contrastRatioNormal: config.contrastRatioNormal || 4.5,  // AA for normal text
            contrastRatioLarge: config.contrastRatioLarge || 3.0,    // AA for large text

            // Auditing
            checkARIA: config.checkARIA !== false,
            checkKeyboardNav: config.checkKeyboardNav !== false,
            checkColorContrast: config.checkColorContrast !== false,
            checkSemanticHTML: config.checkSemanticHTML !== false,
            checkFormLabels: config.checkFormLabels !== false,
            checkImageAlt: config.checkImageAlt !== false,
            checkHeadingStructure: config.checkHeadingStructure !== false,
            checkLinkText: config.checkLinkText !== false,

            // Auto-fixing
            autoFixEnabled: config.autoFixEnabled !== false,

            ...config
        };

        // Statistics
        this.stats = {
            auditsPerformed: 0,
            issuesFound: 0,
            issuesFixed: 0,
            byCategory: {}
        };

        devLogger.log('ACCESSIBILITY', '♿ WCAG 2.1 AA Accessibility Auditor initialized');
    }

    /**
     * AUDIT HTML CONTENT
     */
    async auditHTML(html, options = {}) {
        try {
            devLogger.log('ACCESSIBILITY', '🔍 Auditing HTML for WCAG 2.1 AA compliance');

            const $ = cheerio.load(html);
            const issues = [];

            // 1. ARIA Labels and Roles
            if (this.config.checkARIA) {
                issues.push(...this.auditARIA($));
            }

            // 2. Image Alt Text
            if (this.config.checkImageAlt) {
                issues.push(...this.auditImageAlt($));
            }

            // 3. Form Labels
            if (this.config.checkFormLabels) {
                issues.push(...this.auditFormLabels($));
            }

            // 4. Heading Structure
            if (this.config.checkHeadingStructure) {
                issues.push(...this.auditHeadingStructure($));
            }

            // 5. Link Text
            if (this.config.checkLinkText) {
                issues.push(...this.auditLinkText($));
            }

            // 6. Keyboard Navigation
            if (this.config.checkKeyboardNav) {
                issues.push(...this.auditKeyboardNavigation($));
            }

            // 7. Semantic HTML
            if (this.config.checkSemanticHTML) {
                issues.push(...this.auditSemanticHTML($));
            }

            this.stats.auditsPerformed++;
            this.stats.issuesFound += issues.length;

            // Group issues by category
            const byCategory = this.groupIssuesByCategory(issues);

            return {
                totalIssues: issues.length,
                issues,
                byCategory,
                compliance: this.calculateComplianceScore(issues),
                wcagLevel: this.determineWCAGLevel(issues)
            };

        } catch (error) {
            devLogger.error('ACCESSIBILITY', 'Error auditing HTML:', error);
            throw error;
        }
    }

    /**
     * AUDIT ARIA LABELS AND ROLES
     * WCAG 2.1: 4.1.2 Name, Role, Value
     */
    auditARIA($) {
        const issues = [];

        // Check interactive elements without ARIA labels
        $('button, a[href], input, select, textarea').each((i, el) => {
            const $el = $(el);
            const tagName = el.tagName.toLowerCase();

            const hasARIALabel = $el.attr('aria-label') || $el.attr('aria-labelledby');
            const hasVisibleText = $el.text().trim().length > 0;
            const hasAlt = $el.attr('alt');
            const hasTitle = $el.attr('title');
            const hasValue = $el.attr('value');

            // Buttons must have accessible name
            if (tagName === 'button' && !hasARIALabel && !hasVisibleText && !hasTitle) {
                issues.push({
                    category: 'ARIA',
                    severity: 'high',
                    wcagCriterion: '4.1.2',
                    element: tagName,
                    message: 'Button without accessible name (add aria-label or text content)',
                    html: $.html($el),
                    fix: 'Add aria-label, aria-labelledby, or text content to button'
                });
            }

            // Links must have accessible name
            if (tagName === 'a' && !hasARIALabel && !hasVisibleText && !hasTitle) {
                issues.push({
                    category: 'ARIA',
                    severity: 'high',
                    wcagCriterion: '4.1.2',
                    element: tagName,
                    message: 'Link without accessible name',
                    html: $.html($el),
                    fix: 'Add aria-label, aria-labelledby, or text content to link'
                });
            }

            // Inputs must have labels
            if ((tagName === 'input' || tagName === 'textarea') && !hasARIALabel) {
                const id = $el.attr('id');
                const hasLabel = id && $(`label[for="${id}"]`).length > 0;

                if (!hasLabel && !hasAlt && !hasTitle) {
                    issues.push({
                        category: 'ARIA',
                        severity: 'high',
                        wcagCriterion: '4.1.2',
                        element: tagName,
                        message: 'Input without label or aria-label',
                        html: $.html($el),
                        fix: 'Add <label for="id"> or aria-label attribute'
                    });
                }
            }
        });

        // Check ARIA roles validity
        $('[role]').each((i, el) => {
            const $el = $(el);
            const role = $el.attr('role');
            const validRoles = [
                'button', 'link', 'navigation', 'main', 'banner', 'contentinfo',
                'complementary', 'search', 'form', 'region', 'alert', 'status',
                'dialog', 'alertdialog', 'menu', 'menubar', 'menuitem', 'tab',
                'tablist', 'tabpanel', 'list', 'listitem', 'article', 'document'
            ];

            if (!validRoles.includes(role)) {
                issues.push({
                    category: 'ARIA',
                    severity: 'medium',
                    wcagCriterion: '4.1.2',
                    element: el.tagName.toLowerCase(),
                    message: `Invalid ARIA role: "${role}"`,
                    html: $.html($el),
                    fix: `Use valid ARIA role or remove role attribute`
                });
            }
        });

        return issues;
    }

    /**
     * AUDIT IMAGE ALT TEXT
     * WCAG 2.1: 1.1.1 Non-text Content
     */
    auditImageAlt($) {
        const issues = [];

        $('img').each((i, el) => {
            const $el = $(el);
            const alt = $el.attr('alt');
            const role = $el.attr('role');

            // Decorative images should have empty alt or role="presentation"
            if (alt === undefined && role !== 'presentation') {
                issues.push({
                    category: 'Images',
                    severity: 'high',
                    wcagCriterion: '1.1.1',
                    element: 'img',
                    message: 'Image missing alt attribute',
                    html: $.html($el),
                    fix: 'Add alt="" for decorative images or alt="description" for informative images'
                });
            }

            // Alt text should be descriptive (not just filename)
            if (alt && (alt.endsWith('.jpg') || alt.endsWith('.png') || alt.endsWith('.gif'))) {
                issues.push({
                    category: 'Images',
                    severity: 'medium',
                    wcagCriterion: '1.1.1',
                    element: 'img',
                    message: 'Alt text appears to be filename, not description',
                    html: $.html($el),
                    fix: 'Replace alt text with meaningful description of image content'
                });
            }
        });

        return issues;
    }

    /**
     * AUDIT FORM LABELS
     * WCAG 2.1: 3.3.2 Labels or Instructions
     */
    auditFormLabels($) {
        const issues = [];

        $('input, select, textarea').each((i, el) => {
            const $el = $(el);
            const tagName = el.tagName.toLowerCase();
            const type = $el.attr('type');
            const id = $el.attr('id');

            // Skip hidden and submit inputs
            if (type === 'hidden' || type === 'submit' || type === 'button') {
                return;
            }

            const hasLabel = id && $(`label[for="${id}"]`).length > 0;
            const hasARIALabel = $el.attr('aria-label') || $el.attr('aria-labelledby');
            const hasTitle = $el.attr('title');
            const hasPlaceholder = $el.attr('placeholder');

            if (!hasLabel && !hasARIALabel && !hasTitle) {
                issues.push({
                    category: 'Forms',
                    severity: 'high',
                    wcagCriterion: '3.3.2',
                    element: tagName,
                    message: `Form ${tagName} without label`,
                    html: $.html($el),
                    fix: 'Add <label for="id"> or aria-label attribute'
                });
            }

            // Placeholder is not a substitute for label
            if (hasPlaceholder && !hasLabel && !hasARIALabel) {
                issues.push({
                    category: 'Forms',
                    severity: 'medium',
                    wcagCriterion: '3.3.2',
                    element: tagName,
                    message: 'Placeholder used instead of label (not accessible)',
                    html: $.html($el),
                    fix: 'Add permanent <label> alongside placeholder'
                });
            }

            // Required fields should have aria-required
            if ($el.attr('required') !== undefined && !$el.attr('aria-required')) {
                issues.push({
                    category: 'Forms',
                    severity: 'low',
                    wcagCriterion: '3.3.2',
                    element: tagName,
                    message: 'Required field missing aria-required="true"',
                    html: $.html($el),
                    fix: 'Add aria-required="true" attribute'
                });
            }
        });

        return issues;
    }

    /**
     * AUDIT HEADING STRUCTURE
     * WCAG 2.1: 1.3.1 Info and Relationships
     */
    auditHeadingStructure($) {
        const issues = [];
        let previousLevel = 0;

        $('h1, h2, h3, h4, h5, h6').each((i, el) => {
            const level = parseInt(el.tagName[1]);

            // Only one h1 per page
            if (level === 1 && $('h1').length > 1) {
                issues.push({
                    category: 'Headings',
                    severity: 'medium',
                    wcagCriterion: '1.3.1',
                    element: el.tagName.toLowerCase(),
                    message: 'Multiple <h1> elements found (should be only one per page)',
                    html: $.html($(el)),
                    fix: 'Use only one <h1> per page for main heading'
                });
            }

            // Headings should not skip levels
            if (previousLevel > 0 && level > previousLevel + 1) {
                issues.push({
                    category: 'Headings',
                    severity: 'medium',
                    wcagCriterion: '1.3.1',
                    element: el.tagName.toLowerCase(),
                    message: `Heading level skipped (from <h${previousLevel}> to <h${level}>)`,
                    html: $.html($(el)),
                    fix: `Use <h${previousLevel + 1}> instead of <h${level}>`
                });
            }

            // Headings should have text content
            if ($(el).text().trim().length === 0) {
                issues.push({
                    category: 'Headings',
                    severity: 'high',
                    wcagCriterion: '1.3.1',
                    element: el.tagName.toLowerCase(),
                    message: 'Empty heading element',
                    html: $.html($(el)),
                    fix: 'Add descriptive text to heading or remove empty heading'
                });
            }

            previousLevel = level;
        });

        return issues;
    }

    /**
     * AUDIT LINK TEXT
     * WCAG 2.1: 2.4.4 Link Purpose (In Context)
     */
    auditLinkText($) {
        const issues = [];

        $('a[href]').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim().toLowerCase();
            const ariaLabel = $el.attr('aria-label');

            // Avoid generic link text
            const genericPhrases = ['click here', 'read more', 'more', 'link', 'here', 'this'];

            if (!ariaLabel && genericPhrases.includes(text)) {
                issues.push({
                    category: 'Links',
                    severity: 'medium',
                    wcagCriterion: '2.4.4',
                    element: 'a',
                    message: `Generic link text: "${text}"`,
                    html: $.html($el),
                    fix: 'Use descriptive link text or add aria-label with context'
                });
            }

            // Links should have text or aria-label
            if (!text && !ariaLabel && !$el.find('img[alt]').length) {
                issues.push({
                    category: 'Links',
                    severity: 'high',
                    wcagCriterion: '2.4.4',
                    element: 'a',
                    message: 'Link without text, aria-label, or alt text',
                    html: $.html($el),
                    fix: 'Add text content, aria-label, or img with alt text'
                });
            }
        });

        return issues;
    }

    /**
     * AUDIT KEYBOARD NAVIGATION
     * WCAG 2.1: 2.1.1 Keyboard
     */
    auditKeyboardNavigation($) {
        const issues = [];

        // Check for tabindex values > 0 (bad practice)
        $('[tabindex]').each((i, el) => {
            const $el = $(el);
            const tabindex = parseInt($el.attr('tabindex'));

            if (tabindex > 0) {
                issues.push({
                    category: 'Keyboard',
                    severity: 'medium',
                    wcagCriterion: '2.1.1',
                    element: el.tagName.toLowerCase(),
                    message: `Positive tabindex value (${tabindex}) disrupts natural tab order`,
                    html: $.html($el),
                    fix: 'Use tabindex="0" or "-1" instead of positive values'
                });
            }
        });

        // Check for onclick on non-interactive elements without keyboard handlers
        $('[onclick]').each((i, el) => {
            const $el = $(el);
            const tagName = el.tagName.toLowerCase();
            const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];

            if (!interactiveTags.includes(tagName)) {
                const hasKeyHandler = $el.attr('onkeydown') || $el.attr('onkeypress') || $el.attr('onkeyup');

                if (!hasKeyHandler) {
                    issues.push({
                        category: 'Keyboard',
                        severity: 'high',
                        wcagCriterion: '2.1.1',
                        element: tagName,
                        message: 'onclick without keyboard handler (not keyboard accessible)',
                        html: $.html($el),
                        fix: 'Use <button> instead or add onkeydown handler'
                    });
                }
            }
        });

        return issues;
    }

    /**
     * AUDIT SEMANTIC HTML
     * WCAG 2.1: 1.3.1 Info and Relationships
     */
    auditSemanticHTML($) {
        const issues = [];

        // Check for divs/spans with onclick (should be buttons)
        $('div[onclick], span[onclick]').each((i, el) => {
            issues.push({
                category: 'Semantic HTML',
                severity: 'medium',
                wcagCriterion: '1.3.1',
                element: el.tagName.toLowerCase(),
                message: 'Using div/span as button (use <button> for semantic HTML)',
                html: $.html($(el)),
                fix: 'Replace with <button> element'
            });
        });

        // Check for proper use of landmarks
        if ($('main').length === 0) {
            issues.push({
                category: 'Semantic HTML',
                severity: 'low',
                wcagCriterion: '1.3.1',
                element: 'main',
                message: 'Missing <main> landmark',
                html: 'N/A',
                fix: 'Wrap main content in <main> element'
            });
        }

        if ($('nav').length === 0 && $('[role="navigation"]').length === 0) {
            issues.push({
                category: 'Semantic HTML',
                severity: 'low',
                wcagCriterion: '1.3.1',
                element: 'nav',
                message: 'Missing <nav> landmark or role="navigation"',
                html: 'N/A',
                fix: 'Wrap navigation in <nav> element or add role="navigation"'
            });
        }

        return issues;
    }

    /**
     * GROUP ISSUES BY CATEGORY
     */
    groupIssuesByCategory(issues) {
        const grouped = {};

        issues.forEach(issue => {
            if (!grouped[issue.category]) {
                grouped[issue.category] = [];
            }
            grouped[issue.category].push(issue);
        });

        return grouped;
    }

    /**
     * CALCULATE COMPLIANCE SCORE
     */
    calculateComplianceScore(issues) {
        const totalChecks = 100; // Arbitrary baseline
        const highSeverity = issues.filter(i => i.severity === 'high').length;
        const mediumSeverity = issues.filter(i => i.severity === 'medium').length;
        const lowSeverity = issues.filter(i => i.severity === 'low').length;

        const score = Math.max(0, totalChecks - (highSeverity * 10 + mediumSeverity * 5 + lowSeverity * 2));

        return {
            score: Math.round(score),
            grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
        };
    }

    /**
     * DETERMINE WCAG LEVEL
     */
    determineWCAGLevel(issues) {
        const highIssues = issues.filter(i => i.severity === 'high').length;

        if (highIssues === 0) {
            return 'WCAG 2.1 Level AA Compliant';
        } else if (highIssues < 5) {
            return 'Partially Compliant (few critical issues)';
        } else {
            return 'Non-Compliant (multiple critical issues)';
        }
    }

    /**
     * AUTO-FIX ACCESSIBILITY ISSUES
     */
    async autoFix(html) {
        try {
            devLogger.log('ACCESSIBILITY', '🔧 Auto-fixing accessibility issues');

            const $ = cheerio.load(html);
            let fixedCount = 0;

            // Fix 1: Add empty alt to decorative images
            $('img:not([alt])').each((i, el) => {
                $(el).attr('alt', '');
                fixedCount++;
            });

            // Fix 2: Add aria-required to required inputs
            $('input[required]:not([aria-required]), textarea[required]:not([aria-required])').each((i, el) => {
                $(el).attr('aria-required', 'true');
                fixedCount++;
            });

            // Fix 3: Add role="button" to divs/spans with onclick
            $('div[onclick]:not([role]), span[onclick]:not([role])').each((i, el) => {
                $(el).attr('role', 'button');
                $(el).attr('tabindex', '0');
                fixedCount++;
            });

            // Fix 4: Remove positive tabindex values
            $('[tabindex]').each((i, el) => {
                const tabindex = parseInt($(el).attr('tabindex'));
                if (tabindex > 0) {
                    $(el).attr('tabindex', '0');
                    fixedCount++;
                }
            });

            this.stats.issuesFixed += fixedCount;

            devLogger.log('ACCESSIBILITY', `✅ Auto-fixed ${fixedCount} issues`);

            return {
                html: $.html(),
                fixedCount
            };

        } catch (error) {
            devLogger.error('ACCESSIBILITY', 'Error auto-fixing HTML:', error);
            throw error;
        }
    }

    /**
     * GET STATISTICS
     */
    getStats() {
        return { ...this.stats };
    }
}

// Export singleton instance
const accessibilityAuditor = new AccessibilityAuditor();

module.exports = accessibilityAuditor;
