(function () {
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
      const currentContent = descriptionElement.getAttribute('content');
      if (currentContent && currentContent.includes('{school_name}')) {
        descriptionElement.setAttribute('content', currentContent.replace(/{school_name}/g, tenantConfig.school_name));
      } else if (currentContent && currentContent.includes('Héroes de la Patria')) {
        descriptionElement.setAttribute('content', currentContent.replace(/Héroes de la Patria/g, tenantConfig.school_name));
      } else {
        descriptionElement.setAttribute('content', tenantConfig.school_description);
      }
    }

    // Helper para actualizar meta tags por selector
    const updateMetaTag = (selector, value) => {
      const element = document.querySelector(selector);
      if (element && value) {
        const currentContent = element.getAttribute('content');
        if (currentContent && currentContent.includes('{school_name}')) {
          element.setAttribute('content', currentContent.replace(/{school_name}/g, value));
        } else if (currentContent && currentContent.includes('Héroes de la Patria')) {
          element.setAttribute('content', currentContent.replace(/Héroes de la Patria/g, value));
        }
      }
    };

    // Actualizar meta tags sociales y de autoría
    if (tenantConfig.school_name) {
      updateMetaTag('meta[property="og:title"]', tenantConfig.school_name);
      updateMetaTag('meta[name="twitter:title"]', tenantConfig.school_name);
      updateMetaTag('meta[name="author"]', tenantConfig.school_name);
    }

    if (tenantConfig.school_description) {
      updateMetaTag('meta[property="og:description"]', tenantConfig.school_description);
      updateMetaTag('meta[name="twitter:description"]', tenantConfig.school_description);
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
