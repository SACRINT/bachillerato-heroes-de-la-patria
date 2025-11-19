# 📋 PENDING CSP COMPLIANCE FIXES

## ✅ COMPLETED WORK (3/9 pages)

### JavaScript Files Created (9 total - ALL VALIDATED ✓):
1. ✅ `dark-mode-simple.js` - Simple dark mode toggle (45 lines)
2. ✅ `organigrama-toggle.js` - Organigrama view toggle (39 lines)
3. ✅ `calendario-init.js` - Calendar initialization (55 lines)
4. ✅ `sw-cache-bust.js` - Service worker cache busting (16 lines)
5. ✅ `sw-skip-registration.js` - Service worker skip (19 lines)
6. ✅ `comunidad-photo-gallery.js` - Photo gallery modal (67 lines)
7. ✅ `citas-consulta.js` - Appointment consultation system (149 lines)
8. ✅ `estudiantes-portal.js` - Student portal functions (727 lines)
9. ✅ `calificaciones-grades-system.js` - Grades system (675 lines)

**Total:** 1,792 lines of JavaScript extracted to external files

### HTML Pages Updated (3/9):
1. ✅ `oferta-educativa.html` - Dark mode script → external
2. ✅ `servicios.html` - Dark mode script → external
3. ✅ `padres.html` - Dark mode script → external

### Git Status:
- ✅ Commit created: `c74ee8c`
- ✅ Pushed to: `origin/claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6`

---

## ⏳ PENDING WORK (6/9 pages)

### 1. calendario.html
**Location:** Lines 750-798
**Inline script to replace:**
```javascript
<script>
    let integratedCalendarInstance = null;
    // ... (49 lines)
</script>
```
**Replace with:**
```html
<!-- 📅 Calendario Initialization - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/calendario-init.js?v=2025111801"></script>
```

---

### 2. citas.html
**Location:** Lines 793-934
**Inline script to replace:**
```javascript
<script>
    function consultarCita() {
        // ... (142 lines including consultarCita, showAppointmentDetails, cancelarCita, showAlert)
    }
    // ... more functions
</script>
```
**Replace with:**
```html
<!-- 📅 Appointment Consultation - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/citas-consulta.js?v=2025111801"></script>
```

---

### 3. comunidad.html
**Two inline scripts to replace:**

#### Script 1 (Lines 785-829): Dark Mode
**Replace with:**
```html
<!-- 🌙 Dark Mode - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/dark-mode-comunidad.js?v=2025111801"></script>
```

#### Script 2 (Lines 1203-1268): Photo Gallery
**Replace with:**
```html
<!-- 📸 Photo Gallery - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/comunidad-photo-gallery.js?v=2025111801"></script>
```

**NOTE:** comunidad.html usa dark mode con versión "CORREGIDO V2" (cleanToggleButton)
- Puede necesitar `dark-mode-advanced.js` en lugar de `dark-mode-simple.js`
- O crear `dark-mode-comunidad.js` específico con la función cleanToggleButton

---

### 4. conocenos.html
**Two inline scripts to replace:**

#### Script 1 (Lines 1907-1934): Organigrama Toggle
**Replace with:**
```html
<!-- 👥 Organigrama Toggle - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/organigrama-toggle.js?v=2025111801"></script>
```

#### Script 2 (Lines 2620-2689): Service Worker Skip + Dark Mode
**This script contains TWO functions:**
1. Service Worker Skip (lines 2620-2634)
2. Dark Mode CORREGIDO V2 (lines 2635-2689)

**Replace with:**
```html
<!-- 🔧 Service Worker Skip - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/sw-skip-registration.js?v=2025111801"></script>

<!-- 🌙 Dark Mode - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/dark-mode-advanced.js?v=2025111801"></script>
```

**NOTE:** Necesitas crear `dark-mode-advanced.js` con la función cleanToggleButton (versión V2)

---

### 5. estudiantes.html
**Two inline scripts to replace:**

#### Script 1 (Lines 984-1710): Student Portal Functions
**Massive script with:**
- calculateAverage()
- showTasksModal()
- loadRecursosPWA()
- renderRecursos()
- filterResources()
- loadPersonalSchedule()
- editClass()
- deleteClass()
- contactForRegistration()
- ...and 20+ more functions

**Replace with:**
```html
<!-- 🎓 Student Portal Functions - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/estudiantes-portal.js?v=2025111801"></script>
```

#### Script 2 (Lines 1922-1973): Student Dashboard Auth
**Functions:**
- showStudentLogin()
- hideLoginPrompt()
- showLoginPrompt()
- checkStudentAuthStatus()

**These are ALREADY in estudiantes-portal.js** (lines 713-752), so just remove this duplicate inline script completely.

---

### 6. calificaciones.html
**Three inline scripts to replace:**

#### Script 1 (Lines 686-695): Service Worker Cache Bust
**Replace with:**
```html
<!-- 🔧 Service Worker Cache Bust - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/sw-cache-bust.js?v=2025111801"></script>
```

#### Script 2 (Lines 738-1413): Grades System (MASSIVE)
**Functions:**
- showLoginModal()
- loginStudent()
- loginParent()
- showGradesPanel()
- loadGradesFromAPI()
- populateGradesTable()
- loadSampleGrades()
- showAdvancedGradesSystem()
- logout()
- generatePDF()
- showSubjectDetail()
- generateReport()
- showAttendanceModal()
- showScheduleModal()
- printSchedule()
- ...and more

