const DiseaseKnowledge = require('../models/diseaseKnowledge');

const diseases = [
  {
    disease_name: 'leaf_spot',
    display_name: 'Leaf Spot',
    description: 'Fungal disease causing brown or black spots on leaves',
    symptoms: [
      'Brown or black circular spots on leaves',
      'Yellowing around spots',
      'Leaf wilting',
      'Premature leaf drop'
    ],
    causes: [
      'Fungal infection (Alternaria, Cercospora)',
      'High humidity',
      'Poor air circulation',
      'Overwatering'
    ],
    severity_levels: {
      mild: {
        description: 'Few spots on lower leaves',
        treatment: [
          'Remove affected leaves',
          'Improve air circulation',
          'Reduce watering frequency',
          'Apply fungicide spray'
        ]
      },
      moderate: {
        description: 'Spots spreading to multiple leaves',
        treatment: [
          'Prune affected areas',
          'Apply systemic fungicide',
          'Improve drainage',
          'Monitor closely'
        ]
      },
      severe: {
        description: 'Extensive leaf damage, plant weakening',
        treatment: [
          'Aggressive pruning',
          'Systemic fungicide treatment',
          'Isolate plant if possible',
          'Consider repotting with fresh soil'
        ]
      }
    },
    preventive_measures: [
      'Avoid overhead watering',
      'Ensure good air circulation',
      'Water at base of plant',
      'Remove dead leaves regularly',
      'Maintain proper spacing between plants'
    ],
    estimated_recovery_days: 14
  },
  {
    disease_name: 'root_rot',
    display_name: 'Root Rot',
    description: 'Fungal disease affecting roots, often fatal if not treated early',
    symptoms: [
      'Soft, mushy roots',
      'Brown or black roots',
      'Wilting leaves',
      'Stunted growth',
      'Foul odor from soil'
    ],
    causes: [
      'Overwatering',
      'Poor drainage',
      'Fungal pathogens (Pythium, Phytophthora)',
      'Compacted soil'
    ],
    severity_levels: {
      mild: {
        description: 'Early stage, some roots affected',
        treatment: [
          'Reduce watering immediately',
          'Improve soil drainage',
          'Apply fungicide to soil',
          'Repot with fresh, well-draining soil'
        ]
      },
      moderate: {
        description: 'Significant root damage',
        treatment: [
          'Remove affected roots',
          'Repot in fresh soil',
          'Apply systemic fungicide',
          'Reduce watering by 50%'
        ]
      },
      severe: {
        description: 'Extensive root damage, plant may not recover',
        treatment: [
          'Remove all affected roots',
          'Repot in sterile, well-draining medium',
          'Apply strong fungicide',
          'Consider propagation from healthy parts'
        ]
      }
    },
    preventive_measures: [
      'Use well-draining soil mix',
      'Water only when soil is dry',
      'Ensure pots have drainage holes',
      'Avoid waterlogging',
      'Use clean pots and tools'
    ],
    estimated_recovery_days: 21
  },
  {
    disease_name: 'sunburn',
    display_name: 'Sunburn',
    description: 'Damage caused by excessive direct sunlight exposure',
    symptoms: [
      'Brown or white patches on leaves',
      'Leaf discoloration',
      'Crispy, dry leaf edges',
      'Bleached appearance'
    ],
    causes: [
      'Sudden exposure to intense sunlight',
      'Lack of shade',
      'Reflected heat',
      'Inadequate acclimatization'
    ],
    severity_levels: {
      mild: {
        description: 'Slight discoloration on few leaves',
        treatment: [
          'Move to shaded area',
          'Remove severely damaged leaves',
          'Increase watering slightly',
          'Monitor recovery'
        ]
      },
      moderate: {
        description: 'Multiple leaves affected',
        treatment: [
          'Provide shade immediately',
          'Prune damaged leaves',
          'Increase humidity',
          'Gradually reintroduce to light'
        ]
      },
      severe: {
        description: 'Extensive leaf damage',
        treatment: [
          'Move to full shade',
          'Remove all damaged leaves',
          'Increase watering and humidity',
          'Wait for new growth before re-exposing'
        ]
      }
    },
    preventive_measures: [
      'Gradually acclimate to sunlight',
      'Provide shade during peak hours',
      'Use shade cloth if needed',
      'Monitor plant response to light changes'
    ],
    estimated_recovery_days: 10
  },
  {
    disease_name: 'aloe_rust',
    display_name: 'Aloe Rust',
    description: 'Fungal disease causing orange-brown pustules on leaves',
    symptoms: [
      'Orange-brown pustules on leaves',
      'Leaf discoloration',
      'Reduced plant vigor',
      'Leaf deformation'
    ],
    causes: [
      'Fungal infection (Phakopsora)',
      'High humidity',
      'Poor air circulation',
      'Contaminated tools or soil'
    ],
    severity_levels: {
      mild: {
        description: 'Few pustules visible',
        treatment: [
          'Remove affected leaves',
          'Improve air circulation',
          'Apply fungicide',
          'Reduce humidity'
        ]
      },
      moderate: {
        description: 'Multiple leaves affected',
        treatment: [
          'Prune affected areas',
          'Apply systemic fungicide',
          'Isolate plant',
          'Improve growing conditions'
        ]
      },
      severe: {
        description: 'Extensive infection',
        treatment: [
          'Aggressive pruning',
          'Strong fungicide treatment',
          'Consider repotting',
          'Monitor closely for recovery'
        ]
      }
    },
    preventive_measures: [
      'Maintain good air circulation',
      'Avoid overhead watering',
      'Use clean tools',
      'Quarantine new plants',
      'Maintain optimal humidity levels'
    ],
    estimated_recovery_days: 18
  },
  {
    disease_name: 'bacterial_soft_rot',
    display_name: 'Bacterial Soft Rot',
    description: 'Bacterial disease causing soft, mushy tissue decay',
    symptoms: [
      'Soft, mushy tissue',
      'Foul odor',
      'Water-soaked appearance',
      'Rapid tissue collapse'
    ],
    causes: [
      'Bacterial infection (Erwinia, Pectobacterium)',
      'Wounds or injuries',
      'Overwatering',
      'High humidity'
    ],
    severity_levels: {
      mild: {
        description: 'Small affected area',
        treatment: [
          'Remove affected tissue immediately',
          'Apply antibacterial treatment',
          'Improve drainage',
          'Reduce watering'
        ]
      },
      moderate: {
        description: 'Moderate tissue damage',
        treatment: [
          'Surgical removal of affected parts',
          'Apply copper-based bactericide',
          'Repot if necessary',
          'Isolate plant'
        ]
      },
      severe: {
        description: 'Extensive damage, may be fatal',
        treatment: [
          'Remove all affected tissue',
          'Strong antibacterial treatment',
          'Consider propagation from healthy parts',
          'Dispose of severely affected plants'
        ]
      }
    },
    preventive_measures: [
      'Avoid overwatering',
      'Prevent physical injuries',
      'Use sterile tools',
      'Maintain good hygiene',
      'Ensure proper drainage'
    ],
    estimated_recovery_days: 14
  },
  {
    disease_name: 'anthracnose',
    display_name: 'Anthracnose',
    description: 'Fungal disease causing dark, sunken lesions',
    symptoms: [
      'Dark, sunken lesions',
      'Leaf spots with dark margins',
      'Premature leaf drop',
      'Stunted growth'
    ],
    causes: [
      'Fungal infection (Colletotrichum)',
      'High humidity',
      'Wet conditions',
      'Poor air circulation'
    ],
    severity_levels: {
      mild: {
        description: 'Few lesions on leaves',
        treatment: [
          'Remove affected leaves',
          'Improve air circulation',
          'Apply fungicide',
          'Reduce humidity'
        ]
      },
      moderate: {
        description: 'Multiple lesions spreading',
        treatment: [
          'Prune affected areas',
          'Apply systemic fungicide',
          'Improve growing conditions',
          'Monitor closely'
        ]
      },
      severe: {
        description: 'Extensive damage',
        treatment: [
          'Aggressive pruning',
          'Strong fungicide treatment',
          'Isolate plant',
          'Consider repotting'
        ]
      }
    },
    preventive_measures: [
      'Maintain good air circulation',
      'Avoid overhead watering',
      'Remove dead plant material',
      'Use fungicide preventively in humid conditions',
      'Ensure proper spacing'
    ],
    estimated_recovery_days: 16
  },
  {
    disease_name: 'scale_insect',
    display_name: 'Scale Insect',
    description: 'Sap-sucking insects that attach to plant surfaces',
    symptoms: [
      'Small, brown or white bumps on leaves',
      'Sticky honeydew secretion',
      'Yellowing leaves',
      'Reduced plant vigor'
    ],
    causes: [
      'Scale insect infestation',
      'Poor plant health',
      'Lack of natural predators',
      'Contaminated plants'
    ],
    severity_levels: {
      mild: {
        description: 'Few insects visible',
        treatment: [
          'Manual removal with alcohol swab',
          'Apply insecticidal soap',
          'Increase plant vigor',
          'Monitor for reinfestation'
        ]
      },
      moderate: {
        description: 'Multiple insects present',
        treatment: [
          'Apply horticultural oil',
          'Use systemic insecticide',
          'Prune heavily infested areas',
          'Improve plant care'
        ]
      },
      severe: {
        description: 'Heavy infestation',
        treatment: [
          'Strong systemic insecticide',
          'Aggressive pruning',
          'Isolate plant',
          'Consider disposal if too severe'
        ]
      }
    },
    preventive_measures: [
      'Regular inspection',
      'Quarantine new plants',
      'Maintain plant health',
      'Encourage natural predators',
      'Clean leaves regularly'
    ],
    estimated_recovery_days: 12
  },
  {
    disease_name: 'mealybug',
    display_name: 'Mealybug',
    description: 'Small, white, cottony insects that feed on plant sap',
    symptoms: [
      'White, cottony masses on plant',
      'Sticky honeydew',
      'Yellowing leaves',
      'Stunted growth'
    ],
    causes: [
      'Mealybug infestation',
      'Poor plant health',
      'Overcrowding',
      'Contaminated plants or soil'
    ],
    severity_levels: {
      mild: {
        description: 'Few insects visible',
        treatment: [
          'Manual removal',
          'Apply alcohol solution',
          'Use insecticidal soap',
          'Improve plant care'
        ]
      },
      moderate: {
        description: 'Moderate infestation',
        treatment: [
          'Apply horticultural oil',
          'Use systemic insecticide',
          'Prune affected areas',
          'Increase monitoring'
        ]
      },
      severe: {
        description: 'Heavy infestation',
        treatment: [
          'Strong systemic insecticide',
          'Aggressive treatment',
          'Isolate plant',
          'Consider disposal if necessary'
        ]
      }
    },
    preventive_measures: [
      'Regular inspection',
      'Quarantine new plants',
      'Maintain plant health',
      'Avoid overwatering',
      'Clean growing area'
    ],
    estimated_recovery_days: 10
  },
  {
    disease_name: 'spider_mite',
    display_name: 'Spider Mite',
    description: 'Tiny arachnids that cause stippling and webbing on leaves',
    symptoms: [
      'Fine webbing on leaves',
      'Yellow stippling',
      'Leaf discoloration',
      'Premature leaf drop'
    ],
    causes: [
      'Spider mite infestation',
      'Dry conditions',
      'Poor plant health',
      'Contaminated plants'
    ],
    severity_levels: {
      mild: {
        description: 'Early infestation',
        treatment: [
          'Increase humidity',
          'Spray with water',
          'Apply insecticidal soap',
          'Monitor closely'
        ]
      },
      moderate: {
        description: 'Moderate infestation',
        treatment: [
          'Apply miticide',
          'Increase humidity',
          'Prune affected leaves',
          'Improve plant care'
        ]
      },
      severe: {
        description: 'Heavy infestation',
        treatment: [
          'Strong miticide treatment',
          'Aggressive pruning',
          'Isolate plant',
          'Consider disposal if too severe'
        ]
      }
    },
    preventive_measures: [
      'Maintain adequate humidity',
      'Regular inspection',
      'Quarantine new plants',
      'Keep plants healthy',
      'Clean growing area regularly'
    ],
    estimated_recovery_days: 8
  }
];

const seedDiseases = async () => {
  try {
    // Clear existing diseases
    await DiseaseKnowledge.deleteMany({});

    // Insert diseases
    await DiseaseKnowledge.insertMany(diseases);

    console.log('Diseases seeded successfully');
  } catch (error) {
    console.error('Error seeding diseases:', error);
  }
};

module.exports = seedDiseases;

