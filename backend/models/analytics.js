const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  metrics: {
    total_scans: {
      type: Number,
      default: 0
    },
    total_plants_monitored: {
      type: Number,
      default: 0
    },
    harvest_ready_count: {
      type: Number,
      default: 0
    },
    disease_alerts: {
      type: Number,
      default: 0
    },
    condition_distribution: {
      healthy: { type: Number, default: 0 },
      leaf_spot: { type: Number, default: 0 },
      root_rot: { type: Number, default: 0 },
      sunburn: { type: Number, default: 0 },
      aloe_rust: { type: Number, default: 0 },
      bacterial_soft_rot: { type: Number, default: 0 },
      anthracnose: { type: Number, default: 0 },
      scale_insect: { type: Number, default: 0 }
    },
    pest_distribution: {
      mealybug: { type: Number, default: 0 },
      spider_mite: { type: Number, default: 0 }
    },
    avg_health_score: {
      type: Number,
      min: 0,
      max: 100
    },
    avg_confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    avg_processing_time_ms: {
      type: Number,
      min: 0
    }
  },
  model_performance: {
    images_added_to_dataset: {
      type: Number,
      default: 0
    },
    validation_required_count: {
      type: Number,
      default: 0
    },
    model_accuracy_trend: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  forecasting: {
    yield_prediction_total_kg: {
      type: Number,
      min: 0
    },
    quality_forecast_avg_score: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient date-range queries
analyticsSchema.index({ date: 1, user_id: 1 });

// Static method to aggregate daily analytics
analyticsSchema.statics.aggregateDaily = async function(date, userId = null) {
  const Scan = mongoose.model('Scan');
  const Plant = mongoose.model('Plant');
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const matchQuery = {
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  };
  
  if (userId) {
    matchQuery.user_id = new mongoose.Types.ObjectId(userId);
  }
  
  const scans = await Scan.find(matchQuery);
  
  const metrics = {
    total_scans: scans.length,
    total_plants_monitored: new Set(scans.map(s => s.plant_id.toString())).size,
    harvest_ready_count: scans.filter(s => s.analysis_result.harvest_ready).length,
    disease_alerts: scans.filter(s => s.analysis_result.disease_detected).length,
    condition_distribution: {
      healthy: 0,
      leaf_spot: 0,
      root_rot: 0,
      sunburn: 0,
      aloe_rust: 0,
      bacterial_soft_rot: 0,
      anthracnose: 0,
      scale_insect: 0
    },
    pest_distribution: {
      mealybug: 0,
      spider_mite: 0
    },
    avg_health_score: 0,
    avg_confidence: 0,
    avg_processing_time_ms: 0
  };
  
  scans.forEach(scan => {
    scan.yolo_predictions.forEach(pred => {
      if (metrics.condition_distribution.hasOwnProperty(pred.class)) {
        metrics.condition_distribution[pred.class]++;
      }
      if (metrics.pest_distribution.hasOwnProperty(pred.class)) {
        metrics.pest_distribution[pred.class]++;
      }
    });
  });
  
  if (scans.length > 0) {
    metrics.avg_health_score = scans.reduce((sum, s) => 
      sum + (s.analysis_result.health_score || 0), 0) / scans.length;
    metrics.avg_confidence = scans.reduce((sum, s) => 
      sum + (s.analysis_result.confidence_score || 0), 0) / scans.length;
    metrics.avg_processing_time_ms = scans.reduce((sum, s) => 
      sum + (s.scan_metadata.processing_time_ms || 0), 0) / scans.length;
  }
  
  return metrics;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
    