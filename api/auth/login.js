// api/auth/login.js - Endpoint serverless independiente para login
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

module.exports = async (req, res) => {
    // Solo POST permitido
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username y password son requeridos'
            });
        }

        // Buscar usuario en la tabla usuarios
        const query = `
            SELECT id, uuid, email, username, password_hash, role, status, nombre, apellido_paterno
            FROM usuarios
            WHERE (username = $1 OR email = $1) AND status = 'activo'
            LIMIT 1
        `;

        const result = await pool.query(query, [username.trim()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const tokenPayload = {
            id: user.id,
            uuid: user.uuid,
            username: user.username,
            email: user.email,
            role: user.role,
            nombre: user.nombre
        };

        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                uuid: user.uuid,
                username: user.username,
                email: user.email,
                role: user.role,
                nombre: user.nombre,
                apellido_paterno: user.apellido_paterno
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: 86400 // 24 horas en segundos
            }
        });

    } catch (error) {
        console.error('[LOGIN] Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};
