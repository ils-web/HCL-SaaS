const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register); // Optionally, protect this later
router.get('/me', authMiddleware, authController.me);

module.exports = router;
