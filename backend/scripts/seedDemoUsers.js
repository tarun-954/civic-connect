const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });
const User = require('../models/User');
const Department = require('../models/Department');

// Helper function to get random Indian avatar images
// Using direct image URLs from Unsplash and Pexels featuring Indian/Hindi people
const getRandomIndianAvatar = (index) => {
  // Array of direct image URLs featuring Indian/Hindi people
  // These are professional portrait photos of Indian people from free stock photo services
  const indianAvatarUrls = [
    'https://images.pexels.com/photos/4307869/pexels-photo-4307869.jpeg',
    'https://images.pexels.com/photos/2753381/pexels-photo-2753381.jpeg',
    'https://images.pexels.com/photos/7580649/pexels-photo-7580649.jpeg', 
    'https://images.pexels.com/photos/7580813/pexels-photo-7580813.jpeg', //4
   'https://images.pexels.com/photos/7580761/pexels-photo-7580761.jpeg',//5
    'https://images.pexels.com/photos/7580918/pexels-photo-7580918.jpeg',//6
  'https://images.pexels.com/photos/7580821/pexels-photo-7580821.jpeg',//7
  'https://images.pexels.com/photos/15498251/pexels-photo-15498251.jpeg',
  'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg',
  'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg', 
  'https://images.pexels.com/photos/7580967/pexels-photo-7580967.jpeg',
    'https://images.pexels.com/photos/29028778/pexels-photo-29028778.jpeg',
    'https://images.pexels.com/photos/4307869/pexels-photo-4307869.jpeg',
    'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg',
    'https://images.pexels.com/photos/29028778/pexels-photo-29028778.jpeg',
];
  // Cycle through the array to assign different images to each official
  return indianAvatarUrls[index % indianAvatarUrls.length];
};

