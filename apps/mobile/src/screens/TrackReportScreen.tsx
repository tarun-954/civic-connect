import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ApiService, getStoredUserProfile, saveUserProfile, updateProfile } from '../services/api';
import FullScreenReportViewer from '../components/FullScreenReportViewer';

type ReportDetails = {
  reportId: string;
  trackingCode?: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'resolved' | 'closed' | string;
  submittedAt: string | Date;
  updatedAt: string | Date;
  reporter?: { name?: string; email?: string; phone?: string };
  issue?: {
    category?: string;
    subcategory?: string;
    description?: string;
    photos?: Array<{ uri: string }>;
  };
  location?: { latitude?: number; longitude?: number; address?: string };
  assignment?: {
    department?: string;
    assignedPerson?: string;
    contactEmail?: string;
    estimatedResolution?: string;
    assignedAt?: string | Date;
  };
  resolution?: { description?: string; resolvedAt?: string | Date; resolvedBy?: string };
  likes?: string[];
  dislikes?: string[];
  comments?: Array<{ text: string; byName?: string; byEmail?: string; createdAt?: string | Date }>;
};

const { width: screenWidth } = Dimensions.get('window');
const GRID_ITEM_MARGIN = 2;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = Math.floor((screenWidth - 32 - GRID_ITEM_MARGIN * 2 * GRID_COLUMNS) / GRID_COLUMNS);

