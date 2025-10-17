const router = require('express').Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    return cb(null, true);
  }
});


// Rate limiting: e.g. 30 requests per 15 min per IP to the user list endpoint.
const listUsersRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // adjust as appropriate for this endpoint
  message: 'Too many requests for user listing. Please try again later.'
});

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, upload.single('profilePicture'), userController.updateProfile);
router.get('/avatar/by-email', requireAuth, userController.getAvatarByEmail);
router.get('/lookup/email', requireAuth, userController.getByEmail);
router.get('/:userId/avatar', requireAuth, userController.getAvatar);
router.get('/:userId', requireAuth, userController.getById);
router.get('/', requireAuth, listUsersRateLimiter, userController.listUsers);

module.exports = router;
