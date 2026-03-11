const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear una nueva cita
router.post('/', appointmentController.createAppointment);

// Obtener todas las citas de un paciente
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

// Obtener una cita específica
router.get('/:id', appointmentController.getAppointmentById);

// Actualizar una cita
router.put('/:id', appointmentController.updateAppointment);

// Eliminar una cita
router.delete('/:id', appointmentController.deleteAppointment);

// Actualizar solo el estado de una cita
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
