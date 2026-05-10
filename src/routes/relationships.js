const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/relationshipController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Relationships
 *   description: Vinculación y gestión de pacientes/cuidadores
 */

// Vincular por cédula (para familiares/cuidadores)
/**
 * @swagger
 * /api/relationships/link-by-cedula:
 *   post:
 *     summary: Vincular por cédula
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vinculación exitosa
 */
router.post('/link-by-cedula', relationshipController.linkByCedula);

// Obtener mis pacientes vinculados
/**
 * @swagger
 * /api/relationships/my-patients:
 *   get:
 *     summary: Obtener mis pacientes vinculados
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 */
router.get('/my-patients', relationshipController.getMyPatients);

// Obtener mis cuidadores vinculados (para pacientes)
/**
 * @swagger
 * /api/relationships/my-caregivers:
 *   get:
 *     summary: Obtener mis cuidadores vinculados
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuidadores
 */
router.get('/my-caregivers', relationshipController.getMyCaregivers);

// Crear una nueva relación
/**
 * @swagger
 * /api/relationships:
 *   post:
 *     summary: Crear una nueva relación
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Relación creada
 */
router.post('/', relationshipController.createRelationship);

// Obtener todos los cuidadores/familiares de un adulto mayor
/**
 * @swagger
 * /api/relationships/elderly/{elderly_id}:
 *   get:
 *     summary: Obtener cuidadores de un paciente
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: elderly_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cuidadores
 */
router.get('/elderly/:elderly_id', relationshipController.getElderlyCaregiversAndFamily);

// Obtener todos los adultos mayores asignados a un cuidador/familiar
/**
 * @swagger
 * /api/relationships/caregiver/{caregiver_id}:
 *   get:
 *     summary: Obtener pacientes de un cuidador
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiver_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pacientes
 */
router.get('/caregiver/:caregiver_id', relationshipController.getCaregiverElderlyPatients);

// Actualizar permisos de una relación
/**
 * @swagger
 * /api/relationships/{relationship_id}/permissions:
 *   patch:
 *     summary: Actualizar permisos de una relación
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relationship_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permisos actualizados
 */
router.patch('/:relationship_id/permissions', relationshipController.updateRelationshipPermissions);

// Cambiar estado de una relación
/**
 * @swagger
 * /api/relationships/{relationship_id}/status:
 *   patch:
 *     summary: Cambiar estado de una relación
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relationship_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:relationship_id/status', relationshipController.updateRelationshipStatus);

// Eliminar una relación
/**
 * @swagger
 * /api/relationships/{relationship_id}:
 *   delete:
 *     summary: Eliminar una relación
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: relationship_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relación eliminada
 */
router.delete('/:relationship_id', relationshipController.deleteRelationship);

// Verificar permisos
/**
 * @swagger
 * /api/relationships/check-permission:
 *   get:
 *     summary: Verificar permisos
 *     tags: [Relationships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de permisos
 */
router.get('/check-permission', relationshipController.checkPermission);

module.exports = router;
