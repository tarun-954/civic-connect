import React, { useEffect, useMemo, useRef, useState } from 'react';
declare const process: any;
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Animated, PanResponder, Dimensions, Image, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { ApiService } from '../services/api';

export default function MapViewScreen({ navigation }: any) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports || [];
    return (reports || []).filter((r: any) => {
      const texts: string[] = [
        r?.issue?.category,
        r?.issue?.subcategory,
        r?.location?.address,
      ].filter(Boolean);
      return texts.some((t) => String(t).toLowerCase().includes(q));
    });
  }, [reports, searchQuery]);

  const markers = useMemo(() => {
    const isValidCoord = (lat: any, lng: any) => {
      if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
      const nlat = typeof lat === 'string' && lat.trim() === '' ? NaN : Number(lat);
      const nlng = typeof lng === 'string' && lng.trim() === '' ? NaN : Number(lng);
      if (!isFinite(nlat) || !isFinite(nlng)) return false;
      if (Math.abs(nlat) > 90 || Math.abs(nlng) > 180) return false;
      // Avoid (0,0) and obviously invalid near-zero coords
      if (Math.abs(nlat) < 0.0001 && Math.abs(nlng) < 0.0001) return false;
      return true;
    };
    return (filteredReports || [])
      .map((r: any) => {
        const latRaw = r?.location?.latitude;
        const lngRaw = r?.location?.longitude;
        if (!isValidCoord(latRaw, lngRaw)) return null as any;
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        return {
          latitude: lat,
          longitude: lng,
          title: r?.issue?.category || 'Report',
          description: r?.issue?.subcategory ? `${r.issue.subcategory}` : undefined,
          color: getMarkerColor(r?.status, r?.submittedAt),
          _report: r
        };
      })
      .filter(Boolean);
  }, [filteredReports]);

  const initialCenter = useMemo(() => {
    if (markers.length > 0) {
      return { latitude: markers[0].latitude, longitude: markers[0].longitude };
    }
    // Wider default so user sees more map context
    return { latitude: 23.5937, longitude: 80.9629 }; // India centroid
  }, [markers]);

  useEffect(() => {
    // Fit markers after map is loaded
    if (!mapLoaded || !mapRef.current) return;
    if (markers.length > 0) {
      const coords = markers.map(m => ({ latitude: m.latitude, longitude: m.longitude }));
      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 90, left: 90, right: 90, bottom: 140 },
          animated: true,
        });
      } catch {}
    }
  }, [mapLoaded, markers.length]);

  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      mapRef.current.animateToRegion({
        latitude: initialCenter.latitude,
        longitude: initialCenter.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 300);
    }
  }, [initialCenter, markers.length]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const googleKey = ((process as any)?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string) || '';
  const mapRef = useRef<MapView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const apiBase: string = ((process as any)?.env?.EXPO_PUBLIC_API_BASE_URL as string) || '';
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapFailed, setMapFailed] = useState<boolean>(false);
  const [useOsmFallback, setUseOsmFallback] = useState<boolean>(false);

  useEffect(() => {
    // Fallback to OSM tiles if Google map hasn't loaded in time
    const timer = setTimeout(() => {
      if (!mapLoaded) setUseOsmFallback(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [mapLoaded, markers.length]);

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (apiBase) {
      const sep = apiBase.endsWith('/') || url.startsWith('/') ? '' : '/';
      return `${apiBase}${sep}${url}`;
    }
    return url; // best effort
  };

  const parseCoordinates = (r: any): { lat?: number; lng?: number } => {
    const latRaw = r?.location?.latitude;
    const lngRaw = r?.location?.longitude;
    let latNum: number | undefined;
    let lngNum: number | undefined;
    if (latRaw !== undefined && lngRaw !== undefined) {
      const a = Number(latRaw);
      const b = Number(lngRaw);
      if (isFinite(a) && isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        latNum = a; lngNum = b;
      }
    }
    if (latNum === undefined || lngNum === undefined) {
      const coordStr = r?.location?.coordinates || r?.coordinates || r?.location?.coordString;
      if (typeof coordStr === 'string' && coordStr.includes(',')) {
        const parts = coordStr.split(',');
        const a = Number(parts[0].trim());
        const b = Number(parts[1].trim());
        if (isFinite(a) && isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
          latNum = a; lngNum = b;
        }
      }
    }
    if (latNum === undefined || lngNum === undefined) return {} as any;
    if (Math.abs(latNum) < 0.0001 && Math.abs(lngNum) < 0.0001) return {} as any;
    return { lat: latNum, lng: lngNum };
  };

  const extractUrlFromAny = (p: any): string | undefined => {
    if (!p) return undefined;
    if (typeof p === 'string') return p;
    if (typeof p?.url === 'string') return p.url;
    if (typeof p?.uri === 'string') return p.uri;
    if (typeof p?.path === 'string') return p.path;
    return undefined;
  };

  const getFirstPhoto = (r: any) => {
    const a = Array.isArray(r?.photos) ? r.photos : [];
    const b = Array.isArray(r?.issue?.photos) ? r.issue.photos : [];
    const candidate = extractUrlFromAny(a[0]) || extractUrlFromAny(b[0]);
    return toAbsoluteUrl(candidate);
  };

  // Bottom sheet setup
  const windowHeight = Dimensions.get('window').height;
  const expandedHeight = Math.max(Math.floor(windowHeight * 0.5), 320);
  const collapsedHeight = 110;
  const dragRange = expandedHeight - collapsedHeight;
  const translateY = useRef(new Animated.Value(dragRange)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(Math.max(0, gesture.dy + (translateY as any)._value), dragRange);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = gesture.vy < 0 || (translateY as any)._value < dragRange / 2;
        Animated.spring(translateY, {
          toValue: shouldOpen ? 0 : dragRange,
          useNativeDriver: true,
          friction: 8,
          tension: 80
        }).start();
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {/* Header overlay with back and search */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color="#111827" />
          </TouchableOpacity>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#6B7280" style={{ marginHorizontal: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search category, subcategory, address"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </View>
        <MapView
          key={`map-${markers.length}`}
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={googleKey ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: initialCenter.latitude,
            longitude: initialCenter.longitude,
            latitudeDelta: markers.length > 0 ? 0.05 : 15,
            longitudeDelta: markers.length > 0 ? 0.05 : 15,
          }}
          mapType="standard"
          onMapReady={() => setMapLoaded(true)}
          onPress={() => {}}
        >
          {useOsmFallback && (
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
          )}
          {markers.map((m, idx) => (
            <Marker
              key={`${m.latitude}-${m.longitude}-${idx}`}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              title={m.title}
              description={m.description}
              pinColor={m.color}
              onPress={() => setActiveIndex(idx)}
            />)
          )}
        </MapView>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        )}
      </View>
      <Animated.View style={[styles.sheet, { height: expandedHeight, transform: [{ translateY }] }]}> 
        <View style={styles.sheetHandle} {...panResponder.panHandlers}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Reports</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[styles.bottomBarContent, { backgroundColor: 'transparent' }]}
        >
          {filteredReports.slice(0, 20).map((r: any, i: number) => (
            <TouchableOpacity
              key={r._id || i}
              activeOpacity={0.9}
              onPress={() => {
                const parsed = parseCoordinates(r);
                const lat = parsed.lat;
                const lng = parsed.lng;
                if (typeof lat === 'number' && typeof lng === 'number') {
                  setActiveIndex(i);
                  mapRef.current?.animateToRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }, 300);
                }
              }}
              style={[styles.card, activeIndex === i && { borderColor: '#111827' }]}
            >
              <View style={styles.cardImageWrap}>
                {getFirstPhoto(r) ? (
                  <Image source={{ uri: getFirstPhoto(r) }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
                )}
                <View style={styles.cardBadge}> 
                  <Text style={styles.cardBadgeText}>{(r.status || 'submitted').replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{r.issue?.category || 'Report'}</Text>
                <Text style={styles.cardSub}>{r.location?.address || `${r.location?.latitude?.toFixed(4)}, ${r.location?.longitude?.toFixed(4)}`}</Text>
                <View style={styles.cardRow}>
                  <View style={[styles.dot, { backgroundColor: getMarkerColor(r.status, r.submittedAt) }]} />
                  <Text style={styles.cardStatus}>{r.status}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      const parsed = parseCoordinates(r);
                      const lat = parsed.lat;
                      const lng = parsed.lng;
                      if (typeof lat === 'number' && typeof lng === 'number') {
                        setActiveIndex(i);
                        mapRef.current?.animateToRegion({
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        }, 300);
                      }
                    }}
                    style={styles.viewOnMapBtn}
                  >
                    <Text style={styles.viewOnMapText}>View on map</Text>
                  </TouchableOpacity>
                </View>
      </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  mapContainer: { flex: 1, position: 'relative' },
  legendContainer: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start' },
  legendCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  legendTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#ffffff' },
  legendLabel: { fontSize: 12, color: '#111827' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  bottomBar: { backgroundColor: 'transparent' },
  bottomBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  card: { width: 200, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  cardStatus: { fontSize: 11, color: '#111827', textTransform: 'capitalize' },
  cardLink: { marginTop: 6, color: '#2563EB', fontSize: 11, fontWeight: '600' },
  cardImageWrap: { width: '100%', height: 110, backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(17,24,39,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { padding: 10 },
  cardActions: { marginTop: 6, flexDirection: 'row' },
  viewOnMapBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#111827', borderRadius: 8 },
  viewOnMapText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOpacity: 0, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
  sheetHandle: { alignItems: 'center', paddingTop: 8, paddingBottom: 6 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 2 },
  sheetTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  headerOverlay: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  searchWrap: { flex: 1, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  searchInput: { flex: 1, color: '#111827', fontSize: 14, paddingRight: 12 }
});
