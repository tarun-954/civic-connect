# Rebuild APK - Quick Guide

## ✅ Correct Command (PowerShell)

Since you're in PowerShell, use `.\` prefix:

```powershell
cd "d:\Civic connect\apps\mobile\android"
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

## 🔄 Alternative: Use EAS Build (Easier - Cloud Build)

If Gradle has issues, use EAS Build instead (builds in cloud):

```bash
# 1. Install EAS CLI (if not installed)
npm install -g eas-cli

# 2. Login
eas login

# 3. Navigate to mobile app
cd apps/mobile

# 4. Build APK (cloud build - no local Gradle needed)
eas build --platform android --profile preview
```

This will:
- Build in the cloud (no local Gradle issues)
- Generate APK download link
- Take 10-20 minutes

## 🛠️ Fix Gradle SSL Issue (If using local build)

If you want to fix the Gradle SSL certificate issue:

**Option 1: Use Android Studio**
1. Open Android Studio
2. Open project: `apps/mobile/android`
3. Build → Build Bundle(s) / APK(s) → Build APK(s)
4. APK will be in `app/build/outputs/apk/release/`

**Option 2: Fix Gradle SSL**
Add to `apps/mobile/android/gradle.properties`:
```properties
systemProp.javax.net.ssl.trustStore=NONE
systemProp.javax.net.ssl.trustStoreType=Windows-ROOT
```

Then try again:
```powershell
cd "d:\Civic connect\apps\mobile\android"
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

## 📍 APK Location After Build

After successful build:
```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

## ✅ Quick Test

After rebuilding, test:
1. Install new APK on device
2. Make sure backend is running: `cd backend && npm start`
3. Test login - should work now!

---

**Recommended: Use EAS Build** - It's easier and avoids local Gradle issues!
