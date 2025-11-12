#!/usr/bin/env node

/**
 * Script de Refactorización: admin-dashboard.html
 * ============================================
 * Convierte 153+ inline event handlers a event listeners
 * Objetivo: Mejorar mantenibilidad, seguridad y accesibilidad
 *
 * Cambios:
 * 1. data-action="func-name" -> data-action="funcName" + event listener
 * 2. onmouseover/onmouseout -> CSS hover states
 * 3. onchange -> event listener delegado
 * 4. onkeyup -> event listener delegado
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../../public/admin-dashboard.html');
let content = fs.readFileSync(htmlPath, 'utf8');
let originalContent = content;
let stats = { replacements: 0, lines: 0 };

console.log('🔧 [REFACTOR] Iniciando refactorización de admin-dashboard.html...\n');

// ==========================================
// PASO 1: Convertir onclick handlers
// ==========================================

const onclickPattern = /onclick="([^"]+)"/g;
const onclickMatches = content.match(onclickPattern) || [];

console.log(`📊 [REFACTOR] Encontrados ${onclickMatches.length} onclick handlers\n`);

// Reemplazar onclick con data-action
content = content.replace(onclickPattern, (match, functionCall) => {
  // Extraer nombre de función
  const funcNameMatch = functionCall.match(/^(\w+)/);
  if (!funcNameMatch) return match;

  const funcName = funcNameMatch[1];
  stats.replacements++;

  console.log(`  ✓ Reemplazando: ${match}`);
  console.log(`    → data-action="${funcName}"`);

  return `data-action="${funcName}"`;
});

// ==========================================
// PASO 2: Remover onmouseover/onmouseout
// ==========================================

console.log(`\n🎨 [REFACTOR] Removiendo onmouseover/onmouseout handlers...\n`);

const hoverPattern = /\s+onmouseover="[^"]*"\s+onmouseout="[^"]*"/g;
const hoverMatches = content.match(hoverPattern) || [];

console.log(`📊 [REFACTOR] Encontrados ${hoverMatches.length} onmouseover/onmouseout pares\n`);

content = content.replace(hoverPattern, '');
stats.replacements += hoverMatches.length;

// ==========================================
// PASO 3: Convertir onchange handlers
// ==========================================

console.log(`📊 [REFACTOR] Encontrando onchange handlers...\n`);

const onchangePattern = /onchange="([^"]+)"/g;
const onchangeMatches = content.match(onchangePattern) || [];

console.log(`📊 [REFACTOR] Encontrados ${onchangeMatches.length} onchange handlers\n`);

content = content.replace(onchangePattern, (match, functionCall) => {
  stats.replacements++;
  console.log(`  ✓ Reemplazando: ${match}`);
  console.log(`    → data-change-handler="${functionCall}"`);
  return `data-change-handler="${functionCall}"`;
});

// ==========================================
// PASO 4: Convertir onkeyup handlers
// ==========================================

console.log(`📊 [REFACTOR] Encontrando onkeyup handlers...\n`);

const onkeyupPattern = /onkeyup="([^"]+)"/g;
const onkeyupMatches = content.match(onkeyupPattern) || [];

console.log(`📊 [REFACTOR] Encontrados ${onkeyupMatches.length} onkeyup handlers\n`);

content = content.replace(onkeyupPattern, (match, functionCall) => {
  stats.replacements++;
  console.log(`  ✓ Reemplazando: ${match}`);
  console.log(`    → data-keyup-handler="${functionCall}"`);
  return `data-keyup-handler="${functionCall}"`;
});

// ==========================================
// PASO 5: Agregar CSS para hover effects
// ==========================================

console.log(`\n🎨 [REFACTOR] Agregando CSS para hover effects...\n`);

const hoverCSS = `
    /* ✨ Hover effects reemplazados de inline handlers */
    [data-action] {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    [data-action]:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    [data-action]:active {
      transform: translateY(-2px);
    }
`;

// Buscar la sección de estilos
const styleEndPattern = /<\/style>\s*<script src="js\/meta-updater\.js"/;
if (styleEndPattern.test(content)) {
  content = content.replace(styleEndPattern, hoverCSS + '    </style>\n    <script src="js/meta-updater.js"');
  console.log('✓ CSS de hover effects agregado\n');
} else {
  console.warn('⚠️ No se pudo insertar CSS - verificar estructura del archivo\n');
}

// ==========================================
// PASO 6: Agregar Event Listeners Script
// ==========================================

console.log(`📝 [REFACTOR] Agregando script de event listeners...\n`);

const eventListenersScript = `
    <!-- 🎯 EVENT LISTENERS - Refactorización de inline handlers -->
    <script>
        (function() {
            'use strict';
            console.log('🎯 [EVENT LISTENERS] Inicializando delegación de eventos...');

            // Mapeo de funciones disponibles globales
            const functionMap = {
                // Navigation
                'scrollToSection': (el) => {
                    const targetId = el.dataset.action.replace('scrollToSection', '');
                    if (window.scrollToSection) {
                        window.scrollToSection(targetId || 'adminPanel');
                    }
                },
                'showInfoModal': (el) => { if (window.showInfoModal) window.showInfoModal(); },

                // Notifications
                'openNotificationPanel': (el) => { if (window.openNotificationPanel) window.openNotificationPanel(); },

                // Metrics & Charts
                'advancedMetricsUpdate': (el) => {
                    if (window.advancedMetrics?.updateRealTimeMetrics) {
                        window.advancedMetrics.updateRealTimeMetrics();
                    }
                },
                'advancedMetricsExport': (el) => {
                    if (window.advancedMetrics?.exportWidget) {
                        window.advancedMetrics.exportWidget('all');
                    }
                },
                'dashboardChartsRefresh': (el) => {
                    if (window.dashboardCharts?.refreshAll) {
                        window.dashboardCharts.refreshAll();
                    }
                },

                // Calendar
                'calendarRefetch': (el) => {
                    if (window.globalEventCalendar?.refetch) {
                        window.globalEventCalendar.refetch();
                    }
                },
                'calendarToday': (el) => {
                    if (window.globalEventCalendar?.goToToday) {
                        window.globalEventCalendar.goToToday();
                    }
                },

                // Authentication
                'loginAdmin': (el) => { if (window.loginAdmin) window.loginAdmin(); },
                'updatePassword': (el) => { if (window.updatePassword) window.updatePassword(); },
                'showChangePasswordModal': (el) => { if (window.showChangePasswordModal) window.showChangePasswordModal(); },
                'refreshDashboard': (el) => { if (window.refreshDashboard) window.refreshDashboard(); },
                'logoutAdmin': (el) => { if (window.logoutAdmin) window.logoutAdmin(); },

                // Statistics
                'saveStatisticsConfig': (el) => { if (window.saveStatisticsConfig) window.saveStatisticsConfig(); },
                'showStatisticsConfigModal': (el) => { if (window.showStatisticsConfigModal) window.showStatisticsConfigModal(); },

                // Students
                'reloadStudents': (el) => { if (window.reloadStudents) window.reloadStudents(); },

                // Teachers
                'reloadTeachers': (el) => { if (window.reloadTeachers) window.reloadTeachers(); },

                // Parents
                'showCreateParentModal': (el) => { if (window.showCreateParentModal) window.showCreateParentModal(); },
                'reloadParents': (el) => { if (window.reloadParents) window.reloadParents(); },
                'clearParentFilters': (el) => { if (window.clearParentFilters) window.clearParentFilters(); },

                // Egresados (Alumni)
                'filterEgresados': (el) => { if (window.filterEgresados) window.filterEgresados(); },
                'exportEgresados': (el) => { if (window.exportEgresados) window.exportEgresados(); },
                'loadEgresados': (el) => { if (window.loadEgresados) window.loadEgresados(); },

                // Bolsa Trabajo (Job Board)
                'filterBolsaTrabajo': (el) => { if (window.filterBolsaTrabajo) window.filterBolsaTrabajo(); },
                'clearFiltersBolsaTrabajo': (el) => { if (window.clearFiltersBolsaTrabajo) window.clearFiltersBolsaTrabajo(); },
                'exportBolsaTrabajoCSV': (el) => { if (window.exportBolsaTrabajoCSV) window.exportBolsaTrabajoCSV(); },
                'loadBolsaTrabajo': (el) => { if (window.loadBolsaTrabajo) window.loadBolsaTrabajo(); },

                // Suscriptores (Subscribers)
                'filterSuscriptores': (el) => { if (window.filterSuscriptores) window.filterSuscriptores(); },
                'clearFiltersSuscriptores': (el) => { if (window.clearFiltersSuscriptores) window.clearFiltersSuscriptores(); },
                'exportSuscriptoresCSV': (el) => { if (window.exportSuscriptoresCSV) window.exportSuscriptoresCSV(); },
                'loadSuscriptores': (el) => { if (window.loadSuscriptores) window.loadSuscriptores(); }
            };

            // Manejo de onclick handlers
            document.addEventListener('click', function(event) {
                const target = event.target.closest('[data-action]');
                if (!target) return;

                const actionName = target.dataset.action;
                console.log('🎯 [EVENT] Click detectado:', actionName);

                // Ejecutar función mapeada o evaluar directamente
                if (functionMap[actionName]) {
                    try {
                        functionMap[actionName](target);
                    } catch (err) {
                        console.error('❌ [EVENT] Error ejecutando acción:', actionName, err);
                    }
                } else {
                    // Fallback: evaluar si existe en window
                    try {
                        eval(actionName + '()');
                    } catch (err) {
                        console.warn('⚠️ [EVENT] Función no encontrada:', actionName);
                    }
                }
            });

            // Manejo de onchange handlers
            document.addEventListener('change', function(event) {
                const target = event.target;
                if (!target.dataset.changeHandler) return;

                const handlerCode = target.dataset.changeHandler;
                console.log('🎯 [EVENT] Change detectado:', handlerCode);

                try {
                    eval(handlerCode);
                } catch (err) {
                    console.error('❌ [EVENT] Error ejecutando handler:', handlerCode, err);
                }
            });

            // Manejo de onkeyup handlers
            document.addEventListener('keyup', function(event) {
                const target = event.target;
                if (!target.dataset.keyupHandler) return;

                const handlerCode = target.dataset.keyupHandler;
                console.log('🎯 [EVENT] Keyup detectado:', handlerCode);

                try {
                    eval(handlerCode);
                } catch (err) {
                    console.error('❌ [EVENT] Error ejecutando handler:', handlerCode, err);
                }
            });

            console.log('✅ [EVENT LISTENERS] Inicialización completada');
        })();
    </script>
`;

// Insertar antes de </body>
content = content.replace('</body>', eventListenersScript + '\n</body>');

// ==========================================
// PASO 7: Guardar archivo
// ==========================================

if (content !== originalContent) {
  fs.writeFileSync(htmlPath, content, 'utf8');
  console.log('✅ [REFACTOR] Archivo guardado exitosamente\n');
} else {
  console.warn('⚠️ [REFACTOR] No se realizaron cambios\n');
}

// ==========================================
// RESUMEN FINAL
// ==========================================

console.log('═════════════════════════════════════════════');
console.log('📊 RESUMEN DE REFACTORIZACIÓN');
console.log('═════════════════════════════════════════════');
console.log(`Reemplazos realizados: ${stats.replacements}`);
console.log(`onclick handlers: ${onclickMatches.length}`);
console.log(`hover handlers: ${hoverMatches.length}`);
console.log(`onchange handlers: ${onchangeMatches.length}`);
console.log(`onkeyup handlers: ${onkeyupMatches.length}`);
console.log('═════════════════════════════════════════════\n');

console.log('✨ [REFACTOR] Refactorización completada exitosamente!');
console.log('📝 Próximos pasos:');
console.log('  1. Revisar cambios en admin-dashboard.html');
console.log('  2. Verificar en navegador que todos los botones funcionan');
console.log('  3. Revisar consola para warnings/errors\n');
