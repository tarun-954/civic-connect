import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
import { DepartmentService } from '../services/api';

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

export default function DepartmentIssuesScreen({ route }: any) {
  const department = route?.params?.department || 'Department';
  const departmentCode = route?.params?.departmentCode;
  const [selectedStatus, setSelectedStatus] = useState('submitted');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    return statusMap[report.status] === selectedStatus;
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

  const StatusButton = ({ label, color, onPress }: { label: string; color: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.statusButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.statusButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{department} Dashboard</Text>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {['Pending', 'In Progress', 'Resolved'].map((status, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.activeFilter,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === status && styles.activeFilterText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image 
              source={{ 
                uri: item.issue.photos && item.issue.photos.length > 0 
                  ? item.issue.photos[0].uri 
                  : 'https://via.placeholder.com/150/6B7280/FFFFFF?text=No+Image'
              }} 
              style={styles.image} 
            />
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.issue.subcategory}</Text>
              <Text style={styles.category}>📂 {item.issue.category}</Text>
              <Text style={styles.location}>📍 {item.location.address || `${item.location.latitude}, ${item.location.longitude}`}</Text>
              <Text style={styles.reportedBy}>🧑‍💼 {item.reporter.name}</Text>
              <Text style={styles.trackingCode}>🔍 {item.trackingCode}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.issue.description}</Text>
              <Text style={[styles.statusBadge, 
                item.status === 'submitted' ? styles.badgePending : 
                item.status === 'in_progress' ? styles.badgeInProgress : 
                styles.badgeResolved]}>
                {item.status === 'submitted' ? 'Pending' : 
                 item.status === 'in_progress' ? 'In Progress' : 
                 'Resolved'}
              </Text>

              {item.status === 'submitted' && (
                <View style={styles.actions}>
                  <StatusButton
                    label="Mark In Progress"
                    color="#F59E0B"
                    onPress={() => updateStatus(item.reportId, 'in_progress')}
                  />
                </View>
              )}

              {item.status === 'in_progress' && (
                <View style={styles.actions}>
                  <StatusButton
                    label="Mark Resolved"
                    color="#10B981"
                    onPress={() => updateStatus(item.reportId, 'resolved')}
                  />
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noData}>
            {loading ? 'Loading reports...' : `No reports in ${selectedStatus}.`}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  activeFilter: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    color: '#111827',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  cardContent: {
    flex: 1,
    padding: 10,
  },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  category: { color: '#6B7280', fontSize: 12, marginBottom: 2 },
  location: { color: '#6B7280', fontSize: 13, marginBottom: 2 },
  reportedBy: { color: '#6B7280', fontSize: 13, marginBottom: 2 },
  trackingCode: { color: '#6B7280', fontSize: 12, marginBottom: 2 },
  description: { color: '#374151', fontSize: 14, marginBottom: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  badgePending: { backgroundColor: '#EF4444' },
  badgeInProgress: { backgroundColor: '#F59E0B' },
  badgeResolved: { backgroundColor: '#10B981' },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusButtonText: { color: '#fff', fontWeight: '600' },
  noData: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 30,
  },
});
