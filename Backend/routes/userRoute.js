const express = require('express');
const router = express.Router();
const { registerUser, loginUser, createOfficer, getOfficers } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/officers', verifyToken, authorizeRoles('admin'), createOfficer);
router.get('/officers', verifyToken, authorizeRoles('admin'), getOfficers);

module.exports = router;