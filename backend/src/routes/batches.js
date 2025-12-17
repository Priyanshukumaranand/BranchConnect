const router = require('express').Router();
const batchController = require('../controllers/batchController');
// Public for now to avoid auth-related fetch loops on batch listing
router.get('/', batchController.listBatches);
router.get('/meta', batchController.listBatchesMeta);

module.exports = router;
