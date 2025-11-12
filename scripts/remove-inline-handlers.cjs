#!/usr/bin/env node

/**
 * Remove Inline Event Handlers Script v1 - Pattern A: Simple onclick
 *
 * Refactorizes simple onclick handlers (without parameters) by:
 * 1. Replacing onclick="functionName()" with data-action="function-name"
 * 2. Adding delegated event listener code snippet for main.js integration
 * 3. Supports dry-run (default) and execution (-x flag) modes
 *
 * Supported Patterns (Phase 1):
 * - Pattern A: Simple onclick without parameters (onclick="toggleMenu()")
 *
 * TODO (Future Phases):
 * - Pattern B: onclick with parameters
 * - Pattern C: onclick with multiple actions
 * - Pattern D: onclick with conditionals
 * - Pattern E: onchange handlers
 *
 * Usage:
 *   node remove-inline-handlers.cjs          # Dry-run mode
 *   node remove-inline-handlers.cjs -x       # Execute changes
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_DRY_RUN = !process.argv.includes('-x');
const MODE = IS_DRY_RUN ? 'DRY-RUN' : 'EXECUTE';

// Pattern A: Simple onclick without parameters
// Matches: onclick="toggleMenu()" or onclick='toggleMenu()' or onclick=`toggleMenu()`
const PATTERN_A = {
  name: 'onclick simple (Pattern A)',
  pattern: /onclick\s*=\s*['"`](\w+)\(\)['"`]/g,
  isSimple: true,
  handler: (match, functionName) => {
    // Convert camelCase to kebab-case for data attribute
    const actionName = functionName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    return `data-action="${actionName}"`;
  }
};

// File extensions to process
const EXTENSIONS = ['.js', '.html'];

// Directories to scan
const DIRS_TO_SCAN = [
  'public',
  'backend'
];

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.min\.js$/,
  /dead_code_archive/,
  /no_usados/,
  /test\./,
  /\.test\.js$/,
  /\.spec\.js$/,
  /remove-inline-handlers/
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Color output for console
 */
function colorize(text, color) {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
  };
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
  return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Detect pattern in content
 */
function detectPattern(content) {
  if (PATTERN_A.pattern.test(content)) {
    PATTERN_A.pattern.lastIndex = 0; // Reset regex
    return PATTERN_A;
  }
  return null;
}

/**
 * Extract function names from onclick handlers (Pattern A only)
 */
function extractFunctionsFromPattern(content) {
  const functions = new Set();
  const regex = /onclick\s*=\s*['"`](\w+)\(\)['"`]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    functions.add(match[1]);
  }

  return Array.from(functions);
}

// ============================================================================
// EVENT HANDLER REGISTRY GENERATOR
// ============================================================================

/**
 * Generate event handler registry code for main.js integration
 * This code should be added to main.js or event-handler.js
 */
function generateEventHandlerRegistry(allFunctions) {
  const uniqueFunctions = [...new Set(allFunctions)];

  return `
/**
 * Delegated Event Handler Registry (Auto-generated from remove-inline-handlers.cjs)
 *
 * Maps data-action attributes to their corresponding functions.
 * All simple onclick handlers are now handled via this central dispatcher.
 */
(function initDelegatedEventHandlers() {
  'use strict';

  // Action to function name mapping
  const actionMap = {
${uniqueFunctions.map(fn => `    '${camelToKebab(fn)}': ${fn}`).join(',\n')}
  };

  // Delegated event listener on document
  document.addEventListener('click', function(event) {
    const target = event.target;
    const action = target.getAttribute('data-action');

    if (action && actionMap[action]) {
      try {
        const fn = actionMap[action];
        if (typeof fn === 'function') {
          fn.call(target, event);
        } else {
          console.warn(\`[EVENT-HANDLER] Action '\${action}' is not a function\`);
        }
      } catch (error) {
        console.error(\`[EVENT-HANDLER] Error executing action '\${action}':\`, error);
      }
    }
  });

  console.log('[EVENT-HANDLER] Delegated event handler initialized');
})();
`;
}

// ============================================================================
// FILE PROCESSOR
// ============================================================================

