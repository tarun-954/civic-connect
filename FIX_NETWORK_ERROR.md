# Fix: Network Request Failed on Android APK

## Problem
Android 9+ blocks HTTP (cleartext) traffic by default for security. This causes "Network request failed" errors when trying to connect to your backend using HTTP.

## ✅ Solution Applied

I've added a network security configuration to allow HTTP connections:

1. **Created** `apps/mobile/android/app/src/main/res/xml/network_security_config.xml`
   - Allows cleartext HTTP traffic for your IP address
   - Allows localhost and emulator IPs

2. **Updated** `apps/mobile/android/app/src/main/AndroidManifest.xml`
   - Added `android:networkSecurityConfig="@xml/network_security_config"`
   - Added `android:usesCleartextTraffic="true"`

## 🔨 Rebuild APK

**You MUST rebuild the APK** for these changes to take effect:

```bash
cd apps/mobile/android
./gradlew clean
./gradlew assembleRelease
```

Or if using Gradle wrapper:
```bash
cd apps/mobile/android
gradlew.bat clean
gradlew.bat assembleRelease
```

The new APK will be at:
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## ✅ Verification Steps

1. **Backend is running:**
   ```bash
   cd backend
   npm start
   ```
   Should show: `🌐 Network access: http://172.21.161.251:3000/api`

2. **Test from phone browser:**
   ```
   http://172.21.161.251:3000/api/health
   ```
   Should return: `{"status":"success","message":"Civic Connect API is running"}`

3. **Install new APK** and test login

## 🔍 Additional Troubleshooting

### If still not working:

1. **Check backend is accessible:**
   - From phone browser: `http://172.21.161.251:3000/api/health`
   - If this fails, it's a network/firewall issue, not the app

2. **Verify IP address:**
   ```bash
   ipconfig
   ```
   Make sure IP matches `172.21.161.251`

3. **Check firewall:**
   ```bash
   netsh advfirewall firewall add rule name="Node.js Port 3000" dir=in action=allow protocol=TCP localport=3000
   ```

4. **Verify same Wi-Fi:**
   - Phone and computer must be on same network

5. **Check backend logs:**
   - When you try to login, check backend console for incoming requests
   - If no requests appear, it's a network issue
   - If requests appear but fail, it's an API issue

## 📝 Notes

- The network security config allows HTTP for development
- For production, use HTTPS instead of HTTP
- Update `apps/mobile/src/config/api.ts` to use HTTPS URL when deploying
