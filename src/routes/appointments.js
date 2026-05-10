const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gestión de citas médicas
 */

// Crear una nueva cita
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Crear una nueva cita
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Cita creada
 */
router.post('/', appointmentController.createAppointment);

// Obtener todas las citas de un paciente
/**
 * @swagger
 * /api/appointments/patient/{patientId}:
 *   get:
 *     summary: Obtener citas de un paciente
 *     tags: [Appointments]
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
 *         description: Lista de citas
 */
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

// Obtener una cita específica
/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Obtener cita específica
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles de la cita
 */
router.get('/:id', appointmentController.getAppointmentById);

// Actualizar una cita
/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Actualizar cita
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cita actualizada
 */
router.put('/:id', appointmentController.updateAppointment);

// Eliminar una cita
/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Eliminar cita
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cita eliminada
 */
router.delete('/:id', appointmentController.deleteAppointment);

// Actualizar solo el estado de una cita
/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Actualizar estado de cita
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
