# Blynk Smart Dustbin Integration

## Overview
This integration allows the Civic Connect app to fetch and display real-time data from smart dustbins connected via ESP32 and Blynk IoT platform.

## Components

### 1. Backend Service (`backend/services/blynkService.js`)
- Fetches data from Blynk cloud API
- Supports multiple virtual pins (V0-V4)
- Provides formatted dustbin status with fill percentage, distance, status level, etc.

### 2. Backend Routes (`backend/routes/dustbinRoutes.js`)
- `GET /api/dustbins/status` - Get current dustbin status
- `GET /api/dustbins/all` - Get status of multiple dustbins
- `GET /api/dustbins/pin/:pin` - Get value from a specific Blynk pin

### 3. Mobile API Service (`apps/mobile/src/services/api.ts`)
- `ApiService.getDustbinStatus(deviceId?)` - Fetch single dustbin status
- `ApiService.getAllDustbins(deviceIds?)` - Fetch multiple dustbins
- `ApiService.getDustbinPin(pin, deviceId?)` - Fetch specific pin value

### 4. Mobile Screen (`apps/mobile/src/screens/SmartDustbinScreen.tsx`)
- Real-time dustbin status display
- Fill percentage with visual progress bar
- Status indicators (Empty, Warning, Full)
- Auto-refresh every 30 seconds
- Pull-to-refresh support

### 5. ESP32 Code (`backend/ESP32_BLYNK_CODE.ino`)
- Updated ESP32 code that sends data to Blynk
- Uses Blynk library for cloud connectivity
- Maps virtual pins:
  - V0: Fill percentage (0-100)
  - V1: Distance in cm
  - V2: Status (0=empty, 1=warning, 2=full)
  - V3: Timestamp
  - V4: Location label

## Blynk Configuration

### Current Settings:
- **Template ID**: `TMPL3ha6B5e7d`
- **Template Name**: `tarun choudaruy`
- **Auth Token**: `vvxZw6IiQg1ErbDNfDlhYyfq-Ed5Mlm7`

### Virtual Pins:
- **V0**: Fill Percentage (0-100)
- **V1**: Distance (cm)
- **V2**: Status (0/1/2)
- **V3**: Timestamp
- **V4**: Location Label

## Setup Instructions

### 1. Install Blynk Library for ESP32
In Arduino IDE:
1. Go to `Tools` > `Manage Libraries`
2. Search for "Blynk"
3. Install "Blynk" by Volodymyr Shymanskyy

### 2. Configure ESP32 Code
1. Update WiFi credentials in `ESP32_BLYNK_CODE.ino`:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
   ```

2. Update Blynk credentials (already set):
   ```cpp
   #define BLYNK_AUTH_TOKEN "vvxZw6IiQg1ErbDNfDlhYyfq-Ed5Mlm7"
   ```

3. Adjust dustbin height if needed:
   ```cpp
   const float binHeightCm = 80.0; // Your dustbin height in cm
   ```

### 3. Upload to ESP32
1. Connect ESP32 to computer
2. Select board: `Tools` > `Board` > `ESP32 Dev Module`
3. Select port: `Tools` > `Port` > `COMx` (your port)
4. Upload the code

### 4. Test Backend Connection
```bash
# Test dustbin status endpoint
curl http://localhost:3000/api/dustbins/status

# Test specific pin
curl http://localhost:3000/api/dustbins/pin/V0
```

### 5. Access in Mobile App
Navigate to Smart Dustbin screen:
```typescript
navigation.navigate('SmartDustbin');
```

## Usage

### From Mobile App:
1. Open the app
2. Navigate to Smart Dustbin screen (add button in HomeScreen or DepartmentDashboardScreen)
3. View real-time fill level, status, and location
4. Pull down to refresh manually
5. Screen auto-refreshes every 30 seconds

### From Backend API:
```javascript
// Get single dustbin status
const status = await blynkService.getDustbinStatus();

// Get multiple dustbins
const dustbins = await blynkService.getMultipleDustbins(['device1', 'device2']);

// Get specific pin value
const fillLevel = await blynkService.getPinValue('V0');
```

## Status Levels

- **Empty** (0-50%): Green, normal operation
- **Medium** (50-90%): Blue, monitoring
- **Warning** (90-100%): Orange, needs attention soon
- **Full** (100%+): Red, immediate action required

## Troubleshooting

### ESP32 not connecting to Blynk:
1. Check WiFi credentials
2. Verify Blynk auth token
3. Check serial monitor for error messages
4. Ensure ESP32 has internet connection

### Backend not fetching data:
1. Check Blynk server is accessible: `https://blynk.cloud`
2. Verify auth token in `blynkService.js`
3. Check backend logs for API errors
4. Test Blynk API directly: `https://blynk.cloud/external/api/get?token=YOUR_TOKEN&V0`

### Mobile app showing errors:
1. Verify backend is running
2. Check API base URL in `api.ts`
3. Ensure network connectivity
4. Check device logs for fetch errors

## Notes

- The ESP32 code also includes Twilio SMS alerts (optional)
- Blynk data is fetched in real-time, no local caching
- Multiple dustbins can be monitored by providing device IDs
- The system automatically resets alert flags when dustbin is emptied (fill < 80%)

