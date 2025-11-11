(function() {
  'use strict';

  function updateMetadata(tenantConfig) {
    if (!tenantConfig) return;

    const titleElement = document.getElementById('page-title');
    const descriptionElement = document.getElementById('page-description');

    // Actualizar el título de la página
    if (titleElement && tenantConfig.school_name) {
      // Construye un título base si no existe uno específico para la página
      const baseTitle = titleElement.dataset.baseTitle || '';
      titleElement.textContent = baseTitle ? `${baseTitle} | ${tenantConfig.school_name}` : tenantConfig.school_name;
    }

    // Actualizar la meta descripción
    if (descriptionElement && tenantConfig.school_description) {
      descriptionElement.setAttribute('content', tenantConfig.school_description);
    }
  }

  // Escuchar el evento personalizado que se dispara cuando la configuración del tenant está lista
  document.addEventListener('tenantConfigLoaded', (e) => {
    updateMetadata(e.detail);
  });

  // Fallback por si el script carga después del evento
  if (window.TENANT_CONFIG) {
    updateMetadata(window.TENANT_CONFIG);
  }

})();
