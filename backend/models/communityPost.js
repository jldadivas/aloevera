const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    is_hidden: {
      type: Boolean,
      default: false
    },
    flagged_for_review: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true
    },
    image_url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    disease_name: {
      type: String,
      default: 'healthy'
    },
    is_hidden: {
      type: Boolean,
      default: false,
      index: true
    },
    flagged_for_review: {
      type: Boolean,
      default: false,
      index: true
    },
    moderation_notes: String,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [commentSchema]
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
