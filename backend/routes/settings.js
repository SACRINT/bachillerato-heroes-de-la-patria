const express = require('express');
const router = express.Router();

// GET /api/settings
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            theme: 'light',
            notifications: true,
            language: 'es'
        }
    });
});

module.exports = router;
