const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

communityMessageSchema.index({ sender_id: 1, recipient_id: 1, createdAt: -1 });
communityMessageSchema.index({ recipient_id: 1, is_read: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