class InlineHandlerRemover {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.filesProcessed = 0;
    this.filesModified = 0;
    this.totalReplacements = 0;
    this.errors = [];
    this.modifications = [];
    this.allExtractedFunctions = [];
  }

  log(message, color = 'reset') {
    console.log(colorize(message, color));
  }

  /**
   * Process a single file for Pattern A matches
   */
  processFile(filePath) {
    this.filesProcessed++;

    try {
      // Skip checks
      if (shouldSkipFile(filePath)) {
        return;
      }

      // Check extension
      const ext = path.extname(filePath);
      if (!EXTENSIONS.includes(ext)) {
        return;
      }

      // Read file
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract functions from Pattern A
      const functionsInFile = extractFunctionsFromPattern(content);
      if (functionsInFile.length > 0) {
        this.allExtractedFunctions.push(...functionsInFile);
      }

      // Check if file has Pattern A matches
      if (!PATTERN_A.pattern.test(content)) {
        return;
      }

      // Reset regex
      PATTERN_A.pattern.lastIndex = 0;

      // Apply pattern replacement
      const newContent = content.replace(PATTERN_A.pattern, (match) => {
        // Extract function name from match
        const funcMatch = match.match(/onclick\s*=\s*['"`](\w+)\(\)['"`]/);
        if (funcMatch) {
          const functionName = funcMatch[1];
          const actionName = camelToKebab(functionName);
          return `data-action="${actionName}"`;
        }
        return match;
      });

      if (newContent !== content) {
        const replacementCount = (content.match(PATTERN_A.pattern) || []).length;

        this.filesModified++;
        this.totalReplacements += replacementCount;

        const status = this.dryRun ? '📋' : '✏️';
        this.log(`${status} ${filePath.replace(process.cwd(), '.')} (+${replacementCount})`, 'cyan');

        this.modifications.push({
          file: filePath,
          replacements: replacementCount,
          functions: functionsInFile,
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

  /**
   * Recursively walk directory and process files
   */
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

  /**
   * Generate event handler integration code
   */
  generateIntegrationCode() {
    if (this.allExtractedFunctions.length === 0) {
      return null;
    }

    const uniqueFunctions = [...new Set(this.allExtractedFunctions)];

    return {
      code: generateEventHandlerRegistry(uniqueFunctions),
      functions: uniqueFunctions
    };
  }

  /**
   * Main execution method
   */
  run() {
    this.log(`\n${'='.repeat(80)}`, 'bright');
    this.log(`Remove Inline Event Handlers v1 - ${MODE} MODE (Pattern A: Simple onclick)`, 'bright');
    this.log(`${'='.repeat(80)}\n`, 'bright');

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
    this.log(`\n${'='.repeat(80)}`, 'bright');
    this.log(`SUMMARY - ${MODE} MODE`, 'bright');
    this.log(`${'='.repeat(80)}`, 'bright');
    this.log(`Files processed:   ${this.filesProcessed}`);
    this.log(`Files modified:    ${this.filesModified}`, this.filesModified > 0 ? 'green' : 'dim');
    this.log(`Total replacements: ${this.totalReplacements}`, this.totalReplacements > 0 ? 'green' : 'dim');
    this.log(`Functions detected: ${[...new Set(this.allExtractedFunctions)].length}`);
    this.log(`Errors:            ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'dim');
    this.log(`Duration:          ${duration}s`, 'dim');

    // Modified files list
    if (this.modifications.length > 0) {
      this.log(`\n📋 Files to be modified:`, 'cyan');
      this.modifications.forEach(mod => {
        this.log(`  • ${mod.file.replace(process.cwd(), '.')} (+${mod.replacements})`, 'dim');
      });
    }

    // Generated functions
    if (this.allExtractedFunctions.length > 0) {
      const uniqueFunctions = [...new Set(this.allExtractedFunctions)];
      this.log(`\n🔧 Functions requiring handlers:`, 'blue');
      uniqueFunctions.forEach(fn => {
        this.log(`  • ${fn}() → data-action="${camelToKebab(fn)}"`, 'dim');
      });
    }

    // Errors
    if (this.errors.length > 0) {
      this.log(`\n❌ Errors:`, 'red');
      this.errors.forEach(err => {
        this.log(`  • ${err.file}: ${err.error}`, 'dim');
      });
    }

    // Integration code
    if (!this.dryRun && this.totalReplacements > 0) {
      const integration = this.generateIntegrationCode();
      if (integration) {
        const registryFile = path.join(process.cwd(), 'public', 'js', 'event-handler-registry.js');

        try {
          fs.writeFileSync(registryFile, integration.code, 'utf8');
          this.log(`\n✅ Event handler registry generated:`, 'green');
          this.log(`  • ${registryFile.replace(process.cwd(), '.')}`, 'dim');
          this.log(`  • Functions: ${integration.functions.join(', ')}`, 'dim');
        } catch (error) {
          this.log(`\n⚠️  Could not write registry file: ${error.message}`, 'yellow');
        }
      }
    }

    // Next steps
    if (this.dryRun && this.modifications.length > 0) {
      this.log(`\n💡 Next steps:`, 'yellow');
      this.log(`  1. Review the changes above`, 'dim');
      this.log(`  2. Run with -x flag to apply changes: node scripts/remove-inline-handlers.cjs -x`, 'dim');
      this.log(`  3. Verify main.js includes the event handler registry`, 'dim');
      this.log(`  4. Run tests to verify: npm test`, 'dim');
    }

    if (!this.dryRun && this.modifications.length > 0) {
      this.log(`\n✅ Changes applied successfully!`, 'green');
      this.log(`  • Next: Integrate event handler registry into main.js`, 'dim');
      this.log(`  • Then: Run npm test to validate`, 'dim');
    }

    this.log(`\n${'='.repeat(80)}\n`, 'bright');

    // Exit code
    if (this.errors.length > 0 && this.totalReplacements === 0) {
      process.exit(1);
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const remover = new InlineHandlerRemover(IS_DRY_RUN);
remover.run();
