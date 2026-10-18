const duplicateRules = require('../config/duplicateRules');
const mongoose = require('mongoose');

function getIssueModel() {
  return mongoose.model('Issue');
}

async function findNearbyDuplicates(location, category, sinceDate) {
  const rules = duplicateRules[category];
  if (!rules) throw new Error(`No duplicate rules for category: ${category}`);

  const Issue = getIssueModel();
  const timeMs = rules.timeWindow || (rules.days * 24 * 60 * 60 * 1000);
  const cutoff = sinceDate || new Date(Date.now() - timeMs);

  return Issue.find({
    location: {
      $nearSphere: {
        $geometry: location,
        $maxDistance: rules.radius
      }
    },
    category,
    status: { $nin: ['Resolved', 'Rejected'] },
    createdAt: { $gte: cutoff }
  }).lean();
}

async function checkForDuplicates(issueData) {
  if (!issueData.location || !issueData.category) return [];
  const rules = duplicateRules[issueData.category];
  if (!rules) return [];
  const timeMs = rules.timeWindow || (rules.days * 24 * 60 * 60 * 1000);
  const sinceDate = new Date(Date.now() - timeMs);
  return findNearbyDuplicates(issueData.location, issueData.category, sinceDate);
}

async function markAsDuplicate(duplicateId, originalId, actorId, remark) {
  const Issue = getIssueModel();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const duplicateIssue = await Issue.findByIdAndUpdate(
      duplicateId,
      {
        status: 'Rejected',
        duplicateOf: originalId,
        $push: {
          statusHistory: {
            status: 'Rejected',
            changedBy: actorId,
            remark: remark || 'Marked as duplicate',
            createdAt: new Date()
          }
        }
      },
      { new: true, session }
    );
    await session.commitTransaction();
    session.endSession();
    return { success: true, duplicateIssue };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Error marking as duplicate: ${error.message}`);
  }
}

async function keepDistinct(issueId, actorId, remark) {
  const Issue = getIssueModel();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const issue = await Issue.findByIdAndUpdate(
      issueId,
      {
        duplicateOf: undefined,
        duplicateCandidate: false,
        $push: {
          statusHistory: {
            status: 'Submitted',
            changedBy: actorId,
            remark: remark || 'Kept distinct from potential duplicate',
            createdAt: new Date()
          }
        }
      },
      { new: true, session }
    );
    await session.commitTransaction();
    session.endSession();
    return { success: true, issue };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(`Error keeping distinct: ${error.message}`);
  }
}

module.exports = {
  findNearbyDuplicates,
  checkForDuplicates,
  markAsDuplicate,
  keepDistinct
};