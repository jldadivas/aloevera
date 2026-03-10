const express = require('express');
const { ask, info } = require('../controllers/chatbotController');
const { chatLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public routes
router.get('/info', info);
router.post('/ask', chatLimiter, ask);

module.exports = router;
