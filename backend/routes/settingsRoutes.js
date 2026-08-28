const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const controller = require('../controllers/settingsController');
const router = express.Router();
router.use(requireAuth);
router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);
router.get('/download-data', controller.downloadData);
module.exports = router;
