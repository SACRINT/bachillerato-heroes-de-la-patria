# Remove Inline Event Handlers Script v1 - Architecture & Design

**Date:** November 12, 2025
**Status:** Version 1.0 - Phase A Implementation Ready
**Focus:** Pattern A - Simple onclick handlers (no parameters)

---

## 1. Overview

The `scripts/remove-inline-handlers.cjs` script is designed to refactorize simple event handlers in HTML and JavaScript files by:

1. **Detecting** simple onclick patterns: `onclick="functionName()"`
2. **Replacing** them with data attributes: `data-action="function-name"`
3. **Generating** a centralized event handler registry for delegation
4. **Supporting** dry-run mode (default) and execution mode (-x flag)

### Key Principles

✅ **Modular Design:** One pattern per phase (Pattern A now, B-E later)
✅ **Data Attributes:** Using `data-action` for event delegation
✅ **Centralized Dispatch:** Single event listener on document
✅ **Dry-Run First:** Simulate before executing
✅ **Camel to Kebab:** Convert `toggleMenu` → `toggle-menu`

---

## 2. Architecture

### 2.1 Core Components

```
remove-inline-handlers.cjs
├── CONFIGURATION
│   ├── IS_DRY_RUN (default: true)
│   ├── PATTERN_A (onclick simple regex)
│   ├── EXTENSIONS ['.js', '.html']
│   ├── DIRS_TO_SCAN ['public', 'backend']
│   └── SKIP_PATTERNS [node_modules, .min.js, etc.]
│
├── UTILITY FUNCTIONS
│   ├── colorize(text, color) → Colored console output
│   ├── camelToKebab(str) → toggleMenu → toggle-menu
│   ├── shouldSkipFile(path) → Boolean
│   ├── detectPattern(content) → Pattern object
│   └── extractFunctionsFromPattern(content) → Set<string>
│
├── EVENT HANDLER REGISTRY GENERATOR
│   └── generateEventHandlerRegistry(functions) → JavaScript code
│
├── MAIN PROCESSOR
│   └── InlineHandlerRemover class
│       ├── processFile(path) → Process single file
│       ├── walkDirectory(dir) → Recursive scan
│       ├── generateIntegrationCode() → Registry code
│       └── run() → Main execution
│
└── EXECUTION
    └── new InlineHandlerRemover(IS_DRY_RUN).run()
```

### 2.2 Data Flow

```
START
  ↓
[Parse Arguments] → IS_DRY_RUN = !includes('-x')
  ↓
[Initialize Remover] → New InlineHandlerRemover()
  ↓
[Scan Directories] → Walk public/ + backend/
  ↓
[Process Files] → For each .js/.html file
  │
  ├─→ Check skip patterns (node_modules, .min.js, etc.)
  ├─→ Read file content
  ├─→ Detect Pattern A matches: onclick="funcName()"
  ├─→ Extract function names
  ├─→ Replace onclick with data-action="func-name"
  ├─→ Track modifications & functions
  │
  └─→ [If Execute Mode (-x)]
       ├─→ Write modified file
       └─→ Generate event-handler-registry.js
  ↓
[Summary Report]
  ├─→ Files processed
  ├─→ Files modified
  ├─→ Total replacements
  ├─→ Functions detected
  └─→ Errors (if any)
  ↓
[Next Steps]
  ├─→ [Dry-Run] Show changes and suggest -x flag
  ├─→ [Execute] Show registry file generated
  └─→ Show commands for next phase
  ↓
END
```

---

## 3. Pattern A: Simple onclick (No Parameters)

### 3.1 Regex Pattern

