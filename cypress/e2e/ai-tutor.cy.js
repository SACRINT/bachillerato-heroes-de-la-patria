describe('AI Tutor E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/'); // Visita la página principal donde el tutor debería estar disponible
        // Asumiendo que el login es necesario para que el AI Tutor funcione
        // Es crucial que el login sea exitoso para estas pruebas
        cy.login('estudiante@example.com', 'password123'); // Usar credenciales de un estudiante de prueba
        cy.wait(2000); // Esperar a que la página cargue y el tutor se inicialice
    });

    it('should display the AI Tutor activation button and open/close the widget', () => {
        // Test Case 1: UI Visibility and Basic Interaction
        cy.get('#ai-tutor-activation').should('be.visible');
        cy.get('#ai-tutor-activation').click();
        cy.get('#ai-tutor-widget').should('be.visible');
        cy.contains('.message.ai-message', '¡Hola! Soy tu tutor de IA. ¿En qué puedo ayudarte hoy?').should('be.visible');
        cy.get('.close-btn').click();
        cy.get('#ai-tutor-widget').should('not.be.visible');
    });

    it('should send a message and receive an AI response', () => {
        // Test Case 2: Send Message and Receive AI Response
        cy.get('#ai-tutor-activation').click();
        cy.get('#tutor-input').type('Hola, necesito ayuda con matemáticas.{enter}');
        cy.contains('.message.user-message', 'Hola, necesito ayuda con matemáticas.').should('be.visible');
        cy.get('.typing-indicator').should('be.visible');
        cy.get('.typing-indicator').should('not.be.visible'); // Espera a que desaparezca
        cy.get('.message.ai-message').should('have.length.gt', 1); // Al menos el mensaje de bienvenida y una respuesta
        cy.get('.message.ai-message').last().should('contain.text', 'matemáticas'); // Asumiendo que la IA responde con algo relevante
    });

    it('should handle quick action buttons', () => {
        // Test Case 3: Quick Actions
        cy.get('#ai-tutor-activation').click();
        cy.get('.quick-action[data-action="science"]').click();
        cy.contains('.message.user-message', 'Tengo una pregunta sobre ciencias').should('be.visible');
        cy.get('.typing-indicator').should('be.visible');
        cy.get('.typing-indicator').should('not.be.visible');
        cy.get('.message.ai-message').should('have.length.gt', 1);
        cy.get('.message.ai-message').last().should('contain.text', 'ciencia'); // Asumiendo respuesta relevante
    });

    // Test Case 4: Session Persistence (Basic) - Requiere un mock de la API para cargar conversaciones pasadas
    // Para una prueba E2E completa, necesitaríamos mockear o interactuar con la API del historial de sesiones.
    // Por ahora, solo verificaremos que la conversación actual persista en el DOM tras cerrar/abrir
    it('should persist conversation history in the widget after closing and re-opening', () => {
        cy.get('#ai-tutor-activation').click();
        cy.get('#tutor-input').type('Prueba de persistencia.{enter}');
        cy.contains('.message.user-message', 'Prueba de persistencia.').should('be.visible');
        cy.get('.typing-indicator').should('not.be.visible');
        cy.get('.message.ai-message').should('have.length.gt', 1);

        cy.get('.close-btn').click();
        cy.get('#ai-tutor-widget').should('not.be.visible');

        cy.get('#ai-tutor-activation').click();
        cy.get('#ai-tutor-widget').should('be.visible');
        cy.contains('.message.user-message', 'Prueba de persistencia.').should('be.visible');
        cy.contains('.message.ai-message', 'Prueba de persistencia.').should('be.visible'); // Asumiendo que la IA ya respondió
    });

    // Añadir más tests para casos específicos:
    // - Errores de API
    // - Mensajes largos
    // - Interacción por voz (si es posible simular)
    // - Comprobar que el historial se guarda en localStorage (si es pertinente)
    // - Verificación de que el currentSessionId se setea correctamente
});
