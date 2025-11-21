// api/students-auth/check.js - Verificar sesión de estudiante
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

module.exports = (req, res) => {
    try {
        // Buscar token en cookies o headers
        const token = req.cookies?.studentAuthToken
            || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.json({
                success: true,
                isAuthenticated: false
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        res.json({
            success: true,
            isAuthenticated: true,
            student: {
                id: decoded.id,
                name: decoded.name || decoded.nombre,
                email: decoded.email,
                role: decoded.role || 'student'
            }
        });

    } catch (error) {
        // Token inválido o expirado
        res.json({
            success: true,
            isAuthenticated: false,
            error: 'Token inválido o expirado'
        });
    }
};
