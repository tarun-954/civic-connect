import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { DepartmentService } from '../services/api';

export default function DepartmentIssuesScreen() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');

  const loadIssues = async () => {
    try {
      const result = await DepartmentService.getIssues();
      setIssues(result.data.reports || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load issues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadIssues();
  };

  const updateStatus = async (reportId: string, status: string) => {
    try {
      await DepartmentService.updateIssueStatus(reportId, status, statusNotes);
      Alert.alert('Success', 'Issue status updated successfully');
      loadIssues();
      setModalVisible(false);
      setStatusNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const openStatusModal = (issue: any) => {
    setSelectedIssue(issue);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#2563eb';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderIssue = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.issueCard}
      onPress={() => openStatusModal(item)}
    >
      <View style={styles.issueHeader}>
        <Text style={styles.issueId}>{item.reportId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.category}>
        {item.issue?.category} - {item.issue?.subcategory}
      </Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.issue?.description}
      </Text>
      
      <Text style={styles.location}>
        📍 {item.location?.address || 'Location not specified'}
      </Text>
      
      <Text style={styles.date}>
        📅 {new Date(item.submittedAt).toLocaleDateString()}
      </Text>
      
      {item.issue?.photos && item.issue.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <Text style={styles.photosLabel}>Photos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.issue.photos.map((photo: any, index: number) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading issues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Department Issues</Text>
        <Text style={styles.subtitle}>{issues.length} issues assigned</Text>
      </View>
      
      <FlatList
        data={issues}
        renderItem={renderIssue}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No issues assigned to your department</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Issue Status</Text>
            <Text style={styles.modalIssueId}>{selectedIssue?.reportId}</Text>
            
            <Text style={styles.notesLabel}>Status Notes (Optional):</Text>
            <TextInput
              style={styles.notesInput}
              value={statusNotes}
              onChangeText={setStatusNotes}
              placeholder="Add notes about the status update..."
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#2563eb' }]}
                onPress={() => updateStatus(selectedIssue?.reportId, 'submitted')}
              >
                <Text style={styles.statusButtonText}>Submitted</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#f59e0b' }]}
                onPress={() => updateStatus(selectedIssue?.reportId, 'in_progress')}
              >
                <Text style={styles.statusButtonText}>In Progress</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                onPress={() => updateStatus(selectedIssue?.reportId, 'resolved')}
              >
                <Text style={styles.statusButtonText}>Resolved</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
                onPress={() => updateStatus(selectedIssue?.reportId, 'closed')}
              >
                <Text style={styles.statusButtonText}>Closed</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  photosContainer: {
    marginTop: 8,
  },
  photosLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalIssueId: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
