const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });
const User = require('../models/User');
const Department = require('../models/Department');

// Helper function to get random Indian avatar images
// Using diverse portrait images from randomuser.me for variety
const getRandomIndianAvatar = (index) => {
  // Array of diverse portrait URLs - mixing men and women for variety
  // These provide realistic, diverse faces that will work well for Indian officials
  const avatarUrls = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/68.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'https://randomuser.me/api/portraits/women/47.jpg',
    'https://randomuser.me/api/portraits/men/57.jpg',
    'https://randomuser.me/api/portraits/women/38.jpg',
    'https://randomuser.me/api/portraits/men/29.jpg',
    'https://randomuser.me/api/portraits/women/50.jpg',
    'https://randomuser.me/api/portraits/men/63.jpg',
    'https://randomuser.me/api/portraits/women/28.jpg',
    'https://randomuser.me/api/portraits/men/52.jpg',
    'https://randomuser.me/api/portraits/women/41.jpg',
    'https://randomuser.me/api/portraits/men/71.jpg',
    'https://randomuser.me/api/portraits/women/55.jpg',
    'https://randomuser.me/api/portraits/men/45.jpg',
    'https://randomuser.me/api/portraits/women/33.jpg',
    'https://randomuser.me/api/portraits/men/22.jpg',
    'https://randomuser.me/api/portraits/women/61.jpg',
  ];
  // Cycle through the array to assign different images to each official
  return avatarUrls[index % avatarUrls.length];
};

