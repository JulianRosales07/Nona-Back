const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los medicamentos (para el admin)
router.get('/all', medicineController.getAllMedicines);

// Obtener medicamentos de un paciente
router.get('/patient/:patientId', medicineController.getPatientMedicines);

// Crear medicamento
router.post('/', medicineController.createMedicine);

// Actualizar medicamento
router.put('/:id', medicineController.updateMedicine);

// Eliminar medicamento
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