// Demo users for each department with Indian names and phone numbers
// Department names match ReportIssueScreen categories
const demoUsers = [
  // Road Department
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@road.gov',
    phone: '+91 98765 43210',
    password: 'password123',
    department: 'Road',
    role: 'supervisor',
    designation: 'Head of Road Department',
    imageUrl: getRandomIndianAvatar(0)
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@road.gov',
    phone: '+91 98765 43211',
    password: 'password123',
    department: 'Road',
    role: 'worker',
    designation: 'Road Maintenance Worker',
    imageUrl: getRandomIndianAvatar(1)
  },
  {
    name: 'Anjali Mehta',
    email: 'anjali.mehta@road.gov',
    phone: '+91 98765 43212',
    password: 'password123',
    department: 'Road',
    role: 'worker',
    designation: 'Road Inspector',
    imageUrl: getRandomIndianAvatar(2)
  },
  {
    name: 'Rohit Sharma',
    email: 'rohit.sharma@road.gov',
    phone: '+91 98765 43213',
    password: 'password123',
    department: 'Road',
    role: 'worker',
    designation: 'Construction Supervisor',
    imageUrl: getRandomIndianAvatar(3)
  },
  
  // Electricity Department
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@electricity.gov',
    phone: '+91 98765 43220',
    password: 'password123',
    department: 'Electricity',
    role: 'supervisor',
    designation: 'Head of Electricity Department',
    imageUrl: getRandomIndianAvatar(4)
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@electricity.gov',
    phone: '+91 98765 43221',
    password: 'password123',
    department: 'Electricity',
    role: 'worker',
    designation: 'Senior Electrician',
    imageUrl: getRandomIndianAvatar(5)
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@electricity.gov',
    phone: '+91 98765 43222',
    password: 'password123',
    department: 'Electricity',
    role: 'worker',
    designation: 'Electrical Technician',
    imageUrl: getRandomIndianAvatar(6)
  },
  {
    name: 'Karan Malhotra',
    email: 'karan.malhotra@electricity.gov',
    phone: '+91 98765 43223',
    password: 'password123',
    department: 'Electricity',
    role: 'worker',
    designation: 'Power Line Worker',
    imageUrl: getRandomIndianAvatar(7)
  },
  
  // Sewage Department
  {
    name: 'Meera Nair',
    email: 'meera.nair@sewage.gov',
    phone: '+91 98765 43230',
    password: 'password123',
    department: 'Sewage',
    role: 'supervisor',
    designation: 'Head of Sewage Department',
    imageUrl: getRandomIndianAvatar(8)
  },
  {
    name: 'Anil Kumar',
    email: 'anil.kumar@sewage.gov',
    phone: '+91 98765 43231',
    password: 'password123',
    department: 'Sewage',
    role: 'worker',
    designation: 'Sewage Maintenance Worker',
    imageUrl: getRandomIndianAvatar(9)
  },
  {
    name: 'Divya Iyer',
    email: 'divya.iyer@sewage.gov',
    phone: '+91 98765 43232',
    password: 'password123',
    department: 'Sewage',
    role: 'worker',
    designation: 'Drainage Inspector',
    imageUrl: getRandomIndianAvatar(10)
  },
  
  // Cleanliness Department
  {
    name: 'Sunita Desai',
    email: 'sunita.desai@cleanliness.gov',
    phone: '+91 98765 43240',
    password: 'password123',
    department: 'Cleanliness',
    role: 'supervisor',
    designation: 'Head of Cleanliness Department',
    imageUrl: getRandomIndianAvatar(11)
  },
  {
    name: 'Ramesh Joshi',
    email: 'ramesh.joshi@cleanliness.gov',
    phone: '+91 98765 43241',
    password: 'password123',
    department: 'Cleanliness',
    role: 'worker',
    designation: 'Sanitation Worker',
    imageUrl: getRandomIndianAvatar(12)
  },
  {
    name: 'Lakshmi Pillai',
    email: 'lakshmi.pillai@cleanliness.gov',
    phone: '+91 98765 43242',
    password: 'password123',
    department: 'Cleanliness',
    role: 'worker',
    designation: 'Street Cleaner',
    imageUrl: getRandomIndianAvatar(13)
  },
  {
    name: 'Mohan Rao',
    email: 'mohan.rao@cleanliness.gov',
    phone: '+91 98765 43243',
    password: 'password123',
    department: 'Cleanliness',
    role: 'worker',
    designation: 'Public Area Cleaner',
    imageUrl: getRandomIndianAvatar(14)
  },
  
  // Dustbin Full Department
  {
    name: 'Deepak Verma',
    email: 'deepak.verma@dustbin.gov',
    phone: '+91 98765 43250',
    password: 'password123',
    department: 'Dustbin Full',
    role: 'supervisor',
    designation: 'Head of Waste Management',
    imageUrl: getRandomIndianAvatar(15)
  },
  {
    name: 'Ravi Gupta',
    email: 'ravi.gupta@dustbin.gov',
    phone: '+91 98765 43251',
    password: 'password123',
    department: 'Dustbin Full',
    role: 'worker',
    designation: 'Waste Collection Worker',
    imageUrl: getRandomIndianAvatar(16)
  },
  {
    name: 'Pooja Singh',
    email: 'pooja.singh@dustbin.gov',
    phone: '+91 98765 43252',
    password: 'password123',
    department: 'Dustbin Full',
    role: 'worker',
    designation: 'Garbage Truck Driver',
    imageUrl: getRandomIndianAvatar(17)
  },
  {
    name: 'Nikhil Tiwari',
    email: 'nikhil.tiwari@dustbin.gov',
    phone: '+91 98765 43253',
    password: 'password123',
    department: 'Dustbin Full',
    role: 'worker',
    designation: 'Waste Segregation Worker',
    imageUrl: getRandomIndianAvatar(0)
  },
  
  // Water Department
  {
    name: 'Suresh Reddy',
    email: 'suresh.reddy@water.gov',
    phone: '+91 98765 43260',
    password: 'password123',
    department: 'Water',
    role: 'supervisor',
    designation: 'Head of Water Department',
    imageUrl: getRandomIndianAvatar(1)
  },
  {
    name: 'Kiran Desai',
    email: 'kiran.desai@water.gov',
    phone: '+91 98765 43261',
    password: 'password123',
    department: 'Water',
    role: 'worker',
    designation: 'Water Supply Technician',
    imageUrl: getRandomIndianAvatar(2)
  },
  {
    name: 'Arjun Menon',
    email: 'arjun.menon@water.gov',
    phone: '+91 98765 43262',
    password: 'password123',
    department: 'Water',
    role: 'worker',
    designation: 'Pipe Maintenance Worker',
    imageUrl: getRandomIndianAvatar(3)
  },
  {
    name: 'Radha Krishnan',
    email: 'radha.krishnan@water.gov',
    phone: '+91 98765 43263',
    password: 'password123',
    department: 'Water',
    role: 'worker',
    designation: 'Water Quality Inspector',
    imageUrl: getRandomIndianAvatar(4)
  },
  
  // Streetlight Department
  {
    name: 'Naveen Choudhury',
    email: 'naveen.choudhury@streetlight.gov',
    phone: '+91 98765 43270',
    password: 'password123',
    department: 'Streetlight',
    role: 'supervisor',
    designation: 'Head of Streetlight Department',
    imageUrl: getRandomIndianAvatar(5)
  },
  {
    name: 'Manoj Tiwari',
    email: 'manoj.tiwari@streetlight.gov',
    phone: '+91 98765 43271',
    password: 'password123',
    department: 'Streetlight',
    role: 'worker',
    designation: 'Streetlight Maintenance Worker',
    imageUrl: getRandomIndianAvatar(6)
  },
  {
    name: 'Sarika Nair',
    email: 'sarika.nair@streetlight.gov',
    phone: '+91 98765 43272',
    password: 'password123',
    department: 'Streetlight',
    role: 'worker',
    designation: 'Electrical Repair Technician',
    imageUrl: getRandomIndianAvatar(7)
  },
  {
    name: 'Vishal Kumar',
    email: 'vishal.kumar@streetlight.gov',
    phone: '+91 98765 43273',
    password: 'password123',
    department: 'Streetlight',
    role: 'worker',
    designation: 'Pole Installation Worker',
    imageUrl: getRandomIndianAvatar(8)
  }
];

