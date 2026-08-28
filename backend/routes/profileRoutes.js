const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/authMiddleware');
const controller = require('../controllers/profileController');

const router = express.Router();
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 }, storage: multer.memoryStorage() });
router.use(requireAuth);
router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);
router.post('/resume', upload.single('resume'), controller.uploadResume);
router.get('/resume/download', controller.downloadResume);
router.delete('/resume', controller.removeResume);
router.post('/change-password', controller.changePassword);
router.post('/logout-all', controller.logoutAll);
router.delete('/account', controller.deleteAccount);
module.exports = router;
