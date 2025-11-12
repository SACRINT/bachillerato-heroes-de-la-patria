#!/usr/bin/env node

/**
 * Sanitize innerHTML Script v2 - DOMPurify Integration
 *
 * Replaces dangerous innerHTML assignments with sanitizeHTML() wrapper calls.
 * Supports both dry-run (default) and execution (-x flag) modes.
 *
 * Usage:
 *   node sanitize-innerhtml-v2.cjs          # Dry-run mode
 *   node sanitize-innerhtml-v2.cjs -x       # Execute changes
 */

const fs = require('fs');
const path = require('path');

// Command line arguments
const IS_DRY_RUN = !process.argv.includes('-x');
const MODE = IS_DRY_RUN ? 'DRY-RUN' : 'EXECUTE';

// Patterns to match and replace
const PATTERNS = [
    {
        name: 'innerHTML direct assignment (string)',
        pattern: /(\w+)\.innerHTML\s*=\s*(?!sanitizeHTML\()(["'`])([^"'`]*)\2/g,
        replacement: (match, obj, quote, content) => {
            // Only replace if not already wrapped with sanitizeHTML
            if (!match.includes('sanitizeHTML')) {
                return `${obj}.innerHTML = sanitizeHTML(${quote}${content}${quote})`;
            }
            return match;
        }
    },
    {
        name: 'innerHTML direct assignment (template literal)',
        pattern: /(\w+)\.innerHTML\s*=\s*(?!sanitizeHTML\()`([^`]*)`/g,
        replacement: (match, obj, content) => {
            if (!match.includes('sanitizeHTML')) {
                return `${obj}.innerHTML = sanitizeHTML(\`${content}\`)`;
            }
            return match;
        }
    },
    {
        name: 'insertAdjacentHTML calls',
        pattern: /(\w+)\.insertAdjacentHTML\(\s*(["'`])(\w+)\2\s*,\s*(?!sanitizeHTML\()(.*?)\)/g,
        replacement: (match, obj, quote, position, content) => {
            if (!match.includes('sanitizeHTML')) {
                return `${obj}.insertAdjacentHTML(${quote}${position}${quote}, sanitizeHTML(${content}))`;
            }
            return match;
        }
    }
];

// File extensions to process
const EXTENSIONS = ['.js', '.cjs', '.mjs'];

// Directories to scan
const DIRS_TO_SCAN = [
    'public/js',
    'public',
    'backend',
    'scripts'
];

// Files to skip
const SKIP_PATTERNS = [
    /node_modules/,
    /\.min\.js$/,
    /dompurify/i,
    /sanitize/i,
    /test\./,
    /\.test\.js$/,
    /\.spec\.js$/
];

class SanitizeInnerHTML {
    constructor(dryRun = true) {
        this.dryRun = dryRun;
        this.filesProcessed = 0;
        this.filesModified = 0;
        this.totalReplacements = 0;
        this.errors = [];
        this.modifications = [];
    }

    log(message, color = 'reset') {
        const colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            cyan: '\x1b[36m'
        };
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    shouldSkipFile(filePath) {
        return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
    }

    processFile(filePath) {
        this.filesProcessed++;

        try {
            // Skip if matches skip patterns
            if (this.shouldSkipFile(filePath)) {
                return;
            }

            // Check extension
            const ext = path.extname(filePath);
            if (!EXTENSIONS.includes(ext)) {
                return;
            }

            // Read file
            const content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let newContent = content;
            let fileReplacements = 0;

            // Apply patterns
            for (const patternObj of PATTERNS) {
                const before = newContent;
                newContent = newContent.replace(patternObj.pattern, patternObj.replacement);

                if (newContent !== before) {
                    modified = true;
                    const count = (before.match(patternObj.pattern) || []).length;
                    fileReplacements += count;

                    if (!this.dryRun) {
                        this.log(`  Pattern "${patternObj.name}": ${count} replacement(s)`, 'dim');
                    }
                }
            }

            if (modified) {
                this.filesModified++;
                this.totalReplacements += fileReplacements;
                const status = this.dryRun ? '📋' : '✏️';
                this.log(`${status} ${filePath.replace(process.cwd(), '.')} (+${fileReplacements})`, 'cyan');

                this.modifications.push({
                    file: filePath,
                    replacements: fileReplacements,
                    modified: !this.dryRun
                });

                // Write if not dry-run
                if (!this.dryRun) {
                    fs.writeFileSync(filePath, newContent, 'utf8');
                }
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                error: error.message
            });
            this.log(`❌ Error processing ${filePath}: ${error.message}`, 'red');
        }
    }

    walkDirectory(dir) {
        try {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
                        this.walkDirectory(filePath);
                    }
                } else {
                    this.processFile(filePath);
                }
            }
        } catch (error) {
            this.log(`Error reading directory ${dir}: ${error.message}`, 'red');
        }
    }

    run() {
        this.log(`\n${'='.repeat(70)}`, 'bright');
        this.log(`Sanitize innerHTML Script v2 - ${MODE} MODE`, 'bright');
        this.log(`${'='.repeat(70)}\n`, 'bright');

        const startTime = Date.now();

        // Scan directories
        for (const dir of DIRS_TO_SCAN) {
            const fullPath = path.join(process.cwd(), dir);
            if (fs.existsSync(fullPath)) {
                this.log(`Scanning: ${dir}`, 'dim');
                this.walkDirectory(fullPath);
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Summary
        this.log(`\n${'='.repeat(70)}`, 'bright');
        this.log(`SUMMARY - ${MODE} MODE`, 'bright');
        this.log(`${'='.repeat(70)}`, 'bright');
        this.log(`Files processed:   ${this.filesProcessed}`);
        this.log(`Files modified:    ${this.filesModified}`, this.filesModified > 0 ? 'green' : 'dim');
        this.log(`Total replacements: ${this.totalReplacements}`, this.totalReplacements > 0 ? 'green' : 'dim');
        this.log(`Errors:            ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'dim');
        this.log(`Duration:          ${duration}s`, 'dim');

        if (this.modifications.length > 0) {
            this.log(`\n📋 Files to be modified:`, 'cyan');
            this.modifications.forEach(mod => {
                this.log(`  • ${mod.file.replace(process.cwd(), '.')} (+${mod.replacements})`, 'dim');
            });
        }

        if (this.errors.length > 0) {
            this.log(`\n❌ Errors:`, 'red');
            this.errors.forEach(err => {
                this.log(`  • ${err.file}: ${err.error}`, 'dim');
            });
        }

        if (this.dryRun && this.modifications.length > 0) {
            this.log(`\n💡 Next steps:`, 'yellow');
            this.log(`  1. Review the changes above`, 'dim');
            this.log(`  2. Run with -x flag to apply changes: node scripts/sanitize-innerhtml-v2.cjs -x`, 'dim');
            this.log(`  3. Run tests to verify: npm test`, 'dim');
        }

        if (!this.dryRun && this.modifications.length > 0) {
            this.log(`\n✅ Changes applied successfully!`, 'green');
            this.log(`  Run: npm test`, 'dim');
        }

        this.log(`\n${'='.repeat(70)}\n`, 'bright');

        // Exit code
        if (this.errors.length > 0) {
            process.exit(1);
        }
    }
}

// Execute
const sanitizer = new SanitizeInnerHTML(IS_DRY_RUN);
sanitizer.run();
