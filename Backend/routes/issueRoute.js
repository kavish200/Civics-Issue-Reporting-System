const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const {
  createIssue, getAllIssues, getMyIssues, updateIssueStatus, assignIssue,
  getIssueById, deleteIssue, mergeDuplicate, keepDistinctIssue
} = require('../controllers/issueController');

router.post('/create', verifyToken, authorizeRoles('citizen'), createIssue);
router.get('/getAll', verifyToken, authorizeRoles('admin'), getAllIssues);
router.get('/myIssues', verifyToken, authorizeRoles('citizen'), getMyIssues);
router.put('/updateStatus/:id', verifyToken, authorizeRoles('admin'), updateIssueStatus);
router.patch('/assign/:id', verifyToken, authorizeRoles('admin'), assignIssue);
router.patch('/merge/:id', verifyToken, authorizeRoles('admin'), mergeDuplicate);
router.patch('/keep-distinct/:id', verifyToken, authorizeRoles('admin'), keepDistinctIssue);
router.get('/getIssue/:id', verifyToken, getIssueById);
router.delete('/delete/:id', verifyToken, deleteIssue);

module.exports = router;