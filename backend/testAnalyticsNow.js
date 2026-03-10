const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Scan = require('./models/scan');
    
    // Get recent scans
    const scans = await Scan.find().sort({createdAt: -1}).limit(10);
    console.log('Recent scans:');
    scans.forEach((s, i) => {
      console.log(`${i+1}. ${s.analysis_result?.disease_name} - detected_conditions: [${s.analysis_result?.detected_conditions?.join(', ')}]`);
    });
    
    // Test the analytics logic
    console.log('\n=== Testing Analytics ===\n');
    
    const conditionDistribution = {
      healthy: 0,
      leaf_spot: 0,
      root_rot: 0,
      sunburn: 0,
      aloe_rust: 0,
      bacterial_soft_rot: 0,
      anthracnose: 0,
      scale_insect: 0,
      fungal_disease: 0,
      rust: 0
    };
    
    scans.forEach(scan => {
      if (scan.analysis_result) {
        if (scan.analysis_result.detected_conditions && scan.analysis_result.detected_conditions.length > 0) {
          scan.analysis_result.detected_conditions.forEach(condition => {
            const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
            if (conditionDistribution.hasOwnProperty(conditionKey)) {
              conditionDistribution[conditionKey]++;
            }
          });
        } else {
          conditionDistribution['healthy']++;
        }
      }
    });
    
    console.log('Analytics Result:');
    Object.keys(conditionDistribution).forEach(key => {
      if (conditionDistribution[key] > 0) {
        console.log(`  ${key}: ${conditionDistribution[key]}`);
      }
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
