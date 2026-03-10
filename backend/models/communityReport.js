const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema(
  {
    reporter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    target_type: {
      type: String,
      enum: ['post', 'comment'],
      required: true,
      index: true
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true
    },
    comment_id: {
      type: mongoose.Schema.Types.ObjectId
    },
    target_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['open', 'dismissed', 'warned', 'removed'],
      default: 'open',
      index: true
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution_notes: String,
    resolved_at: Date
  },
  { timestamps: true }
);

communityReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
