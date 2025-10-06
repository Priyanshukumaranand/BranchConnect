const router = require('express').Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

router.post('/forgetPassword', passwordController.forgotPassword);
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);

router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleAuthCallback);
router.get('/Auth/google', authController.googleAuth);
router.get('/Auth/google/home', authController.googleAuthCallback);

module.exports = router;
