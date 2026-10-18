const Issue = require('../../shared/models/Issue');
const User = require('../../shared/models/User');
const Notification = require('../../shared/models/Notification');
const { changeStatus } = require('../../shared/services/statusWorkflow');
const { markAsDuplicate, keepDistinct } = require('../../shared/services/duplicates');

const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, location, image } = req.body;

    let geoLocation = location;
    if (location && location.latitude && location.longitude) {
      geoLocation = {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
        address: location.address || ''
      };
    }

    const issue = await Issue.create({
      description: description || title || '',
      category,
      location: geoLocation,
      image,
      reporter: req.user.id,
      reportedBy: req.user.id
    });

    res.status(201).json({ message: 'Issue reported successfully', issue });
  } catch (err) {
    next(err);
  }
};

const getAllIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find()
      .populate('reporter', 'name email')
      .populate('assignedTo', '_id name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ message: 'Issues retrieved', count: issues.length, issues });
  } catch (err) {
    next(err);
  }
};

const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ reporter: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Your issues retrieved', count: issues.length, issues });
  } catch (err) {
    next(err);
  }
};

const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, remark } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const actor = { _id: req.user.id, id: req.user.id, role: req.user.role };
    const updatedIssue = await changeStatus(issue, status, actor, remark || '', true);

    res.status(200).json({ message: 'Issue status updated', issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

const assignIssue = async (req, res, next) => {
  try {
    const { officerId, remark } = req.body;
    if (!officerId) return res.status(400).json({ message: 'officerId is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer') {
      return res.status(400).json({ message: 'Invalid officer ID' });
    }

    issue.assignedTo = officer._id;
    const actor = { _id: req.user.id, id: req.user.id, role: req.user.role };
    const updatedIssue = await changeStatus(issue, 'Assigned', actor, remark || `Assigned to ${officer.name}`, true);

    await Notification.create({
      recipient: officer._id,
      sender: req.user.id,
      issue: issue._id,
      type: 'assignment',
      message: remark || `You have been assigned to issue ${issue.trackingId}`
    });

    const reporterId = issue.reporter ? (issue.reporter._id || issue.reporter).toString() : null;
    if (reporterId && reporterId !== req.user.id) {
      await Notification.create({
        recipient: reporterId,
        sender: req.user.id,
        issue: issue._id,
        type: 'status_update',
        message: remark || `Your issue has been assigned to ${officer.name}`
      });
    }

    res.status(200).json({ message: 'Issue assigned successfully', issue: updatedIssue });
  } catch (err) {
    next(err);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('assignedTo', '_id name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const userId = req.user.id;
    const userRole = req.user.role;
    const reporterId = issue.reporter ? (issue.reporter._id || issue.reporter).toString() : null;
    const assignedId = issue.assignedTo ? (issue.assignedTo._id || issue.assignedTo).toString() : null;

    const isOwner = reporterId === userId;
    const isAssigned = assignedId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ message: 'Issue fetched', issue });
  } catch (err) {
    next(err);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const isOwner = issue.reporter && issue.reporter.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to delete this issue' });
    }

    await issue.deleteOne();
    res.status(200).json({ message: 'Issue deleted', issue });
  } catch (err) {
    next(err);
  }
};

const mergeDuplicate = async (req, res, next) => {
  try {
    const { duplicateOf, remark } = req.body;
    const issueId = req.params.id;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const originalId = duplicateOf || issue.duplicateOf;
    if (!originalId) return res.status(400).json({ message: 'duplicateOf is required' });

    const original = await Issue.findById(originalId);
    if (!original) return res.status(404).json({ message: 'Original issue not found' });

    const result = await markAsDuplicate(issueId, originalId, req.user.id, remark || 'Merged as duplicate');

    if (issue.reporter) {
      await Notification.create({
        recipient: issue.reporter,
        sender: req.user.id,
        issue: issueId,
        type: 'duplicate',
        message: remark || 'Your issue has been merged as a duplicate of another issue'
      });
    }

    res.status(200).json({ message: 'Issue merged as duplicate', issue: result.duplicateIssue });
  } catch (err) {
    next(err);
  }
};

const keepDistinctIssue = async (req, res, next) => {
  try {
    const { remark } = req.body;
    const issueId = req.params.id;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const result = await keepDistinct(issueId, req.user.id, remark || 'Kept as distinct issue');
    res.status(200).json({ message: 'Issue kept distinct', issue: result.issue });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getMyIssues,
  updateIssueStatus,
  assignIssue,
  getIssueById,
  deleteIssue,
  mergeDuplicate,
  keepDistinctIssue
};