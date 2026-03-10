const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  firebase_uid: {
    type: String,
    unique: true,
    sparse: true
  },
  auth_provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  password_hash: {
    type: String,
    required: function requiredPassword() {
      return this.auth_provider === 'local';
    }
  },
  full_name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'grower'],
    default: 'grower'
  },
  phone: {
    type: String
  },
  profile_picture: {
    url: String,
    public_id: String
  },
  preferences: {
    notification_enabled: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  deactivation_reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  deactivated_at: Date,
  community_mute_until: Date,
  moderation_history: [
    {
      action: String,
      reason: String,
      by_admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  last_login: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.password_hash || !this.isModified('password_hash')) {
    return;
  }
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password_hash) return false;
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
