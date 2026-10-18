const Issue = require('../../shared/models/Issue');
const User = require('../../shared/models/User');
const Notification = require('../../shared/models/Notification');
const { changeStatus } = require('../../shared/services/statusWorkflow');
const { createNotification } = require('./notificationController');
const cloudinary = require('../config/cloudinary');

const fs = require('fs');
const path = require('path');

const saveUploadedFile = async (file) => {
  if (!file || !file.buffer) return null;

  // 1. Try Cloudinary if available
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
    if (process.env.CLOUDINARY_API_KEY && cloudName && cloudName !== 'Root') {
      const url = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'civics-issues' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
      if (url) return url;
    }
  } catch (cloudErr) {
    console.warn('Cloudinary upload warning, using local storage fallback:', cloudErr.message);
  }

  // 2. Local disk fallback
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const ext = path.extname(file.originalname || '') || '.jpg';
    const fileName = `issue-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
    return `/uploads/${fileName}`;
  } catch (localErr) {
    console.error('Local file save error:', localErr.message);
    return null;
  }
};

const createIssue = async (req, res, next) => {
  try {
    const { category, description, latitude, longitude, address, clientId } = req.body;

    const imageUrl = await saveUploadedFile(req.file);

    const lat = parseFloat(latitude) || 22.7196;
    const lng = parseFloat(longitude) || 75.8577;

    const trackingId = `ISSUE-${Math.random().toString(36).substr(2, 5).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const issue = new Issue({
      category: category || 'road_damage',
      description: description || 'Civic issue reported',
      image: imageUrl,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: address || 'Indore, Madhya Pradesh',
      reporter: req.user.id,
      status: 'Submitted',
      priorityScore: 0.5,
      priority: 'Medium',
      trackingId,
      clientId: clientId || undefined
    });

    await issue.save();
    await issue.populate('reporter', 'name email');
    res.status(201).json({
      message: 'Issue reported successfully',
      issue,
      duplicateCandidate: false
    });
  } catch (err) {
    next(err);
  }
};

const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ reporter: req.user.id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name')
      .populate('statusHistory.changedBy', 'name');

    res.json({ issues });
  } catch (err) {
    next(err);
  }
};

const getNearbyIssues = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude required' });
    }

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .sort({ createdAt: -1 })
    .populate('reporter', 'name')
    .populate('assignedTo', 'name');

    res.json({ issues });
  } catch (err) {
    next(err);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name')
      .populate('statusHistory.changedBy', 'name');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue });
  } catch (err) {
    next(err);
  }
};

const getAssignedIssues = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { assignedTo: req.user.id };
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .sort({ priorityScore: -1, createdAt: 1 })
      .populate('reporter', 'name email')
      .populate('statusHistory.changedBy', 'name');

    res.json({ issues });
  } catch (err) {
    next(err);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { status, remark } = req.body;

    if (!['In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'status must be In Progress or Resolved' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (!issue.assignedTo || issue.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    if (req.file) {
      const imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'civics-issues' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      issue.image = imageUrl;
    }

    const actor = { _id: req.user.id, id: req.user.id };
    await changeStatus(issue, status, actor, remark || '');

    await issue.populate('reporter', 'name');
    const statusChange = `Status changed to ${status}`;
    await createNotification(issue.reporter._id, {
      sender: req.user.id,
      issue: issue._id,
      type: 'status_update',
      title: 'Issue Status Updated',
      message: `${statusChange}: ${issue.category}`,
    });

    res.json({ issue });
  } catch (err) {
    if (err.message && err.message.startsWith('Invalid transition')) {
      return res.status(422).json({ message: err.message });
    }
    next(err);
  }
};

const confirmIssue = async (req, res, next) => {
  try {
    const { confirmed, rating, feedback } = req.body;
    if (confirmed === undefined) return res.status(400).json({ message: 'confirmed field is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (!issue.reporter || issue.reporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the reporter can confirm resolution' });
    }

    if (issue.status !== 'Resolved') {
      return res.status(422).json({ message: 'Issue must be Resolved before confirmation' });
    }

    if (!confirmed) {
      const actor = { _id: req.user.id, id: req.user.id };
      await changeStatus(issue, 'In Progress', actor, 'Citizen re-opened issue');

      if (issue.assignedTo) {
        await createNotification(issue.assignedTo, {
          sender: req.user.id,
          issue: issue._id,
          type: 'status_update',
          title: 'Issue Reopened',
          message: `Issue reopened by reporter: ${issue.category}`,
        });
      }
    } else {
      issue.citizenConfirmed = true;
      if (rating) issue.rating = rating;
      if (feedback) issue.feedback = feedback;
      await issue.save();
    }

    res.json({ issue });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createIssue,
  getMyIssues,
  getNearbyIssues,
  getIssueById,
  getAssignedIssues,
  updateProgress,
  confirmIssue,
};