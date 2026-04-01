const express = require('express');
const {
    register,
    login,
    requestPasswordReset,
    verifyResetCode,
    resetPassword
} = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;
