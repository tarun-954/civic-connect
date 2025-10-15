const mongoose = require('mongoose');
const Department = require('../models/Department');
require('dotenv').config({ path: './.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    const demo = [
      { name: 'Road Department', code: 'ROAD_DEPT', email: 'road.dept@civic.local', password: 'road123' },
      { name: 'Electricity Department', code: 'ELECTRICITY_DEPT', email: 'electricity.dept@civic.local', password: 'elec123' },
      { name: 'Sewage Department', code: 'SEWAGE_DEPT', email: 'sewage.dept@civic.local', password: 'sewage123' },
      { name: 'Cleanliness Department', code: 'CLEANLINESS_DEPT', email: 'cleanliness.dept@civic.local', password: 'clean123' },
      { name: 'Waste Management', code: 'WASTE_MGMT', email: 'waste.mgmt@civic.local', password: 'waste123' },
      { name: 'Water Department', code: 'WATER_DEPT', email: 'water.dept@civic.local', password: 'water123' },
      { name: 'Streetlight Department', code: 'STREETLIGHT_DEPT', email: 'streetlight.dept@civic.local', password: 'light123' }
    ];

    for (const d of demo) {
      const exists = await Department.findOne({ code: d.code });
      if (exists) {
        console.log(`↩️  Department exists: ${d.code}`);
        continue;
      }
      const passwordHash = await Department.hashPassword(d.password);
      await Department.create({ name: d.name, code: d.code, email: d.email, passwordHash });
      console.log(`✅ Created department: ${d.code}`);
    }

    console.log('🎉 Done.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed', e);
    process.exit(1);
  }
}

run();


