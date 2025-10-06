const router = require('express').Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

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

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, upload.single('profilePicture'), userController.updateProfile);
router.get('/', requireAuth, userController.listUsers);

module.exports = router;
