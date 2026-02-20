// API Configuration
// This file allows you to easily change the API URL for different environments
import { Platform } from 'react-native';

// ============================================
// CONFIGURATION - Change these values as needed
// ============================================

// Option 1: Use your local machine's IP address (for testing on physical devices)
// Find your IP: 
//   Windows: ipconfig (look for IPv4 Address)
//   Mac/Linux: ifconfig or ip addr (look for inet)
// Example: 'http://192.168.1.100:3000/api'

// Option 2: Use a deployed backend URL (for production)
// Example: 'https://your-backend-domain.com/api'

// Option 3: Use localhost/emulator (default - only works on emulator)
const LOCAL_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'  // Android Emulator
  : 'http://localhost:3000/api';  // iOS Simulator

// ============================================
// CHANGE THIS TO YOUR BACKEND URL
// ============================================
// For physical devices on same network, use your computer's local IP:
// Example: 'http://192.168.1.100:3000/api'
// 
// For production/deployed backend:
// Example: 'https://api.civicconnect.com/api'

export const API_BASE_URL = 'http://172.21.161.251:3000/api';

// Alternative: Use environment variable (recommended for production)
// Uncomment and set EXPO_PUBLIC_API_URL in your .env file
// export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL;

// ============================================
// HELPER: Get your local IP address
// ============================================
// Run this command to find your local IP:
// Windows: ipconfig | findstr IPv4
// Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
// Then update API_BASE_URL above with that IP
