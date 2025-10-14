import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { DepartmentService } from '../services/api';

export default function DepartmentMapScreen() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const openInMaps = (latitude: number, longitude: number, address?: string) => {
    const label = address ? encodeURIComponent(address) : 'Issue Location';
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&label=${label}`;
    Linking.openURL(url);
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
      onPress={() => openInMaps(item.location?.latitude, item.location?.longitude, item.location?.address)}
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
      
      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <View style={styles.locationInfo}>
          <Text style={styles.coordinates}>
            {item.location?.latitude?.toFixed(6)}, {item.location?.longitude?.toFixed(6)}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {item.location?.address || 'Location not specified'}
          </Text>
        </View>
        <Text style={styles.mapIcon}>🗺️</Text>
      </View>
      
      <Text style={styles.date}>
        📅 {new Date(item.submittedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading map data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Issue Map</Text>
        <Text style={styles.subtitle}>
          {issues.length} issue{issues.length !== 1 ? 's' : ''} on map
        </Text>
        <Text style={styles.instruction}>
          Tap on any issue to open in Google Maps
        </Text>
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
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>No issues to display on map</Text>
            <Text style={styles.emptySubtext}>
              Issues assigned to your department will appear here
            </Text>
          </View>
        }
      />
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
  instruction: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
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
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  coordinates: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  address: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  mapIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
