// Configuración global para los tests
// Aquí puedes agregar mocks globales o configuración de entorno

// Mock de console.log para evitar ruido en los tests
global.console = {
    ...console,
    // log: jest.fn(), // Descomentar para silenciar logs
    debug: jest.fn(),
    info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};

// Mock de variables de entorno si es necesario
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
