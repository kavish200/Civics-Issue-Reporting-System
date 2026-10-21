const mongoose = require('mongoose');

const statusValues = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const categoryValues = ['road_damage', 'garbage', 'streetlight', 'water', 'drainage'];

const issueSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: categoryValues },
  description: { type: String, required: true },
  image: { type: String },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
    address: { type: String }
  },
  status: { type: String, enum: statusValues, default: 'Submitted' },
  rejectionReason: { type: String, trim: true },
  statusHistory: [{
    status: { type: String, enum: statusValues },
    remark: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  trackingId: { type: String, required: true, unique: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  priorityScore: { type: Number, min: 0, max: 1, default: 0 },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  duplicateCandidate: { type: Boolean, default: false },
  citizenConfirmed: { type: Boolean, default: null },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  clientId: { type: String, sparse: true, unique: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ reporter: 1 });

issueSchema.pre('validate', function (next) {
  if (this.reporter && !this.reportedBy) {
    this.reportedBy = this.reporter;
  }
  if (this.reportedBy && !this.reporter) {
    this.reporter = this.reportedBy;
  }
  if (!this.trackingId) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substr(2, 5);
    this.trackingId = `ISSUE-${ts}-${rand}`.toUpperCase();
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Issue', issueSchema);