const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');
const {
  createIssue,
  getMyIssues,
  getIssueById,
  getNearbyIssues,
  getAssignedIssues,
  updateProgress,
  confirmIssue
} = require('../controllers/issueController');

router.post('/create', verifyToken, authorizeRoles('citizen'), upload.single('image'), createIssue);
router.get('/myIssues', verifyToken, authorizeRoles('citizen'), getMyIssues);
router.get('/nearby', verifyToken, getNearbyIssues);
router.get('/assigned', verifyToken, authorizeRoles('officer'), getAssignedIssues);
router.get('/getIssue/:id', verifyToken, getIssueById);
router.patch('/progress/:id', verifyToken, authorizeRoles('officer'), upload.single('image'), updateProgress);
router.post('/confirm/:id', verifyToken, authorizeRoles('citizen'), confirmIssue);

module.exports = router;