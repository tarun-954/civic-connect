// API Configuration
import { Platform } from 'react-native';

// Prefer emulator-friendly hosts to avoid timeouts:
// - Android Emulator: 10.0.2.2 maps to host machine's localhost
// - iOS Simulator: localhost works
// You can override this with a LAN IP if testing on a physical device
const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'
  : 'http://localhost:3000/api';
// API Service for Civic Connect
export class ApiService {
  static baseURL = API_BASE_URL;

  // Submit a new report
  static async submitReport(reportData: any): Promise<any> {
    try {
      const headers: any = { 'Content-Type': 'application/json', ...(await this.authHeaders()) };
      const response = await fetch(`${this.baseURL}/reports/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit report');
      }

      return result;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  // User signup
  static async signup(data: { name: string; email: string; phone: string; password: string; }): Promise<any> {
    // Use AbortController to prevent indefinite hanging on poor networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${this.baseURL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Prefer detailed validation errors from backend if present
        let message = (result && (result.message || result.error)) || `Signup failed (${response.status})`;
        if (Array.isArray(result?.errors) && result.errors.length > 0) {
          const fieldMessages = result.errors
            .map((e: any) => (e?.msg || e?.message || '').trim())
            .filter((m: string) => !!m);
          if (fieldMessages.length > 0) {
            message = fieldMessages.join('\n');
          }
        }
        throw new Error(message);
      }
      return result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Get all reports
  static async getReports(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/reports?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch reports');
      }

      return result;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get report by ID
  static async getReportById(reportId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/reports/${reportId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch report');
      }

      return result;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // Get report by tracking code
  static async getReportByTrackingCode(trackingCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/reports/tracking/${trackingCode}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch report');
      }

      return result;
    } catch (error) {
      console.error('Error fetching report by tracking code:', error);
      throw error;
    }
  }

  // Auth header helper
  static async authHeaders() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  // Get all reports (for nearby filtering)
  static async getAllReports(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch reports');
      }

      return result;
    } catch (error) {
      console.error('Error fetching all reports:', error);
      throw error;
    }
  }

  // Get my reports
  static async getMyReports(page: number = 1, limit: number = 10) {
    const headers = { ...(await this.authHeaders()) } as any;
    const res = await fetch(`${this.baseURL}/reports/mine?page=${page}&limit=${limit}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch your reports');
    return data;
  }

  static async likeReport(reportId: string) {
    const headers = { 'Content-Type': 'application/json', ...(await this.authHeaders()) } as any;
    const res = await fetch(`${this.baseURL}/reports/${reportId}/like`, { method: 'POST', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to like report');
    return data;
  }

  static async dislikeReport(reportId: string) {
    const headers = { 'Content-Type': 'application/json', ...(await this.authHeaders()) } as any;
    const res = await fetch(`${this.baseURL}/reports/${reportId}/dislike`, { method: 'POST', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to dislike report');
    return data;
  }

  static async addComment(reportId: string, text: string, byName?: string) {
    const headers = { 'Content-Type': 'application/json', ...(await this.authHeaders()) } as any;
    const res = await fetch(`${this.baseURL}/reports/${reportId}/comments`, { method: 'POST', headers, body: JSON.stringify({ text, byName }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add comment');
    return data;
  }

  // Get nearby reports
  static async getNearbyReports(latitude: number, longitude: number, radius: number = 1000): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseURL}/reports/location/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch nearby reports');
      }

      return result;
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
      throw error;
    }
  }

  // Update report status
  static async updateReportStatus(reportId: string, status: string, notes?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update report status');
      }

      return result;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'API health check failed');
      }

      return result;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }

  // Get user notifications
  static async getUserNotifications(): Promise<any> {
    try {
      const headers = { ...(await this.authHeaders()) } as any;
      const response = await fetch(`${this.baseURL}/notifications/user`, { headers });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }

      return result;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      const headers = { ...(await this.authHeaders()) } as any;
      const response = await fetch(`${this.baseURL}/notifications/user/${notificationId}/read`, {
        method: 'PATCH',
        headers
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }

      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadNotificationCount(): Promise<any> {
    try {
      const headers = { ...(await this.authHeaders()) } as any;
      const response = await fetch(`${this.baseURL}/notifications/user/unread-count`, { headers });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unread count');
      }

      return result;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Compress image before upload (simplified version)
  static async compressImage(imageUri: string): Promise<string> {
    // For now, return the original URI
    // In a production app, you would implement proper image compression here
    // using libraries like react-native-image-resizer or expo-image-manipulator
    console.log(`📏 Using original image (compression disabled): ${imageUri}`);
    return imageUri;
  }

  // Upload image to server with retry mechanism
  static async uploadImage(imageUri: string, retryCount: number = 0): Promise<string> {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // Exponential backoff

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Compress image before upload (with fallback)
      let compressedUri = imageUri;
      try {
        compressedUri = await this.compressImage(imageUri);
      } catch (compressionError) {
        console.warn('⚠️ Compression failed, using original image:', compressionError);
        compressedUri = imageUri;
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // For React Native, we need to create a file object
      const file = {
        uri: compressedUri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      } as any;
      
      formData.append('image', file);

      console.log(`📤 Uploading image (attempt ${retryCount + 1}/${maxRetries + 1})`);
      console.log(`📤 Original URI:`, imageUri);
      console.log(`📤 Compressed URI:`, compressedUri);
      console.log(`📤 File name:`, file.name);

      const response = await fetch(`${this.baseURL}/reports/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let React Native set it with boundary
        },
        body: formData,
      });

      console.log(`📤 Upload response status: ${response.status}`);
      
      let result;
      try {
        const text = await response.text();
        console.log(`📤 Upload response text:`, text);
        result = JSON.parse(text);
      } catch (parseError) {
        console.error(`❌ Failed to parse response:`, parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = result?.message || `Server error: ${response.status}`;
        console.error(`❌ Upload failed:`, errorMessage);
        throw new Error(errorMessage);
      }

      if (!result?.data?.url) {
        console.error(`❌ Response missing URL:`, result);
        throw new Error('Server response missing image URL');
      }

      console.log(`✅ Image uploaded successfully:`, result.data.url);
      return result.data.url;
    } catch (error: any) {
      console.error(`❌ Error uploading image (attempt ${retryCount + 1}):`, error);
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying upload in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.uploadImage(imageUri, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Upload multiple images in parallel with progress tracking
  static async uploadImages(images: Array<{ uri: string }>, onProgress?: (completed: number, total: number) => void): Promise<Array<{ uri: string; filename: string; size: number; uploadedAt: Date }>> {
    const uploadPromises = images.map(async (image, index) => {
      try {
        const uploadedUrl = await this.uploadImage(image.uri);
        onProgress?.(index + 1, images.length);
        return {
          uri: uploadedUrl,
          filename: `uploaded_${Date.now()}_${index}.jpg`,
          size: 0,
          uploadedAt: new Date()
        };
      } catch (error: any) {
        console.error(`❌ Failed to upload image ${index + 1}:`, error);
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        throw new Error(`Failed to upload image ${index + 1}/${images.length}: ${errorMessage}`);
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      console.log(`✅ All ${images.length} images uploaded successfully`);
      return results;
    } catch (error) {
      console.error('❌ One or more images failed to upload:', error);
      throw error;
    }
  }

  // Analyze image using ML service for pothole detection
  static async analyzeImage(imageUri: string): Promise<any> {
    try {
      const formData = new FormData();
      
      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `analysis_${Date.now()}.jpg`,
      } as any;
      
      formData.append('image', file);

      console.log(`🤖 Analyzing image for potholes:`, imageUri);

      const response = await fetch(`${this.baseURL}/reports/analyze-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        } as any,
        body: formData,
      });

      console.log(`🤖 Analysis response status: ${response.status}`);
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to analyze image');
      }

      console.log(`✅ Image analyzed successfully:`, result);
      return result;
    } catch (error: any) {
      console.error('❌ Error analyzing image:', error);
      throw error;
    }
  }
}

// Helper function to format report data for API submission
export const formatReportForSubmission = (reportData: any) => {
  return {
    reporter: {
      name: reportData.reporter?.name || 'Anonymous User',
      email: reportData.reporter?.email || 'user@example.com',
      phone: reportData.reporter?.phone || '+1234567890',
      userId: reportData.reporter?.userId || 'USR-ANONYMOUS'
    },
    issue: {
      category: reportData.issue?.category || 'General',
      subcategory: reportData.issue?.subcategory || 'Other',
      description: reportData.issue?.description || 'No description provided',
      inputMode: reportData.issue?.inputMode || 'text',
      hasVoiceRecording: reportData.issue?.hasVoiceRecording || false,
      photos: reportData.issue?.photos || [],
      priority: reportData.issue?.priority || null,
      severity: reportData.issue?.severity || null,
      mlAnalysis: reportData.issue?.mlAnalysis || null
    },
    location: {
      latitude: reportData.location?.latitude || 0,
      longitude: reportData.location?.longitude || 0,
      address: reportData.location?.address || 'Location not specified',
      accuracy: reportData.location?.accuracy || null
    },
    assignment: {
      department: reportData.assignment?.department || null,
      assignedTo: reportData.assignment?.assignedTo || null,
      assignedPerson: reportData.assignment?.assignedPerson || null,
      contactEmail: reportData.assignment?.contactEmail || null,
      contactPhone: reportData.assignment?.contactPhone || null,
      estimatedResolution: reportData.assignment?.estimatedResolution || null
    }
  };
};

// Department APIs
export class DepartmentService {
  static baseURL = API_BASE_URL;

  static async signup(payload: { name: string; code: string; email: string; password: string }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/departments/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Department signup failed');
      }
      return result;
    } catch (error) {
      console.error('Department signup error:', error);
      throw error;
    }
  }

