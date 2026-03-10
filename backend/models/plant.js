const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  plant_id: {
    type: String,
    unique: true,
    index: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  common_name: {
    type: String,
    default: 'Aloe Vera'
  },
  species: {
    type: String,
    default: 'Aloe barbadensis'
  },
  name: String,
  planting_date: {
    type: Date,
    required: true
  },
  location: {
    farm_name: String,
    plot_number: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  current_status: {
    health_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    harvest_ready: {
      type: Boolean,
      default: false
    },
    last_scan_date: Date,
    primary_condition: {
      type: String,
      enum: ['healthy', 'leaf_spot', 'root_rot', 'sunburn', 'aloe_rust', 'aloe_rusts',
             'leaf_spots', 'scale_insects', 'sunburns', 'scale_insect',
             'bacterial_soft_rot', 'anthracnose', 'fungal_disease', 'rust',
             'mealybug', 'spider_mite', 'unknown']
    },
    disease_severity: {
      type: String,
      enum: ['none', 'low', 'mild', 'moderate', 'high', 'severe'],
      default: 'none'
    },
    estimated_days_to_harvest: Number,
    is_isolated: {
      type: Boolean,
      default: false
    },
    needs_treatment: {
      type: Boolean,
      default: false
    },
    treatment_started_at: Date,
    harvest_marked_at: Date,
    harvest_completed_at: Date,
    next_rescan_date: Date
  },
  management_logs: [{
    action: {
      type: String,
      enum: [
        'isolate',
        'start_treatment',
        'rescan_3_days',
        'rescan_7_days',
        'mark_for_harvest',
        'harvest_completed',
        'log_yield',
        'remove_infected_leaves',
        'dispose_plant',
        'disinfect_area',
        'spot_check_nearby'
      ]
    },
    note: String,
    photo_url: String,
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    variety: {
      type: String,
      default: 'Aloe barbadensis Miller'
    },
    propagation_method: {
      type: String,
      enum: ['in-vitro', 'vegetative', 'seed']
    },
    soil_type: String,
    notes: String
  }
}, {
  timestamps: true
});

// Virtual field for age calculation
plantSchema.virtual('age_in_months').get(function() {
  const now = new Date();
  const planted = new Date(this.planting_date);
  const months = (now.getFullYear() - planted.getFullYear()) * 12 + 
                  (now.getMonth() - planted.getMonth());
  return months;
});

// Generate unique plant ID
plantSchema.pre('save', async function() {
  if (!this.plant_id) {
    const count = await mongoose.model('Plant').countDocuments();
    const year = new Date().getFullYear();
    this.plant_id = `ALV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

plantSchema.set('toJSON', { virtuals: true });
plantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Plant', plantSchema);
