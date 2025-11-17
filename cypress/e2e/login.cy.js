/**
 * 🧪 LOGIN E2E TESTS
 * End-to-end tests para flujo de autenticación
 * Semana 8 - Testing E2E
 */

describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login button', () => {
    cy.contains('Iniciar Sesión').should('be.visible');
  });

  it('should open login modal on click', () => {
    cy.contains('Iniciar Sesión').click();
    cy.get('[data-testid="login-modal"]').should('be.visible');
  });

  it('should login with valid credentials', () => {
    cy.contains('Iniciar Sesión').click();

    cy.get('[data-testid="email"]').type('admin@bge.edu.mx');
    cy.get('[data-testid="password"]').type('admin123');
    cy.get('[data-testid="submit-login"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Bienvenido').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.contains('Iniciar Sesión').click();

    cy.get('[data-testid="email"]').type('wrong@example.com');
    cy.get('[data-testid="password"]').type('wrongpass');
    cy.get('[data-testid="submit-login"]').click();

    cy.contains('Credenciales inválidas').should('be.visible');
  });
});