// Demo users for each department with Indian names and phone numbers
const demoUsers = [
  // Road Department
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@roaddepartment.gov',
    phone: '+91 98765 43210',
    password: 'password123',
    department: 'ROAD',
    role: 'supervisor',
    designation: 'Senior Road Engineer',
    imageUrl: getRandomIndianAvatar(0)
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@roaddepartment.gov',
    phone: '+91 98765 43211',
    password: 'password123',
    department: 'ROAD',
    role: 'worker',
    designation: 'Road Maintenance Worker',
    imageUrl: getRandomIndianAvatar(1)
  },
  
  // Electricity Department
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@electricity.gov',
    phone: '+91 98765 43212',
    password: 'password123',
    department: 'ELEC',
    role: 'supervisor',
    designation: 'Electrical Supervisor',
    imageUrl: getRandomIndianAvatar(2)
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@electricity.gov',
    phone: '+91 98765 43213',
    password: 'password123',
    department: 'ELEC',
    role: 'worker',
    designation: 'Electrician',
    imageUrl: getRandomIndianAvatar(3)
  },
  
  // Water Department
  {
    name: 'Suresh Reddy',
    email: 'suresh.reddy@water.gov',
    phone: '+91 98765 43214',
    password: 'password123',
    department: 'WATER',
    role: 'supervisor',
    designation: 'Water Supply Manager',
    imageUrl: getRandomIndianAvatar(4)
  },
  {
    name: 'Kiran Desai',
    email: 'kiran.desai@water.gov',
    phone: '+91 98765 43215',
    password: 'password123',
    department: 'WATER',
    role: 'worker',
    designation: 'Water Technician',
    imageUrl: getRandomIndianAvatar(5)
  },
  
  // Sanitation Department
  {
    name: 'Meera Nair',
    email: 'meera.nair@sanitation.gov',
    phone: '+91 98765 43216',
    password: 'password123',
    department: 'SANIT',
    role: 'supervisor',
    designation: 'Sanitation Officer',
    imageUrl: getRandomIndianAvatar(6)
  },
  {
    name: 'Anil Kumar',
    email: 'anil.kumar@sanitation.gov',
    phone: '+91 98765 43217',
    password: 'password123',
    department: 'SANIT',
    role: 'worker',
    designation: 'Sanitation Worker',
    imageUrl: getRandomIndianAvatar(7)
  },
  
  // Public Safety Department
  {
    name: 'Deepak Verma',
    email: 'deepak.verma@safety.gov',
    phone: '+91 98765 43218',
    password: 'password123',
    department: 'SAFETY',
    role: 'supervisor',
    designation: 'Safety Inspector',
    imageUrl: getRandomIndianAvatar(8)
  },
  {
    name: 'Ravi Gupta',
    email: 'ravi.gupta@safety.gov',
    phone: '+91 98765 43219',
    password: 'password123',
    department: 'SAFETY',
    role: 'worker',
    designation: 'Safety Officer',
    imageUrl: getRandomIndianAvatar(9)
  },
  
  // Healthcare Department
  {
    name: 'Dr. Kavita Rao',
    email: 'kavita.rao@health.gov',
    phone: '+91 98765 43220',
    password: 'password123',
    department: 'HEALTH',
    role: 'supervisor',
    designation: 'Chief Medical Officer',
    imageUrl: getRandomIndianAvatar(10)
  },
  {
    name: 'Sunita Iyer',
    email: 'sunita.iyer@health.gov',
    phone: '+91 98765 43221',
    password: 'password123',
    department: 'HEALTH',
    role: 'worker',
    designation: 'Health Worker',
    imageUrl: getRandomIndianAvatar(11)
  },
  
  // Education Department
  {
    name: 'Prof. Ramesh Menon',
    email: 'ramesh.menon@education.gov',
    phone: '+91 98765 43222',
    password: 'password123',
    department: 'EDUC',
    role: 'supervisor',
    designation: 'Education Officer',
    imageUrl: getRandomIndianAvatar(12)
  },
  {
    name: 'Lakshmi Pillai',
    email: 'lakshmi.pillai@education.gov',
    phone: '+91 98765 43223',
    password: 'password123',
    department: 'EDUC',
    role: 'worker',
    designation: 'Field Education Coordinator',
    imageUrl: getRandomIndianAvatar(13)
  },
  
  // Environment Department
  {
    name: 'Dr. Arjun Joshi',
    email: 'arjun.joshi@environment.gov',
    phone: '+91 98765 43224',
    password: 'password123',
    department: 'ENV',
    role: 'supervisor',
    designation: 'Environmental Scientist',
    imageUrl: getRandomIndianAvatar(14)
  },
  {
    name: 'Rashmi Malhotra',
    email: 'rashmi.malhotra@environment.gov',
    phone: '+91 98765 43225',
    password: 'password123',
    department: 'ENV',
    role: 'worker',
    designation: 'Environment Inspector',
    imageUrl: getRandomIndianAvatar(15)
  },
  
  // Transportation Department
  {
    name: 'Naveen Choudhury',
    email: 'naveen.choudhury@transportation.gov',
    phone: '+91 98765 43226',
    password: 'password123',
    department: 'TRANS',
    role: 'supervisor',
    designation: 'Traffic Manager',
    imageUrl: getRandomIndianAvatar(16)
  },
  {
    name: 'Manoj Tiwari',
    email: 'manoj.tiwari@transportation.gov',
    phone: '+91 98765 43227',
    password: 'password123',
    department: 'TRANS',
    role: 'worker',
    designation: 'Transport Officer',
    imageUrl: getRandomIndianAvatar(17)
  },
  
  // Housing Department
  {
    name: 'Padmini Krishnan',
    email: 'padmini.krishnan@housing.gov',
    phone: '+91 98765 43228',
    password: 'password123',
    department: 'HOUSING',
    role: 'supervisor',
    designation: 'Housing Director',
    imageUrl: getRandomIndianAvatar(0)
  },
  {
    name: 'Dinesh Nair',
    email: 'dinesh.nair@housing.gov',
    phone: '+91 98765 43229',
    password: 'password123',
    department: 'HOUSING',
    role: 'worker',
    designation: 'Housing Officer',
    imageUrl: getRandomIndianAvatar(1)
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
    
    // Get MongoDB URI from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-connect';
    console.log(`📡 Attempting to connect to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
        role: userData.role,
        designation: userData.designation || null,
        imageUrl: userData.imageUrl || null
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
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n⚠️  MongoDB is not running or not accessible!');
      console.error('📝 Please ensure MongoDB is running:');
      console.error('   - On Windows: net start MongoDB');
      console.error('   - On macOS: brew services start mongodb-community');
      console.error('   - On Linux: sudo systemctl start mongod');
      console.error('\n   Or check your MONGODB_URI in .env file');
      console.error(`   Current URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-connect'}`);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the seeding function
if (require.main === module) {
  seedDemoUsers();
}

module.exports = { seedDemoUsers, demoUsers, departments };
