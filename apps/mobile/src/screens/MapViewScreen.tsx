import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList,
  TextInput,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function MapViewScreen() {
  const mapRef = useRef<MapView>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredReports, setFilteredReports] = useState<any[]>([]);

  // Load reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getAllReports();
      const data = res?.data?.reports || res?.reports || res?.data || [];
      const filtered = data.filter((r: any) => {
        const lat = Number(r?.location?.latitude);
        const lng = Number(r?.location?.longitude);
        return isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0;
      });
      setReports(filtered);
      setFilteredReports(filtered);
    } catch (err) {
      console.log('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter reports by search text
  useEffect(() => {
    if (!searchText) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(r =>
        r.issue?.category?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchText, reports]);

  const getMarkerType = (status?: string, submittedAt?: string) => {
    if (status === 'resolved' || status === 'closed') return 'resolved';
    if (status === 'in_progress') return 'in_progress';
    if (submittedAt) {
      const created = new Date(submittedAt).getTime();
      if (Date.now() - created > 7 * 24 * 60 * 60 * 1000) return 'overdue';
    }
    return 'pending';
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'resolved':
        return '#10B981'; // green
      case 'in_progress':
        return '#EF4444'; // red
      case 'overdue':
        return '#F59E0B'; // orange
      default:
        return '#3B82F6'; // blue
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'resolved':
        return 'check-circle';
      case 'in_progress':
        return 'clock';
      case 'overdue':
        return 'alert-triangle';
      default:
        return 'map-pin';
    }
  };

  // Fit all markers to map
  useEffect(() => {
    if (filteredReports.length > 0 && mapRef.current) {
      const coords = filteredReports.map(r => ({
        latitude: Number(r.location.latitude),
        longitude: Number(r.location.longitude),
      }));
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }, 500);
    }
  }, [filteredReports]);

  const handleMarkerPress = (report: any) => {
    setSelectedReport(report);
    const { latitude, longitude } = report.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by category"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Google Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        initialRegion={{
          latitude: filteredReports[0]?.location?.latitude || 20.5937,
          longitude: filteredReports[0]?.location?.longitude || 78.9629,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {filteredReports.map((r, i) => {
          const lat = Number(r.location.latitude);
          const lng = Number(r.location.longitude);
          const type = getMarkerType(r.status, r.submittedAt);
          const color = getMarkerColor(type);
          const icon = getMarkerIcon(type);

          return (
            <Marker
              key={r._id || i}
              coordinate={{ latitude: lat, longitude: lng }}
              title={r.issue?.category || 'Report'}
              description={r.location?.address || ''}
              onPress={() => handleMarkerPress(r)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.customMarker,
                  { backgroundColor: color },
                  selectedReport?._id === r._id && { transform: [{ scale: 1.2 }] },
                ]}
              >
                <Feather name={icon as any} size={16} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Scrollable report list */}
      {filteredReports.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Reports ({filteredReports.length})</Text>
          <FlatList
            data={filteredReports}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={({ item }) => {
              const type = getMarkerType(item.status, item.submittedAt);
              const color = getMarkerColor(type);

              return (
                <TouchableOpacity
                  style={[styles.reportCard, { borderLeftColor: color }]}
                  onPress={() => {
                    setSelectedReport(item);
                    mapRef.current?.animateToRegion({
                      latitude: Number(item.location.latitude),
                      longitude: Number(item.location.longitude),
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    });
                  }}
                >
                  <Text style={styles.reportCategory}>{item.issue?.category || 'Unknown'}</Text>
                  <Text style={styles.reportAddress} numberOfLines={1}>
                    {item.location?.address || 'No address'}
                  </Text>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${item.location.latitude},${item.location.longitude}`
                      )
                    }
                  >
                    <Feather name="navigation" size={14} color="#fff" />
                    <Text style={styles.navText}>Navigate</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Search bar
  searchContainer: {
    position: 'absolute',
    top: 15,
    left: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    elevation: 3,
  },
  filterButton: {
    marginLeft: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  customMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  listContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  listTitle: {
    color: '#111',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 16,
    marginBottom: 8,
  },
  reportCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 12,
    width: 220,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderLeftWidth: 5,
  },
  reportCategory: { fontWeight: '700', fontSize: 14, color: '#111' },
  reportAddress: { fontSize: 12, color: '#555', marginTop: 4 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  navText: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: '600' },
});
