const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

// All task routes require authentication and a valid tenant ID
router.use(authMiddleware);
router.use(requireTenant);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);

module.exports = router;
