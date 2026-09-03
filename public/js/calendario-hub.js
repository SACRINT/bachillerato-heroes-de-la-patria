/**
 * HUB 6 - Calendario Hub: Tab switching, event handlers, quick actions
 * CSP Compliant - ALL external, NO inline scripts
 * Mobile-First with 48px touch targets
 */
(function () {
    'use strict';

    // ============================================
    // TAB HASH ACTIVATION
    // ============================================
    function activateTabFromHash() {
        var hash = window.location.hash;
        if (!hash) return;

        var tabMap = {
            '#calendario': '#tab-calendario',
            '#convocatorias': '#tab-convocatorias',
            '#eventos': '#tab-eventos',
            '#ciclo-escolar': '#tab-calendario',
            '#periodos-academicos': '#tab-calendario',
            '#tipos-eventos': '#tab-eventos',
            '#inscripciones-2025': '#tab-convocatorias',
            '#convocatorias-activas': '#tab-convocatorias',
            '#proximas-convocatorias': '#tab-convocatorias',
            '#notificaciones': '#tab-convocatorias'
        };

        var tabId = tabMap[hash];
        if (!tabId) return;

        var tabEl = document.querySelector(tabId);
        if (tabEl) {
            var bsTab = bootstrap.Tab.getOrCreateInstance(tabEl);
            bsTab.show();
        }
    }

    // ============================================
    // QUICK ACTION HANDLERS (data-action)
    // ============================================
    function handleQuickAction(action) {
        switch (action) {
            case 'downloadCalendar':
                downloadCalendar();
                break;
            case 'exportToGoogle':
                exportToGoogle();
                break;
            case 'shareCalendar':
                shareCalendar();
                break;
            case 'setReminders':
                openReminderModal();
                break;
            case 'addToPersonalCalendar':
                addToPersonalCalendar();
                break;
            case 'saveReminders':
                saveReminders();
                break;
            default:
                console.log('[CAL-HUB] Acción no reconocida:', action);
        }
    }

    function downloadCalendar() {
        if (typeof window.sanitizeHTML === 'function') {
            alert(window.sanitizeHTML('Función de descarga disponible próximamente.'));
        } else {
            alert('Función de descarga disponible próximamente.');
        }
    }

    function exportToGoogle() {
        var eventUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
            encodeURIComponent('Calendario Escolar BGE') +
            '&details=' + encodeURIComponent('Consulta el calendario escolar interactivo');
        window.open(eventUrl, '_blank', 'noopener');
    }

    function shareCalendar() {
        if (navigator.share) {
            navigator.share({
                title: 'Calendario Escolar',
                text: 'Consulta el calendario escolar interactivo del bachillerato',
                url: window.location.href
            }).catch(function () { });
        } else {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).then(function () {
                    alert('Enlace copiado al portapapeles');
                });
            }
        }
    }

    function openReminderModal() {
        var modal = document.getElementById('reminderModal');
        if (modal) {
            var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
        }
    }

    function addToPersonalCalendar() {
        var modal = document.getElementById('eventModal');
        if (modal) {
            var bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        alert('Selecciona un evento del calendario para añadirlo a tu agenda personal.');
    }

    function saveReminders() {
        var reminders = {
            evaluations: document.getElementById('remindEvaluations')?.checked || false,
            holidays: document.getElementById('remindHolidays')?.checked || false,
            events: document.getElementById('remindEvents')?.checked || false,
            civic: document.getElementById('remindCivic')?.checked || false,
            anticipation: parseInt(document.getElementById('reminderTime')?.value || '3')
        };

        try {
            localStorage.setItem('calendar_reminders', JSON.stringify(reminders));
            alert('Recordatorios guardados correctamente.');
        } catch (e) {
            console.error('[CAL-HUB] Error guardando recordatorios:', e);
        }

        var modal = document.getElementById('reminderModal');
        if (modal) {
            var bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
    }

    // ============================================
    // EVENT DELEGATION
    // ============================================
    function setupEventDelegation() {
        document.addEventListener('click', function (e) {
            var actionEl = e.target.closest('[data-action]');
            if (actionEl) {
                var action = actionEl.getAttribute('data-action');
                if (action) {
                    e.preventDefault();
                    handleQuickAction(action);
                }
            }
        });
    }

    // ============================================
    // HASH CHANGE LISTENER
    // ============================================
    function setupHashListener() {
        window.addEventListener('hashchange', function () {
            activateTabFromHash();
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        setupEventDelegation();
        setupHashListener();
        activateTabFromHash();

        console.log('[CAL-HUB] Calendario Hub initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
