const mongoose = require('mongoose');
const TicketCounter = require('./ticketCounter');

const ticketTimelineSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  by_admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticket_number: {
    type: String,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  reporter_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  reporter_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  device_model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  os_version: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  category: {
    type: String,
    enum: ['technical', 'account', 'billing', 'feature_request', 'bug_report', 'other'],
    default: 'other'
  },
  channel: {
    type: String,
    enum: ['app', 'email', 'chat', 'call', 'walk_in'],
    default: 'app'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  internal_notes: {
    type: String,
    trim: true,
    default: ''
  },
  resolution_notes: {
    type: String,
    trim: true,
    default: ''
  },
  issue_image: {
    url: String,
    public_id: String
  },
  last_response_at: Date,
  resolved_at: Date,
  closed_at: Date,
  timeline: {
    type: [ticketTimelineSchema],
    default: []
  }
}, {
  timestamps: true
});

supportTicketSchema.pre('save', function createTicketNumber(next) {
  if (this.ticket_number) return next();

  const year = new Date().getFullYear();
  TicketCounter.findOneAndUpdate(
    { year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  )
    .then((counter) => {
      const seq = String(counter.sequence).padStart(4, '0');
      this.ticket_number = `ALOE-${year}-${seq}`;
      next();
    })
    .catch((err) => next(err));
});

supportTicketSchema.pre('save', function normalizeLifecycleDates(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolved_at) this.resolved_at = new Date();
    if (this.status === 'closed' && !this.closed_at) this.closed_at = new Date();
  }
  next();
});

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ user_id: 1, createdAt: -1 });
supportTicketSchema.index({ assigned_to: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
