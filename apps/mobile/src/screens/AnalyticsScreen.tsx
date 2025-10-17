import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

function LanguageSelector() {
  return (
    <TouchableOpacity style={styles.langButton} activeOpacity={0.8}>
      <Text style={styles.langFlag}>🇺🇸</Text>
      <Text style={styles.langText}>ENG</Text>
      <Text style={styles.langChevron}>▾</Text>
    </TouchableOpacity>
  );
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState<7 | 10 | 14 | 30>(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    try {
      let page = 1;
      const pageSize = 200;
      const all: any[] = [];
      for (let i = 0; i < 10; i++) {
        const result = await ApiService.getReports(page, pageSize);
        const list = result?.data?.reports || [];
        all.push(...list);
        const hasNext = result?.data?.pagination?.hasNext;
        if (!hasNext) break;
        page += 1;
      }
      setReports(all);
    } catch (e) {
      console.log('Error fetching data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const byStatus = useMemo(() => {
    const counts = { submitted: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0 };
    for (const r of reports) {
      const s = r?.status || 'submitted';
      counts[s as keyof typeof counts] = (counts[s as keyof typeof counts] || 0) + 1;
    }
    return counts;
  }, [reports]);

  const totalReports = reports.length;

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) set.add(r?.issue?.category || 'Other');
    return ['All', ...Array.from(set).sort()];
  }, [reports]);

  const timeWindow = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    const span = rangeDays;
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [rangeDays]);

  const makeSeries = useCallback(
    (filterCategory?: string) => {
      const days = timeWindow;
      const makeZeroMap = () =>
        days.reduce((acc: any, d) => {
          acc[d] = 0;
          return acc;
        }, {});
      const submitted = makeZeroMap();
      const inProgress = makeZeroMap();
      const resolved = makeZeroMap();
      const overdue = makeZeroMap();

      for (const r of reports) {
        const cat = r?.issue?.category || 'Other';
        if (filterCategory && filterCategory !== 'All' && cat !== filterCategory) continue;
        const key = r?.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : undefined;
        if (!key || !(key in submitted)) continue;
        const s = r?.status || 'submitted';
        if (s === 'submitted') submitted[key] += 1;
        else if (s === 'in_progress') inProgress[key] += 1;
        else if (s === 'resolved' || s === 'closed') resolved[key] += 1;
        else if (s === 'overdue') overdue[key] += 1;
      }

      return {
        labels: days,
        datasets: [
          { data: days.map((d) => submitted[d]), color: () => '#3B82F6', strokeWidth: 3 },
          { data: days.map((d) => inProgress[d]), color: () => '#EF4444', strokeWidth: 3 },
          { data: days.map((d) => resolved[d]), color: () => '#10B981', strokeWidth: 3 },
          { data: days.map((d) => overdue[d]), color: () => '#F59E0B', strokeWidth: 3 },
        ],
      };
    },
    [reports, timeWindow]
  );

  const seriesAllStatuses = useMemo(() => makeSeries(), [makeSeries]);
  const seriesByCategory = useMemo(() => makeSeries(selectedCategory), [makeSeries, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllReports();
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(17,24,39,${opacity})`,
    labelColor: (opacity = 1) => `rgba(107,114,128,${opacity})`,
    propsForDots: { r: '3', strokeWidth: '1', stroke: '#3B82F6' },
    propsForBackgroundLines: { strokeDasharray: '', strokeWidth: 0 },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/logoimage.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>Analytics</Text>
        </View>
        <LanguageSelector />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {/* Days Range Selector */}
          <View style={styles.daysBoxRow}>
            {[7, 10, 14, 30].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBox, rangeDays === d && styles.dayBoxActive]}
                onPress={() => setRangeDays(d as any)}
              >
                <Text style={[styles.dayBoxText, rangeDays === d && styles.dayBoxTextActive]}>{d} Days</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Chips Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categoriesList.slice(0, 4).map((cat, idx) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Image
                  source={require('../images/icons8-transmission-tower-24 (1).png')}
                  style={styles.categoryIcon}
                />
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}

            {/* Dropdown for remaining categories */}
            <TouchableOpacity style={styles.moreChip} onPress={() => setShowDropdown(!showDropdown)}>
              <Feather name="chevron-down" size={16} color="#111" />
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </ScrollView>

          {showDropdown && (
            <View style={styles.dropdown}>
              <Picker selectedValue={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                {categoriesList.slice(4).map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="trending-up" size={20} color="#10B981" />
              <Text style={styles.statNumber}>{totalReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="clock" size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{byStatus.in_progress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <Text style={styles.statNumber}>{byStatus.resolved + byStatus.closed}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="edit-3" size={20} color="#3B82F6" />
              <Text style={styles.statNumber}>{byStatus.submitted}</Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
          </View>

          {/* Charts */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Status trends (last {rangeDays} days)</Text>
            {loading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <LineChart
                data={{
                  labels: seriesAllStatuses.labels.map((d, idx) =>
                    rangeDays <= 10 ? d.slice(5) : idx % Math.ceil(rangeDays / 6) === 0 ? d.slice(5) : ''
                  ),
                  datasets: seriesAllStatuses.datasets,
                  legend: ['Submitted', 'In Progress', 'Resolved', 'Overdue'],
                }}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                withDots
                withShadow={false}
                style={{ borderRadius: 12 }}
              />
            )}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Category trends ({selectedCategory})</Text>
            {loading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <LineChart
                data={{
                  labels: seriesByCategory.labels.map((d, idx) =>
                    rangeDays <= 10 ? d.slice(5) : idx % Math.ceil(rangeDays / 6) === 0 ? d.slice(5) : ''
                  ),
                  datasets: seriesByCategory.datasets,
                  legend: ['Submitted', 'In Progress', 'Resolved', 'Overdue'],
                }}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                withDots
                withShadow={false}
                style={{ borderRadius: 12 }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContainer: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 28, height: 28, borderRadius: 6, marginRight: 8 },
  appName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  langFlag: { fontSize: 16, marginRight: 6 },
  langText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  langChevron: { marginLeft: 6, color: '#6B7280', fontSize: 12 },
  content: { padding: 16 },

  daysBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayBox: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dayBoxActive: { backgroundColor: '#111827', borderColor: '#111827' },
  dayBoxText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  dayBoxTextActive: { color: '#fff' },

  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  categoryChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryIcon: { width: 18, height: 18, marginRight: 6 },
  categoryText: { fontSize: 12, color: '#111', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },

  moreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  moreText: { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#111' },

  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 16,
  },

  chartCard: { backgroundColor: 'transparent', marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    width: (width - 48) / 2,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#111', textAlign: 'center', marginBottom: 4 },
});
