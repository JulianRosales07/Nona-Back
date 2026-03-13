const express = require('express');
const router = express.Router();
const medicineLogController = require('../controllers/medicineLogController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Registrar una toma de medicamento
router.post('/log', medicineLogController.logMedicineTaken);

// Obtener logs de medicamentos de un paciente
router.get('/patient/:patientId', medicineLogController.getMedicineLogs);

// Obtener estadísticas de hoy
router.get('/stats/:patientId', medicineLogController.getTodayStats);

// Verificar si un medicamento fue tomado hoy
router.get('/check/:medicineId/:patientId', medicineLogController.checkMedicineTakenToday);

module.exports = router;
