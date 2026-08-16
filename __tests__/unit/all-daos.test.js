/**
 * 🧪 Test Suite for All DAOs in backend/data/
 * Verifies that all 75+ DAOs load properly, export classes/functions, and have valid static interface methods.
 */

const fs = require('fs');
const path = require('path');

const DAO_DIR = path.resolve(__dirname, '../../backend/data');

describe('Data Access Objects (DAO) Architecture Suite', () => {
    const daoFiles = fs.readdirSync(DAO_DIR).filter(f => f.endsWith('.dao.js'));

    test(`Loads and verifies all ${daoFiles.length} DAOs`, () => {
        expect(daoFiles.length).toBeGreaterThanOrEqual(44);
    });

    daoFiles.forEach(file => {
        const daoName = file.replace('.js', '');

        describe(`DAO: ${daoName}`, () => {
            let dao;

            beforeAll(() => {
                const filePath = path.join(DAO_DIR, file);
                dao = require(filePath);
                if (dao.default) dao = dao.default;
            });

            test('should export a class, object, or function', () => {
                expect(dao).toBeDefined();
                expect(typeof dao === 'function' || typeof dao === 'object').toBe(true);
            });

            test('should have defined methods or prototype', () => {
                let methods = [];
                if (typeof dao === 'function') {
                    const staticMethods = Object.getOwnPropertyNames(dao).filter(m => typeof dao[m] === 'function');
                    const protoMethods = dao.prototype ? Object.getOwnPropertyNames(dao.prototype).filter(m => typeof dao.prototype[m] === 'function' && m !== 'constructor') : [];
                    methods = [...staticMethods, ...protoMethods];
                } else if (typeof dao === 'object' && dao !== null) {
                    const ownMethods = Object.keys(dao).filter(m => typeof dao[m] === 'function');
                    const protoMethods = Object.getPrototypeOf(dao) 
                        ? Object.getOwnPropertyNames(Object.getPrototypeOf(dao)).filter(m => typeof dao[m] === 'function' && m !== 'constructor') 
                        : [];
                    methods = [...ownMethods, ...protoMethods];
                }
                expect(methods.length).toBeGreaterThan(0);
            });
        });
    });
});
