import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
declare const process: any;
import { ApiService, formatReportForSubmission, getStoredUserProfile, fetchMyProfile } from '../services/api';
import NotificationService from '../services/notificationService';

const { width } = Dimensions.get('window');

interface ReportPreviewScreenProps {
  navigation: any;
  route: any;
}

const ReportPreviewScreen: React.FC<ReportPreviewScreenProps> = ({ navigation, route }) => {
  const { reportData } = route.params || {};
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  
  // Generate report ID and other metadata
  const generateReportId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'RPT-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const reportId = generateReportId();
  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Parse coordinates from report data
  const parseCoordinates = () => {
    if (reportData?.location) {
      return {
        latitude: reportData.location.latitude,
        longitude: reportData.location.longitude,
      };
    }
    
    // Fallback: try to parse from coordinates string
    if (reportData?.coordinates) {
      const coords = reportData.coordinates.split(',');
      if (coords.length === 2) {
        return {
          latitude: parseFloat(coords[0].trim()),
          longitude: parseFloat(coords[1].trim()),
        };
      }
    }
    
    // Default coordinates (Delhi)
    return {
      latitude: 28.6139,
      longitude: 77.2090,
    };
  };

  const mapCoordinates = parseCoordinates();

  // Debug logging
  console.log('🔍 ReportPreviewScreen - reportData:', JSON.stringify(reportData, null, 2));
  console.log('🔍 ReportPreviewScreen - mapCoordinates:', mapCoordinates);
  console.log('🔍 ReportPreviewScreen - displayData.location:', {
    latitude: mapCoordinates.latitude,
    longitude: mapCoordinates.longitude,
    address: reportData?.location?.address || reportData?.address || 'Location not specified',
    coordinates: `${mapCoordinates.latitude}, ${mapCoordinates.longitude}`,
    accuracy: reportData?.location?.accuracy || null,
  });

  useEffect(() => {
    (async () => {
      // Prefer remote profile if token exists; fallback to local cache
      const remote = await fetchMyProfile();
      const stored = remote || await getStoredUserProfile();
      if (stored) {
        setReporterName(stored.name || '');
        setReporterEmail(stored.email || '');
        setReporterPhone(stored.phone || '');
      }
    })();
  }, []);

  // Submit report function
  const handleSubmitReport = async () => {
    try {
      setIsSubmitting(true);
      
      // Upload images first if they exist
      let uploadedPhotos: Array<{ uri: string; filename: string; size: number; uploadedAt: Date }> = [];
      if (displayData.issue?.photos && displayData.issue.photos.length > 0) {
        console.log('📤 Starting parallel image upload process...');
        setIsUploading(true);
        setUploadProgress({ completed: 0, total: displayData.issue.photos.length });
        
        try {
          uploadedPhotos = await ApiService.uploadImages(
            displayData.issue.photos,
            (completed, total) => {
              setUploadProgress({ completed, total });
              console.log(`📤 Upload progress: ${completed}/${total} images`);
            }
          );
          console.log('✅ All images uploaded successfully:', uploadedPhotos.length);
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          Alert.alert(
            'Upload Failed',
            'Failed to upload some images. Do you want to continue without the failed images?',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  setIsSubmitting(false);
                  setIsUploading(false);
                  return;
                }
              },
              {
                text: 'Continue',
                onPress: () => {
                  // Continue with successfully uploaded images
                  console.log('Continuing with uploaded images:', uploadedPhotos.length);
                }
              }
            ]
          );
          return;
        } finally {
          setIsUploading(false);
        }
      }
      
      // Format the report data for API submission
      let formattedData = formatReportForSubmission(displayData);
      formattedData = {
        ...formattedData,
        reporter: {
          name: reporterName || formattedData.reporter?.name,
          email: reporterEmail || formattedData.reporter?.email,
          phone: reporterPhone || formattedData.reporter?.phone,
          userId: formattedData.reporter?.userId
        },
        issue: {
          ...formattedData.issue,
          photos: uploadedPhotos // Use uploaded photos instead of local paths
        }
      };
      
      console.log('📤 Submitting report with data:', JSON.stringify(formattedData, null, 2));
      
      // Submit to backend API
      const response = await ApiService.submitReport(formattedData);
      
      // Copy tracking code to clipboard (preferred for tracking)
      const trackingCode = response.data.trackingCode || response.data.reportId;
      await Clipboard.setString(trackingCode);
      
      // Show native notification for department users
      try {
        await NotificationService.notifyDepartmentOfNewReport({
          title: formattedData.issue?.subcategory || 'New Report',
          description: formattedData.issue?.description || 'A new report has been submitted',
          category: formattedData.issue?.category || 'General',
          department: 'General Department',
          trackingId: trackingCode,
          reportId: response.data.reportId
        });
        console.log('✅ Native notification sent');
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
      
      // Show success message with copy and track options
      Alert.alert(
        'Report Submitted Successfully! 🎉',
        `Your report has been submitted!\n\nReport ID: ${response.data.reportId}\nTracking Code: ${trackingCode}\n\nTracking code has been copied to clipboard.`,
        [
          {
            text: 'Track Report',
            onPress: () => {
              // Navigate to Track Report screen with the tracking code prefilled
              navigation.navigate('TrackReport', { 
                prefilledTrackingId: trackingCode 
              });
            }
          },
          {
            text: 'Go Home',
            onPress: () => {
              navigation.navigate('MainTabs');
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error submitting report:', error);
      
      // Show error message
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit report. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default data structure with actual data from previous screens
  const displayData = {
    reportId: reportId,
    trackingCode: '-',
    status: 'Draft',
    priority: 'Medium',
    submittedDate: currentDate,
    reporter: {
      name: 'John Doe', // This could be from user profile
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      userId: 'USR-2024-001',
    },
    issue: {
      category: reportData?.category || 'Not specified',
      subcategory: reportData?.subcategory || 'Not specified',
      description: reportData?.description || 'No description provided',
      hasVoiceRecording: reportData?.inputMode === 'voice',
      photos: reportData?.attachments || [],
    },
    location: {
      latitude: mapCoordinates.latitude,
      longitude: mapCoordinates.longitude,
      address: reportData?.location?.address || reportData?.address || 'Location not specified',
      coordinates: `${mapCoordinates.latitude}, ${mapCoordinates.longitude}`,
      accuracy: reportData?.location?.accuracy || null,
    },
    assignment: {
      department: 'Sanitation Department', // This could be determined by category
      assignedTo: 'Sewage Management Team',
      assignedPerson: 'Engineer David Chen',
      contactEmail: 'david.chen@municipal.gov',
      contactPhone: '+1 (555) 456-7890',
      estimatedResolution: '3-5 business days',
    },
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInfoRow = (label: string, value: string, icon?: string) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        {icon && <Feather name={icon as any} size={16} color="#666" style={styles.infoIcon} />}
        <Text style={styles.infoLabel}>{label}:</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const renderPhotoItem = (photo: { uri: string }, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={styles.photoItem}
      onPress={() => {
        setSelectedImageIndex(index);
        setImageModalVisible(true);
      }}
    >
      <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoName}>Photo {index + 1}</Text>
        <Text style={styles.photoSize}>Tap to preview</Text>
      </View>
      <Feather name="eye" size={16} color="#007AFF" style={styles.previewIcon} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Preview</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Review all information before submitting your report</Text>
        </View>

        {/* Report Information */}
        {renderSection('Report Information', (
          <View style={styles.infoContainer}>
            {renderInfoRow('Report ID', displayData.reportId, 'hash')}
            {renderInfoRow('Tracking Code', displayData.trackingCode, 'search')}
            {renderInfoRow('Status', displayData.status, 'check-circle')}
            {renderInfoRow('Priority', displayData.priority, 'flag')}
            {renderInfoRow('Submitted', displayData.submittedDate, 'clock')}
          </View>
        ))}

        {/* Reporter Information (read-only) */}
        {renderSection('Reporter Information', (
          <View style={styles.infoContainer}>
            {renderInfoRow('Name', (reporterName || displayData.reporter.name), 'user')}
            {renderInfoRow('Email', (reporterEmail || displayData.reporter.email), 'mail')}
            {renderInfoRow('Phone', (reporterPhone || displayData.reporter.phone), 'phone')}
            {renderInfoRow('User ID', displayData.reporter.userId, 'id-card')}
          </View>
        ))}

        {/* Issue Details */}
        {renderSection('Issue Details', (
          <View style={styles.infoContainer}>
            {renderInfoRow('Category', displayData.issue.category, 'tag')}
            {renderInfoRow('Subcategory', displayData.issue.subcategory, 'tag')}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{displayData.issue.description}</Text>
            </View>
            
            {displayData.issue.hasVoiceRecording && (
              <View style={styles.voiceRecordingContainer}>
                <Feather name="mic" size={20} color="#007AFF" />
                <Text style={styles.voiceRecordingText}>Voice Recording Available</Text>
              </View>
            )}

            <View style={styles.photosSection}>
              <Text style={styles.photosTitle}>Photos:</Text>
              {displayData.issue.photos.length > 0 ? (
                <View style={styles.photosGrid}>
                  {displayData.issue.photos.map((photo: { uri: string }, index: number) => (
                    <View key={index} style={styles.photoGridItem}>
                      <TouchableOpacity
                        style={styles.photoGridContainer}
                        onPress={() => {
                          setSelectedImageIndex(index);
                          setImageModalVisible(true);
                        }}
                      >
                        <Image source={{ uri: photo.uri }} style={styles.photoGridImage} />
                        <View style={styles.photoOverlay}>
                          <Feather name="eye" size={16} color="#fff" />
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.photoGridText}>Photo {index + 1}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPhotosText}>No photos attached</Text>
              )}
            </View>
          </View>
        ))}

        {/* Location Information */}
        {renderSection('Location Information', (
          <View style={styles.infoContainer}>
            {renderInfoRow('Address', displayData.location.address, 'map-pin')}
            {renderInfoRow('Coordinates', displayData.location.coordinates, 'navigation')}
            
            {/* Interactive Map */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: mapCoordinates.latitude,
                  longitude: mapCoordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                mapType="standard"
              >
                <Marker
                  coordinate={{ latitude: mapCoordinates.latitude, longitude: mapCoordinates.longitude }}
                  title="📍 Reported Location"
                  description={`Issue Location: ${displayData.location.coordinates}`}
                  pinColor="#3B82F6"
                />
              </MapView>
            </View>
            <Text style={styles.mapInfoText}>
              📍 Issue location marked on the map
            </Text>
          </View>
        ))}

        {/* Assignment Details */}
        {renderSection('Assignment Details', (
          <View style={styles.infoContainer}>
            {renderInfoRow('Department', displayData.assignment.department, 'building')}
            {renderInfoRow('Assigned To', displayData.assignment.assignedTo, 'users')}
            {renderInfoRow('Assigned Person', displayData.assignment.assignedPerson, 'user-check')}
            {renderInfoRow('Contact Email', displayData.assignment.contactEmail, 'mail')}
            {renderInfoRow('Contact Phone', displayData.assignment.contactPhone, 'phone')}
            {renderInfoRow('Estimated Resolution', displayData.assignment.estimatedResolution, 'calendar')}
          </View>
        ))}
      </ScrollView>

      {/* Upload Progress */}
      {isUploading && uploadProgress.total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Uploading Images: {uploadProgress.completed} of {uploadProgress.total}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backActionText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || isUploading) && styles.submitButtonDisabled]}
          onPress={handleSubmitReport}
          disabled={isSubmitting || isUploading}
        >
          {isUploading ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator color="#fff" size="small" style={styles.submitSpinner} />
              <Text style={styles.submitButtonText}>
                Uploading Images... {uploadProgress.completed}/{uploadProgress.total}
              </Text>
            </View>
          ) : isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator color="#fff" size="small" style={styles.submitSpinner} />
              <Text style={styles.submitButtonText}>Submitting Report...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Photo {selectedImageIndex + 1} of {displayData.issue.photos.length}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: displayData.issue.photos[selectedImageIndex]?.uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
            
            {displayData.issue.photos.length > 1 && (
              <View style={styles.imageNavigation}>
                <TouchableOpacity
                  style={[styles.navButton, selectedImageIndex === 0 && styles.navButtonDisabled]}
                  onPress={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  disabled={selectedImageIndex === 0}
                >
                  <Feather name="chevron-left" size={24} color={selectedImageIndex === 0 ? "#ccc" : "#333"} />
                </TouchableOpacity>
                
                <Text style={styles.imageCounter}>
                  {selectedImageIndex + 1} / {displayData.issue.photos.length}
                </Text>
                
                <TouchableOpacity
                  style={[styles.navButton, selectedImageIndex === displayData.issue.photos.length - 1 && styles.navButtonDisabled]}
                  onPress={() => setSelectedImageIndex(Math.min(displayData.issue.photos.length - 1, selectedImageIndex + 1))}
                  disabled={selectedImageIndex === displayData.issue.photos.length - 1}
                >
                  <Feather name="chevron-right" size={24} color={selectedImageIndex === displayData.issue.photos.length - 1 ? "#ccc" : "#333"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    // paddingVertical: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoContainer: {
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  editLabel: {
    width: 90,
    color: '#555',
    fontWeight: '600'
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFBFF'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginTop: 4,
  },
  voiceRecordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  voiceRecordingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  photosSection: {
    marginTop: 8,
  },
  photosTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
  },
  photoName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  photoSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  previewIcon: {
    marginLeft: 8,
  },
  noPhotosText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  // Grid Layout Styles
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  photoGridItem: {
    width: (width - 60) / 2, // 2 columns with margins
    marginBottom: 15,
  },
  photoGridContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoGridImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGridText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  // Image Preview Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.95,
    height: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  imageNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  imageCounter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  mapInfoText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 15,
  },
  backActionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  backActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitSpinner: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
});

export default ReportPreviewScreen;