```javascript
/onclick\s*=\s*['"`](\w+)\(\)['"`]/g
```

**Breakdown:**
- `onclick` - Literal keyword
- `\s*=\s*` - Optional whitespace around equals
- `['"\`]` - Any quote type (single, double, backtick)
- `(\w+)` - Capture group: function name (word characters only)
- `\(\)` - Literal parentheses with no content
- `['"\`]` - Closing quote must match

**Matches:**
- ✅ `onclick="toggleMenu()"`
- ✅ `onclick='toggleMenu()'`
- ✅ `onclick=\`toggleMenu()\``
- ✅ `onclick = "toggleMenu()"` (extra spaces)

**Does NOT Match:**
- ❌ `onclick="deleteItem(123)"` (has parameters)
- ❌ `onclick="save(); closeModal();"` (multiple functions)
- ❌ `onclick="if(x) doA();"` (conditional)
- ❌ `onchange="filterDept(this.value)"` (different event)

### 3.2 Transformation Examples

```javascript
// BEFORE
<button onclick="toggleMenu()">Menu</button>
<button onclick='showModal()'>Open</button>

// AFTER
<button data-action="toggle-menu">Menu</button>
<button data-action="show-modal">Open</button>
```

### 3.3 Function Name Conversion

```javascript
toggleMenu()     → toggle-menu
showModal()      → show-modal
deleteItem()     → delete-item
sendMessage()    → send-message
openChatbot()    → open-chatbot
```

**Logic:**
1. Insert hyphen before uppercase letters: `toggleMenu` → `toggle-Menu`
2. Convert to lowercase: `toggle-Menu` → `toggle-menu`
3. Remove leading hyphen if present

---

## 4. Event Handler Registry Generation

### 4.1 Auto-Generated Code Structure

When `-x` flag is used and replacements are made, the script generates:
`public/js/event-handler-registry.js`

```javascript
/**
 * Delegated Event Handler Registry
 * Auto-generated from remove-inline-handlers.cjs
 * Maps data-action attributes to their corresponding functions
 */
(function initDelegatedEventHandlers() {
  'use strict';

  const actionMap = {
    'toggle-menu': toggleMenu,
    'show-modal': showModal,
    'delete-item': deleteItem,
    'send-message': sendMessage,
    // ... more functions
  };

  // Single delegated listener on document
  document.addEventListener('click', function(event) {
    const target = event.target;
    const action = target.getAttribute('data-action');

    if (action && actionMap[action]) {
      try {
        const fn = actionMap[action];
        if (typeof fn === 'function') {
          fn.call(target, event);
        } else {
          console.warn(`[EVENT-HANDLER] Action '${action}' is not a function`);
        }
      } catch (error) {
        console.error(`[EVENT-HANDLER] Error executing action '${action}':`, error);
      }
    }
  });

  console.log('[EVENT-HANDLER] Delegated event handler initialized');
})();
```

### 4.2 Key Features

✅ **IIFE Encapsulation:** Prevents global scope pollution
✅ **Strict Mode:** `'use strict'` for safety
✅ **Error Handling:** Try-catch with logging
✅ **Type Checking:** Validates function exists before calling
✅ **Event Context:** Calls function with `this = target element`
✅ **Delegated Pattern:** Single listener on document (efficient)

### 4.3 Integration into main.js

After running with `-x`, you must add to `main.js`:

```javascript
// Load event handler registry (delegated events)
const registryScript = document.createElement('script');
registryScript.src = 'js/event-handler-registry.js';
document.head.appendChild(registryScript);
```

Or include directly in HTML:
```html
<script src="js/event-handler-registry.js"></script>
```

---

## 5. InlineHandlerRemover Class

### 5.1 Properties

```javascript
InlineHandlerRemover {
  dryRun: boolean              // true = simulate, false = execute
  filesProcessed: number       // Total files checked
  filesModified: number        // Files with changes
  totalReplacements: number    // Total onclick replacements
  errors: Array<{file, error}> // Processing errors
  modifications: Array<{...}>  // Files modified with details
  allExtractedFunctions: Set   // All unique functions found
}
```

### 5.2 Key Methods

#### `processFile(filePath): void`
**Purpose:** Process a single file for Pattern A matches
**Steps:**
1. Increment `filesProcessed`
2. Check skip patterns
3. Check extension
4. Read file content
5. Extract functions from file
6. Test Pattern A regex
7. Replace all matches
8. Track modifications
9. Write if not dry-run

#### `walkDirectory(dir): void`
**Purpose:** Recursively scan directory tree
**Features:**
- Skips node_modules and .git directories
- Processes files and subdirectories
- Error handling per directory

#### `generateIntegrationCode(): Object`
**Purpose:** Create event handler registry code
**Returns:**
```javascript
{
  code: "IIFE code string",
  functions: ["toggleMenu", "showModal", ...]
}
```

#### `run(): void`
**Purpose:** Main execution flow
**Output:**
- Colored console output
- Summary statistics
- File list (if changes)
- Function list
- Error list (if any)
- Next steps guidance

---

## 6. Execution Modes

### 6.1 Dry-Run Mode (Default)

```bash
node scripts/remove-inline-handlers.cjs
```

**Output:**
- 📋 Symbol indicates files will change
- No actual file modifications
- Shows summary and next steps
- Suggests running with `-x` flag

**Use Case:** Preview all changes before applying

### 6.2 Execute Mode

```bash
node scripts/remove-inline-handlers.cjs -x
```

**Output:**
- ✏️ Symbol indicates files were changed
- Actual file modifications applied
- Generates `event-handler-registry.js`
- Shows integration instructions

**Use Case:** Apply changes after dry-run verification

---

## 7. Output Examples

### 7.1 Dry-Run Output

```
════════════════════════════════════════════════════════════════════════════
Remove Inline Event Handlers v1 - DRY-RUN MODE (Pattern A: Simple onclick)
════════════════════════════════════════════════════════════════════════════

Scanning: public
Scanning: backend

════════════════════════════════════════════════════════════════════════════
SUMMARY - DRY-RUN MODE
════════════════════════════════════════════════════════════════════════════
Files processed:   1432
Files modified:    47
Total replacements: 156
Functions detected: 38
Errors:            0
Duration:          1.23s

📋 Files to be modified:
  • public/js/dashboard-manager-2025.js (+5)
  • public/js/google-auth-integration.js (+4)
  • public/js/egresados-dashboard.js (+3)
  ... (44 more files)

🔧 Functions requiring handlers:
  • toggleMenu() → data-action="toggle-menu"
  • showModal() → data-action="show-modal"
  • deleteItem() → data-action="delete-item"
  ... (35 more functions)

💡 Next steps:
  1. Review the changes above
  2. Run with -x flag to apply changes: node scripts/remove-inline-handlers.cjs -x
  3. Verify main.js includes the event handler registry
  4. Run tests to verify: npm test

════════════════════════════════════════════════════════════════════════════
```

---

## 8. Limitations & Future Enhancements

### Current Limitations (Pattern A Only)

❌ **Pattern B:** Parameters - `onclick="deleteItem(123)"`
❌ **Pattern C:** Multiple actions - `onclick="save(); close();"`
❌ **Pattern D:** Conditionals - `onclick="if(x) doA();"`
❌ **Pattern E:** onchange - `onchange="filter(this.value)"`

### Phase 2 Enhancements (Planned)

- **Pattern B Handler:** Extract parameters to data-* attributes
- **Pattern C Handler:** Create wrapper functions for sequences
- **Pattern D Handler:** Refactor to dedicated functions
- **Pattern E Handler:** Handle form change events
- **Configuration File:** Support custom function mapping
- **Auto-Loading:** Detect and load event-handler-registry.js automatically

---

## 9. Error Handling

### Error Scenarios

1. **File Read Error**
   - Logged to errors array
   - Message shown in console
   - Processing continues with next file

2. **Invalid Regex Match**
   - Skipped (should not occur with valid regex)
   - Reported in summary

3. **Write Permission Error**
   - Caught during `-x` mode
   - Error logged
   - File skipped, processing continues

4. **Registry Generation Error**
   - Caught separately
   - Shows warning about registry file
   - Main replacements still applied

### Exit Codes

- `0` - Success (no errors)
- `1` - Errors detected and replacements were 0
- `0` - Errors detected but replacements > 0 (partial success)

---

## 10. Testing the Script

### Test Case 1: Dry-Run Detection

```bash
cd C:\03_BachilleratoHeroesWeb
node scripts/remove-inline-handlers.cjs

# Expected: Files to modify shown, no changes made
# Verify: No files actually changed
```

### Test Case 2: Execute with -x

```bash
node scripts/remove-inline-handlers.cjs -x

# Expected: Files modified, event-handler-registry.js created
# Verify: Check modifications in git diff
# Verify: event-handler-registry.js exists and has correct code
```

### Test Case 3: Verify Syntax

```bash
npm test

# Expected: Same test results as before (no new failures)
# Verify: All files still valid JavaScript
```

---

## 11. Configuration Reference

### Pattern A Regex

```javascript
/onclick\s*=\s*['"`](\w+)\(\)['"`]/g
```

### Directories Scanned

```javascript
['public', 'backend']
```

### File Extensions

```javascript
['.js', '.html']
```

### Skip Patterns

```javascript
[
  /node_modules/,
  /\.min\.js$/,
  /dead_code_archive/,
  /no_usados/,
  /test\./,
  /\.test\.js$/,
  /\.spec\.js$/,
  /remove-inline-handlers/
]
```

---

## 12. Next Steps After Execution

1. ✅ Run `node scripts/remove-inline-handlers.cjs` (dry-run)
2. ✅ Review changes
3. ✅ Run `node scripts/remove-inline-handlers.cjs -x` (execute)
4. ✅ Integrate `event-handler-registry.js` into `main.js`
5. ✅ Run `npm test` to validate
6. ✅ Commit changes atomically

---

**Status:** Ready for Phase 3 (Dry-Run Simulation)
**Created:** November 12, 2025
**Version:** 1.0
