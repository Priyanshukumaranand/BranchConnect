const router = require('express').Router();

const healthRoute = require('./health');
const authRoutes = require('./auth');
const batchRoutes = require('./batches');
const societyRoutes = require('./societies');
const resourceRoutes = require('./resources');
const userRoutes = require('./users');
const chatRoutes = require('./chat');
const otpRoutes = require('./otp');

router.use('/', authRoutes);
router.use('/health', healthRoute);
router.use('/batches', batchRoutes);
router.use('/societies', societyRoutes);
router.use('/resources', resourceRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/otp', otpRoutes);
router.use('/generate-otp', otpRoutes);

module.exports = router;
