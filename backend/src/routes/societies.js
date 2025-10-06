const router = require('express').Router();
const societyController = require('../controllers/societyController');

router.get('/', societyController.listSocieties);

module.exports = router;
