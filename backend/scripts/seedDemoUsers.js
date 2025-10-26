const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');

// Demo users for each department
const demoUsers = [
  // Road Department
  {
    name: 'John Smith',
    email: 'john.smith@roaddepartment.gov',
    phone: '+1234567890',
    password: 'password123',
    department: 'ROAD',
    role: 'supervisor'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@roaddepartment.gov',
    phone: '+1234567891',
    password: 'password123',
    department: 'ROAD',
    role: 'worker'
  },
  
  // Electricity Department
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@electricity.gov',
    phone: '+1234567892',
    password: 'password123',
    department: 'ELEC',
    role: 'supervisor'
  },
  {
    name: 'David Brown',
    email: 'david.brown@electricity.gov',
    phone: '+1234567893',
    password: 'password123',
    department: 'ELEC',
    role: 'worker'
  },
  
  // Water Department
  {
    name: 'Lisa Davis',
    email: 'lisa.davis@water.gov',
    phone: '+1234567894',
    password: 'password123',
    department: 'WATER',
    role: 'supervisor'
  },
  {
    name: 'Tom Wilson',
    email: 'tom.wilson@water.gov',
    phone: '+1234567895',
    password: 'password123',
    department: 'WATER',
    role: 'worker'
  },
  
  // Sanitation Department
  {
    name: 'Emma Garcia',
    email: 'emma.garcia@sanitation.gov',
    phone: '+1234567896',
    password: 'password123',
    department: 'SANIT',
    role: 'supervisor'
  },
  {
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@sanitation.gov',
    phone: '+1234567897',
    password: 'password123',
    department: 'SANIT',
    role: 'worker'
  },
  
  // Public Safety Department
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@safety.gov',
    phone: '+1234567898',
    password: 'password123',
    department: 'SAFETY',
    role: 'supervisor'
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@safety.gov',
    phone: '+1234567899',
    password: 'password123',
    department: 'SAFETY',
    role: 'worker'
  },
  
  // Healthcare Department
  {
    name: 'Dr. Maria Martinez',
    email: 'maria.martinez@health.gov',
    phone: '+1234567800',
    password: 'password123',
    department: 'HEALTH',
    role: 'supervisor'
  },
  {
    name: 'Nurse Amy Chen',
    email: 'amy.chen@health.gov',
    phone: '+1234567801',
    password: 'password123',
    department: 'HEALTH',
    role: 'worker'
  },
  
  // Education Department
  {
    name: 'Principal James Anderson',
    email: 'james.anderson@education.gov',
    phone: '+1234567802',
    password: 'password123',
    department: 'EDUC',
    role: 'supervisor'
  },
  {
    name: 'Teacher Susan White',
    email: 'susan.white@education.gov',
    phone: '+1234567803',
    password: 'password123',
    department: 'EDUC',
    role: 'worker'
  },
  
  // Environment Department
  {
    name: 'Dr. Michael Green',
    email: 'michael.green@environment.gov',
    phone: '+1234567804',
    password: 'password123',
    department: 'ENV',
    role: 'supervisor'
  },
  {
    name: 'Eco Officer Rachel Kim',
    email: 'rachel.kim@environment.gov',
    phone: '+1234567805',
    password: 'password123',
    department: 'ENV',
    role: 'worker'
  },
  
  // Transportation Department
  {
    name: 'Traffic Manager Kevin Park',
    email: 'kevin.park@transportation.gov',
    phone: '+1234567806',
    password: 'password123',
    department: 'TRANS',
    role: 'supervisor'
  },
  {
    name: 'Transport Officer Alex Thompson',
    email: 'alex.thompson@transportation.gov',
    phone: '+1234567807',
    password: 'password123',
    department: 'TRANS',
    role: 'worker'
  },
  
  // Housing Department
  {
    name: 'Housing Director Patricia Clark',
    email: 'patricia.clark@housing.gov',
    phone: '+1234567808',
    password: 'password123',
    department: 'HOUSING',
    role: 'supervisor'
  },
  {
    name: 'Housing Officer Daniel Lewis',
    email: 'daniel.lewis@housing.gov',
    phone: '+1234567809',
    password: 'password123',
    department: 'HOUSING',
    role: 'worker'
  }
];

// Department information
const departments = [
  {
    name: 'Road Maintenance Department',
    code: 'ROAD',
    email: 'admin@roaddepartment.gov',
    password: 'admin123'
  },
  {
    name: 'Electricity Department',
    code: 'ELEC',
    email: 'admin@electricity.gov',
    password: 'admin123'
  },
  {
    name: 'Water Supply Department',
    code: 'WATER',
    email: 'admin@water.gov',
    password: 'admin123'
  },
  {
    name: 'Sanitation Department',
    code: 'SANIT',
    email: 'admin@sanitation.gov',
    password: 'admin123'
  },
  {
    name: 'Public Safety Department',
    code: 'SAFETY',
    email: 'admin@safety.gov',
    password: 'admin123'
  },
  {
    name: 'Healthcare Department',
    code: 'HEALTH',
    email: 'admin@health.gov',
    password: 'admin123'
  },
  {
    name: 'Education Department',
    code: 'EDUC',
    email: 'admin@education.gov',
    password: 'admin123'
  },
  {
    name: 'Environment Department',
    code: 'ENV',
    email: 'admin@environment.gov',
    password: 'admin123'
  },
  {
    name: 'Transportation Department',
    code: 'TRANS',
    email: 'admin@transportation.gov',
    password: 'admin123'
  },
  {
    name: 'Housing Department',
    code: 'HOUSING',
    email: 'admin@housing.gov',
    password: 'admin123'
  }
];

async function seedDemoUsers() {
  try {
    console.log('🌱 Starting to seed demo users and departments...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicconnect');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Create departments
    console.log('🏢 Creating departments...');
    for (const deptData of departments) {
      const hashedPassword = await Department.hashPassword(deptData.password);
      const department = new Department({
        ...deptData,
        passwordHash: hashedPassword,
        roles: ['department']
      });
      await department.save();
      console.log(`✅ Created department: ${deptData.name} (${deptData.code})`);
    }
    
    // Create demo users
    console.log('👥 Creating demo users...');
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        department: userData.department,
        role: userData.role
      });
      await user.save();
      console.log(`✅ Created user: ${userData.name} (${userData.email}) - ${userData.role} in ${userData.department}`);
    }
    
    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('\n🏢 Department Logins:');
    departments.forEach(dept => {
      console.log(`${dept.name}: ${dept.email} / ${dept.password}`);
    });
    
    console.log('\n👥 User Logins:');
    demoUsers.forEach(user => {
      console.log(`${user.name} (${user.role}): ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDemoUsers();
}

module.exports = { seedDemoUsers, demoUsers, departments };