**Replace with:**
```html
<!-- 📊 Grades System - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/calificaciones-grades-system.js?v=2025111801"></script>
```

#### Script 3 (Lines 1515-1548): Dark Mode
**Replace with:**
```html
<!-- 🌙 Dark Mode - EXTRACTED TO EXTERNAL FILE FOR CSP COMPLIANCE -->
<script src="js/dark-mode-simple.js?v=2025111801"></script>
```

---

## 🔨 ACTION ITEMS

### Step 1: Create Missing File
Create `dark-mode-advanced.js` with cleanToggleButton function (for comunidad.html and conocenos.html):

```javascript
/**
 * 🌙 DARK MODE ADVANCED - BGE HEROES DE LA PATRIA
 * Dark mode toggle con cleanToggleButton (versión V2)
 * Para: comunidad.html, conocenos.html
 */

const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

if (darkModeToggle) {
    // Limpiar cualquier contenido de texto del botón
    const cleanToggleButton = () => {
        const textNodes = [...darkModeToggle.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => node.remove());
    };

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        cleanToggleButton();
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            updateDarkModeIcon(true);
        } else {
            localStorage.setItem('darkMode', 'disabled');
            updateDarkModeIcon(false);
        }
    });

    cleanToggleButton();
}

function updateDarkModeIcon(isDark) {
    if (darkModeToggle) {
        let icon = darkModeToggle.querySelector('i');

        if (!icon) {
            icon = document.createElement('i');
            darkModeToggle.innerHTML = '';
            darkModeToggle.appendChild(icon);
        }

        if (isDark) {
            icon.className = 'fas fa-sun';
            darkModeToggle.setAttribute('aria-label', 'Activar modo claro');
        } else {
            icon.className = 'fas fa-moon';
            darkModeToggle.setAttribute('aria-label', 'Activar modo oscuro');
        }
    }
}
```

### Step 2: Update 6 HTML Files
Manually edit each HTML file listed above to replace inline scripts with external script references.

### Step 3: Validate
```bash
# Validate syntax of new file
node -c public/js/dark-mode-advanced.js

# Check for remaining inline scripts
grep -n "<script>" public/calendario.html
grep -n "<script>" public/citas.html
grep -n "<script>" public/comunidad.html
grep -n "<script>" public/conocenos.html
grep -n "<script>" public/estudiantes.html
grep -n "<script>" public/calificaciones.html
```

### Step 4: Commit & Push
```bash
git add public/js/dark-mode-advanced.js public/calendario.html public/citas.html public/comunidad.html public/conocenos.html public/estudiantes.html public/calificaciones.html
git commit -m "feat(csp): Complete extraction of inline scripts (6 remaining pages)

COMPLETED:
✅ Created dark-mode-advanced.js for V2 dark mode (with cleanToggleButton)
✅ Updated calendario.html - calendario-init.js
✅ Updated citas.html - citas-consulta.js
✅ Updated comunidad.html - dark-mode-advanced.js + comunidad-photo-gallery.js
✅ Updated conocenos.html - organigrama-toggle.js + sw-skip-registration.js + dark-mode-advanced.js
✅ Updated estudiantes.html - estudiantes-portal.js + removed duplicate auth script
✅ Updated calificaciones.html - sw-cache-bust.js + calificaciones-grades-system.js + dark-mode-simple.js

All 9 pages now CSP compliant - zero inline scripts remain
Total JavaScript extracted: ~2,000 lines to 10 external files"

git push -u origin claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6
```

---

## 📊 Summary Statistics

**Before:**
- 9 pages with CSP-violating inline scripts
- ~2,000 lines of inline JavaScript
- CSP errors blocking execution

**After (when complete):**
- 0 pages with inline scripts
- 10 external JavaScript files
- 100% CSP compliance
- All scripts validated with `node -c`

**Files:**
- 9 JS created + 1 JS pending (dark-mode-advanced.js)
- 3 HTML updated + 6 HTML pending
- 2 commits created
- Branch: claude/fix-page-errors-01F8NvJtJRZVyx2c8UAN1YD6

---

## ⚠️ Important Notes

1. **Character Encoding Issues:** Some files have special characters (⚠, ✅) that may not match exactly when using Edit tool. Manual editing may be required.

2. **Dark Mode Variants:** There are TWO versions of dark mode:
   - `dark-mode-simple.js` - Basic version (oferta-educativa, servicios, padres, calificaciones)
   - `dark-mode-advanced.js` - V2 with cleanToggleButton (comunidad, conocenos, estudiantes)

3. **Duplicate Code:** estudiantes.html has duplicate auth functions (lines 1922-1973) that are ALREADY in estudiantes-portal.js. Remove the duplicate completely.

4. **Testing Required:** After updates, test each page in browser to ensure:
   - No console errors
   - Dark mode works
   - All interactive functions work
   - No CSP violations

---

**Date Created:** 18 Nov 2025
**Last Updated:** 18 Nov 2025
**Status:** 3/9 pages completed, 6/9 pending
