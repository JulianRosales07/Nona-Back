const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Medicines
 *   description: Gestión de medicamentos
 */

// Buscar medicamentos en la base de datos de medicamentos
/**
 * @swagger
 * /api/medicines/search:
 *   get:
 *     summary: Buscar medicamentos
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search', medicineController.searchDrugDatabase);

// Obtener todos los medicamentos (para el admin)
/**
 * @swagger
 * /api/medicines/all:
 *   get:
 *     summary: Obtener todos los medicamentos
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de medicamentos
 */
router.get('/all', medicineController.getAllMedicines);

// Obtener medicamentos de un paciente
/**
 * @swagger
 * /api/medicines/patient/{patientId}:
 *   get:
 *     summary: Obtener medicamentos de un paciente
 *     tags: [Medicines]
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
 *         description: Lista de medicamentos
 */
router.get('/patient/:patientId', medicineController.getPatientMedicines);

// Crear medicamento
/**
 * @swagger
 * /api/medicines:
 *   post:
 *     summary: Crear medicamento
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Medicamento creado
 */
router.post('/', medicineController.createMedicine);

// Actualizar medicamento
/**
 * @swagger
 * /api/medicines/{id}:
 *   put:
 *     summary: Actualizar medicamento
 *     tags: [Medicines]
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
 *         description: Medicamento actualizado
 */
router.put('/:id', medicineController.updateMedicine);

// Eliminar medicamento
router.delete('/:id', medicineController.deleteMedicine);

// Descargar plantilla
router.get('/template', medicineController.downloadMedicineTemplate);

// Importar desde Excel
router.post('/import', upload.single('file'), medicineController.importMedicinesExcel);

module.exports = router;

