const express = require('express');
const router = express.Router();
const { uploadProfileImage, deleteProfileImage, uploadMedicineImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Rutas protegidas (requieren autenticación)
router.post('/profile-image', authenticateToken, uploadProfileImage);
router.delete('/profile-image', authenticateToken, deleteProfileImage);
router.post('/medicine-image', authenticateToken, uploadMedicineImage);

module.exports = router;
