const express = require('express');
const router = express.Router();
const medicineLogController = require('../controllers/medicineLogController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: MedicineLogs
 *   description: Registro de tomas de medicamentos
 */

// Registrar una toma de medicamento
/**
 * @swagger
 * /api/medicine-logs/log:
 *   post:
 *     summary: Registrar una toma de medicamento
 *     tags: [MedicineLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toma registrada
 */
router.post('/log', medicineLogController.logMedicineTaken);

// Obtener logs de medicamentos de un paciente
/**
 * @swagger
 * /api/medicine-logs/patient/{patientId}:
 *   get:
 *     summary: Obtener logs de medicamentos de un paciente
 *     tags: [MedicineLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de logs
 */
router.get('/patient/:patientId', medicineLogController.getMedicineLogs);

// Obtener estadísticas de hoy
/**
 * @swagger
 * /api/medicine-logs/stats/{patientId}:
 *   get:
 *     summary: Obtener estadísticas de tomas de hoy
 *     tags: [MedicineLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas
 */
router.get('/stats/:patientId', medicineLogController.getTodayStats);

// Verificar si un medicamento fue tomado hoy
/**
 * @swagger
 * /api/medicine-logs/check/{medicineId}/{patientId}:
 *   get:
 *     summary: Verificar si se tomó un medicamento
 *     tags: [MedicineLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de toma
 */
router.get('/check/:medicineId/:patientId', medicineLogController.checkMedicineTakenToday);

module.exports = router;
