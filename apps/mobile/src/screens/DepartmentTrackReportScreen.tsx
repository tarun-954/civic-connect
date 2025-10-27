import React, { useState, useEffect } from 'react';
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
  FlatList,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

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

export default function DepartmentTrackReportScreen({ navigation }: any) {
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const trackReportById = async (id: string) => {
    if (!id.trim()) {
      Alert.alert('Error', 'Please enter a tracking code or report ID');
      return;
    }

    try {
      setLoading(true);
      setReport(null);
      
      // Try to get report by tracking code or report ID
      const response = await ApiService.getReportByTrackingCode(id);
      
      if (response.status === 'success' && response.data) {
        setReport(response.data);
      } else {
        Alert.alert('Not Found', 'No report found with this tracking code or ID');
      }
    } catch (error: any) {
      console.error('Error tracking report:', error);
      Alert.alert('Error', error.message || 'Failed to track report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return 'clock';
      case 'in_progress': return 'play-circle';
      case 'resolved': return 'check-circle';
      case 'closed': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderReportDetails = () => {
    if (!report) return null;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Report Details</Text>
        
        {/* Status Card */}
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

        {/* Issue Details */}
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

        {/* Reporter Information */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionHeaderTitle}>Reporter Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{report.reporter?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{report.reporter?.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{report.reporter?.phone}</Text>
          </View>
        </View>

        {/* Location Information */}
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

        {/* Assignment Information */}
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

        {/* Timeline */}
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

        {/* Resolution Information */}
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Report</Text>
        <View style={{ flex: 1 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Report</Text>
          <View style={styles.searchCard}>
            <Text style={styles.searchDescription}>
              Enter a tracking code or report ID to view detailed information about a specific report.
            </Text>
            
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter tracking code or report ID..."
                value={trackingId}
                onChangeText={setTrackingId}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={() => trackReportById(trackingId)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Report Details */}
        {renderReportDetails()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#0B5CAB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reportSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  photosContainer: {
    marginTop: 12,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
});
