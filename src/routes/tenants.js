const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Note: In a real system, these routes would be protected by a requireSuperAdmin middleware
// router.use(authMiddleware);

router.post('/', tenantController.createTenant);
router.get('/', tenantController.getTenants);

module.exports = router;
