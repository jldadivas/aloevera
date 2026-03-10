const mongoose = require('mongoose');

const diseaseKnowledgeSchema = new mongoose.Schema({
  disease_name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  display_name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String
  }],
  causes: [{
    type: String
  }],
  severity_levels: {
    mild: {
      description: String,
      treatment: [String]
    },
    moderate: {
      description: String,
      treatment: [String]
    },
    severe: {
      description: String,
      treatment: [String]
    }
  },
  preventive_measures: [{
    type: String
  }],
  estimated_recovery_days: {
    type: Number,
    min: 0
  },
  references: [{
    type: String
  }]
}, {
  timestamps: true
});

// Static method to get treatment recommendations
diseaseKnowledgeSchema.statics.getTreatment = async function(diseaseName, severity = 'moderate') {
  const disease = await this.findOne({ disease_name: diseaseName });
  if (!disease) return null;
  
  return {
    disease: disease.display_name,
    description: disease.description,
    symptoms: disease.symptoms,
    treatment: disease.severity_levels[severity]?.treatment || [],
    preventive_measures: disease.preventive_measures,
    recovery_days: disease.estimated_recovery_days
  };
};

module.exports = mongoose.model('DiseaseKnowledge', diseaseKnowledgeSchema);
