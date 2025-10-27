import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

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
    assignedPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    estimatedResolution?: string;
    assignedAt?: string;
  };
};

export default function ReportDetailsScreen({ navigation, route }: any) {
  const { report, departmentInfo } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGoogleMaps = (latitude: number, longitude: number, address?: string) => {
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

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Report Details</Text>
          <Text style={styles.headerSubtitle}>{report.trackingCode}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.navigateButton}
            onPress={() => openGoogleMaps(report.location.latitude, report.location.longitude, report.location.address)}
          >
            <Feather name="navigation" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status and Priority Cards */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: getStatusColor(report.status) }]}>
            <Feather name={getStatusIcon(report.status) as any} size={20} color="#fff" />
            <Text style={styles.statusText}>
              {report.status === 'submitted' ? 'Pending' : 
               report.status === 'in_progress' ? 'In Progress' : 
               'Resolved'}
            </Text>
          </View>
          <View style={[styles.priorityCard, { backgroundColor: getPriorityColor(report.priority) }]}>
            <Feather name="flag" size={20} color="#fff" />
            <Text style={styles.priorityText}>{report.priority || 'Medium'}</Text>
          </View>
        </View>

        {/* Issue Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{report.issue.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subcategory</Text>
              <Text style={styles.infoValue}>{report.issue.subcategory}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{report.issue.description}</Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {report.issue.photos && report.issue.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({report.issue.photos.length})</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photosContainer}
            >
              {report.issue.photos.map((photo: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoItem}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  {selectedImageIndex === index && (
                    <View style={styles.selectedIndicator}>
                      <Feather name="check" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reporter Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporter Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{report.reporter.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{report.reporter.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{report.reporter.phone}</Text>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {report.location.address || 'Location not specified'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <Text style={styles.infoValue}>
                {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.navigateButtonFull}
              onPress={() => openGoogleMaps(report.location.latitude, report.location.longitude, report.location.address)}
            >
              <Feather name="navigation" size={20} color="#EF4444" />
              <Text style={styles.navigateButtonText}>Navigate to Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assignment Information */}
        {report.assignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{report.assignment.department}</Text>
              </View>
              {report.assignment.assignedPerson && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Assigned To</Text>
                  <Text style={styles.infoValue}>{report.assignment.assignedPerson}</Text>
                </View>
              )}
              {report.assignment.contactEmail && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Email</Text>
                  <Text style={styles.infoValue}>{report.assignment.contactEmail}</Text>
                </View>
              )}
              {report.assignment.contactPhone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Phone</Text>
                  <Text style={styles.infoValue}>{report.assignment.contactPhone}</Text>
                </View>
              )}
              {report.assignment.estimatedResolution && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estimated Resolution</Text>
                  <Text style={styles.infoValue}>{report.assignment.estimatedResolution}</Text>
                </View>
              )}
              {report.assignment.assignedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Assigned At</Text>
                  <Text style={styles.infoValue}>{formatDate(report.assignment.assignedAt)}</Text>
                </View>
              )}
            </View>
            
            {/* Contact Actions */}
            {(report.assignment.contactEmail || report.assignment.contactPhone) && (
              <View style={styles.contactActions}>
                <Text style={styles.contactActionsTitle}>Contact Assigned Person</Text>
                <View style={styles.contactButtons}>
                  {report.assignment.contactEmail && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        // Open email client
                        const emailUrl = `mailto:${report.assignment.contactEmail}`;
                        Linking.openURL(emailUrl).catch(err => {
                          Alert.alert('Error', 'Could not open email client');
                        });
                      }}
                    >
                      <Feather name="mail" size={16} color="#3B82F6" />
                      <Text style={styles.contactButtonText}>Email</Text>
                    </TouchableOpacity>
                  )}
                  {report.assignment.contactPhone && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        // Open phone dialer
                        const phoneUrl = `tel:${report.assignment.contactPhone}`;
                        Linking.openURL(phoneUrl).catch(err => {
                          Alert.alert('Error', 'Could not open phone dialer');
                        });
                      }}
                    >
                      <Feather name="phone" size={16} color="#10B981" />
                      <Text style={styles.contactButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>{formatDate(report.submittedAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Report ID</Text>
              <Text style={styles.infoValue}>{report.reportId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tracking Code</Text>
              <Text style={styles.infoValue}>{report.trackingCode}</Text>
            </View>
          </View>
        </View>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  priorityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  photosContainer: {
    marginTop: 12,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  navigateButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contactActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
