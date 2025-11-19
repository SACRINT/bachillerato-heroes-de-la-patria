
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
    'admin-login': handleAdminLogin,
    'logout-admin-panel': logoutAdminPanel
  };

  // Delegated event listener on document
  document.addEventListener('click', function(event) {
    const target = event.target;
    const action = target.getAttribute('data-action');

    if (action && actionMap[action]) {
      try {
        const fn = actionMap[action];

        if (typeof fn === 'function') {
          // Extract parameters from data-* attributes (Pattern B support)
          const params = [];

          // Iterate through all attributes
          for (let attr of target.attributes) {
            if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
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

          // Call function with parameters: first arg is event, then extracted data-* values
          fn.apply(target, [event, ...params]);
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
