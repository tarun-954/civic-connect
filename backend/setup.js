#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Civic Connect Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const configEnvPath = path.join(__dirname, 'config.env');

if (!fs.existsSync(envPath) && fs.existsSync(configEnvPath)) {
  console.log('📝 Creating .env file from config.env...');
  fs.copyFileSync(configEnvPath, envPath);
  console.log('✅ .env file created successfully!\n');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists!\n');
} else {
  console.log('⚠️  No .env file found. Please create one based on config.env\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Please run: npm install\n');
} else {
  console.log('✅ Dependencies already installed!\n');
}

// Display setup instructions
console.log('📋 Setup Instructions:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Update the MONGODB_URI in your .env file if needed');
console.log('3. Run: npm install (if not already done)');
console.log('4. Run: npm run dev (to start development server)');
console.log('5. The API will be available at http://localhost:3000/api\n');

console.log('🔗 API Endpoints:');
console.log('- Health Check: GET /api/health');
console.log('- Submit Report: POST /api/reports/submit');
console.log('- Get Reports: GET /api/reports');
console.log('- Get Report by ID: GET /api/reports/:reportId');
console.log('- Update Status: PATCH /api/reports/:reportId/status');
console.log('- Nearby Reports: GET /api/reports/location/nearby\n');

console.log('📱 Mobile App Configuration:');
console.log('Make sure your mobile app is configured to use:');
console.log('API_BASE_URL = "http://localhost:3000/api"');
console.log('(For physical device, use your computer\'s IP address)\n');

console.log('🎉 Setup complete! Happy coding!');
