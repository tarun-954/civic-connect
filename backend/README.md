# Civic Connect Backend API

A Node.js backend API for the Civic Connect mobile application, built with Express.js and MongoDB.

## Features

- 📝 Report submission and management
- 🗄️ MongoDB database integration
- 🔒 Security middleware (Helmet, Rate limiting)
- ✅ Input validation
- 📍 Location-based queries
- 📊 Pagination support
- 🏥 Health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example config file
cp config.env .env

# Edit the .env file with your configuration
```

4. Start MongoDB (if running locally):
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

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

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Reports
- `POST /api/reports/submit` - Submit a new report
- `GET /api/reports` - Get all reports (with pagination)
- `GET /api/reports/:reportId` - Get a specific report
- `PATCH /api/reports/:reportId/status` - Update report status
- `GET /api/reports/location/nearby` - Get reports near a location

## Report Submission Format

```json
{
  "reporter": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "userId": "USR-2024-001"
  },
  "issue": {
    "category": "Sewage",
    "subcategory": "Sewage overflow",
    "description": "Sewage overflow in the street",
    "inputMode": "text",
    "hasVoiceRecording": false,
    "photos": [
      {
        "uri": "file://path/to/image.jpg",
        "filename": "image1.jpg",
        "size": 1024000
      }
    ]
  },
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "New Delhi, India",
    "accuracy": 10
  },
  "assignment": {
    "department": "Sanitation Department",
    "assignedTo": "Sewage Management Team",
    "assignedPerson": "Engineer David Chen",
    "contactEmail": "david@municipal.gov",
    "contactPhone": "+1234567890",
    "estimatedResolution": "3-5 business days"
  }
}
```

## Database Schema

The Report model includes the following fields:

- **Report Identification**: reportId, trackingCode
- **Status**: status, priority, timestamps
- **Reporter Info**: name, email, phone, userId
- **Issue Details**: category, subcategory, description, photos
- **Location**: latitude, longitude, address, accuracy
- **Assignment**: department, assigned person, contact info
- **Resolution**: resolution details, notes

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

### Database Connection

The application will automatically connect to MongoDB on startup. Make sure MongoDB is running and the connection string in your environment variables is correct.

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Express-validator for request validation
- **Error Handling**: Global error handler with proper error responses

## Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Submit a report
curl -X POST http://localhost:3000/api/reports/submit \
  -H "Content-Type: application/json" \
  -d '{"reporter":{"name":"Test User","email":"test@example.com","phone":"1234567890","userId":"USR-001"},"issue":{"category":"Road","subcategory":"Pothole","description":"Large pothole on main street"},"location":{"latitude":28.6139,"longitude":77.2090}}'
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your environment variables
   - Verify network connectivity

2. **Port Already in Use**
   - Change the PORT in your environment variables
   - Kill any process using port 3000

3. **CORS Issues**
   - Update CORS_ORIGIN in environment variables
   - Ensure the mobile app is using the correct API URL

## License

MIT License
