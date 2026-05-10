const express = require('express');
const router = express.Router();
const pushTokenController = require('../controllers/pushTokenController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: PushTokens
 *   description: Gestión de notificaciones push
 */

// Registrar o actualizar token
/**
 * @swagger
 * /api/push-tokens/register:
 *   post:
 *     summary: Registrar o actualizar token
 *     tags: [PushTokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token registrado
 */
router.post('/register', pushTokenController.registerPushToken);

// Desactivar token
/**
 * @swagger
 * /api/push-tokens/deactivate:
 *   post:
 *     summary: Desactivar token
 *     tags: [PushTokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token desactivado
 */
router.post('/deactivate', pushTokenController.deactivatePushToken);

// Obtener tokens de un usuario
/**
 * @swagger
 * /api/push-tokens/user/{userId}:
 *   get:
 *     summary: Obtener tokens de un usuario
 *     tags: [PushTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tokens
 */
router.get('/user/:userId', pushTokenController.getUserTokens);

// Enviar notificación de prueba
/**
 * @swagger
 * /api/push-tokens/test:
 *   post:
 *     summary: Enviar notificación de prueba
 *     tags: [PushTokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificación enviada
 */
router.post('/test', pushTokenController.testPushNotification);

module.exports = router;
