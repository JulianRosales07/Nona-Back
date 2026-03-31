const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { chat } = require('../controllers/assistantController');

router.post('/chat', authenticateToken, chat);

module.exports = router;
