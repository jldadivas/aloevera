const mongoose = require('mongoose');

const trainingDatasetSchema = new mongoose.Schema({
  image_url: {
    type: String,
    required: true
  },
  source_scan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true,
    enum: ['healthy', 'leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 
           'bacterial_soft_rot', 'anthracnose', 'scale_insect', 
           'mealybug', 'spider_mite']
  },
  validation_status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending',
    index: true
  },
  validated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confidence_when_captured: {
    type: Number,
    min: 0,
    max: 1
  },
  added_to_training: {
    type: Boolean,
    default: false,
    index: true
  },
  training_batch: {
    type: String,
    index: true
  },
  validation_notes: String,
  metadata: {
    original_prediction: String,
    corrected_label: String,
    image_quality_score: Number
  }
}, {
  timestamps: true
});

// Compound indexes
trainingDatasetSchema.index({ validation_status: 1, added_to_training: 1 });
trainingDatasetSchema.index({ training_batch: 1, label: 1 });

// Static method to get pending validations
trainingDatasetSchema.statics.getPendingValidations = function(limit = 50) {
  return this.find({ validation_status: 'pending' })
    .populate('source_scan_id', 'image_data yolo_predictions analysis_result')
    .populate('validated_by', 'full_name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to export training batch
trainingDatasetSchema.statics.exportBatch = async function(batchName) {
  const images = await this.find({
    validation_status: 'validated',
    added_to_training: false
  }).limit(1000);
  
  const imageIds = images.map(img => img._id);
  await this.updateMany(
    { _id: { $in: imageIds } },
    { 
      $set: { 
        training_batch: batchName,
        added_to_training: true 
      }
    }
  );
  
  return images.map(img => ({
    image_url: img.image_url,
    label: img.label,
    batch: batchName
  }));
};

// Static method to auto-flag low-confidence predictions
trainingDatasetSchema.statics.autoFlagLowConfidence = async function(threshold = 0.7) {
  const Scan = mongoose.model('Scan');
  
  const lowConfidenceScans = await Scan.find({
    'analysis_result.confidence_score': { $lt: threshold },
    'self_learning_status.added_to_dataset': false
  }).limit(100);
  
  const trainingImages = [];
  
  for (const scan of lowConfidenceScans) {
    const trainingImage = new this({
      image_url: scan.image_data.original_url,
      source_scan_id: scan._id,
      label: scan.yolo_predictions[0]?.class || 'healthy',
      confidence_when_captured: scan.analysis_result.confidence_score,
      validation_status: 'pending'
    });
    
    trainingImages.push(trainingImage);
    
    scan.self_learning_status.added_to_dataset = true;
    scan.self_learning_status.requires_validation = true;
    await scan.save();
  }
  
  if (trainingImages.length > 0) {
    return await this.insertMany(trainingImages);
  }
  
  return [];
};

module.exports = mongoose.model('TrainingDataset', trainingDatasetSchema);
