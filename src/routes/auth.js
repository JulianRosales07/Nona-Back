const express = require('express');
const {
    register,
    login,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    getProfile,
    updateProfile,
    updateProfile,
    getAllUsers,
    adminUpdateUser
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/all', authenticateToken, getAllUsers);
router.put('/admin/user/:id', authenticateToken, adminUpdateUser);

module.exports = router;
