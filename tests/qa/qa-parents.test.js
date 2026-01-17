/**
 * QA Test Suite: Parent Credentials (Integration check)
 * Ubicación: tests/qa/qa-parents.test.js
 */
const mockQuery = jest.fn();

// Importante: Mockear antes de importar
jest.mock('../../backend/config/database', () => ({
    query: mockQuery,
    getPool: () => ({ query: mockQuery })
}));

// Ajustado el path relativo: tests/qa -> ../../backend/data
const DAO_PATH = '../../backend/data/parent-credentials.dao';
let ParentCredentialsDAO;

try {
    const module = require(DAO_PATH);
    ParentCredentialsDAO = module.default || module;
} catch (e) {
    console.error("QA Error: Could not load DAO from " + DAO_PATH, e.message);
}

describe('QA: Parent Credentials Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('DAO Module should load correctly', () => {
        expect(ParentCredentialsDAO).toBeDefined();
    });

    test('DAO should have expected critical methods', () => {
        if (!ParentCredentialsDAO) return;

        console.log('Static props:', Object.getOwnPropertyNames(ParentCredentialsDAO));
        if (ParentCredentialsDAO.prototype) {
            console.log('Prototype props:', Object.getOwnPropertyNames(ParentCredentialsDAO.prototype));
        }

        // Check static first (common in DAOs here)
        const staticMethods = Object.getOwnPropertyNames(ParentCredentialsDAO);
        let hasGenerate = staticMethods.some(m => m.includes('generate'));

        if (!hasGenerate && ParentCredentialsDAO.prototype) {
            const protoMethods = Object.getOwnPropertyNames(ParentCredentialsDAO.prototype);
            hasGenerate = protoMethods.some(m => m.includes('generate'));
        }

        expect(hasGenerate).toBe(true);
    });
});
