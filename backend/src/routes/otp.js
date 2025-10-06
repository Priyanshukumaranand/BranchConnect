const router = require('express').Router();
const otpController = require('../controllers/otpController');

router.post('/', otpController.generateOtp);

module.exports = router;
