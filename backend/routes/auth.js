const express = require('express');
const {
  register,
  login,
  googleSignIn,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/register', authLimiter, upload.single('profile_picture'), register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleSignIn);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, upload.single('profile_picture'), updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/logout', protect, logout);

module.exports = router;

