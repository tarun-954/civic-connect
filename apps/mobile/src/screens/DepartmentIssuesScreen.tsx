import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  RefreshControl, 
  SafeAreaView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService, DepartmentService } from '../services/api';
import { Fonts } from '../utils/fonts';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

type Report = {
  _id: string;
  reportId: string;
  trackingCode: string;
  status: string;
  priority: string;
  submittedAt: string;
  reporter: {
    name: string;
    email: string;
    phone: string;
  };
  issue: {
    category: string;
    subcategory: string;
    description: string;
    photos: Array<{ uri: string; filename?: string }>;
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  assignment?: {
    department?: string;
    assignedAt?: string;
  };
  resolution?: {
    description?: string;
    resolvedAt?: string;
    resolvedBy?: string;
    resolutionPhotos?: Array<{ uri: string; filename?: string; uploadedAt?: string }>;
    pendingApproval?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    qualityCheck?: {
      status?: 'pass' | 'fail' | 'unknown';
      confidence?: number;
      summary?: string;
    };
    rejectionReason?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  };
};

export default function DepartmentIssuesScreen({ route, navigation }: any) {
  const department = route?.params?.department || 'Department';
  const departmentCode = route?.params?.departmentCode;
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [departmentInfo, setDepartmentInfo] = useState<any>(null);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [selectedReportForResolution, setSelectedReportForResolution] = useState<Report | null>(null);
  const [proofImages, setProofImages] = useState<Array<{ uri: string }>>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Load department information
  const loadDepartmentInfo = async () => {
    try {
      const deptInfoStr = await AsyncStorage.getItem('departmentInfo');
      if (deptInfoStr) {
        const deptInfo = JSON.parse(deptInfoStr);
        setDepartmentInfo(deptInfo);
      }
    } catch (error) {
      console.error('Error loading department info:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await DepartmentService.getIssues();
      setReports(result.data.reports || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDepartmentInfo();
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const openResolutionModal = (report: Report) => {
    setSelectedReportForResolution(report);
    setProofImages([]);
    setResolutionNotes('');
    setResolutionDescription('');
    setResolutionModalVisible(true);
  };

  const closeResolutionModal = () => {
    if (submittingResolution) {
      return;
    }
    setResolutionModalVisible(false);
    setSelectedReportForResolution(null);
    setProofImages([]);
    setResolutionNotes('');
    setResolutionDescription('');
  };

  const handlePickImage = async (source: 'camera' | 'library') => {
    try {
      if (proofImages.length >= 5) {
        Alert.alert('Limit reached', 'You can upload up to 5 proof images per resolution.');
        return;
      }

      let permission;
      if (source === 'camera') {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission required',
          source === 'camera'
            ? 'Camera access is needed to capture proof images.'
            : 'Photo library access is needed to select proof images.'
        );
        return;
      }

      const pickerResult = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            quality: 0.8
          });

      if (pickerResult.canceled) {
        return;
      }

      const assets = pickerResult.assets || [];
      if (assets.length === 0) {
        return;
      }

      const formatted = assets.map(asset => ({ uri: asset.uri }));
      setProofImages(prev => {
        const remainingSlots = Math.max(0, 5 - prev.length);
        const nextBatch = remainingSlots > 0 ? formatted.slice(0, remainingSlots) : [];
        return [...prev, ...nextBatch];
      });
    } catch (error) {
      console.error('Error picking proof image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeProofImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResolution = async () => {
    if (!selectedReportForResolution) {
      return;
    }

    if (proofImages.length === 0) {
      Alert.alert('Add proof', 'Please add at least one proof image before submitting.');
      return;
    }

    try {
      setSubmittingResolution(true);
      const uploaded = await ApiService.uploadImages(proofImages);

      const payload = {
        photos: uploaded.map(photo => ({
          uri: photo.uri,
          filename: photo.filename,
          uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt).toISOString() : new Date().toISOString()
        })),
        description: resolutionDescription.trim() || undefined,
        notes: resolutionNotes.trim() || undefined
      };

      const response = await DepartmentService.submitResolution(
        selectedReportForResolution.reportId,
        payload
      );

      const quality = response?.data?.resolution?.qualityCheck;
      const summaryMessage = quality?.summary
        ? `${quality.summary}${typeof quality.confidence === 'number' ? ` (confidence ${(quality.confidence * 100).toFixed(0)}%)` : ''}`
        : 'Resolution proof submitted successfully.';

      Alert.alert('Resolution submitted', summaryMessage);
      closeResolutionModal();
      setSelectedStatus('Awaiting Approval');
      loadReports();
    } catch (error: any) {
      console.error('Error submitting resolution proof:', error);
      Alert.alert('Error', error?.message || 'Failed to submit resolution proof. Please try again.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const statusMap: { [key: string]: string } = {
    'submitted': 'Pending',
    'in_progress': 'In Progress',
    'resolved': 'Awaiting Approval',
    'closed': 'Closed'
  };

  const filteredReports = reports.filter((report: Report) => {
    const statusMatch = statusMap[report.status] === selectedStatus;
    const searchMatch = !searchText || 
      report.issue.category.toLowerCase().includes(searchText.toLowerCase()) ||
      report.issue.subcategory.toLowerCase().includes(searchText.toLowerCase()) ||
      report.issue.description.toLowerCase().includes(searchText.toLowerCase()) ||
      report.reporter.name.toLowerCase().includes(searchText.toLowerCase()) ||
      report.trackingCode.toLowerCase().includes(searchText.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      await DepartmentService.updateIssueStatus(reportId, newStatus);
      // Reload reports after status update
      loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'alert-triangle';
      case 'medium': return 'clock';
      case 'low': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#3B82F6';
      case 'closed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return 'clock';
      case 'in_progress': return 'play-circle';
      case 'resolved': return 'clock';
      case 'closed': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGoogleMaps = (latitude: number, longitude: number, address?: string) => {
    const label = address ? encodeURIComponent(address) : 'Issue Location';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Google Maps is not available on this device');
      }
    }).catch(err => {
      console.error('Error opening Google Maps:', err);
      Alert.alert('Error', 'Failed to open Google Maps');
    });
  };

  const handleViewDetails = (report: Report) => {
    // Navigate to the new ReportDetailsScreen for a clean, focused view
    navigation.navigate('ReportDetails', {
      report: report,
      departmentInfo: departmentInfo
    });
  };

  const StatusButton = ({ label, color, icon, onPress }: { label: string; color: string; icon: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Feather name={icon as any} size={16} color="#fff" />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderIssueCard = ({ item }: { item: Report }) => (
    <TouchableOpacity style={styles.issueCard} activeOpacity={0.8}>
      {/* Header with Priority and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Feather name={getPriorityIcon(item.priority) as any} size={12} color="#fff" />
            <Text style={styles.priorityText}>{item.priority || 'Medium'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Feather name={getStatusIcon(item.status) as any} size={12} color="#fff" />
          <Text style={styles.statusText}>
            {statusMap[item.status] || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Issue Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: item.issue.photos && item.issue.photos.length > 0 
              ? item.issue.photos[0].uri 
              : 'https://via.placeholder.com/300x200/6B7280/FFFFFF?text=No+Image'
          }} 
          style={styles.issueImage} 
        />
        {item.issue.photos && item.issue.photos.length > 1 && (
          <View style={styles.photoCount}>
            <Feather name="camera" size={12} color="#fff" />
            <Text style={styles.photoCountText}>+{item.issue.photos.length - 1}</Text>
          </View>
        )}
      </View>

      {/* Issue Details */}
      <View style={styles.cardContent}>
        <Text style={styles.issueTitle}>{item.issue.subcategory}</Text>
        <Text style={styles.issueCategory}>{item.issue.category}</Text>
        
        <Text style={styles.issueDescription} numberOfLines={2}>
          {item.issue.description}
        </Text>

        {/* Issue Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Feather name="user" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.reporter.name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location.address || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="hash" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.trackingCode}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(item.submittedAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {item.status === 'submitted' && (
            <StatusButton
              label="Start Work"
              color="#F59E0B"
              icon="play"
              onPress={() => updateStatus(item.reportId, 'in_progress')}
            />
          )}
          {item.status === 'in_progress' && (
            <StatusButton
              label="Submit Proof"
              color="#10B981"
              icon="check"
              onPress={() => openResolutionModal(item)}
            />
          )}
          {item.status === 'resolved' && (
            <StatusButton
              label="Update Proof"
              color="#3B82F6"
              icon="upload-cloud"
              onPress={() => openResolutionModal(item)}
            />
          )}
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleViewDetails(item)}
          >
            <Feather name="eye" size={16} color="#fff" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {/* Google Maps Button */}
          <TouchableOpacity 
            style={styles.mapsButton}
            onPress={() => openGoogleMaps(item.location.latitude, item.location.longitude, item.location.address)}
          >
            <Feather name="navigation" size={16} color="#EF4444" />
            <Text style={styles.mapsButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
      {(item.status === 'resolved' || item.status === 'closed') && (
        <View
          style={[
            styles.resolutionSummary,
            item.status === 'resolved'
              ? styles.resolutionPending
              : styles.resolutionApproved
          ]}
        >
          <View style={styles.resolutionSummaryIcon}>
            <Feather
              name={item.status === 'resolved' ? 'clock' : 'check-circle'}
              size={16}
              color={item.status === 'resolved' ? '#3B82F6' : '#10B981'}
            />
          </View>
          <View style={styles.resolutionSummaryText}>
            <Text style={styles.resolutionSummaryTitle}>
              {item.status === 'resolved'
                ? 'Awaiting Citizen Approval'
                : 'Closed by Citizen'}
            </Text>
            {item.resolution?.qualityCheck?.summary && (
              <Text style={styles.resolutionSummarySubtitle}>
                AI review: {item.resolution.qualityCheck.summary}
              </Text>
            )}
            <Text style={styles.resolutionSummarySubtitle}>
              {item.status === 'resolved'
                ? `Submitted ${item.resolution?.resolvedAt ? formatDate(item.resolution.resolvedAt) : 'recently'}`
                : `Approved ${item.resolution?.reviewedAt ? formatDate(item.resolution.reviewedAt) : 'recently'}`}
            </Text>
            {item.status === 'resolved' && item.resolution?.pendingApproval && (
              <Text style={styles.resolutionSummarySubtitle}>
                Citizen review pending
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Feather name="inbox" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No Issues Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText 
          ? `No issues match "${searchText}" in ${selectedStatus.toLowerCase()} status`
          : `No issues in ${selectedStatus.toLowerCase()} status`
        }
      </Text>
      {searchText && (
        <TouchableOpacity 
          style={styles.clearSearchButton}
          onPress={() => setSearchText('')}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={resolutionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeResolutionModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Submit Work Proof</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReportForResolution?.issue?.subcategory || 'Selected report'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeResolutionModal}
                disabled={submittingResolution}
              >
                <Feather name="x" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Proof Images</Text>
              <View style={styles.proofImagesRow}>
                {proofImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.proofImageWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.proofImage} />
                    <TouchableOpacity
                      style={styles.removeProofButton}
                      onPress={() => removeProofImage(index)}
                    >
                      <Feather name="trash-2" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {proofImages.length === 0 && (
                  <View style={styles.emptyProofPlaceholder}>
                    <Feather name="image" size={22} color="#9CA3AF" />
                    <Text style={styles.emptyProofText}>
                      Add photos showing the completed work.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.proofButtonsRow}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => handlePickImage('camera')}
                >
                  <Feather name="camera" size={16} color="#2563EB" />
                  <Text style={styles.secondaryActionButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => handlePickImage('library')}
                >
                  <Feather name="image" size={16} color="#2563EB" />
                  <Text style={styles.secondaryActionButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Summary for Citizen</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 80 }]}
                placeholder="Describe the work completed..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={resolutionDescription}
                onChangeText={setResolutionDescription}
              />

              <Text style={styles.inputLabel}>Internal Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                placeholder="Add any notes for your records"
                placeholderTextColor="#9CA3AF"
                multiline
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitProofButton,
                submittingResolution && styles.submitProofButtonDisabled
              ]}
              onPress={handleSubmitResolution}
              disabled={submittingResolution}
            >
              {submittingResolution ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.submitProofButtonText}>
                    Submit for Citizen Approval
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modern Redesigned Header */}
      <View style={styles.header}>
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.navButtonContent}>
              <Feather name="arrow-left" size={20} color="#1F2937" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle}>
              {departmentInfo?.name || department}
            </Text>
            <Text style={styles.navSubtitle}>Issues Management</Text>
          </View>
          
          <TouchableOpacity style={styles.navButton} onPress={onRefresh}>
            <View style={styles.navButtonContent}>
              <Feather name="refresh-cw" size={20} color="#1F2937" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              {reports.filter(r => r.status === 'submitted').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
              {reports.filter(r => r.status === 'in_progress').length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
              {reports.filter(r => r.status === 'resolved').length}
            </Text>
            <Text style={styles.statLabel}>Awaiting Approval</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {reports.filter(r => r.status === 'closed').length}
            </Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>

        {/* Enhanced Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Feather name="search" size={18} color="#6B7280" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category, description, reporter, or tracking code..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchText('')}
            >
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'submitted', label: 'Pending', count: reports.filter(r => r.status === 'submitted').length },
          { key: 'in_progress', label: 'In Progress', count: reports.filter(r => r.status === 'in_progress').length },
          { key: 'resolved', label: 'Awaiting Approval', count: reports.filter(r => r.status === 'resolved').length },
          { key: 'closed', label: 'Closed', count: reports.filter(r => r.status === 'closed').length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              selectedStatus === tab.label && styles.activeFilterTab
            ]}
            onPress={() => setSelectedStatus(tab.label)}
          >
            <Text style={[
              styles.filterTabText,
              selectedStatus === tab.label && styles.activeFilterTabText
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.filterBadge,
              selectedStatus === tab.label && styles.activeFilterBadge
            ]}>
              <Text style={[
                styles.filterBadgeText,
                selectedStatus === tab.label && styles.activeFilterBadgeText
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Issues List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading issues...</Text>
        </View>
      ) : (
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id}
          renderItem={renderIssueCard}
        refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Navigation Bar Styles
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonContent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Stats Bar Styles
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // Enhanced Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIconContainer: {
    marginRight: 12,
    padding: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
  },
  activeFilterTabText: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterBadgeText: {
    color: '#fff',
  },

  // List Styles
  listContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // Issue Card Styles
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Image Styles
  imageContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  issueImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  photoCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Content Styles
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  issueCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  issueDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },

  // Meta Info Styles
  metaContainer: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },

  // Action Styles
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    flex: 1,
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F1',
    borderWidth: 1,
    borderColor: '#FECACA',
    flex: 1,
  },
  mapsButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Resolution summary styles
  resolutionSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  resolutionPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  resolutionApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  resolutionSummaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resolutionSummaryText: {
    flex: 1,
  },
  resolutionSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  resolutionSummarySubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 16,
  },
  modalScroll: {
    maxHeight: '65%',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  proofImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  proofImageWrapper: {
    position: 'relative',
  },
  proofImage: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  removeProofButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProofPlaceholder: {
    width: '100%',
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyProofText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  proofButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitProofButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitProofButtonDisabled: {
    opacity: 0.6,
  },
  submitProofButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
