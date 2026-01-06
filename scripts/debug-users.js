const { executeQuery } = require('../backend/config/database');

async function listUsers() {
    try {
        const users = await executeQuery('SELECT id, email, role, password FROM usuarios', []);
        console.table(users);
    } catch (e) {
        console.error(e);
    }
}

listUsers();