// Department information matching ReportIssueScreen categories
const departments = [
  {
    name: 'Road',
    code: 'ROAD',
    email: 'admin@road.gov',
    password: 'admin123',
    location: 'City Hall, Sector 12, Main Road, New Delhi - 110001',
    foundedDate: new Date('1985-01-15'),
    leaderName: 'Rajesh Kumar',
    leaderEmail: 'rajesh.kumar@road.gov',
    leaderPhone: '+91 98765 43210'
  },
  {
    name: 'Electricity',
    code: 'ELECTRICITY',
    email: 'admin@electricity.gov',
    password: 'admin123',
    location: 'Power House Complex, Industrial Area, New Delhi - 110020',
    foundedDate: new Date('1978-06-20'),
    leaderName: 'Priya Sharma',
    leaderEmail: 'priya.sharma@electricity.gov',
    leaderPhone: '+91 98765 43220'
  },
  {
    name: 'Sewage',
    code: 'SEWAGE',
    email: 'admin@sewage.gov',
    password: 'admin123',
    location: 'Water Works Building, Near Yamuna River, New Delhi - 110006',
    foundedDate: new Date('1990-03-10'),
    leaderName: 'Meera Nair',
    leaderEmail: 'meera.nair@sewage.gov',
    leaderPhone: '+91 98765 43230'
  },
  {
    name: 'Cleanliness',
    code: 'CLEANLINESS',
    email: 'admin@cleanliness.gov',
    password: 'admin123',
    location: 'Municipal Office, Civil Lines, New Delhi - 110054',
    foundedDate: new Date('1995-08-05'),
    leaderName: 'Sunita Desai',
    leaderEmail: 'sunita.desai@cleanliness.gov',
    leaderPhone: '+91 98765 43240'
  },
  {
    name: 'Dustbin Full',
    code: 'DUSTBIN_FULL',
    email: 'admin@dustbin.gov',
    password: 'admin123',
    location: 'Waste Management Center, Okhla Industrial Area, New Delhi - 110020',
    foundedDate: new Date('2000-11-12'),
    leaderName: 'Deepak Verma',
    leaderEmail: 'deepak.verma@dustbin.gov',
    leaderPhone: '+91 98765 43250'
  },
  {
    name: 'Water',
    code: 'WATER',
    email: 'admin@water.gov',
    password: 'admin123',
    location: 'Water Supply Office, Connaught Place, New Delhi - 110001',
    foundedDate: new Date('1982-04-18'),
    leaderName: 'Suresh Reddy',
    leaderEmail: 'suresh.reddy@water.gov',
    leaderPhone: '+91 98765 43260'
  },
  {
    name: 'Streetlight',
    code: 'STREETLIGHT',
    email: 'admin@streetlight.gov',
    password: 'admin123',
    location: 'Public Works Department, Karol Bagh, New Delhi - 110005',
    foundedDate: new Date('1988-09-25'),
    leaderName: 'Naveen Choudhury',
    leaderEmail: 'naveen.choudhury@streetlight.gov',
    leaderPhone: '+91 98765 43270'
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
    
    // Clear and reseed departments, but DO NOT wipe all citizen users
    await Department.deleteMany({});
    console.log('🧹 Cleared existing departments');

    // Remove only existing demo users (by email) to avoid duplicates, preserve real users
    const demoEmails = demoUsers.map(u => u.email);
    const removed = await User.deleteMany({ email: { $in: demoEmails } });
    console.log(`🧹 Removed ${removed.deletedCount || 0} existing demo users (preserved real users)`);
    
    // Create departments
    console.log('🏢 Creating departments...');
    for (const deptData of departments) {
      const hashedPassword = await Department.hashPassword(deptData.password);
      const department = new Department({
        name: deptData.name,
        code: deptData.code,
        email: deptData.email,
        passwordHash: hashedPassword,
        roles: ['department'],
        location: deptData.location,
        foundedDate: deptData.foundedDate,
        leaderName: deptData.leaderName,
        leaderEmail: deptData.leaderEmail,
        leaderPhone: deptData.leaderPhone
      });
      await department.save();
      console.log(`✅ Created department: ${deptData.name} (${deptData.code}) - Leader: ${deptData.leaderName}`);
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
