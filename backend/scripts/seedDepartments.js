const mongoose = require('mongoose');
const Department = require('../models/Department');
require('dotenv').config({ path: './.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    const demo = [
      { name: 'Public Works', code: 'PUBLIC_WORKS', email: 'public.works@civic.local', password: 'pw_demo_123' },
      { name: 'Sanitation', code: 'SANITATION', email: 'sanitation@civic.local', password: 'san_demo_123' },
      { name: 'Electricity', code: 'ELECTRICITY', email: 'electricity@civic.local', password: 'ele_demo_123' },
      { name: 'Water', code: 'WATER', email: 'water@civic.local', password: 'wat_demo_123' }
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


