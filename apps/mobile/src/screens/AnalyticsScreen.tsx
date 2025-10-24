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
import { ApiService } from '../services/api';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

// Icons for stats
const statIcons = [
  require('../images/icons8-person-100.png'), // Total Report
  require('../images/icons8-construction-64.png'),
  require('../images/icons8-success-64 (1).png'), // Resolved
  require('../images/icons8-why-quest-48.png'), // Submitted
];

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
  const [rangeDays, setRangeDays] = useState<7 | 10 | 14 | 30>(7);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Fetch all reports
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

  // Compute reports by status
  const byStatus = useMemo(() => {
    const counts = { submitted: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0 };
    const filteredReports = reports.filter(r => {
      if (selectedFilter === 'All') return true;
      const cat = r?.issue?.category || 'Other';
      const dept = r?.assignedTo?.department || r?.department || 'Unassigned';

      const departmentMapping: Record<string, string | string[]> = {
        ROAD_DEPT: 'Road',
        ELECTRICITY_DEPT: 'Electricity',
        SEWAGE_DEPT: 'Sewage',
        CLEANLINESS_DEPT: ['Cleanliness', 'Dustbin Full'],
        WATER_DEPT: 'Water',
        STREETLIGHT_DEPT: 'Streetlight',
      };

      const mappedCategory = departmentMapping[selectedFilter as keyof typeof departmentMapping];
      const isMappedCategory = Array.isArray(mappedCategory)
        ? mappedCategory.includes(cat)
        : mappedCategory && cat === mappedCategory;

      return cat === selectedFilter || dept === selectedFilter || isMappedCategory;
    });

    for (const r of filteredReports) {
      const s = r?.status || 'submitted';
      counts[s as keyof typeof counts] = (counts[s as keyof typeof counts] || 0) + 1;
    }
    return counts;
  }, [reports, selectedFilter]);

  // Total reports
  const totalReports = useMemo(() => {
    if (selectedFilter === 'All') return reports.length;
    return reports.filter(r => {
      const cat = r?.issue?.category || 'Other';
      const dept = r?.assignedTo?.department || r?.department || 'Unassigned';

      const departmentMapping: Record<string, string | string[]> = {
        ROAD_DEPT: 'Road',
        ELECTRICITY_DEPT: 'Electricity',
        SEWAGE_DEPT: 'Sewage',
        CLEANLINESS_DEPT: ['Cleanliness', 'Dustbin Full'],
        WATER_DEPT: 'Water',
        STREETLIGHT_DEPT: 'Streetlight',
      };

      const mappedCategory = departmentMapping[selectedFilter as keyof typeof departmentMapping];
      const isMappedCategory = Array.isArray(mappedCategory)
        ? mappedCategory.includes(cat)
        : mappedCategory && cat === mappedCategory;

      return cat === selectedFilter || dept === selectedFilter || isMappedCategory;
    }).length;
  }, [reports, selectedFilter]);

  // Categories & Departments
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) set.add(r?.issue?.category || 'Other');
    return ['All', ...Array.from(set).sort()];
  }, [reports]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      const dept = r?.assignedTo?.department || r?.department || 'Unassigned';
      set.add(dept);
    }
    return ['All', ...Array.from(set).sort()];
  }, [reports]);

  // Combined filter list
  const combinedList = useMemo(() => {
    const categories = categoriesList.filter(cat => cat !== 'All');
    const departments = departmentsList.filter(dept => dept !== 'All');
    const reportIssueDepartments = [
      'ROAD_DEPT',
      'ELECTRICITY_DEPT',
      'SEWAGE_DEPT',
      'CLEANLINESS_DEPT',
      'WATER_DEPT',
      'STREETLIGHT_DEPT',
    ];
    const allItems = [...categories, ...departments, ...reportIssueDepartments];
    const uniqueItems = [...new Set(allItems)];
    return ['All', ...uniqueItems.sort()];
  }, [categoriesList, departmentsList]);

  // Time window
  const timeWindow = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [rangeDays]);

  // Series data for charts
  const makeSeriesByStatus = useCallback(
    (status: 'submitted' | 'in_progress' | 'resolved' | 'overdue', filter?: string) => {
      const days = timeWindow;
      const zeroMap = days.reduce((acc: any, d: string) => {
        acc[d] = 0;
        return acc;
      }, {});
      const dataMap = { ...zeroMap };

      for (const r of reports) {
        if (filter && filter !== 'All') {
          const cat = r?.issue?.category || 'Other';
          const dept = r?.assignedTo?.department || r?.department || 'Unassigned';

          const departmentMapping: Record<string, string> = {
            ROAD_DEPT: 'Road',
            ELECTRICITY_DEPT: 'Electricity',
            SEWAGE_DEPT: 'Sewage',
            CLEANLINESS_DEPT: 'Cleanliness',
            WASTE_MGMT: 'Dustbin Full',
            WATER_DEPT: 'Water',
            STREETLIGHT_DEPT: 'Streetlight',
          };

          const mappedCategory = departmentMapping[filter as keyof typeof departmentMapping];
          if (cat !== filter && dept !== filter && !(mappedCategory && cat === mappedCategory)) continue;
        }

        const key = r?.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : undefined;
        if (!key || !(key in dataMap)) continue;

        const s = r?.status || 'submitted';
        if (status === 'resolved' && (s === 'resolved' || s === 'closed')) dataMap[key] += 1;
        else if (s === status) dataMap[key] += 1;
      }

      return { labels: days, datasets: [{ data: days.map((d: string) => dataMap[d]), strokeWidth: 3 }] };
    },
    [reports, timeWindow]
  );

  const seriesSubmitted = useMemo(() => makeSeriesByStatus('submitted', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesInProgress = useMemo(() => makeSeriesByStatus('in_progress', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesResolved = useMemo(() => makeSeriesByStatus('resolved', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesOverdue = useMemo(() => makeSeriesByStatus('overdue', selectedFilter), [makeSeriesByStatus, selectedFilter]);

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAllReports();
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(17,24,39,${opacity})`,
    labelColor: (opacity = 1) => `rgba(17,17,17,${opacity})`,
    propsForDots: { r: '1.5', strokeWidth: '0.4', stroke: '#ffffff' },
    propsForBackgroundLines: { stroke: '#000000', strokeDasharray: '', strokeWidth: 0.03 },
  };

  const getPercentage = (count: number) => totalReports ? ((count / totalReports) * 100).toFixed(1) + '%' : '0%';

  const renderStatusChart = (title: string, series: any, color: string) => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title} - {selectedFilter}</Text>
      {loading ? (
        <ActivityIndicator color="#111827" />
      ) : (
        <LineChart
          data={{
            labels: series.labels.map((d: string, idx: number) =>
              rangeDays <= 10 ? d.slice(5) : idx % Math.ceil(rangeDays / 6) === 0 ? d.slice(5) : ''
            ),
            datasets: series.datasets.map((ds: any) => ({ ...ds, color: () => color })),
          }}
          width={width - 32}
          height={180}
          chartConfig={{
            ...chartConfig,
            color: () => color,
            fillShadowGradient: color,
            fillShadowGradientOpacity: 0.1,
            propsForDots: { r: '3', strokeWidth: '1', stroke: color },
          }}
          bezier
          withDots
          withShadow
          style={{ borderRadius: 8 }}
        />
      )}
    </View>
  );

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
            {[7, 10, 14, 30].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dayBox, rangeDays === d && styles.dayBoxActive]}
                onPress={() => setRangeDays(d as any)}
              >
                <Text style={[styles.dayBoxText, rangeDays === d && styles.dayBoxTextActive]}>{d} Days</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Combined Filter Dropdown */}
          <View style={styles.dropdown}>
            <Picker selectedValue={selectedFilter} onValueChange={val => setSelectedFilter(val)}>
              {combinedList.map(item => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRowHorizontal}>
              {[
                { count: totalReports, label: 'Total Reports' },
                { count: byStatus.in_progress, label: 'In Progress' },
                { count: byStatus.resolved + byStatus.closed, label: 'Resolved' },
                { count: byStatus.submitted, label: 'Submitted' },
              ].map((item, index) => (
                <View key={item.label} style={styles.statColumn}>
                  <View style={styles.statRow}>
                    <Image source={statIcons[index]} style={styles.statIcon} />
                    <Text style={styles.statNumber}>{item.count}</Text>
                  </View>
                  <Text style={styles.statPercentage}>{getPercentage(item.count)}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Individual Status Charts */}
          {renderStatusChart('Submitted', seriesSubmitted, '#3B82F6')}
          {renderStatusChart('In Progress', seriesInProgress, '#F97316')}
          {renderStatusChart('Resolved', seriesResolved, '#10B981')}
          {renderStatusChart('Overdue', seriesOverdue, '#EF4444')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------- STYLES -----------------
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
  daysBoxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
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
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginBottom: 16 },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  statsRowHorizontal: { flexDirection: 'row', justifyContent: 'space-around' },
  statColumn: { alignItems: 'center', flex: 1, marginHorizontal: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statIcon: { width: 50, height: 50, marginRight: 4 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#111' },
  statPercentage: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chartCard: { backgroundColor: 'transparent', marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
});
