const mongoose = require('mongoose');
const Issue = require('../../shared/models/Issue');
const User = require('../../shared/models/User');
const Notification = require('../../shared/models/Notification');
const { changeStatus } = require('../../shared/services/statusWorkflow');

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

const issueQuery = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.search) {
    const search = query.search.trim();
    if (search) {
      filter.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
  }
  return filter;
};

const populateIssues = (query) => query
  .populate('reporter', 'name email')
  .populate('assignedTo', '_id name email')
  .sort({ createdAt: -1 });

const getAdminIssues = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = issueQuery(req.query);
    const [issues, total] = await Promise.all([
      populateIssues(Issue.find(filter).skip((page - 1) * limit).limit(limit)),
      Issue.countDocuments(filter)
    ]);

    res.json({ issues, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const counts = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus = counts.reduce((result, item) => {
      result[item._id] = item.count;
      return result;
    }, {});

    res.json({
      total: counts.reduce((total, item) => total + item.count, 0),
      byStatus
    });
  } catch (err) {
    next(err);
  }
};

const getEligibleOfficers = async (req, res, next) => {
  try {
    const officers = await User.find({ role: 'officer' })
      .select('_id name email phone address')
      .sort({ name: 1 });
    res.json({ officers });
  } catch (err) {
    next(err);
  }
};

const approveAndAssign = async (req, res, next) => {
  try {
    const { officerId, remark } = req.body;
    if (!isValidId(req.params.id) || !isValidId(officerId)) {
      return res.status(400).json({ message: 'Valid issue and officer IDs are required' });
    }

    const [issue, officer] = await Promise.all([
      Issue.findById(req.params.id),
      User.findOne({ _id: officerId, role: 'officer' })
    ]);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (!officer) return res.status(400).json({ message: 'Invalid officer ID' });
    if (!['Submitted', 'Under Review'].includes(issue.status)) {
      return res.status(409).json({ message: `Issue cannot be approved from ${issue.status}` });
    }
    if (!issue.image) {
      return res.status(409).json({ message: 'A complaint photo must be available before approval' });
    }

    issue.assignedTo = officer._id;
    const actor = { _id: req.user.id, id: req.user.id, role: req.user.role };
    const updatedIssue = await changeStatus(
      issue,
      'Assigned',
      actor,
      remark || `Approved and assigned to ${officer.name}`,
      true
    );

    await Notification.create({
      recipient: officer._id,
      sender: req.user.id,
      issue: issue._id,
      type: 'assignment',
      message: remark || `You have been assigned to issue ${issue.trackingId}`
    });

    res.json({ message: 'Issue approved and assigned successfully', issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

const rejectIssue = async (req, res, next) => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid issue ID' });
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (!['Submitted', 'Under Review'].includes(issue.status)) {
      return res.status(409).json({ message: `Issue cannot be rejected from ${issue.status}` });
    }

    issue.rejectionReason = reason;
    const actor = { _id: req.user.id, id: req.user.id, role: req.user.role };
    const updatedIssue = await changeStatus(issue, 'Rejected', actor, reason, true);
    res.json({ message: 'Issue rejected successfully', issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminIssues,
  getAdminStats,
  getEligibleOfficers,
  approveAndAssign,
  rejectIssue
};