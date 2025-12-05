
/**
 * Delegated Event Handler Registry (Auto-generated from remove-inline-handlers.cjs)
 *
 * Version 2: Supports Patterns A (simple) and B (with parameters)
 *
 * Pattern A: data-action="func-name"
 * Pattern B: data-action="func-name" data-id="123" data-email="test@mail.com"
 *
 * The registry reads all data-* attributes and passes them as arguments
 */
(function initDelegatedEventHandlers() {
  'use strict';

  // Action to function name mapping
  const actionMap = {
    'apply-to-job': applyToJob,
    'remove-from-saved': removeFromSaved,
    'save-job': saveJob,
    'show-subject-detail': showSubjectDetail,
    'cancelar-cita': cancelarCita,
    'show-activity-registration': showActivityRegistration,
    'edit-class': editClass,
    'scroll-to-section': scrollToSection,
    'view-student': viewStudent,
    'edit-student': editStudent,
    'contact-student': contactStudent,
    'view-teacher': viewTeacher,
    'edit-teacher': editTeacher,
    'assign-subjects': assignSubjects,
    'view-newsletter-detail': viewNewsletterDetail,
    'approve-submission': approveSubmission,
    'reject-submission': rejectSubmission,
    'view-full-data': viewFullData,
    'submit-feedback': submitFeedback,
    'edit-noticia': editNoticia,
    'delete-noticia': deleteNoticia,
    'edit-evento': editEvento,
    'delete-evento': deleteEvento,
    'edit-aviso': editAviso,
    'delete-aviso': deleteAviso,
    'edit-comunicado': editComunicado,
    'delete-comunicado': deleteComunicado,
    'generate-student-report': generateStudentReport,
    'edit-content': editContent,
    'delete-content': deleteContent,
    'show-noticia-modal': showNoticiaModal,
    'show-evento-modal': showEventoModal,
    'inscribirse-evento': inscribirseEvento,
    'fill-dev-credentials': fillDevCredentials,
    'submit-activity-registration': submitActivityRegistration,
    'show-ticket-detail': showTicketDetail,
    'handle-add-comment': handleAddComment,
    'handle-assign-ticket': handleAssignTicket,
    'handle-resolve-ticket': handleResolveTicket,
    'handle-close-ticket': handleCloseTicket,
    'handle-reopen-ticket': handleReopenTicket,
    'handle-unwatch-ticket': handleUnwatchTicket,
    'handle-watch-ticket': handleWatchTicket,
    // ✅ FIX (19 Nov 2025): Admin login modal no abría - faltaba mapping
    // ✅ FIX (04 Dic 2025): Fallback directo si handleAdminLogin no está cargado aún
    'admin-login': function (event) {
      if (typeof window.handleAdminLogin === 'function') {
        window.handleAdminLogin();
      } else {
        // Fallback: Mostrar modal directamente si la función no está cargada
        console.warn('[EVENT-HANDLER] handleAdminLogin no disponible, mostrando modal directamente');
        const modalEl = document.getElementById('adminLoginModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        } else {
          // Último recurso: redirigir a página de admin
          window.location.href = '/admin-dashboard.html';
        }
      }
    },
    'logout-admin-panel': function (event) {
      if (typeof window.logoutAdminPanel === 'function') {
        window.logoutAdminPanel();
      } else if (typeof logoutAdminPanel === 'function') {
        logoutAdminPanel();
      } else {
        console.error('[EVENT-HANDLER] logoutAdminPanel no está disponible');
      }
    },

    // ✅ FIX (01 Dic 2025): Chatbot actions - 15+ páginas afectadas
    'toggle-chatbot': function (event) {
      event.preventDefault();
      const chatbotContainer = document.getElementById('chatbotContainer');
      if (chatbotContainer) {
        chatbotContainer.classList.toggle('d-none');
        chatbotContainer.classList.toggle('active');
      }
    },
    'toggleChatbot': function (event) {
      // Alias para compatibilidad con formato toggleChatbot()
      this['toggle-chatbot'](event);
    },
    'send-message': function (event) {
      event.preventDefault();
      if (typeof window.sendChatMessage === 'function') {
        window.sendChatMessage();
      } else if (typeof sendChatMessage === 'function') {
        sendChatMessage();
      } else {
        console.warn('[EVENT-HANDLER] sendChatMessage no disponible');
      }
    },
    'sendMessage': function (event) {
      // Alias para compatibilidad con formato sendMessage()
      this['send-message'](event);
    },

    // ✅ FIX (01 Dic 2025): Comunidad photo gallery
    'show-photo-gallery': function (event) {
      event.preventDefault();
      if (typeof showPhotoGallery === 'function') {
        showPhotoGallery();
      } else {
        console.error('[EVENT-HANDLER] showPhotoGallery no está disponible');
      }
    },

    // ✅ FIX (01 Dic 2025): Estudiantes portal actions
    'showTasksModal': function (event) {
      event.preventDefault();
      if (typeof showTasksModal === 'function') {
        showTasksModal();
      } else {
        console.error('[EVENT-HANDLER] showTasksModal no está disponible');
      }
    },
    'calculateAverage': function (event) {
      event.preventDefault();
      if (typeof calculateAverage === 'function') {
        calculateAverage();
      } else {
        console.error('[EVENT-HANDLER] calculateAverage no está disponible');
      }
    },
    'showActivityRegistration': function (event) {
      event.preventDefault();
      const activity = event.target.getAttribute('data-activity') || event.target.getAttribute('data-param-1');
      if (typeof showActivityRegistration === 'function') {
        showActivityRegistration(activity);
      } else {
        console.error('[EVENT-HANDLER] showActivityRegistration no está disponible');
      }
    },
    'addNewClass': function (event) {
      event.preventDefault();
      if (typeof addNewClass === 'function') {
        addNewClass();
      } else {
        console.error('[EVENT-HANDLER] addNewClass no está disponible');
      }
    },
    'clearSchedule': function (event) {
      event.preventDefault();
      if (typeof clearSchedule === 'function') {
        clearSchedule();
      } else {
        console.error('[EVENT-HANDLER] clearSchedule no está disponible');
      }
    },
    'loadSampleSchedule': function (event) {
      event.preventDefault();
      if (typeof loadSampleSchedule === 'function') {
        loadSampleSchedule();
      } else {
        console.error('[EVENT-HANDLER] loadSampleSchedule no está disponible');
      }
    },
    'exportSchedule': function (event) {
      event.preventDefault();
      if (typeof exportSchedule === 'function') {
        exportSchedule();
      } else {
        console.error('[EVENT-HANDLER] exportSchedule no está disponible');
      }
    },
    'printSchedule': function (event) {
      event.preventDefault();
      if (typeof printSchedule === 'function') {
        printSchedule();
      } else {
        console.error('[EVENT-HANDLER] printSchedule no está disponible');
      }
    },
    'delete-class': function (event) {
      event.preventDefault();
      if (typeof deleteClass === 'function') {
        deleteClass();
      } else {
        console.error('[EVENT-HANDLER] deleteClass no está disponible');
      }
    },
    'contact-for-registration': function (event) {
      event.preventDefault();
      window.location.href = 'contacto.html';
    },

    // ✅ FIX (01 Dic 2025): Conocenos actions
    'agregarVideo': function (event) {
      event.preventDefault();
      if (typeof agregarVideo === 'function') {
        agregarVideo();
      } else {
        console.error('[EVENT-HANDLER] agregarVideo no está disponible');
      }
    },
    'mostrarFormularioVideo': function (event) {
      event.preventDefault();
      if (typeof mostrarFormularioVideo === 'function') {
        mostrarFormularioVideo();
      } else {
        console.error('[EVENT-HANDLER] mostrarFormularioVideo no está disponible');
      }
    },
    'toggleOrganigramaView': function (event) {
      event.preventDefault();
      const viewType = event.target.getAttribute('data-view-type');
      if (typeof toggleOrganigramaView === 'function') {
        toggleOrganigramaView(viewType);
      } else {
        console.error('[EVENT-HANDLER] toggleOrganigramaView no está disponible');
      }
    },
    'cerrarModalVideo': function (event) {
      event.preventDefault();
      const modal = document.querySelector('.modal.show');
      if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    },

    // ✅ FIX (01 Dic 2025): Contacto actions
    'getDirections': function (event) {
      event.preventDefault();
      if (typeof getDirections === 'function') {
        getDirections();
      } else {
        window.open('https://maps.google.com/?q=Bachillerato+Heroes+de+la+Patria', '_blank');
      }
    },
    'shareLocation': function (event) {
      event.preventDefault();
      if (typeof shareLocation === 'function') {
        shareLocation();
      } else {
        console.error('[EVENT-HANDLER] shareLocation no está disponible');
      }
    },
    'openMapModal': function (event) {
      event.preventDefault();
      if (typeof openMapModal === 'function') {
        openMapModal();
      } else {
        console.error('[EVENT-HANDLER] openMapModal no está disponible');
      }
    },

    // ✅ FIX (01 Dic 2025): Pagos actions
    'scrollToSection': function (event) {
      event.preventDefault();
      const targetId = event.target.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    'showLoginModal': function (event) {
      event.preventDefault();
      if (typeof showLoginModal === 'function') {
        showLoginModal();
      } else {
        console.error('[EVENT-HANDLER] showLoginModal no está disponible');
      }
    },
    'showConsultModal': function (event) {
      event.preventDefault();
      if (typeof showConsultModal === 'function') {
        showConsultModal();
      } else {
        console.error('[EVENT-HANDLER] showConsultModal no está disponible');
      }
    },
    'payDebt': function (event, debtIndex) {
      event.preventDefault();
      if (typeof payDebt === 'function') {
        payDebt(debtIndex);
      } else {
        console.error('[EVENT-HANDLER] payDebt no está disponible');
      }
    },

    // ✅ FIX (01 Dic 2025): Gamification actions
    'refresh-wallet': function (event) {
      event.preventDefault();
      if (typeof refreshWallet === 'function') {
        refreshWallet();
      } else if (typeof window.loadWalletBalance === 'function') {
        window.loadWalletBalance();
      } else {
        console.error('[EVENT-HANDLER] refreshWallet/loadWalletBalance no está disponible');
      }
    },
    'show-purchase-modal': function (event) {
      event.preventDefault();
      if (typeof showPurchaseModal === 'function') {
        showPurchaseModal();
      } else {
        console.error('[EVENT-HANDLER] showPurchaseModal no está disponible');
      }
    },
    'load-wallet-balance': function (event) {
      event.preventDefault();
      if (typeof loadWalletBalance === 'function') {
        loadWalletBalance();
      } else {
        console.error('[EVENT-HANDLER] loadWalletBalance no está disponible');
      }
    },

    // ✅ FIX (01 Dic 2025): Offline page
    'check-connection': function (event) {
      event.preventDefault();
      if (navigator.onLine) {
        window.location.reload();
      } else {
        alert('Aún no hay conexión. Por favor intenta de nuevo más tarde.');
      }
    }
  };

  // Delegated event listener on document
  document.addEventListener('click', function (event) {
    // ✅ FIX (01 Dic 2025): Use closest() to find element with data-action
    // This allows clicking on child elements (like icons inside buttons)
    const target = event.target.closest('[data-action]');

    if (!target) return;

    const action = target.getAttribute('data-action');

    if (action && actionMap[action]) {
      try {
        const fn = actionMap[action];

        if (typeof fn === 'function') {
          // Extract parameters from data-* attributes (Pattern B support)
          const params = [];

          // Iterate through all attributes
          for (let attr of target.attributes) {
            if (attr.name.startsWith('data-param-')) {
              let value = attr.value;

              // Try to convert to appropriate type
              if (!isNaN(value) && value !== '') {
                // Numeric parameter
                value = Number(value);
              } else if (value === 'true') {
                // Boolean true
                value = true;
              } else if (value === 'false') {
                // Boolean false
                value = false;
              } else if ((value.startsWith('{') || value.startsWith('[')) && value.length > 0) {
                // Try to parse as JSON
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  // Keep as string if not valid JSON
                }
              }

              params.push(value);
            }
          }

          // ✅ FIX (01 Dic 2025): For modal functions, call with parameters only (no event)
          // For other functions, pass event first
          if (action === 'show-noticia-modal' || action === 'show-evento-modal') {
            // Call modal functions with just the ID parameter
            fn.apply(target, params);
          } else {
            // Call other functions with event first, then extracted data-* values
            fn.apply(target, [event, ...params]);
          }
        } else {
          console.warn(`[EVENT-HANDLER] Action '${action}' is not a function`);
        }
      } catch (error) {
        console.error(`[EVENT-HANDLER] Error executing action '${action}':`, error);
      }
    }
  });

  console.log('[EVENT-HANDLER] Delegated event handler initialized (v2 - Pattern A & B)');
})();
