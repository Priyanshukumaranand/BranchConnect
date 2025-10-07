const router = require('express').Router();
const batchController = require('../controllers/batchController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, batchController.listBatches);

module.exports = router;
