const Notification = require('../models/Notification');
const { calculatePriorityForIssue } = require('./priority');

const allowedTransitions = {
  'Submitted': ['Under Review', 'Rejected'],
  'Under Review': ['Assigned', 'Rejected'],
  'Assigned': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': ['In Progress'],
  'Rejected': []
};

async function changeStatus(issue, newStatus, actor, remark, bypass) {
  if (!bypass) {
    const allowed = allowedTransitions[issue.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${issue.status} to ${newStatus}`);
    }

    if (issue.status === 'Resolved' && newStatus === 'In Progress') {
      const actorRole = actor.role;
      const actorId = actor._id ? actor._id.toString() : (actor.id ? actor.id.toString() : '');
      const reporterId = issue.reporter ? (issue.reporter._id || issue.reporter).toString() : '';
      const isCitizenOwner = actorRole === 'citizen' && actorId === reporterId;
      if (!isCitizenOwner) {
        throw new Error('Resolved issues can only be reopened to In Progress by the reporting citizen');
      }
    }
  }

  const oldStatus = issue.status;
  issue.status = newStatus;
  issue.statusHistory.push({
    status: newStatus,
    changedBy: actor._id || actor.id,
    remark: remark || '',
    createdAt: new Date()
  });

  const createdDate = issue.createdAt ? new Date(issue.createdAt) : new Date();
  const now = new Date();
  const daysOpen = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const reportCount = issue.duplicateCandidate ? 1 : 0;
  const { score, level } = calculatePriorityForIssue(issue.category, reportCount, daysOpen);
  issue.priorityScore = score;
  issue.priority = level;

  await issue.save();

  const reporterId = issue.reporter ? (issue.reporter._id || issue.reporter).toString() : null;
  const actorId = actor._id ? actor._id.toString() : (actor.id ? actor.id.toString() : null);
  if (reporterId && reporterId !== actorId) {
    await Notification.create({
      recipient: reporterId,
      sender: actorId,
      issue: issue._id,
      type: 'status_update',
      message: remark || `Your issue status changed from ${oldStatus} to ${newStatus}`
    });
  }

  return issue;
}

module.exports = {
  changeStatus,
  allowedTransitions
};