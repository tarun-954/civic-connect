import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Linking, Alert } from 'react-native';
import { DepartmentService } from '../services/api';

type Issue = { id: string; title: string; location: string; reportedBy: string; status: 'Pending' | 'In Progress' | 'Resolved'; image: string; lat?: number; lng?: number; assignedPerson?: string };

export default function DepartmentIssuesScreen({ route }: any) {
  const department = route?.params?.department || 'Department';
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: '1',
      title: 'Overflowing Garbage Bin',
      location: 'Market Road, Ludhiana',
      reportedBy: 'Tarun',
      status: 'Pending',
      image: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Garbage',
    },
    {
      id: '2',
      title: 'Broken Street Light',
      location: 'Sector 5, Chandigarh',
      reportedBy: 'Ravi',
      status: 'In Progress',
      image: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Light',
    },
    {
      id: '3',
      title: 'Water Leakage near Park',
      location: 'Model Town, Ludhiana',
      reportedBy: 'Simran',
      status: 'Resolved',
      image: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Water',
    },
  ]);

  // Fetch real department issues from backend, fallback to demo
  useEffect(() => {
    (async () => {
      try {
        const res = await DepartmentService.getIssues();
        const reps = res?.data?.reports || [];
        if (reps.length > 0) {
          const normalized: Issue[] = reps.map((r: any) => ({
            id: r.reportId,
            title: r.issue?.description || `${r.issue?.category || 'Issue'} · ${r.issue?.subcategory || ''}`,
            location: r.location?.address || 'Location not specified',
            lat: r.location?.latitude,
            lng: r.location?.longitude,
            reportedBy: r.reporter?.name || 'Citizen',
            status: (r.status === 'in_progress' ? 'In Progress' : r.status === 'resolved' ? 'Resolved' : 'Pending') as Issue['status'],
            image: r.issue?.photos?.[0]?.uri || 'https://via.placeholder.com/150/93C5FD/111827?text=Report',
            assignedPerson: r.assignment?.assignedPerson
          }));
          setIssues(normalized);
        }
      } catch (e: any) {
        // silent fallback to demo
      }
    })();
  }, []);

  const filteredIssues = issues.filter((issue: Issue) => issue.status === selectedStatus);

  const updateStatus = (id: string, newStatus: Issue['status']) => {
    const updated = issues.map((issue: Issue) =>
      issue.id === id ? { ...issue, status: newStatus } : issue
    );
    setIssues(updated);
  };

  const StatusButton = ({ label, color, onPress }: { label: string; color: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.statusButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.statusButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const openDirections = (lat?: number, lng?: number, address?: string) => {
    try {
      if (lat && lng) {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      } else if (address) {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
      } else {
        Alert.alert('No location', 'This report is missing location data');
      }
    } catch {}
  };

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

      {/* Issues List */}
      <FlatList
        data={filteredIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.location}>📍 {item.location}</Text>
              <Text style={styles.reportedBy}>🧑‍💼 {item.reportedBy}{item.assignedPerson ? ` · Assigned: ${item.assignedPerson}` : ''}</Text>
              <Text style={[styles.statusBadge, item.status === 'Pending' ? styles.badgePending : item.status === 'In Progress' ? styles.badgeInProgress : styles.badgeResolved]}>
                {item.status}
              </Text>
              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.viewBtn} onPress={() => Alert.alert('Details', `${item.title}\n${item.location}`)}>
                  <Text style={styles.viewBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dirBtn} onPress={() => openDirections(item.lat, item.lng, item.location)}>
                  <Text style={styles.dirBtnText}>Direction</Text>
                </TouchableOpacity>
              </View>

              {item.status === 'Pending' && (
                <View style={styles.actions}>
                  <StatusButton
                    label="Mark In Progress"
                    color="#F59E0B"
                    onPress={() => updateStatus(item.id, 'In Progress')}
                  />
                </View>
              )}

              {item.status === 'In Progress' && (
                <View style={styles.actions}>
                  <StatusButton
                    label="Mark Resolved"
                    color="#10B981"
                    onPress={() => updateStatus(item.id, 'Resolved')}
                  />
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noData}>No issues in {selectedStatus}.</Text>
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
  location: { color: '#6B7280', fontSize: 13 },
  reportedBy: { color: '#6B7280', fontSize: 13 },
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
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  viewBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  viewBtnText: { color: '#111827', fontWeight: '600' },
  dirBtn: { flex: 1, backgroundColor: '#065F46', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  dirBtnText: { color: '#fff', fontWeight: '600' },
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
