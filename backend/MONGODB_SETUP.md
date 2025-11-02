# MongoDB Setup Guide

## Problem: "No officials" showing in carousel

This happens when MongoDB is not running or the database is not seeded with officials data.

## Solution Steps

### Step 1: Install MongoDB (if not installed)

#### Option A: Install MongoDB Community Edition (Windows)

1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows service

#### Option B: Use MongoDB Atlas (Cloud - Free Tier Available)

1. Sign up at: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civic-connect
   ```

#### Option C: Use Docker (if you have Docker installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 2: Start MongoDB

#### Windows (if installed as service):
```powershell
net start MongoDB
```

#### Or manually:
```powershell
# Navigate to MongoDB bin directory (usually C:\Program Files\MongoDB\Server\<version>\bin)
mongod --dbpath "C:\data\db"
```

### Step 3: Verify MongoDB is Running

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB*

# Or test connection
mongosh
```

### Step 4: Seed the Database

Once MongoDB is running, seed the database with officials:

```powershell
cd backend
node scripts/seedDemoUsers.js
```

You should see:
```
🌱 Starting to seed demo users and departments...
✅ Connected to MongoDB
🧹 Cleared existing data
🏢 Creating departments...
✅ Created department: ...
👥 Creating demo users...
✅ Created user: Rajesh Kumar ...
🎉 Demo data seeding completed successfully!
```

### Step 5: Start the Backend Server

Make sure the backend server is running:

```powershell
cd backend
npm start
# or
npm run dev
```

### Step 6: Verify Officials Endpoint

Test the API endpoint:
```powershell
# In a browser or use curl
curl http://localhost:3000/api/departments/officials
```

You should get a response with officials array.

### Step 7: Check Mobile App

The mobile app should now show officials in the carousel. If it still doesn't show:
1. Make sure backend server is running on port 3000
2. Make sure mobile app API base URL is correct (check `apps/mobile/src/services/api.ts`)
3. Restart the mobile app

## Troubleshooting

### Error: "connect ECONNREFUSED"

- MongoDB is not running
- Check if MongoDB service is started: `Get-Service MongoDB*`
- Start MongoDB: `net start MongoDB`

### Error: "Authentication failed"

- Check your MongoDB connection string in `.env` file
- For local MongoDB, you might not need username/password
- For MongoDB Atlas, make sure your IP is whitelisted

### Empty officials array

- Database is not seeded: Run `node scripts/seedDemoUsers.js`
- Check if users exist: Connect to MongoDB and run `db.users.find({role: {$in: ['supervisor', 'worker']}})`

### Mobile app shows "No officials available"

1. Check backend logs for errors
2. Verify API endpoint returns data: `curl http://localhost:3000/api/departments/officials`
3. Check mobile app console for API errors
4. Verify API base URL in mobile app matches your backend URL

## Quick Check Commands

```powershell
# Check MongoDB service
Get-Service MongoDB*

# Start MongoDB
net start MongoDB

# Seed database
cd backend
node scripts/seedDemoUsers.js

# Check if backend is running
curl http://localhost:3000/api/health

# Test officials endpoint
curl http://localhost:3000/api/departments/officials
```

