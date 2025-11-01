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
  
  // Group reports by coordinates (for clustering)
  const clusterMarkers = (reports: any[]) => {
    const clusters = new Map();
    
    reports.forEach(report => {
      const lat = Number(report.location?.latitude);
      const lng = Number(report.location?.longitude);
      const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key).push(report);
    });
    
    return Array.from(clusters.entries()).map(([key, reports], index) => ({
      key,
      reports: reports as any[],
      coordinate: {
        latitude: Number((reports as any[])[0].location?.latitude),
        longitude: Number((reports as any[])[0].location?.longitude),
      },
    }));
  };

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

  // Filter reports by search text (category, subcategory, description, or address)
  useEffect(() => {
    if (!searchText) {
      setFilteredReports(reports);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = reports.filter(r => {
        const category = r.issue?.category?.toLowerCase() || '';
        const subcategory = r.issue?.subcategory?.toLowerCase() || '';
        const description = r.issue?.description?.toLowerCase() || '';
        const address = r.location?.address?.toLowerCase() || '';
        const status = r.status?.toLowerCase() || '';
        
        return category.includes(searchLower) ||
               subcategory.includes(searchLower) ||
               description.includes(searchLower) ||
               address.includes(searchLower) ||
               status.includes(searchLower);
      });
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

  // Fit all markers to map when filtered reports change
  useEffect(() => {
    if (filteredReports.length > 0 && mapRef.current) {
      const validCoords = filteredReports
        .map(r => {
          const lat = Number(r.location?.latitude);
          const lng = Number(r.location?.longitude);
          if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
            return { latitude: lat, longitude: lng };
          }
          return null;
        })
        .filter(c => c !== null) as { latitude: number; longitude: number }[];
      
      if (validCoords.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(validCoords, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }, 500);
      }
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
          placeholder="Search by category, status, or address"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchText('')} 
            style={styles.clearButton}
          >
            <Feather name="x" size={18} color="#666" />
          </TouchableOpacity>
        )}
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
            latitude: filteredReports[0]?.location?.latitude 
              ? Number(filteredReports[0]?.location?.latitude) 
              : 20.5937,
            longitude: filteredReports[0]?.location?.longitude 
              ? Number(filteredReports[0]?.location?.longitude) 
              : 78.9629,
            latitudeDelta: 5,
            longitudeDelta: 5,
          }}
      >
        {clusterMarkers(filteredReports).map((cluster, clusterIndex) => {
          const clusterSize = cluster.reports.length;
          
          // If multiple reports at same location, show them side by side with offset
          if (clusterSize > 1) {
            return cluster.reports.map((r, index) => {
              const type = getMarkerType(r.status, r.submittedAt);
              const color = getMarkerColor(type);
              const icon = getMarkerIcon(type);
              
              // Offset calculation: spread markers in a small circle
              const angle = (index / clusterSize) * 2 * Math.PI;
              const radius = 0.0003; // Small offset in degrees
              const latOffset = radius * Math.cos(angle);
              const lngOffset = radius * Math.sin(angle);
              
              return (
                <Marker
                  key={`${cluster.key}_${r._id || index}`}
                  coordinate={{
                    latitude: cluster.coordinate.latitude + latOffset,
                    longitude: cluster.coordinate.longitude + lngOffset,
                  }}
                  title={`${r.issue?.category || 'Report'} (${clusterSize} issues)`}
                  description={r.location?.address || ''}
                  onPress={() => handleMarkerPress(r)}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View
                    style={[
                      styles.customMarker,
                      { backgroundColor: color },
                      selectedReport?._id === r._id && { transform: [{ scale: 1.3 }] },
                    ]}
                  >
                    <Feather name={icon as any} size={16} color="#fff" />
                  </View>
                </Marker>
              );
            });
          }
          
          // Single report at this location
          const r = cluster.reports[0];
          const lat = Number(r.location.latitude);
          const lng = Number(r.location.longitude);
          const type = getMarkerType(r.status, r.submittedAt);
          const color = getMarkerColor(type);
          const icon = getMarkerIcon(type);

          return (
            <Marker
              key={r._id || clusterIndex}
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
  clearButton: {
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
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
