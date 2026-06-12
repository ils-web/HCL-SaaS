const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

router.use(authMiddleware);
router.use(requireTenant);

// POST /api/upload/presigned-url
router.post('/presigned-url', uploadController.getPresignedUrl);

module.exports = router;
