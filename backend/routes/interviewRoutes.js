const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/interviewController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/analyze-answer', requireAuth, ctrl.analyzeAnswer);
router.post('/generate-report', requireAuth, ctrl.generateReport);

module.exports = router;
