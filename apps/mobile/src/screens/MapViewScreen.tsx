import React, { useEffect, useMemo, useState } from 'react';
declare const process: any;
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import GoogleMap from '../components/GoogleMap';
import { ApiService } from '../services/api';

export default function MapViewScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getAllReports();
      setReports(result?.data?.reports || result?.reports || []);
    } catch (e) {
      // no-op, keep UI minimal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getMarkerColor = (status?: string, submittedAt?: string) => {
    if (status === 'resolved' || status === 'closed') return '#10B981'; // green
    if (status === 'in_progress') return '#EF4444'; // red
    // overdue heuristic: older than 7 days and not resolved
    if (submittedAt) {
      const created = new Date(submittedAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - created > sevenDays) return '#F59E0B'; // yellow
    }
    return '#3B82F6'; // default blue for submitted
  };

  const markers = useMemo(() => {
    return (reports || [])
      .filter((r: any) => r?.location?.latitude && r?.location?.longitude)
      .map((r: any) => ({
        latitude: r.location.latitude,
        longitude: r.location.longitude,
        title: r.issue?.category || 'Report',
        description: r.issue?.subcategory ? `${r.issue.subcategory}` : undefined,
        color: getMarkerColor(r.status, r.submittedAt)
      }));
  }, [reports]);

  const initialCenter = useMemo(() => {
    if (markers.length > 0) {
      return { latitude: markers[0].latitude, longitude: markers[0].longitude };
    }
    return { latitude: 28.6139, longitude: 77.2090 }; // New Delhi default
  }, [markers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const googleKey = ((process as any)?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string) || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {googleKey ? (
          <GoogleMap
            apiKey={googleKey}
            latitude={initialCenter.latitude}
            longitude={initialCenter.longitude}
            zoom={12}
            markers={markers}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 }}>Google Maps API key required</Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and restart the app.</Text>
          </View>
        )}
        <View style={styles.legendContainer}>
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Status</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendLabel}>In Progress</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendLabel}>Resolved</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>Overdue</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendLabel}>Submitted</Text>
            </View>
          </View>
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        )}
      </View>
      <ScrollView
        style={styles.bottomBar}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomBarContent}
      >
        <Text style={styles.bottomText}>Pull to refresh reports</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  mapContainer: { flex: 1 },
  legendContainer: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start' },
  legendCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  legendTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#ffffff' },
  legendLabel: { fontSize: 12, color: '#111827' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  bottomBar: { backgroundColor: '#ffffff' },
  bottomBarContent: { paddingHorizontal: 16, paddingVertical: 12 },
  bottomText: { fontSize: 12, color: '#4B5563' }
});
