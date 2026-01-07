import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  LoginScreen: undefined;
  DepartmentLoginScreen: undefined;
  SignUp: undefined;
  CitizenTabs: undefined;
  DepartmentTabs: undefined;
  ReportIssue: undefined;
  ReportLocation: undefined;
  TrackReport: { prefilledTrackingId?: string } | undefined;
  Departments: undefined;
  SmartDustbin: undefined;
  Notifications: undefined;
  ResolutionReview: {
    reportId: string;
    trackingId?: string;
    photos: Array<{ uri: string; filename?: string; uploadedAt?: string }>;
    qualityCheck?: {
      status?: 'pass' | 'fail' | 'unknown';
      confidence?: number;
      summary?: string;
    };
    canRespond: boolean;
  };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();


