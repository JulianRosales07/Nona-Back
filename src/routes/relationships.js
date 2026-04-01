const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/relationshipController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Vincular por cédula (para familiares/cuidadores)
router.post('/link-by-cedula', relationshipController.linkByCedula);

// Obtener mis pacientes vinculados
router.get('/my-patients', relationshipController.getMyPatients);

// Obtener mis cuidadores vinculados (para pacientes)
router.get('/my-caregivers', relationshipController.getMyCaregivers);

// Crear una nueva relación
router.post('/', relationshipController.createRelationship);

// Obtener todos los cuidadores/familiares de un adulto mayor
router.get('/elderly/:elderly_id', relationshipController.getElderlyCaregiversAndFamily);

// Obtener todos los adultos mayores asignados a un cuidador/familiar
router.get('/caregiver/:caregiver_id', relationshipController.getCaregiverElderlyPatients);

// Actualizar permisos de una relación
router.patch('/:relationship_id/permissions', relationshipController.updateRelationshipPermissions);

// Cambiar estado de una relación
router.patch('/:relationship_id/status', relationshipController.updateRelationshipStatus);

// Eliminar una relación
router.delete('/:relationship_id', relationshipController.deleteRelationship);

// Verificar permisos
router.get('/check-permission', relationshipController.checkPermission);

module.exports = router;
