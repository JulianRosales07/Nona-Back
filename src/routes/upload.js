const express = require('express');
const router = express.Router();
const { uploadProfileImage, deleteProfileImage, uploadMedicineImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Rutas protegidas (requieren autenticación)
/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Subida de archivos e imágenes
 */

/**
 * @swagger
 * /api/upload/profile-image:
 *   post:
 *     summary: Subir imagen de perfil
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 */
router.post('/profile-image', authenticateToken, uploadProfileImage);

/**
 * @swagger
 * /api/upload/profile-image:
 *   delete:
 *     summary: Eliminar imagen de perfil
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imagen eliminada
 */
router.delete('/profile-image', authenticateToken, deleteProfileImage);

/**
 * @swagger
 * /api/upload/medicine-image:
 *   post:
 *     summary: Subir imagen de medicamento
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imagen de medicamento subida
 */
router.post('/medicine-image', authenticateToken, uploadMedicineImage);

module.exports = router;
