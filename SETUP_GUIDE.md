# Civic Connect - Backend Integration Setup Guide

This guide will help you set up the Node.js backend with MongoDB and connect it to your React Native mobile app.

## 🏗️ Backend Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

The backend uses a `config.env` file. Copy it to `.env`:

```bash
cp config.env .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/civic-connect

# JWT Secret (for future authentication)
JWT_SECRET=your-super-secret-jwt-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:8081
```

### 3. Install and Start MongoDB

#### Option A: Local MongoDB Installation

**macOS (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civic-connect
```

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

## 📱 Mobile App Configuration

### 1. Update API URL (if needed)

The mobile app is already configured to use `http://localhost:3000/api`. If you're testing on a physical device, update the API URL in `apps/mobile/src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

### 2. Test the Integration

1. Start your mobile app: `npx expo start`
2. Navigate through the report flow
3. Fill out the report form
4. Click "Submit Report" on the preview screen
5. Check the backend console for the submitted report

## 🧪 Testing the API

### Test with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Submit a test report
curl -X POST http://localhost:3000/api/reports/submit \
  -H "Content-Type: application/json" \
  -d '{
    "reporter": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "1234567890",
      "userId": "USR-001"
    },
    "issue": {
      "category": "Road",
      "subcategory": "Pothole",
      "description": "Large pothole on main street"
    },
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }'
```

### Test with Postman:

1. Import the API endpoints
2. Set base URL to `http://localhost:3000/api`
3. Test the `/reports/submit` endpoint

## 📊 Database Schema

The Report model includes:

- **Report ID**: Auto-generated unique identifier
- **Reporter Info**: Name, email, phone, user ID
- **Issue Details**: Category, subcategory, description, photos
- **Location**: GPS coordinates, address, accuracy
- **Assignment**: Department, assigned person, contact info
- **Status Tracking**: Draft, submitted, in progress, resolved, closed
- **Timestamps**: Created, updated, submitted dates

## 🔧 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **CORS Issues**
   - Update `CORS_ORIGIN` in `.env`
   - Ensure mobile app URL matches

3. **API Not Responding**
   - Check if backend server is running
   - Verify port 3000 is not in use
   - Check console for error messages

4. **Mobile App Can't Connect**
   - Use computer's IP address instead of localhost
   - Check firewall settings
   - Ensure both devices are on same network

### Debug Steps:

1. Check backend console for errors
2. Verify MongoDB connection
3. Test API endpoints with curl/Postman
4. Check mobile app console for network errors
5. Verify environment variables

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas or production MongoDB instance
3. Set up proper CORS origins
4. Use environment-specific JWT secrets
5. Set up SSL/HTTPS
6. Configure proper logging and monitoring

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/reports/submit` - Submit new report
- `GET /api/reports` - Get all reports (paginated)
- `GET /api/reports/:reportId` - Get specific report
- `PATCH /api/reports/:reportId/status` - Update report status
- `GET /api/reports/location/nearby` - Get nearby reports

## 🎉 Success!

Once everything is set up:

1. ✅ Backend server running on port 3000
2. ✅ MongoDB connected and accessible
3. ✅ Mobile app can submit reports
4. ✅ Reports saved to database
5. ✅ Success/error messages displayed

Your Civic Connect app is now fully integrated with a backend database! 🎊
