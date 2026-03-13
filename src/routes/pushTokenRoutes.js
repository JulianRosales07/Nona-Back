const express = require('express');
const router = express.Router();
const pushTokenController = require('../controllers/pushTokenController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Registrar o actualizar token
router.post('/register', pushTokenController.registerPushToken);

// Desactivar token
router.post('/deactivate', pushTokenController.deactivatePushToken);

// Obtener tokens de un usuario
router.get('/user/:userId', pushTokenController.getUserTokens);

module.exports = router;
