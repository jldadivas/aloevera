const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://reactVin:forprojectonly@cluster0.iysctby.mongodb.net/aloe_vera?appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    const Scan = require('./models/scan');
    
    // Check all scans with disease_detected = true
    const diseased = await Scan.find({ 'analysis_result.disease_detected': true }).limit(5);
    console.log(`Scans with disease_detected=true: ${diseased.length}`);
    diseased.forEach((s, i) => {
      console.log(`  ${i+1}. Severity: ${s.analysis_result?.disease_severity}, User: ${s.user_id}`);
    });

    // Check all scans by severity
    const byServer = await Scan.aggregate([
      { $group: { _id: '$analysis_result.disease_severity', count: { $sum: 1 } } }
    ]);
    console.log('\n Scans by disease_severity:');
    byServer.forEach(b => {
      console.log(`  ${b._id}: ${b.count} scans`);
    });

    // Total scans
    const total = await Scan.countDocuments();
    console.log(`\nTotal scans in database: ${total}`);

    // Get all users
    const User = require('./models/user');
    const users = await User.find().select('email');
    console.log(`\nUsers in database: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email}`));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
