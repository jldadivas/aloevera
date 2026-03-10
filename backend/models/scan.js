const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  scan_id: {
    type: String,
    unique: true,
    index: true
  },
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
  image_data: {
    original_url: {
      type: String,
      required: true
    },
    annotated_url: String,
    thumbnail_url: String,
    file_size: Number,
    dimensions: {
      width: Number,
      height: Number
    }
  },
  yolo_predictions: [{
    class: {
      type: String,
      enum: ['healthy', 'leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 'aloe_rusts',
             'leaf_spots', 'scale_insects', 'sunburns', 'scale_insect',
             'bacterial_soft_rot', 'anthracnose', 'fungal_disease', 'rust',
             'mealybug', 'spider_mite', 'unknown']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    bounding_box: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }],
  visual_features: {
    leaf_color_index: Number,
    surface_pattern_score: Number,
    structural_features: {
      thickness_estimate: {
        type: String,
        enum: ['thin', 'medium', 'thick']
      },
      leaf_count_visible: Number
    }
  },
  analysis_result: {
    harvest_ready: Boolean,
    maturity_assessment: {
      type: String,
      enum: ['immature', 'maturing', 'optimal', 'over-mature']
    },
    health_score: {
      type: Number,
      min: 0,
      max: 100
    },
    plant_health_score: {
      type: Number,
      min: 0,
      max: 100
    },
    disease_detected: Boolean,
    disease_severity: {
      type: String,
      enum: ['none', 'low', 'mild', 'moderate', 'high', 'severe']
    },
    disease_name: String,
    recommended_action: {
      type: String,
      enum: ['harvest_now', 'wait_2_weeks', 'treat_disease', 'monitor_daily']
    },
    estimated_days_to_harvest: Number,
    estimated_age_months: Number,
    estimated_age_formatted: String,
    age_confidence: Number,
    confidence: Number,
    confidence_score: Number,
    detected_conditions: [String],
    detected_pests: [String]
  },
  recommendations: {
    treatment_plan: [String],
    preventive_measures: [String],
    follow_up_required: Boolean,
    next_scan_date: Date
  },
  scan_metadata: {
    device_type: String,
    app_version: String,
    processing_time_ms: Number,
    model_version: String,
    inference_server: {
      type: String,
      default: 'Flask-YOLOv8'
    }
  },
  self_learning_status: {
    added_to_dataset: {
      type: Boolean,
      default: false
    },
    requires_validation: Boolean,
    validated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validation_date: Date
  }
}, {
  timestamps: true
});

// Generate unique scan ID
scanSchema.pre('save', async function() {
  if (!this.scan_id) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    this.scan_id = `SCAN-${timestamp}-${random}`;
  }
});

// Compound indexes for efficient queries
scanSchema.index({ user_id: 1, createdAt: -1 });
scanSchema.index({ plant_id: 1, createdAt: -1 });
scanSchema.index({ 'analysis_result.disease_detected': 1, createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
