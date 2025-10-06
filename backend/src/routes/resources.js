const router = require('express').Router();
const resourceController = require('../controllers/resourceController');

router.get('/', resourceController.listResources);

module.exports = router;
