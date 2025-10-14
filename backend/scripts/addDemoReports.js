const mongoose = require('mongoose');
const Report = require('../models/Report');
require('dotenv').config({ path: './.env' });

// Demo reports with realistic data
const demoReports = [
  {
    reportId: 'RPT-DEMO001-STREETLIGHT',
    trackingCode: 'TRK-DEMO001-STREETLIGHT',
    status: 'submitted',
    priority: 'medium',
    reporter: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0123',
      userId: 'user_demo_001'
    },
    issue: {
      category: 'Infrastructure',
      subcategory: 'Street Lighting',
      description: 'Street light on Main Street has been flickering for the past week. It goes on and off randomly, making it unsafe for pedestrians at night.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
          filename: 'streetlight_flickering.jpg',
          size: 245760,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main Street, New York, NY',
      accuracy: 5.0
    },
    assignment: {
      department: 'Public Works',
      assignedPerson: 'Mike Rodriguez',
      contactEmail: 'mike.rodriguez@city.gov',
      contactPhone: '+1-555-0100',
      estimatedResolution: '2-3 business days',
      assignedAt: new Date()
    },
    likes: ['john.doe@email.com', 'jane.smith@email.com'],
    dislikes: [],
    comments: [
      {
        byEmail: 'john.doe@email.com',
        byName: 'John Doe',
        text: 'I noticed this too! Very dangerous for night walkers.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ]
  },
  {
    reportId: 'RPT-DEMO002-POTHOLES',
    trackingCode: 'TRK-DEMO002-POTHOLES',
    status: 'in_progress',
    priority: 'high',
    reporter: {
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1-555-0124',
      userId: 'user_demo_002'
    },
    issue: {
      category: 'Roads & Sidewalks',
      subcategory: 'Potholes',
      description: 'Large pothole on Oak Avenue near the intersection with Pine Street. It\'s getting bigger and could damage vehicles.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          filename: 'pothole_oak_ave.jpg',
          size: 312000,
          uploadedAt: new Date()
        },
        {
          uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
          filename: 'pothole_closeup.jpg',
          size: 298000,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7589,
      longitude: -73.9851,
      address: '456 Oak Avenue, New York, NY',
      accuracy: 3.0
    },
    assignment: {
      department: 'Transportation',
      assignedPerson: 'Lisa Thompson',
      contactEmail: 'lisa.thompson@city.gov',
      contactPhone: '+1-555-0101',
      estimatedResolution: '1-2 business days',
      assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    likes: ['sarah.johnson@email.com', 'mike.wilson@email.com', 'anna.brown@email.com'],
    dislikes: ['complainer@email.com'],
    comments: [
      {
        byEmail: 'sarah.johnson@email.com',
        byName: 'Sarah Johnson',
        text: 'This pothole is really bad! I almost hit it yesterday.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        byEmail: 'mike.wilson@email.com',
        byName: 'Mike Wilson',
        text: 'City should fix this ASAP before someone gets hurt.',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      }
    ]
  },
  {
    reportId: 'RPT-DEMO003-GARBAGE',
    trackingCode: 'TRK-DEMO003-GARBAGE',
    status: 'resolved',
    priority: 'low',
    reporter: {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1-555-0125',
      userId: 'user_demo_003'
    },
    issue: {
      category: 'Sanitation',
      subcategory: 'Garbage Collection',
      description: 'Garbage bins on Elm Street are overflowing and haven\'t been collected for over a week. There\'s a bad smell and it\'s attracting pests.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          filename: 'overflowing_garbage.jpg',
          size: 267000,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7505,
      longitude: -73.9934,
      address: '789 Elm Street, New York, NY',
      accuracy: 4.0
    },
    assignment: {
      department: 'Sanitation',
      assignedPerson: 'Carlos Martinez',
      contactEmail: 'carlos.martinez@city.gov',
      contactPhone: '+1-555-0102',
      estimatedResolution: 'Same day',
      assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    resolution: {
      description: 'Garbage bins have been emptied and cleaned. Regular collection schedule has been restored.',
      resolvedBy: 'Carlos Martinez',
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    likes: ['john.doe@email.com', 'sarah.johnson@email.com'],
    dislikes: [],
    comments: [
      {
        byEmail: 'john.doe@email.com',
        byName: 'John Doe',
        text: 'Great job getting this fixed quickly!',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]
  },
  {
    reportId: 'RPT-DEMO004-PARK',
    trackingCode: 'TRK-DEMO004-PARK',
    status: 'submitted',
    priority: 'medium',
    reporter: {
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+1-555-0126',
      userId: 'user_demo_004'
    },
    issue: {
      category: 'Parks & Recreation',
      subcategory: 'Playground Equipment',
      description: 'The swing set in Central Park playground has a broken chain. One of the swings is hanging loose and could be dangerous for children.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          filename: 'broken_swing.jpg',
          size: 289000,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      address: 'Central Park Playground, New York, NY',
      accuracy: 2.0
    },
    assignment: {
      department: 'Parks & Recreation',
      assignedPerson: 'Jennifer Lee',
      contactEmail: 'jennifer.lee@city.gov',
      contactPhone: '+1-555-0103',
      estimatedResolution: '3-5 business days',
      assignedAt: new Date()
    },
    likes: ['emily.davis@email.com', 'michael.chen@email.com'],
    dislikes: [],
    comments: [
      {
        byEmail: 'emily.davis@email.com',
        byName: 'Emily Davis',
        text: 'My kids love this playground. Hope it gets fixed soon!',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ]
  },
  {
    reportId: 'RPT-DEMO005-TRAFFIC',
    trackingCode: 'TRK-DEMO005-TRAFFIC',
    status: 'in_progress',
    priority: 'high',
    reporter: {
      name: 'Anna Brown',
      email: 'anna.brown@email.com',
      phone: '+1-555-0127',
      userId: 'user_demo_005'
    },
    issue: {
      category: 'Traffic & Safety',
      subcategory: 'Traffic Signals',
      description: 'Traffic light at the intersection of Broadway and 42nd Street is malfunctioning. The red light stays on too long, causing major traffic jams during rush hour.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
          filename: 'traffic_light_malfunction.jpg',
          size: 301000,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7580,
      longitude: -73.9855,
      address: 'Broadway & 42nd Street, New York, NY',
      accuracy: 1.0
    },
    assignment: {
      department: 'Transportation',
      assignedPerson: 'Robert Kim',
      contactEmail: 'robert.kim@city.gov',
      contactPhone: '+1-555-0104',
      estimatedResolution: 'Same day',
      assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    likes: ['david.wilson@email.com', 'sarah.johnson@email.com', 'mike.wilson@email.com'],
    dislikes: [],
    comments: [
      {
        byEmail: 'david.wilson@email.com',
        byName: 'David Wilson',
        text: 'This is causing chaos during rush hour!',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }
    ]
  },
  {
    reportId: 'RPT-DEMO006-WATER',
    trackingCode: 'TRK-DEMO006-WATER',
    status: 'submitted',
    priority: 'urgent',
    reporter: {
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '+1-555-0128',
      userId: 'user_demo_006'
    },
    issue: {
      category: 'Utilities',
      subcategory: 'Water Leak',
      description: 'Water is leaking from a broken hydrant on Maple Street. It\'s been running for 2 days and creating a large puddle on the sidewalk.',
      inputMode: 'text',
      photos: [
        {
          uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          filename: 'water_leak_hydrant.jpg',
          size: 278000,
          uploadedAt: new Date()
        }
      ]
    },
    location: {
      latitude: 40.7614,
      longitude: -73.9776,
      address: '321 Maple Street, New York, NY',
      accuracy: 2.0
    },
    assignment: {
      department: 'Water Department',
      assignedPerson: 'Tom Anderson',
      contactEmail: 'tom.anderson@city.gov',
      contactPhone: '+1-555-0105',
      estimatedResolution: 'Emergency - Same day',
      assignedAt: new Date()
    },
    likes: ['anna.brown@email.com', 'emily.davis@email.com'],
    dislikes: [],
    comments: [
      {
        byEmail: 'anna.brown@email.com',
        byName: 'Anna Brown',
        text: 'This is such a waste of water! Needs immediate attention.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ]
  }
];

async function addDemoReports() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing demo reports
    await Report.deleteMany({ reportId: { $regex: /^RPT-DEMO/ } });
    console.log('🗑️ Cleared existing demo reports');

    // Add new demo reports
    const createdReports = await Report.insertMany(demoReports);
    console.log(`✅ Added ${createdReports.length} demo reports`);

    // Display summary
    console.log('\n📊 Demo Reports Summary:');
    createdReports.forEach(report => {
      console.log(`- ${report.reportId}: ${report.issue.category} - ${report.issue.subcategory} (${report.status})`);
    });

    console.log('\n🎉 Demo data setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding demo reports:', error);
    process.exit(1);
  }
}

// Run the script
addDemoReports();


