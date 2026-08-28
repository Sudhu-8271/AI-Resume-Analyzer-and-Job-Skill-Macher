const express = require('express');

const router = express.Router();

const auth =
  require('../controllers/authController');


// ============================================================
// AUTH ROUTES
// ============================================================

router.post(
  '/signup',
  auth.signup
);

router.post(
  '/login',
  auth.login
);


// ============================================================
// FORGOT PASSWORD
// ============================================================

router.post(
  '/forgot-password',
  auth.forgotPassword
);

router.post(
  '/verify-reset-otp',
  auth.verifyResetOtp
);

router.post(
  '/reset-password',
  auth.resetPassword
);


// ============================================================
// NORMAL OTP
// ============================================================

router.post(
  '/request-otp',
  auth.requestOtp
);

router.post(
  '/verify-otp',
  auth.verifyOtp
);


// ============================================================
// GOOGLE
// ============================================================

router.post(
  '/google',
  auth.google
);


// ============================================================
// CONFIG
// ============================================================

router.get(
  '/config',
  auth.config
);


// ============================================================
// SESSION
// ============================================================

router.post(
  '/refresh',
  auth.refresh
);

router.post(
  '/logout',
  auth.logout
);

router.get(
  '/me',
  auth.me
);


module.exports = router;