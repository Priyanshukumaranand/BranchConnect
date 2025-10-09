const router = require('express').Router();
const { getRedisHealth } = require('../config/redis');

router.get('/', (req, res) => {
  const redis = getRedisHealth();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis
    }
  });
});

module.exports = router;