  static async login(code: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/departments/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Department login failed');
      }
      return result;
    } catch (error) {
      console.error('Department login error:', error);
      throw error;
    }
  }

  static async getIssues(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      const response = await fetch(`${this.baseURL}/departments/issues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch issues');
      }
      return result;
    } catch (error) {
      console.error('Error fetching department issues:', error);
      throw error;
    }
  }

  static async updateIssueStatus(reportId: string, status: string, notes?: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      const response = await fetch(`${this.baseURL}/departments/issues/${reportId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update issue status');
      }
      return result;
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw error;
    }
  }

  static async getAnalytics(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      const response = await fetch(`${this.baseURL}/departments/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
      return result;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Get department officials (public endpoint, no auth required)
  static async getOfficials(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/departments/officials`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch officials');
      }
      return result;
    } catch (error) {
      console.error('Error fetching officials:', error);
      throw error;
    }
  }

  static async getNotifications(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      // Get department info from token
      const departmentInfo = await AsyncStorage.getItem('departmentInfo');
      if (!departmentInfo) throw new Error('No department info found');
      
      const dept = JSON.parse(departmentInfo);
      const response = await fetch(`${this.baseURL}/notifications/department/${dept.code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadNotificationCount(): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      // Get department info from token
      const departmentInfo = await AsyncStorage.getItem('departmentInfo');
      if (!departmentInfo) throw new Error('No department info found');
      
      const dept = JSON.parse(departmentInfo);
      const response = await fetch(`${this.baseURL}/notifications/department/${dept.code}/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unread count');
      }
      return result;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      // Get department info from token
      const departmentInfo = await AsyncStorage.getItem('departmentInfo');
      if (!departmentInfo) throw new Error('No department info found');
      
      const dept = JSON.parse(departmentInfo);
      const response = await fetch(`${this.baseURL}/notifications/department/${dept.code}/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async analyzePothole(imageUrl: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      const response = await fetch(`${this.baseURL}/departments/ml/analyze-pothole`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to analyze pothole');
      }
      return result;
    } catch (error) {
      console.error('Error analyzing pothole:', error);
      throw error;
    }
  }

  static async analyzePriority(imageUrl: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem('deptToken');
      if (!token) throw new Error('No department token found');
      
      const response = await fetch(`${this.baseURL}/departments/ml/ocr-priority`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to analyze priority');
      }
      return result;
    } catch (error) {
      console.error('Error analyzing priority:', error);
      throw error;
    }
  }
}

// OTP APIs
export class OtpService {
  static baseURL = API_BASE_URL;

  static async requestOtp(payload: { target: string; channel: 'phone' | 'email'; purpose: 'login' | 'signup'; }) {
    const response = await fetch(`${this.baseURL}/users/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to request OTP');
    }
    return result;
  }

  static async verifyOtp(payload: { target: string; purpose: 'login' | 'signup'; code: string; }) {
    const response = await fetch(`${this.baseURL}/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to verify OTP');
    }
    return result; // contains data.token
  }
}

// Simple user profile storage utilities (for reporter autofill)
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredUserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  userId?: string;
};

const USER_PROFILE_KEY = 'cc_user_profile';

export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  try {
    const existingRaw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const merged = { ...existing, ...profile };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage errors
  }
}

export async function getStoredUserProfile(): Promise<StoredUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Remote profile fetch using JWT
export async function fetchMyProfile(): Promise<StoredUserProfile | null> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) return null;
    const data = result?.data || {};
    const profile: StoredUserProfile = { name: data.name || undefined, email: data.email || undefined, phone: data.phone || undefined };
    // cache locally
    await saveUserProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

// Update user profile
export async function updateProfile(profileData: {
  name?: string;
  phone?: string;
  avatar?: string;
}): Promise<StoredUserProfile | null> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Updating profile with data:', profileData);
    console.log('API URL:', `${API_BASE_URL}/users/profile`);
    console.log('Token:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: Failed to update profile`);
    }

    const updatedProfile = {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      userId: result.data._id,
      avatar: result.data.avatar,
    };

    // Save updated profile to local storage
    await saveUserProfile(updatedProfile);
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Notification methods
export const NotificationApiService = {
  async getUserNotifications(): Promise<any> {
    try {
      const headers = await ApiService.authHeaders() as any;
      const response = await fetch(`${ApiService.baseURL}/notifications/user`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }

      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      const headers = await ApiService.authHeaders() as any;
      const response = await fetch(`${ApiService.baseURL}/notifications/user/${notificationId}/read`, {
        method: 'PATCH',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }

      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async getUnreadNotificationCount(): Promise<any> {
    try {
      const headers = await ApiService.authHeaders() as any;
      const response = await fetch(`${ApiService.baseURL}/notifications/user/unread-count`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch unread count');
      }

      return result;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
};
