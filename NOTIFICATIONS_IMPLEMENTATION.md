# Push Notifications Implementation

## Overview
Native push notifications have been implemented for the Civic Connect app. When a user submits a report, department users will receive a native notification that appears in the system notification drawer.

## Features Implemented

### 1. Native Notification Service
- **File**: `apps/mobile/src/services/notificationService.ts`
- Handles notification permissions
- Schedules and displays local notifications
- Manages notification listeners for user interaction

### 2. Notification Configuration
- **File**: `apps/mobile/app.json`
- Added `expo-notifications` plugin
- Configured notification icon and color

### 3. Report Submission Integration
- **File**: `apps/mobile/src/screens/ReportPreviewScreen.tsx`
- Triggers native notification when a report is successfully submitted
- Notification includes report details and tracking ID

### 4. App Initialization
- **File**: `apps/mobile/App.tsx`
- Requests notification permissions on app startup
- Sets up notification listeners for handling notification taps

## How It Works

1. **User submits a report** through the ReportPreviewScreen
2. **Backend processes** the report submission
3. **Native notification is triggered** with the following details:
   - Title: "New Report: [Category]"
   - Body: "Report #[Tracking ID] - [Description]"
   - Report ID and data embedded for navigation

4. **System notification appears** in the notification drawer
5. **Tapping the notification** allows the department user to view the report details

## Notification Content

When a department user receives a notification, they will see:
- **Title**: "New Report: [Category Name]"
- **Body**: "Report #TRACKING-ID\n[Description]"
- **Actions**: Tapping the notification opens it for viewing

## Testing

To test notifications:
1. Start the app and grant notification permissions
2. Submit a new report as a citizen user
3. Department users will receive a native notification
4. Pull down the notification drawer to see the notification
5. Tap the notification to navigate to the report

## Technical Details

### Permissions
- Android: Automatically requested via `expo-notifications`
- iOS: Requires user permission (handled automatically)

### Notification Behavior
- Shows alert banner when app is in foreground
- Plays sound when received
- Sets badge count
- Appears in system notification drawer
- Persists until user interacts with it

### Data Payload
```typescript
{
  reportId: string,
  reportData: {
    title, description, category, department, trackingId
  },
  type: 'new_report'
}
```

## Next Steps

Consider implementing:
1. Deep linking to navigate directly to the report
2. Rich notifications with images
3. Action buttons in notifications (e.g., "Mark as Resolved")
4. Notification preferences in settings
5. Sound customization
