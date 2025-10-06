const router = require('express').Router();
const batchController = require('../controllers/batchController');
router.get('/', batchController.listBatches);

module.exports = router;
