const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, getMe, savePushToken } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts, please try again later' }
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', verifyToken, getMe);
router.post('/push-token', verifyToken, savePushToken);

module.exports = router;
