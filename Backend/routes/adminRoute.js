const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const {
  getAdminIssues,
  getAdminStats,
  getEligibleOfficers,
  getAdminUsers,
  updateUserRole,
  approveAndAssign,
  rejectIssue
} = require('../controllers/adminController');

router.use(verifyToken, authorizeRoles('admin'));
router.get('/issues', getAdminIssues);
router.get('/stats', getAdminStats);
router.get('/officers', getEligibleOfficers);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/issues/:id/approve', approveAndAssign);
router.patch('/issues/:id/reject', rejectIssue);

module.exports = router;