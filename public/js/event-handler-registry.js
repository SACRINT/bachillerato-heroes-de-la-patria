
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
    'toggle-chatbot': toggleChatbot,
    'send-message': sendMessage,
    'show-upload-c-v': showUploadCV,
    'generate-report': generateReport,
    'generate-attendance-report': generateAttendanceReport,
    'print-schedule': printSchedule,
    'show-photo-gallery': showPhotoGallery,
    'show-student-login': showStudentLogin,
    'delete-class': deleteClass,
    'contact-for-registration': contactForRegistration,
    'show-info-modal': showInfoModal,
    'show-change-password-modal': showChangePasswordModal,
    'show-statistics-config-modal': showStatisticsConfigModal,
    'login-admin': loginAdmin,
    'logout-admin': logoutAdmin,
    'update-password': updatePassword,
    'refresh-dashboard': refreshDashboard,
    'open-notification-panel': openNotificationPanel,
    'reload-students': reloadStudents,
    'save-statistics-config': saveStatisticsConfig,
    'load-pending-approvals': loadPendingApprovals,
    'create-content': createContent,
    'initiate-google-login': initiateGoogleLogin,
    'initiate-demo-login': initiateDemoLogin,
    'initiate-manual-login': initiateManualLogin,
    'initiate-guest-login': initiateGuestLogin,
    'open-a-i-vault': openAIVault,
    'open-profile': openProfile,
    'open-achievements': openAchievements,
    'google-logout': googleLogout,
    'handle-logout': handleLogout,
    'confirm-activity-registration': confirmActivityRegistration,
    'close-chatbot': closeChatbot,
    'show-grades': showGrades,
    'show-attendance': showAttendance,
    'show-communication': showCommunication,
    'show-schedule': showSchedule,
    'download-report': downloadReport,
    'schedule-appointment': scheduleAppointment,
    'contact-teacher': contactTeacher,
    'parent-logout': parentLogout,
    'load-main-dashboard': loadMainDashboard,
    'handle-student-login': handleStudentLogin,
    'check-connection': checkConnection,
    'logout-admin-panel': logoutAdminPanel,
    'test-auth': testAuth,
    'test-bolsa-trabajo': testBolsaTrabajo,
    'test-students': testStudents,
    'test-parents': testParents,
    'test-b-g-e-framework': testBGEFramework,
    'func-name': funcName
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
          console.warn(`[EVENT-HANDLER] Action '${action}' is not a function`);
        }
      } catch (error) {
        console.error(`[EVENT-HANDLER] Error executing action '${action}':`, error);
      }
    }
  });

  console.log('[EVENT-HANDLER] Delegated event handler initialized');
})();
