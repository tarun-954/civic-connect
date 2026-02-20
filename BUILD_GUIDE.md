# Civic Connect - APK Build Guide

This guide will help you build an APK for Android devices and configure the backend to work on all mobile devices.

## 📱 Building APK for Android

### Prerequisites
1. **Expo CLI** installed globally:
   ```bash
   npm install -g expo-cli
   ```

2. **EAS CLI** (recommended for modern Expo projects):
   ```bash
   npm install -g eas-cli
   ```

3. **Expo Account** (free): Sign up at https://expo.dev

### Method 1: Using EAS Build (Recommended)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS Build**:
   ```bash
   cd apps/mobile
   eas build:configure
   ```

4. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   
   This will:
   - Build your app in the cloud
   - Generate a download link for the APK
   - Take about 10-20 minutes

5. **Download APK**: After build completes, download the APK from the provided link and install on any Android device.

### Method 2: Local Build (Requires Android Studio)

1. **Install Android Studio**:
   - Download from https://developer.android.com/studio
   - Install Android SDK and build tools

2. **Generate Native Project**:
   ```bash
   cd apps/mobile
   npx expo prebuild --platform android
   ```

3. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Find APK**: The APK will be at:
   ```
   apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

### Method 3: Using Expo Build (Legacy)

```bash
cd apps/mobile
expo build:android -t apk
```

---

## 🌐 Making Backend Accessible on All Devices

### Option 1: Use Your Local IP Address (For Testing)

1. **Find Your Computer's IP Address**:
   - **Windows**: Open Command Prompt and run:
     ```bash
     ipconfig
     ```
     Look for "IPv4 Address" (e.g., `192.168.1.100`)
   
   - **Mac/Linux**: Open Terminal and run:
     ```bash
     ifconfig
     ```
     or
     ```bash
     ip addr
     ```
     Look for `inet` address (not 127.0.0.1)

2. **Update API Configuration**:
   - Open `apps/mobile/src/config/api.ts`
   - Change `API_BASE_URL` to use your IP:
     ```typescript
     export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
     // Example: 'http://192.168.1.100:3000/api'
     ```

3. **Ensure Backend is Accessible**:
   - Make sure your backend server is running:
     ```bash
     cd backend
     npm start
     ```
   
   - Ensure firewall allows connections on port 3000
   - All devices must be on the same Wi-Fi network

### Option 2: Deploy Backend to Cloud (For Production)

#### Using Heroku (Free Tier Available):

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   cd backend
   heroku create civic-connect-api
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_secret_key
   ```

4. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a civic-connect-api
   git push heroku main
   ```

5. **Update API URL**:
   - Open `apps/mobile/src/config/api.ts`
   - Change to:
     ```typescript
     export const API_BASE_URL = 'https://civic-connect-api.herokuapp.com/api';
     ```

#### Using Railway (Free Tier Available):

1. **Sign up** at https://railway.app
2. **Create new project** → Deploy from GitHub
3. **Set environment variables** (MONGODB_URI, JWT_SECRET)
4. **Get your Railway URL** and update `apps/mobile/src/config/api.ts`

#### Using Render (Free Tier Available):

1. **Sign up** at https://render.com
2. **Create Web Service** → Connect GitHub repo
3. **Set environment variables**
4. **Deploy** and get URL

---

## 🔧 Configuration Steps Summary

### For Development (Local Network):

1. **Find your IP**: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Update** `apps/mobile/src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = 'http://YOUR_IP:3000/api';
   ```
3. **Start backend**: `cd backend && npm start`
4. **Rebuild app** with new API URL

### For Production:

1. **Deploy backend** to cloud (Heroku/Railway/Render)
2. **Update** `apps/mobile/src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = 'https://your-backend-url.com/api';
   ```
3. **Build APK** with production API URL

---

## 📝 Environment Variables (Optional)

For easier configuration, you can use environment variables:

1. **Create** `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
   ```

2. **Update** `apps/mobile/src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL;
   ```

3. **Restart Expo**: Environment variables require restart

---

## ✅ Testing Checklist

Before distributing your APK:

- [ ] Backend is accessible from mobile device
- [ ] API URL is correctly configured
- [ ] All API endpoints work correctly
- [ ] App can connect to backend
- [ ] Login/signup works
- [ ] Report submission works
- [ ] Notifications work
- [ ] Location services work

---

## 🚀 Quick Start Commands

```bash
# 1. Configure API URL
# Edit apps/mobile/src/config/api.ts

# 2. Build APK (EAS Build)
cd apps/mobile
eas build --platform android --profile preview

# 3. Or build locally
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

---

## 📞 Troubleshooting

### "Network request failed" on physical device:
- ✅ Check API URL is using your computer's IP (not localhost)
- ✅ Ensure backend is running
- ✅ Check firewall settings
- ✅ Ensure device and computer are on same Wi-Fi

### APK won't install:
- ✅ Enable "Install from Unknown Sources" in Android settings
- ✅ Check APK is for correct architecture (arm64-v8a, armeabi-v7a, x86)

### Backend not accessible:
- ✅ Check backend is running: `curl http://YOUR_IP:3000/api/health`
- ✅ Check firewall allows port 3000
- ✅ Try accessing from mobile browser first

---

## 📚 Additional Resources

- Expo Build Docs: https://docs.expo.dev/build/introduction/
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Heroku Deployment: https://devcenter.heroku.com/articles/getting-started-with-nodejs
- Railway Deployment: https://docs.railway.app/
