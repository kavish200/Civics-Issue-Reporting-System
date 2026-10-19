const Issue = require('../../shared/models/Issue');
const User = require('../../shared/models/User');
const { checkForDuplicates } = require('../../shared/services/duplicates');
const { calculatePriorityForIssue } = require('../../shared/services/priority');
const { createNotification } = require('../controllers/notificationController');
const { verifyWithGemini } = require('./geminiVerification');

/**
 * Validates the legitimacy of a civic complaint automatically without manual admin work.
 * Checks coordinate validity, category boundaries, text quality, duplicate candidates,
 * and performs AI Vision inspection via Google Gemini.
 */
async function verifyLegitimacy({ category, description, latitude, longitude, file }) {
  const errors = [];

  // 1. Required fields presence check
  if (
    !category ||
    !description ||
    latitude === undefined ||
    longitude === undefined ||
    latitude === '' ||
    longitude === ''
  ) {
    errors.push('category, description, latitude, longitude are required');
    return { isLegit: false, errors };
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // 2. Geographic & Coordinate Sanity Validation
  if (isNaN(lat) || isNaN(lng)) {
    errors.push('latitude and longitude must be valid floating point numbers');
  } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    errors.push('GPS coordinates are out of valid planetary range (-90 to +90, -180 to +180)');
  } else if (lat === 0 && lng === 0) {
    errors.push('GPS coordinate (0, 0) is not a valid land location');
  }

  // 3. Category Validation against defined schema
  const validCategories = ['road_damage', 'garbage', 'streetlight', 'water', 'drainage'];
  if (!validCategories.includes(category)) {
    errors.push(`Invalid category: "${category}". Allowed: ${validCategories.join(', ')}`);
  }

  // 4. Description Quality & Spam Prevention
  const trimmedDesc = (description || '').trim();
  if (trimmedDesc.length < 5) {
    errors.push('Description is too brief. Please provide at least 5 characters to describe the issue.');
  }

  if (errors.length > 0) {
    return { isLegit: false, errors };
  }

  // 5. Gemini AI Vision & Content Verification
  let aiInspection = null;
  try {
    aiInspection = await verifyWithGemini({ category, description: trimmedDesc, file });
    if (aiInspection && aiInspection.isLegit === false) {
      errors.push(
        `AI Inspection Alert: The submitted report was flagged as unverified or non-civic. Reason: ${aiInspection.reason || 'Photo does not appear to show a valid civic issue.'}`
      );
      return { isLegit: false, errors, aiInspection };
    }
  } catch (aiErr) {
    console.warn('AutoTriage: Gemini AI check warning:', aiErr.message);
  }

  // 6. Duplicate Detection Check using geospatial radius & time window
  let duplicateCandidate = false;
  let duplicateOf = null;
  try {
    const nearbyDuplicates = await checkForDuplicates({
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      category
    });

    if (nearbyDuplicates && nearbyDuplicates.length > 0) {
      duplicateCandidate = true;
      duplicateOf = nearbyDuplicates[0]._id;
    }
  } catch (dupErr) {
    console.warn('AutoTriage: Duplicate detection warning:', dupErr.message);
  }

  // 7. Dynamic Priority Score & Severity Calculation
  const reportCount = duplicateCandidate ? 2 : 1;
  const { score, level } = calculatePriorityForIssue(category, reportCount, 0);

  // If Gemini detected higher urgency/priority, respect it
  let finalPriority = level || 'Medium';
  if (aiInspection && aiInspection.suggestedPriority) {
    const priorityWeights = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    if ((priorityWeights[aiInspection.suggestedPriority] || 0) > (priorityWeights[finalPriority] || 0)) {
      finalPriority = aiInspection.suggestedPriority;
    }
  }

  return {
    isLegit: true,
    coordinates: [lng, lat],
    duplicateCandidate,
    duplicateOf,
    priorityScore: score || 0.5,
    priority: finalPriority,
    aiInspection
  };
}

/**
 * Automatically dispatches a validated complaint to a field officer without admin intervention.
 * Employs workload balancing: assigns to the officer with the lowest active task count.
 */
async function autoDispatchIssue(issue, reporterId, aiInspection) {
  try {
    const autoDispatchEnabled = process.env.AUTO_DISPATCH !== 'false';
    if (!autoDispatchEnabled) {
      return { assigned: false, reason: 'Auto-dispatch is disabled via environment' };
    }

    // 1. Find all active field officers
    const officers = await User.find({ role: 'officer' }).select('_id name email pushToken');

    if (!officers || officers.length === 0) {
      console.log('AutoDispatch: No field officers found in database. Issue queued in Submitted status.');
      return { assigned: false, reason: 'No field officers registered in system' };
    }

    // 2. Workload Balancing: Count open tasks for each officer
    const workloadList = await Promise.all(
      officers.map(async (officer) => {
        const activeCount = await Issue.countDocuments({
          assignedTo: officer._id,
          status: { $in: ['Assigned', 'In Progress'] }
        });
        return { officer, activeCount };
      })
    );

    // Sort officers by lowest active workload
    workloadList.sort((a, b) => a.activeCount - b.activeCount);
    const selectedOfficer = workloadList[0].officer;
    const currentLoad = workloadList[0].activeCount;

    const aiNote =
      aiInspection && !aiInspection.skipped
        ? `Gemini AI Verified (Confidence: ${(aiInspection.confidence * 100).toFixed(0)}%)`
        : 'System Auto-Verified';

    // 3. Auto-assign the issue to the selected officer
    issue.assignedTo = selectedOfficer._id;
    issue.status = 'Assigned';
    issue.statusHistory.push({
      status: 'Assigned',
      remark: `System Auto-Dispatch: ${aiNote} & assigned to Officer ${selectedOfficer.name} based on workload balance (${currentLoad} active tasks).`,
      changedBy: reporterId || selectedOfficer._id,
      createdAt: new Date()
    });

    // 4. Send Instant Push & In-App Notification to Assigned Officer
    const categoryLabel = (issue.category || '').replace('_', ' ');
    await createNotification(selectedOfficer._id, {
      sender: reporterId,
      issue: issue._id,
      type: 'assignment',
      title: 'New Task Assignment',
      message: `New task assigned [${issue.trackingId}]: ${categoryLabel} at ${issue.address || 'assigned location'}.`
    });

    console.log(
      `AutoDispatch: Issue ${issue.trackingId} assigned to Officer ${selectedOfficer.name} (${selectedOfficer.email}) [Current Load: ${currentLoad}].`
    );

    return {
      assigned: true,
      officer: selectedOfficer,
      activeCount: currentLoad
    };
  } catch (err) {
    console.error('AutoDispatch error:', err);
    return { assigned: false, error: err.message };
  }
}

module.exports = {
  verifyLegitimacy,
  autoDispatchIssue
};