export default function TrackReportScreen({ navigation, route }: any) {
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'your' | 'nearby'>('search');
  const [myReports, setMyReports] = useState<ReportDetails[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [nearbyReports, setNearbyReports] = useState<ReportDetails[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [distanceFilter, setDistanceFilter] = useState(10); // Default 10km
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState<{ visible: boolean; report?: any }>({ visible: false });
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fullScreenViewer, setFullScreenViewer] = useState<{ visible: boolean; initialIndex: number }>({
    visible: false,
    initialIndex: 0,
  });
  const [activeGridTab, setActiveGridTab] = useState<'posts' | 'reels' | 'tagged'>('posts');
  
  // Edit Profile Modal State
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  

  // Location functions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby reports.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
      return null;
    }
  };

  // Load nearby reports
  const loadNearbyReports = async () => {
    try {
      setLoadingNearby(true);
      
      // Get current location first
      const location = await getCurrentLocation();
      if (!location) {
        setNearbyReports([]);
        return;
      }

      // Fetch all reports and filter by distance
      const response = await ApiService.getAllReports();
      if (response.status === 'success' && response.data) {
        const allReports = response.data.reports || [];
        
        // Calculate distance and filter nearby reports (within selected radius)
        const nearbyReports = allReports.filter((report: any) => {
          if (!report.location?.latitude || !report.location?.longitude) return false;
          
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            report.location.latitude,
            report.location.longitude
          );
          
          return distance <= distanceFilter; // Use selected radius
        });

        // Sort by distance (closest first)
        nearbyReports.sort((a: any, b: any) => {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.location.latitude,
            a.location.longitude
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.location.latitude,
            b.location.longitude
          );
          return distanceA - distanceB;
        });

        setNearbyReports(nearbyReports);
      }
    } catch (error) {
      console.error('Error loading nearby reports:', error);
      Alert.alert('Error', 'Failed to load nearby reports.');
    } finally {
      setLoadingNearby(false);
    }
  };

  // Calculate distance between two coordinates (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle prefilled tracking ID from navigation
  useEffect(() => {
    if (route?.params?.prefilledTrackingId) {
      const prefilledId = route.params.prefilledTrackingId;
      setTrackingId(prefilledId);
      setActiveTab('search');
      // Automatically search for the prefilled report after state is updated
      setTimeout(() => {
        // Use the prefilled ID directly instead of relying on state
        trackReportById(prefilledId);
      }, 100);
    }
  }, [route?.params?.prefilledTrackingId]);

  // Image picker function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Open edit profile modal
  const openEditProfile = () => {
    setEditName(userProfile?.name || '');
    setEditEmail(userProfile?.email || '');
    setEditPhone(userProfile?.phone || '');
    setEditAvatar(userProfile?.avatar || null);
    setEditProfileVisible(true);
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSavingProfile(true);
    try {
      const profileData = {
        name: editName.trim(),
        phone: editPhone.trim(),
        avatar: editAvatar || undefined,
      };

      // Update profile via backend API
      const updatedProfile = await updateProfile(profileData);
      
      if (updatedProfile) {
        // Update local state
        setUserProfile(updatedProfile);
        
        // Close modal
        setEditProfileVisible(false);
        
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const trackReportById = async (id: string) => {
    if (!id.trim()) {
      Alert.alert('Missing ID', 'Please enter a report ID or tracking code.');
      return;
    }

    try {
      setLoading(true);
      setReport(null);
      
      console.log('Searching for report with ID:', id);
      let response;
      
      // Try tracking code first, then report ID
      try {
        console.log('Trying tracking code search first...');
        response = await ApiService.getReportByTrackingCode(id.trim());
        console.log('Tracking code search successful');
      } catch (error) {
        console.log('Tracking code failed, trying report ID:', error);
        response = await ApiService.getReportById(id.trim());
        console.log('Report ID search successful');
      }
      
      if (response.status === 'success' && response.data) {
        setReport(response.data);
        console.log('Report found:', response.data);
      } else {
        Alert.alert('Report Not Found', 'No report found with this ID or tracking code.');
        setReport(null);
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      Alert.alert('Report Not Found', error?.message || 'Could not find a report with this ID. Please check and try again.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackReport = async () => {
    await trackReportById(trackingId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'clock';
      case 'in_progress':
        return 'activity';
      case 'resolved':
        return 'check-circle';
      case 'closed':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadMyReports = async () => {
    try {
      setLoadingMy(true);
      const res = await ApiService.getMyReports(1, 50);
      setMyReports(res?.data?.reports || []);
    } catch (e) {
      console.error('Error loading my reports:', e);
    } finally {
      setLoadingMy(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await getStoredUserProfile();
      setUserProfile(profile);
    } catch (e) {
      // no-op
    }
  };

  useEffect(() => {
    if (activeTab === 'your' || activeTab === 'nearby') {
      if (activeTab === 'your') {
        loadMyReports();
        loadUserProfile();
      } else if (activeTab === 'nearby') {
        loadNearbyReports();
      }
    }
  }, [activeTab]);

  // handle open full-screen viewer
  const handleReportPress = useCallback(
    (reportIndex: number) => {
      setFullScreenViewer({ visible: true, initialIndex: reportIndex });
    },
    []
  );

  // Helper to get first photo or placeholder
  const previewImageForReport = (r: ReportDetails) => {
    if (r.issue?.photos && r.issue.photos.length > 0) {
      const imageUri = r.issue.photos[0].uri;
      console.log('🖼️ Loading image for report:', r.reportId, 'URI:', imageUri);
      return imageUri;
    }
    console.log('🖼️ No images for report:', r.reportId);
    return 'https://via.placeholder.com/300x300/9CA3AF/FFFFFF?text=No+Image';
  };

  // Render a single grid item (like an Instagram post tile)
  const renderGridItem = ({ item, index }: { item: ReportDetails; index: number }) => {
    const imageUri = previewImageForReport(item);
    
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => handleReportPress(index)}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.gridImage}
          resizeMode="cover"
          onError={(error) => {
            console.log('❌ Image load error for report:', item.reportId, 'URI:', imageUri, 'Error:', error.nativeEvent.error);
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for report:', item.reportId, 'URI:', imageUri);
          }}
        />
        {/* small status pill top-left */}
        <View style={[styles.gridStatusPill, { backgroundColor: getStatusColor(item.status) }]}>
          <Feather name={getStatusIcon(item.status) as any} size={12} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Report</Text>
        <View style={{ flex: 1 }} />
      </View>
      
      {/* Top segmented navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'search' && styles.tabButtonActive]}
          onPress={() => setActiveTab('search')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'search' && styles.tabButtonTextActive]}>
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'your' && styles.tabButtonActive]}
          onPress={() => setActiveTab('your')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'your' && styles.tabButtonTextActive]}>
            Your Reports
          </Text>
        </TouchableOpacity>
       
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nearby' && styles.tabButtonActive]}
          onPress={() => setActiveTab('nearby')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'nearby' && styles.tabButtonTextActive]}>
            Nearby Reports
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Search Report</Text>
              
              <View style={styles.cardInputRow}>
                <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.cardInput}
                  placeholder="Enter Tracking ID"
                  placeholderTextColor="#9CA3AF"
                  value={trackingId}
                  onChangeText={setTrackingId}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.cardButton, loading && { opacity: 0.7 }]}
                onPress={handleTrackReport}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.cardButtonText}>Search</Text>}
              </TouchableOpacity>

              {/* Quick results / sample card if report found */}
              {report && (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <Text style={styles.postTitle}>{report.issue?.category || 'Report'}</Text>
                      <Text style={styles.postTime}>{formatDate(report.submittedAt)}</Text>
                    </View>
                    <View style={styles.postImages}>
                      {report.issue?.photos && report.issue.photos.length > 0 ? (
                        <Image source={{ uri: report.issue.photos[0].uri }} style={styles.postImage} />
                      ) : (
                        <View style={[styles.postImage, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Feather name="image" size={48} color="#C7CDD3" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.postDescription} numberOfLines={3}>
                      {report.issue?.description || 'No description provided.'}
                    </Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity style={{ marginRight: 12 }} onPress={() => setCommentsVisible({ visible: true, report })}>
                        <Text style={styles.actionText}>Comments</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Alert.alert('Share', 'Share this report link (not implemented)')}>
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* YOUR (Profile) TAB — Instagram-like */}
        {activeTab === 'your' && (
          <View style={styles.profileContainer}>
            {/* Profile header (centered like Instagram) */}
            <View style={styles.profileTop}>
              <View style={styles.profileRow}>
                <View style={styles.profilePictureLarge}>
                  {userProfile?.avatar ? (
                    <Image source={{ uri: userProfile.avatar }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileInitialsCircle}>
                      <Text style={styles.profileInitials}>
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.statsColumn}>
                  <View style={styles.statColItem}>
                    <Text style={styles.statNumber}>{myReports.length}</Text>
                    <Text style={styles.statLabel}>Reports</Text>
                  </View>
                  <View style={styles.statColItem}>
                    <Text style={styles.statNumber}>{myReports.filter(r => r.status === 'resolved').length}</Text>
                    <Text style={styles.statLabel}>Solved</Text>
                  </View>
                  <View style={styles.statColItem}>
                    <Text style={styles.statNumber}>{myReports.filter(r => r.status === 'in_progress').length}</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                  </View>
                </View>
              </View>

              <View style={styles.profileTextBlock}>
                <Text style={styles.profileName}>{userProfile?.name || 'Your Name'}</Text>
                <Text style={styles.profileEmail}>{userProfile?.email || 'your.email@example.com'}</Text>
                <Text style={styles.profileBio}>Civic Connect User • Reporting issues in your community</Text>

                <View style={styles.profileActionsRow}>
                  <TouchableOpacity style={styles.editProfileButton} onPress={openEditProfile}>
                    <Text style={styles.editProfileText}>Edit profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingsButton} onPress={() => Alert.alert('Settings', 'Open settings (not implemented)')}>
                    <Feather name="settings" size={18} color="#111" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Grid tabs (posts / reels / tagged) */}
            <View style={styles.gridTabs}>
              <TouchableOpacity style={[styles.gridTab, activeGridTab === 'posts' && styles.gridTabActive]} onPress={() => setActiveGridTab('posts')}>
                <Feather name="grid" size={20} color={activeGridTab === 'posts' ? '#000' : '#8E8E8E'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridTab, activeGridTab === 'reels' && styles.gridTabActive]} onPress={() => setActiveGridTab('reels')}>
                <Feather name="check" size={20} color={activeGridTab === 'reels' ? '#000' : '#8E8E8E'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridTab, activeGridTab === 'tagged' && styles.gridTabActive]} onPress={() => setActiveGridTab('tagged')}>
                <Feather name="user" size={20} color={activeGridTab === 'tagged' ? '#000' : '#8E8E8E'} />
              </TouchableOpacity>
            </View>

            {/* Grid content */}
            {loadingMy ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            ) : myReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={48} color="#8E8E8E" />
                <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
                <Text style={styles.emptyStateText}>Submit your first report to see it here</Text>
              </View>
            ) : (
              <View style={styles.gridWrapper}>
                <FlatList
                  data={myReports}
                  keyExtractor={(item) => item.reportId}
                  numColumns={GRID_COLUMNS}
                  renderItem={renderGridItem}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}


         {/* NEARBY REPORTS TAB - Location-based filtering */}
         {activeTab === 'nearby' && (
           <View style={styles.allReportsContainer}>
             <View style={styles.nearbyHeader}>
               <Text style={styles.cardTitle}>Reports Near You</Text>
               <TouchableOpacity 
                 style={styles.filterButton}
                 onPress={() => setShowFilterModal(true)}
               >
                 <Feather name="sliders" size={18} color="#0B5CAB" />
                 <Text style={styles.filterButtonText}>Filter</Text>
               </TouchableOpacity>
             </View>
             
             {userLocation && (
               <View style={styles.locationInfo}>
                 <Feather name="map-pin" size={16} color="#10B981" />
                 <Text style={styles.locationText}>
                   Showing reports within {distanceFilter}km of your location
                 </Text>
               </View>
             )}
             
             {loadingNearby ? (
               <View style={styles.loadingContainer}>
                 <ActivityIndicator size="large" />
                 <Text style={styles.loadingText}>Finding reports near you...</Text>
               </View>
             ) : nearbyReports.length > 0 ? (
               <View style={styles.reportsList}>
                 {nearbyReports.map((report, index) => {
                   const distance = userLocation ? calculateDistance(
                     userLocation.latitude,
                     userLocation.longitude,
                     report.location?.latitude || 0,
                     report.location?.longitude || 0
                   ) : 0;
                   
                   return (
                     <TouchableOpacity
                       key={report.reportId}
                       style={styles.reportListItem}
                       onPress={() => handleReportPress(index)}
                       activeOpacity={0.7}
                     >
                       <View style={styles.reportListImage}>
                         {report.issue?.photos && report.issue.photos.length > 0 ? (
                           <Image 
                             source={{ uri: report.issue.photos[0].uri }} 
                             style={styles.reportListImageContent}
                             resizeMode="cover"
                           />
                         ) : (
                           <View style={[styles.reportListImageContent, styles.reportListImagePlaceholder]}>
                             <Feather name="image" size={24} color="#9CA3AF" />
                           </View>
                         )}
                         <View style={[styles.reportListStatusPill, { backgroundColor: getStatusColor(report.status) }]}>
                           <Feather name={getStatusIcon(report.status) as any} size={10} color="#fff" />
                         </View>
                       </View>
                       
                       <View style={styles.reportListContent}>
                         <Text style={styles.reportListTitle}>
                           {report.issue?.category} • {report.issue?.subcategory}
                         </Text>
                         <Text style={styles.reportListDescription} numberOfLines={2}>
                           {report.issue?.description || 'No description provided'}
                         </Text>
                         <View style={styles.reportListMeta}>
                           <Text style={styles.reportListDate}>{formatDate(report.submittedAt)}</Text>
                           <Text style={styles.reportListDistance}>
                             📍 {distance.toFixed(1)}km away
                           </Text>
                         </View>
                         <View style={styles.reportListActions}>
                           <View style={styles.reportListStats}>
                             <Text style={styles.reportListStat}>👍 {report.likes?.length || 0}</Text>
                             <Text style={styles.reportListStat}>👎 {report.dislikes?.length || 0}</Text>
                             <Text style={styles.reportListStat}>💬 {report.comments?.length || 0}</Text>
                           </View>
                           <Feather name="chevron-right" size={16} color="#9CA3AF" />
                         </View>
                       </View>
                     </TouchableOpacity>
                   );
                 })}
               </View>
             ) : (
               <View style={styles.emptyState}>
                 <Feather name="map-pin" size={48} color="#8E8E8E" />
                 <Text style={styles.emptyStateTitle}>No Reports Nearby</Text>
                 <Text style={styles.emptyStateText}>
                   {userLocation 
                     ? 'No reports found within 10km of your location'
                     : 'Enable location access to see nearby reports'
                   }
                 </Text>
                 {!userLocation && (
                   <TouchableOpacity 
                     style={styles.enableLocationButton}
                     onPress={loadNearbyReports}
                   >
                     <Text style={styles.enableLocationButtonText}>Enable Location</Text>
                   </TouchableOpacity>
                 )}
               </View>
             )}
           </View>
         )}

         {/* All Reports Scrollable View */}
         {activeTab === 'search' && report && (
           <View style={styles.reportSection}>
             <Text style={styles.cardTitle}>Report Details</Text>
             
             {/* Single report details */}
             <View style={styles.statusCard}>
               <View style={styles.statusHeader}>
                 <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(report.status) }]}>
                   <Feather name={getStatusIcon(report.status) as any} size={16} color="#fff" />
                 </View>
                 <Text style={styles.statusText}>{(report.status || '').replace('_', ' ').toUpperCase()}</Text>
               </View>
               <Text style={styles.reportId}>Report ID: {report.reportId}</Text>
               {report.trackingCode && <Text style={styles.trackingCode}>Tracking Code: {report.trackingCode}</Text>}
             </View>

             <View style={styles.detailCard}>
               <Text style={styles.sectionHeaderTitle}>Issue Details</Text>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Category:</Text>
                 <Text style={styles.detailValue}>{report.issue?.category}</Text>
               </View>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Subcategory:</Text>
                 <Text style={styles.detailValue}>{report.issue?.subcategory}</Text>
               </View>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Description:</Text>
                 <Text style={styles.detailValue}>{report.issue?.description}</Text>
               </View>

               {report.issue?.photos && report.issue.photos.length > 0 && (
                 <View style={styles.photosContainer}>
                   <Text style={styles.detailLabel}>Photos:</Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                     {report.issue.photos.map((photo: any, index: number) => (
                       <View key={index} style={styles.photoContainer}>
                         <Image source={{ uri: photo.uri }} style={styles.photo} />
                       </View>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>

             <View style={styles.detailCard}>
               <Text style={styles.sectionHeaderTitle}>Location</Text>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Address:</Text>
                 <Text style={styles.detailValue}>{report.location?.address || 'Not specified'}</Text>
               </View>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Coordinates:</Text>
                 <Text style={styles.detailValue}>
                   {report.location?.latitude?.toFixed(6)}, {report.location?.longitude?.toFixed(6)}
                 </Text>
               </View>
             </View>

             {report.assignment && (
               <View style={styles.detailCard}>
                 <Text style={styles.sectionHeaderTitle}>Assignment</Text>
                 {report.assignment.department && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Department:</Text>
                     <Text style={styles.detailValue}>{report.assignment.department}</Text>
                   </View>
                 )}
                 {report.assignment.assignedPerson && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Assigned To:</Text>
                     <Text style={styles.detailValue}>{report.assignment.assignedPerson}</Text>
                   </View>
                 )}
                 {report.assignment.contactEmail && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Contact Email:</Text>
                     <Text style={styles.detailValue}>{report.assignment.contactEmail}</Text>
                   </View>
                 )}
                 {report.assignment.estimatedResolution && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Estimated Resolution:</Text>
                     <Text style={styles.detailValue}>{report.assignment.estimatedResolution}</Text>
                   </View>
                 )}
               </View>
             )}

             <View style={styles.detailCard}>
               <Text style={styles.sectionHeaderTitle}>Timeline</Text>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Submitted:</Text>
                 <Text style={styles.detailValue}>{formatDate(report.submittedAt)}</Text>
               </View>
               <View style={styles.detailRow}>
                 <Text style={styles.detailLabel}>Last Updated:</Text>
                 <Text style={styles.detailValue}>{formatDate(report.updatedAt)}</Text>
               </View>
               {report.assignment?.assignedAt && (
                 <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Assigned:</Text>
                   <Text style={styles.detailValue}>{formatDate(report.assignment.assignedAt)}</Text>
                 </View>
               )}
               {report.resolution?.resolvedAt && (
                 <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>Resolved:</Text>
                   <Text style={styles.detailValue}>{formatDate(report.resolution.resolvedAt)}</Text>
                 </View>
               )}
             </View>

             {report.resolution && (
               <View style={styles.detailCard}>
                 <Text style={styles.sectionHeaderTitle}>Resolution</Text>
                 {report.resolution.description && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Description:</Text>
                     <Text style={styles.detailValue}>{report.resolution.description}</Text>
                   </View>
                 )}
                 {report.resolution.resolvedBy && (
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>Resolved By:</Text>
                     <Text style={styles.detailValue}>{report.resolution.resolvedBy}</Text>
                   </View>
                 )}
               </View>
             )}
           </View>
         )}
      </ScrollView>

      {/* Comments Modal */}
      <Modal visible={commentsVisible.visible} transparent animationType="fade" onRequestClose={() => setCommentsVisible({ visible: false })}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Comments</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {commentsVisible.report?.comments?.length ? (
                commentsVisible.report.comments.map((c: any, idx: number) => (
                  <View key={idx} style={{ marginBottom: 10 }}>
                    <Text style={{ fontWeight: '700', color: '#0A2E68' }}>{c.byName || (c.byEmail || '').split('@')[0]}</Text>
                    <Text style={{ color: '#111827' }}>{c.text}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#6B7280' }}>No comments yet</Text>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={{ marginLeft: 8, backgroundColor: '#0B5CAB', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10 }}
                disabled={addingComment || !newComment.trim()}
                onPress={async () => {
                  try {
                    setAddingComment(true);
                    await ApiService.addComment(commentsVisible.report.reportId, newComment.trim());
                    setNewComment('');
                    await loadMyReports();
                    const updated = (myReports || []).find(m => m.reportId === commentsVisible.report.reportId);
                    setCommentsVisible({ visible: true, report: updated });
                  } catch {}
                  finally {
                    setAddingComment(false);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{addingComment ? '...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setCommentsVisible({ visible: false })}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} transparent animationType="slide" onRequestClose={() => setEditProfileVisible(false)}>
        <View style={styles.editProfileBackdrop}>
          <View style={styles.editProfileModal}>
            <View style={styles.editProfileHeader}>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Text style={styles.editProfileCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editProfileTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={saveProfile} disabled={savingProfile}>
                <Text style={[styles.editProfileSave, savingProfile && { opacity: 0.5 }]}>
                  {savingProfile ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editProfileContent} showsVerticalScrollIndicator={false}>
              {/* Profile Picture Section */}
              <View style={styles.profilePictureSection}>
                <TouchableOpacity style={styles.profilePictureContainer} onPress={pickImage}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.editProfileImage} />
                  ) : (
                    <View style={styles.editProfileImagePlaceholder}>
                      <Feather name="camera" size={32} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.cameraIconOverlay}>
                    <Feather name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.profilePictureLabel}>Tap to change photo</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.editFormSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={[styles.editInput, { color: '#6B7280' }]}
                    value={editEmail}
                    editable={false}
                    placeholder="Email cannot be changed"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.inputHelper}>Email cannot be changed for security reasons</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Distance Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.editProfileBackdrop}>
          <View style={styles.filterModal}>
            <View style={styles.editProfileHeader}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.editProfileCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editProfileTitle}>Distance Filter</Text>
              <TouchableOpacity onPress={() => {
                setShowFilterModal(false);
                loadNearbyReports(); // Reload with new filter
              }}>
                <Text style={styles.editProfileSave}>Apply</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              <Text style={styles.filterLabel}>Select maximum distance:</Text>
              
              <View style={styles.distanceOptions}>
                {[1, 5, 10, 25, 50].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    style={[
                      styles.distanceOption,
                      distanceFilter === distance && styles.distanceOptionSelected
                    ]}
                    onPress={() => setDistanceFilter(distance)}
                  >
                    <Text style={[
                      styles.distanceOptionText,
                      distanceFilter === distance && styles.distanceOptionTextSelected
                    ]}>
                      {distance}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.customDistanceSection}>
                <Text style={styles.filterLabel}>Or enter custom distance:</Text>
                <View style={styles.customDistanceInput}>
                  <TextInput
                    style={styles.distanceInput}
                    value={distanceFilter.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 1;
                      setDistanceFilter(Math.min(Math.max(value, 1), 100));
                    }}
                    keyboardType="numeric"
                    placeholder="Enter distance"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.distanceUnit}>km</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Viewer */}
      <FullScreenReportViewer
        visible={fullScreenViewer.visible}
        reports={activeTab === 'nearby' ? nearbyReports : myReports}
        initialIndex={fullScreenViewer.initialIndex}
        onClose={() => setFullScreenViewer({ visible: false, initialIndex: 0 })}
        onReportsUpdate={activeTab === 'nearby' ? loadNearbyReports : loadMyReports}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  tabButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#111827',
  },
  cardWrapper: {
    marginTop: 20,
    padding: 8,
    borderRadius: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionMuted: {
    color: '#6B7280',
    fontSize: 14,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#E6E6E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  cardInput: {
    height: 42,
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  cardButton: {
    backgroundColor: '#111827',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postTitle: { fontWeight: '700', color: '#0A2E68' },
  postTime: { color: '#6B7280', fontSize: 12 },
  postImages: { marginTop: 8 },
  postImage: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#F3F4F6' },
  postDescription: { marginTop: 8, color: '#111827' },
  postActions: { flexDirection: 'row', marginTop: 8 },
  actionText: { color: '#0B5CAB', fontWeight: '700' },

  // Report details / status
  statusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reportId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackingCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 120,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  photosContainer: {
    marginTop: 8,
  },
  photoContainer: {
    marginRight: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  // Instagram-style profile styles
  profileContainer: {
    flex: 1,
  },
  profileTop: {
    paddingVertical: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  profilePictureLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitialsCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  statsColumn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  statColItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  profileTextBlock: {
    paddingHorizontal: 4,
    marginTop: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#111827',
    marginTop: 8,
    lineHeight: 18,
  },
  profileActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  editProfileText: {
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },

  // grid tabs
  gridTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRadius: 10,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
    marginTop: 12,
  },
  gridTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
   
borderRightColor: '#E5E7EB',
    borderBottomWidth: 2,
    borderRadius: 6,
  
    borderBottomColor: 'transparent',
  },
  gridTabActive: {
    borderBottomColor: '#111827',
  },
  gridWrapper: {
    paddingVertical: 8,
  },
  gridItem: {
    margin: GRID_ITEM_MARGIN,
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridStatusPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '92%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0A2E68', marginBottom: 8 },

  // near preview
  nearPreview: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
    backgroundColor: '#FAFBFD',
  },

   reportSection: {
     marginBottom: 20,
     paddingBottom: 20,
   },

   // All Reports List Styles
   allReportsContainer: {
     flex: 1,
     paddingHorizontal: 16,
     paddingTop: 16,
   },
   reportsList: {
     marginTop: 16,
   },
   reportListItem: {
     flexDirection: 'row',
     backgroundColor: '#FFFFFF',
     borderRadius: 12,
     padding: 12,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 2,
     elevation: 1,
   },
   reportListImage: {
     width: 80,
     height: 80,
     borderRadius: 8,
     marginRight: 12,
     position: 'relative',
   },
   reportListImageContent: {
     width: '100%',
     height: '100%',
     borderRadius: 8,
   },
   reportListImagePlaceholder: {
     backgroundColor: '#F3F4F6',
     alignItems: 'center',
     justifyContent: 'center',
   },
   reportListStatusPill: {
     position: 'absolute',
     top: 4,
     right: 4,
     paddingHorizontal: 4,
     paddingVertical: 2,
     borderRadius: 8,
     alignItems: 'center',
     justifyContent: 'center',
   },
   reportListContent: {
     flex: 1,
     justifyContent: 'space-between',
   },
   reportListTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#111827',
     marginBottom: 4,
   },
   reportListDescription: {
     fontSize: 14,
     color: '#6B7280',
     lineHeight: 18,
     marginBottom: 8,
   },
   reportListMeta: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 8,
   },
   reportListDate: {
     fontSize: 12,
     color: '#9CA3AF',
   },
   reportListId: {
     fontSize: 12,
     color: '#9CA3AF',
     fontWeight: '500',
   },
   reportListActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   reportListStats: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   reportListStat: {
     fontSize: 12,
     color: '#6B7280',
     marginRight: 12,
   },

   // Edit Profile Modal Styles
   editProfileBackdrop: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'flex-end',
   },
   editProfileModal: {
     backgroundColor: '#FFFFFF',
     borderTopLeftRadius: 20,
     borderTopRightRadius: 20,
     maxHeight: '90%',
     minHeight: '70%',
   },
   editProfileHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 20,
     paddingVertical: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
   },
   editProfileCancel: {
     fontSize: 16,
     color: '#6B7280',
     fontWeight: '500',
   },
   editProfileTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#111827',
   },
   editProfileSave: {
     fontSize: 16,
     color: '#0B5CAB',
     fontWeight: '600',
   },
   editProfileContent: {
     flex: 1,
     paddingHorizontal: 20,
   },
   profilePictureSection: {
     alignItems: 'center',
     paddingVertical: 24,
   },
   profilePictureContainer: {
     position: 'relative',
     marginBottom: 8,
   },
   editProfileImage: {
     width: 120,
     height: 120,
     borderRadius: 60,
   },
   editProfileImagePlaceholder: {
     width: 120,
     height: 120,
     borderRadius: 60,
     backgroundColor: '#F3F4F6',
     alignItems: 'center',
     justifyContent: 'center',
   },
   cameraIconOverlay: {
     position: 'absolute',
     bottom: 0,
     right: 0,
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: '#0B5CAB',
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 3,
     borderColor: '#FFFFFF',
   },
   profilePictureLabel: {
     fontSize: 14,
     color: '#6B7280',
     fontWeight: '500',
   },
   editFormSection: {
     paddingBottom: 24,
   },
   inputGroup: {
     marginBottom: 20,
   },
   inputLabel: {
     fontSize: 16,
     fontWeight: '600',
     color: '#111827',
     marginBottom: 8,
   },
   editInput: {
     borderWidth: 1,
     borderColor: '#E5E7EB',
     borderRadius: 12,
     paddingHorizontal: 16,
     paddingVertical: 12,
     fontSize: 16,
     backgroundColor: '#FFFFFF',
   },
   inputHelper: {
     fontSize: 12,
     color: '#6B7280',
     marginTop: 4,
   },

   // Prefilled indicator styles
   prefilledIndicator: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F0FDF4',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: '#BBF7D0',
   },
   prefilledText: {
     fontSize: 14,
     color: '#059669',
     fontWeight: '500',
     marginLeft: 6,
   },

   // Nearby Reports Styles
   locationInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F0FDF4',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     marginBottom: 16,
     borderWidth: 1,
     borderColor: '#BBF7D0',
   },
   locationText: {
     fontSize: 14,
     color: '#059669',
     fontWeight: '500',
     marginLeft: 6,
   },
   loadingText: {
     fontSize: 14,
     color: '#6B7280',
     marginTop: 8,
     textAlign: 'center',
   },
   reportListDistance: {
     fontSize: 12,
     color: '#10B981',
     fontWeight: '600',
   },
   enableLocationButton: {
     backgroundColor: '#0B5CAB',
     paddingHorizontal: 20,
     paddingVertical: 12,
     borderRadius: 8,
     marginTop: 16,
   },
   enableLocationButtonText: {
     color: '#FFFFFF',
     fontSize: 16,
     fontWeight: '600',
     textAlign: 'center',
   },

   // Filter Modal Styles
   nearbyHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
   },
   filterButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F3F4F6',
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   filterButtonText: {
     fontSize: 14,
     color: '#0B5CAB',
     fontWeight: '600',
     marginLeft: 6,
   },
   filterModal: {
     backgroundColor: '#FFFFFF',
     borderTopLeftRadius: 20,
     borderTopRightRadius: 20,
     maxHeight: '60%',
     minHeight: '40%',
   },
   filterContent: {
     padding: 20,
   },
   filterLabel: {
     fontSize: 16,
     fontWeight: '600',
     color: '#111827',
     marginBottom: 16,
   },
   distanceOptions: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     marginBottom: 24,
   },
   distanceOption: {
     backgroundColor: '#F3F4F6',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 8,
     marginRight: 8,
     marginBottom: 8,
     borderWidth: 1,
     borderColor: '#E5E7EB',
   },
   distanceOptionSelected: {
     backgroundColor: '#0B5CAB',
     borderColor: '#0B5CAB',
   },
   distanceOptionText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#6B7280',
   },
   distanceOptionTextSelected: {
     color: '#FFFFFF',
   },
   customDistanceSection: {
     marginTop: 8,
   },
   customDistanceInput: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F3F4F6',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     paddingHorizontal: 12,
   },
   distanceInput: {
     flex: 1,
     paddingVertical: 12,
     fontSize: 16,
     color: '#111827',
   },
   distanceUnit: {
     fontSize: 16,
     color: '#6B7280',
     fontWeight: '500',
   },
 });
