# 🚀 Quick Start - Build APK & Configure Backend

## Step 1: Configure API URL for All Devices

### Find Your Computer's IP Address:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
or
```bash
ip addr | grep "inet "
```

### Update API Configuration:

1. Open `apps/mobile/src/config/api.ts`
2. Change line 32 to use your IP:
   ```typescript
   export const API_BASE_URL = 'http://YOUR_IP_HERE:3000/api';
   ```
   Example: `'http://192.168.1.100:3000/api'`

3. Save the file

---

## Step 2: Build APK

### Option A: EAS Build (Cloud - Recommended) ⭐

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Navigate to mobile app
cd apps/mobile

# 4. Build APK
eas build --platform android --profile preview
```

Wait 10-20 minutes, then download the APK from the provided link.

### Option B: Local Build (Requires Android Studio)

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK location: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## Step 3: Start Backend Server

```bash
cd backend
npm start
```

Make sure:
- ✅ Backend is running on port 3000
- ✅ Firewall allows connections on port 3000
- ✅ Your device and computer are on the same Wi-Fi network

---

## Step 4: Test Connection

Before installing APK, test from your phone's browser:
```
http://YOUR_IP:3000/api/health
```

Should return: `{"status":"success","message":"Civic Connect API is running"}`

---

## 📱 Install APK on Android Device

1. Transfer APK to your phone (via USB, email, or cloud storage)
2. On your phone: Settings → Security → Enable "Install from Unknown Sources"
3. Open APK file and install
4. Open the app and test!

---

## 🌐 For Production (Deploy Backend Online)

### Quick Deploy Options:

**Railway (Easiest):**
1. Sign up at https://railway.app
2. New Project → Deploy from GitHub
3. Set environment variables (MONGODB_URI, JWT_SECRET)
4. Get your Railway URL
5. Update `apps/mobile/src/config/api.ts` with Railway URL

**Render:**
1. Sign up at https://render.com
2. New Web Service → Connect GitHub
3. Set environment variables
4. Deploy and get URL

**Heroku:**
```bash
cd backend
heroku create civic-connect-api
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

Then update API URL in `apps/mobile/src/config/api.ts` to your deployed URL.

---

## ✅ Checklist

- [ ] Found your computer's IP address
- [ ] Updated `apps/mobile/src/config/api.ts` with your IP
- [ ] Backend server is running
- [ ] Tested API from phone browser
- [ ] Built APK (EAS or local)
- [ ] Installed APK on device
- [ ] App connects to backend successfully

---

## 🆘 Troubleshooting

**"Network request failed":**
- Check API URL uses your IP (not localhost)
- Ensure backend is running
- Check firewall settings
- Ensure same Wi-Fi network

**APK won't install:**
- Enable "Install from Unknown Sources" in Android settings

**Backend not accessible:**
- Check backend is running: `curl http://YOUR_IP:3000/api/health`
- Check firewall allows port 3000
- Try accessing from mobile browser first

---

For detailed instructions, see `BUILD_GUIDE.md`
