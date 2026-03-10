const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vera');
    const Scan = require('./models/scan');
    const User = require('./models/user');
    
    // Get all users
    const users = await User.find().limit(1);
    console.log('Users:', users.length);
    
    if (users.length > 0) {
      const userId = users[0]._id;
      console.log('Checking scans for user:', userId);
      
      const scans = await Scan.find({ user_id: userId }).limit(5);
      console.log('Total scans for this user:', scans.length);
      
      scans.forEach((s, i) => {
        console.log(`\nScan ${i}:`);
        console.log(`  plant_id: ${s.plant_id}`);
        console.log(`  createdAt: ${s.createdAt}`);
        console.log(`  disease_detected: ${s.analysis_result?.disease_detected}`);
        console.log(`  disease_severity: ${s.analysis_result?.disease_severity}`);
        console.log(`  detected_conditions: ${JSON.stringify(s.analysis_result?.detected_conditions)}`);
      });
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
