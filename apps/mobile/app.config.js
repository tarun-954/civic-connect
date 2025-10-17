// Dynamic Expo config to inject Google Maps API key for Android
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    entryPoint: './index.js',
    name: 'Civic Connect',
    slug: 'civic-connect',
    scheme: 'civicconnect',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/images/logoimage.png',
    splash: {
      image: './src/images/logoimage.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    updates: { fallbackToCacheTimeout: 0 },
    assetBundlePatterns: ['**/*'],
    ios: {
      ...(config.ios || {}),
      supportsTablet: true
    },
    android: {
      ...(config.android || {}),
      adaptiveIcon: {
        foregroundImage: './src/images/logoimage.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.civic.connect',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.DETECT_SCREEN_CAPTURE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.DETECT_SCREEN_CAPTURE'
      ],
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey
        }
      }
    },
    web: {
      ...(config.web || {}),
      favicon: './src/images/logoimage.png'
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow Civic Connect to use your location to report issues accurately.'
        }
      ],
      'expo-font'
    ]
  };
};


