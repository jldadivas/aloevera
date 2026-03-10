const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://reactVin:forprojectonly@cluster0.iysctby.mongodb.net/aloe_vera?appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas');

    const Scan = require('./models/scan');
    const User = require('./models/user');
    
    // Get user
    const user = await User.findOne({ email: 'user@vera.com' });
    console.log('\nUser found:', user?.email, 'ID:', user?._id);
    
    if (user) {
      // Get scans for this user
      const scans = await Scan.find({ user_id: user._id }).limit(10);
      console.log(`\nTotal scans for this user: ${scans.length}`);
      
      if (scans.length > 0) {
        console.log('\n--- First 5 Scans ---');
        scans.slice(0, 5).forEach((s, i) => {
          console.log(`\nScan ${i + 1}:`);
          console.log(`  ID: ${s._id}`);
          console.log(`  Plant ID: ${s.plant_id}`);
          console.log(`  Created: ${s.createdAt}`);
          console.log(`  Analysis Result exists: ${!!s.analysis_result}`);
          if (s.analysis_result) {
            console.log(`    - disease_detected: ${s.analysis_result.disease_detected}`);
            console.log(`    - disease_severity: ${s.analysis_result.disease_severity}`);
            console.log(`    - health_score: ${s.analysis_result.health_score}`);
            console.log(`    - detected_conditions: ${JSON.stringify(s.analysis_result.detected_conditions)}`);
          }
        });
      }

      // Check plants
      const Plant = require('./models/plant');
      const plants = await Plant.find({ owner_id: user._id }).limit(5);
      console.log(`\n\nTotal plants: ${plants.length}`);
      plants.slice(0, 3).forEach((p, i) => {
        console.log(`\nPlant ${i + 1}:`);
        console.log(`  Plant ID: ${p._id}`);
        console.log(`  Name: ${p.plant_name}`);
        console.log(`  Disease severity: ${p.current_status?.disease_severity}`);
      });
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
