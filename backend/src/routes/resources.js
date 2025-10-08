const router = require('express').Router();
const resourceController = require('../controllers/resourceController');

router.get('/', resourceController.listResources);
router.get('/dsa-leaderboard', resourceController.getDsaLeaderboard);

module.exports = router;
