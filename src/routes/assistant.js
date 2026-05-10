const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { chat } = require('../controllers/assistantController');

/**
 * @swagger
 * tags:
 *   name: Assistant
 *   description: Asistente virtual AI
 */

/**
 * @swagger
 * /api/assistant/chat:
 *   post:
 *     summary: Enviar mensaje al asistente
 *     tags: [Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Respuesta del asistente
 */
router.post('/chat', authenticateToken, chat);

module.exports = router;
