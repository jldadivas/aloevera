const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Scan = require('./models/scan');
    
    // Get all scans with disease detected but empty detected_conditions
    const scans = await Scan.find({
      'analysis_result.disease_detected': true,
      'analysis_result.detected_conditions': { $in: [[], undefined] }
    });
    
    console.log(`Found ${scans.length} scans with disease but no detected_conditions`);
    
    for (const scan of scans) {
      // Get the disease class from yolo predictions or disease_name
      let diseaseClass = null;
      
      if (scan.yolo_predictions && scan.yolo_predictions.length > 0) {
        diseaseClass = scan.yolo_predictions[0].class;
      } else if (scan.analysis_result?.disease_name) {
        diseaseClass = scan.analysis_result.disease_name.toLowerCase().replace(/\s+/g, '_');
      }
      
      if (diseaseClass && diseaseClass !== 'healthy') {
        await Scan.findByIdAndUpdate(scan._id, {
          $set: {
            'analysis_result.detected_conditions': [diseaseClass],
            'analysis_result.detected_pests': []
          }
        });
        console.log(`✓ Updated scan with detected_conditions: ["${diseaseClass}"]`);
      }
    }
    
    console.log('All scans updated!');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
