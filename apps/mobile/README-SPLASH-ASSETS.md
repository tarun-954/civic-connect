# Splash & Assets

- Replace the illustration in `SplashScreen` by removing the placeholder and adding an image:

```tsx
<Image source={require('./assets/splash-illustration.png')} style={{ width: '100%', height: 340, resizeMode: 'contain' }} />
```

- Place your file at `apps/mobile/src/screens/assets/splash-illustration.png` (create the folder if missing)
- Update `app.json` icon, splash, and adaptive icon by placing files under `apps/mobile/assets/`:
  - `icon.png` – 1024x1024
  - `splash.png` – 1242x2436 (or larger), centered, transparent background recommended
  - `adaptive-icon.png` – foreground image for Android
  - `favicon.png` – for web

After replacing, run:

```bash
npm run dev:mobile
```
