const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  plant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  task_type: {
    type: String,
    enum: ['daily_scan', 'watering', 'fertilize', 'inspect_disease', 
           'harvest', 'treatment_application'],
    required: true
  },
  scheduled_date: {
    type: Date,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'skipped', 'overdue'],
    default: 'pending',
    index: true
  },
  description: {
    type: String,
    required: true
  },
  auto_generated: {
    type: Boolean,
    default: false
  },
  prevention_plan: {
    plan_type: {
      type: String,
      enum: ['disease_prevention', 'harvest_optimization', 'routine_care']
    },
    irrigation_schedule: String,
    humidity_control: String,
    fungicide_application: String,
    duration_days: Number
  },
  related_scan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan'
  },
  completed_at: Date,
  completed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completion_notes: String
}, {
  timestamps: true
});

// Compound index for calendar queries
followUpSchema.index({ user_id: 1, scheduled_date: 1, status: 1 });
followUpSchema.index({ plant_id: 1, scheduled_date: 1 });

// Method to mark task as overdue
followUpSchema.statics.updateOverdueTasks = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      scheduled_date: { $lt: now },
      status: 'pending'
    },
    {
      $set: { status: 'overdue' }
    }
  );
  return result;
};

module.exports = mongoose.model('FollowUp', followUpSchema);
