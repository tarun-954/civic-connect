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
  Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DepartmentService } from '../services/api';
import { Fonts } from '../utils/fonts';

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
};

export default function DepartmentIssuesScreen({ route, navigation }: any) {
  const department = route?.params?.department || 'Department';
  const departmentCode = route?.params?.departmentCode;
  const [selectedStatus, setSelectedStatus] = useState('submitted');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [departmentInfo, setDepartmentInfo] = useState<any>(null);

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

  const filteredReports = reports.filter((report: Report) => {
    const statusMap: { [key: string]: string } = {
      'submitted': 'Pending',
      'in_progress': 'In Progress', 
      'resolved': 'Resolved'
    };
    
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
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return 'clock';
      case 'in_progress': return 'play-circle';
      case 'resolved': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
            {item.status === 'submitted' ? 'Pending' : 
             item.status === 'in_progress' ? 'In Progress' : 
             'Resolved'}
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
              label="Mark Resolved"
              color="#10B981"
              icon="check"
              onPress={() => updateStatus(item.reportId, 'resolved')}
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
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {reports.filter(r => r.status === 'resolved').length}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
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
          { key: 'resolved', label: 'Resolved', count: reports.filter(r => r.status === 'resolved').length }
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
