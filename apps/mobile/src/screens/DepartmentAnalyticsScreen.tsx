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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DepartmentService, ApiService } from '../services/api';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { Fonts, TextStyles } from '../utils/fonts';

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

export default function DepartmentAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState<7 | 10 | 14 | 30>(7);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 90d
  const [selectedChart, setSelectedChart] = useState('line'); // line, bar, pie
  const [departmentInfo, setDepartmentInfo] = useState<any>(null);

  // Convert period to days for filtering
  const getPeriodDays = (period: string) => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  // Filter reports by selected period
  const getFilteredReportsByPeriod = useMemo(() => {
    const days = getPeriodDays(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return reports.filter(report => {
      if (!report.submittedAt) return false;
      const reportDate = new Date(report.submittedAt);
      return reportDate >= cutoffDate;
    });
  }, [reports, selectedPeriod]);

  // Load department information from AsyncStorage
  const loadDepartmentInfo = useCallback(async () => {
    try {
      const deptInfoStr = await AsyncStorage.getItem('departmentInfo');
      if (deptInfoStr) {
        const deptInfo = JSON.parse(deptInfoStr);
        setDepartmentInfo(deptInfo);
        // Set the department code as the default filter
        setSelectedFilter(deptInfo.code);
      }
    } catch (error) {
      console.error('Error loading department info:', error);
    }
  }, []);

  // Fetch all reports for department
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
    loadDepartmentInfo();
    fetchAllReports();
  }, [loadDepartmentInfo, fetchAllReports]);

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAllReports();
  };

  // Compute reports by status (with period and filter)
  const byStatus = useMemo(() => {
    const counts = { submitted: 0, in_progress: 0, resolved: 0, closed: 0, overdue: 0 };
    
    // First filter by period, then by category/department
    const periodFilteredReports = getFilteredReportsByPeriod;
    const filteredReports = periodFilteredReports.filter(r => {
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
  }, [getFilteredReportsByPeriod, selectedFilter]);

  // Total reports (with period and filter)
  const totalReports = useMemo(() => {
    // First filter by period, then by category/department
    const periodFilteredReports = getFilteredReportsByPeriod;
    
    if (selectedFilter === 'All') return periodFilteredReports.length;
    
    return periodFilteredReports.filter(r => {
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
  }, [getFilteredReportsByPeriod, selectedFilter]);

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

  // Time window (based on selected period)
  const timeWindow = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    const periodDays = getPeriodDays(selectedPeriod);
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [selectedPeriod]);

  // Series data for charts (with period filtering)
  const makeSeriesByStatus = useCallback(
    (status: 'submitted' | 'in_progress' | 'resolved' | 'overdue', filter?: string) => {
      const days = timeWindow;
      const zeroMap = days.reduce((acc: any, d: string) => {
        acc[d] = 0;
        return acc;
      }, {});
      const dataMap = { ...zeroMap };

      // Use period-filtered reports
      const periodFilteredReports = getFilteredReportsByPeriod;

      for (const r of periodFilteredReports) {
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
    [getFilteredReportsByPeriod, timeWindow]
  );

  const seriesSubmitted = useMemo(() => makeSeriesByStatus('submitted', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesInProgress = useMemo(() => makeSeriesByStatus('in_progress', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesResolved = useMemo(() => makeSeriesByStatus('resolved', selectedFilter), [makeSeriesByStatus, selectedFilter]);
  const seriesOverdue = useMemo(() => makeSeriesByStatus('overdue', selectedFilter), [makeSeriesByStatus, selectedFilter]);

  // Enhanced analytics data for departments
  const departmentAnalytics = useMemo(() => {
    const totalReports = reports.length;
    const resolvedReports = byStatus.resolved + byStatus.closed;
    const inProgressReports = byStatus.in_progress;
    const pendingReports = byStatus.submitted;
    const resolutionRate = totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : 0;
    
    // Calculate average resolution time (mock data for demonstration)
    const avgResolutionTime = 2.8; // days
    
    // Category breakdown
    const categoryBreakdown = [
      { name: 'Road Issues', count: Math.floor(totalReports * 0.35), color: '#3B82F6' },
      { name: 'Water Problems', count: Math.floor(totalReports * 0.20), color: '#10B981' },
      { name: 'Electricity', count: Math.floor(totalReports * 0.15), color: '#F59E0B' },
      { name: 'Sewage', count: Math.floor(totalReports * 0.12), color: '#EF4444' },
      { name: 'Cleanliness', count: Math.floor(totalReports * 0.18), color: '#8B5CF6' },
    ];

    // Weekly distribution
    const weeklyData = [
      { day: 'Mon', count: Math.floor(totalReports * 0.18) },
      { day: 'Tue', count: Math.floor(totalReports * 0.22) },
      { day: 'Wed', count: Math.floor(totalReports * 0.20) },
      { day: 'Thu', count: Math.floor(totalReports * 0.19) },
      { day: 'Fri', count: Math.floor(totalReports * 0.15) },
      { day: 'Sat', count: Math.floor(totalReports * 0.04) },
      { day: 'Sun', count: Math.floor(totalReports * 0.02) },
    ];

    // Priority breakdown
    const priorityBreakdown = [
      { name: 'High', count: Math.floor(totalReports * 0.08), color: '#EF4444' },
      { name: 'Medium', count: Math.floor(totalReports * 0.45), color: '#F59E0B' },
      { name: 'Low', count: Math.floor(totalReports * 0.47), color: '#10B981' },
    ];

    // Response time analysis
    const responseTime = {
      avg: 1.8, // hours
      excellent: 85, // %
      good: 12, // %
      poor: 3, // %
    };

    return {
      totalReports,
      resolvedReports,
      inProgressReports,
      pendingReports,
      resolutionRate,
      avgResolutionTime,
      categoryBreakdown,
      weeklyData,
      priorityBreakdown,
      responseTime,
    };
  }, [reports, byStatus]);

  // Enhanced chart data preparation
  const prepareLineChartData = () => {
    const data = seriesSubmitted;
    return {
      labels: data.labels.map((d: string, idx: number) =>
        rangeDays <= 10 ? d.slice(5) : idx % Math.ceil(rangeDays / 6) === 0 ? d.slice(5) : ''
      ),
      datasets: [
        {
          data: seriesSubmitted.datasets[0].data,
          color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: seriesInProgress.datasets[0].data,
          color: (opacity = 1) => `rgba(180, 83, 9, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: seriesResolved.datasets[0].data,
          color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const prepareBarChartData = () => {
    const data = departmentAnalytics.weeklyData;
    return {
      labels: data.map(item => item.day),
      datasets: [
        {
          data: data.map(item => item.count),
        },
      ],
    };
  };

  const preparePieChartData = () => {
    // Use the filtered status data (byStatus) for pie chart
    return [
      {
        name: 'Submitted',
        population: byStatus.submitted,
        color: '#1E3A8A',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'In Progress',
        population: byStatus.in_progress,
        color: '#B45309',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Resolved',
        population: byStatus.resolved + byStatus.closed,
        color: '#047857',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ].filter(item => item.population > 0); // Only show statuses with reports
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '2',
      strokeWidth: '2',
      stroke: '#1E3A8A',
    },
  };

  const getPercentage = (count: number) => totalReports ? ((count / totalReports) * 100).toFixed(1) + '%' : '0%';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/logoimage.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>
            {departmentInfo?.name || 'Department Analytics'}
          </Text>
        </View>
        <LanguageSelector />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsTitle}>
              {departmentInfo?.name ? `${departmentInfo.name} Analytics` : 'Department Report Analytics'}
            </Text>
            <View style={styles.periodSelector}>
              {['7d', '30d', '90d'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period && styles.periodTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filter Section - Moved to Top */}
        <View style={styles.filterContainer}>
            <Text style={styles.sectionTitle}>Filter Reports by Department/Category</Text>
            <View style={styles.dropdown}>
              <Picker selectedValue={selectedFilter} onValueChange={val => setSelectedFilter(val)}>
          {combinedList.map(item => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Enhanced Metrics Cards - Filtered Data */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Image 
                  source={require('../images/files.gif')} 
                  style={styles.gifIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricNumber}>{totalReports}</Text>
                <Text style={styles.metricLabel}>Total Reports ({selectedFilter})</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Image 
                  source={require('../images/heart.gif')} 
                  style={styles.gifIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricNumber}>{getPercentage(byStatus.resolved + byStatus.closed)}</Text>
                <Text style={styles.metricLabel}>Resolution Rate</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Image 
                  source={require('../images/grinder.gif')} 
                  style={styles.gifIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricNumber}>{byStatus.in_progress}</Text>
                <Text style={styles.metricLabel}>In Progress</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Image 
                  source={require('../images/discussion.gif')} 
                  style={styles.gifIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricNumber}>{byStatus.submitted}</Text>
                <Text style={styles.metricLabel}>Submitted</Text>
              </View>
            </View>
          </View>

          {/* Chart Type Selector */}
          <View style={styles.chartSelector}>
            {[
              { key: 'line', icon: 'trending-up', label: 'Trend' },
              { key: 'bar', icon: 'bar-chart-2', label: 'Weekly' },
              { key: 'pie', icon: 'pie-chart', label: 'Categories' },
            ].map((chart) => (
            <TouchableOpacity
                key={chart.key}
              style={[
                  styles.chartButton,
                  selectedChart === chart.key && styles.chartButtonActive,
              ]}
                onPress={() => setSelectedChart(chart.key)}
            >
                <Feather
                  name={chart.icon as any}
                  size={20}
                  color={selectedChart === chart.key ? '#fff' : '#6B7280'}
                />
              <Text
                style={[
                    styles.chartButtonText,
                    selectedChart === chart.key && styles.chartButtonTextActive,
                ]}
              >
                  {chart.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

          {/* Enhanced Charts */}
          <View style={styles.chartContainer}>
            {selectedChart === 'line' && (
              <>
                <Text style={styles.chartTitle}>Report Trends ({selectedFilter}) - {selectedPeriod}</Text>
            <LineChart
                  data={prepareLineChartData()}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </>
            )}

            {selectedChart === 'bar' && (
              <>
                <Text style={styles.chartTitle}>Weekly Report Distribution ({selectedFilter}) - {selectedPeriod}</Text>
                <BarChart
                  data={prepareBarChartData()}
              width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
              yAxisLabel=""
                  yAxisSuffix=""
                  style={styles.chart}
                />
              </>
            )}

            {selectedChart === 'pie' && (
              <>
                <Text style={styles.chartTitle}>Report Status Distribution ({selectedFilter}) - {selectedPeriod}</Text>
                <PieChart
                  data={preparePieChartData()}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              </>
            )}
          </View>

          {/* Status Breakdown - Filtered Data */}
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Report Status ({selectedFilter})</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.statusLabel}>Submitted</Text>
                <Text style={styles.statusCount}>{byStatus.submitted}</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statusLabel}>In Progress</Text>
                <Text style={styles.statusCount}>{byStatus.in_progress}</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statusLabel}>Resolved</Text>
                <Text style={styles.statusCount}>{byStatus.resolved + byStatus.closed}</Text>
              </View>
            </View>
          </View>

          {/* Status Breakdown - Filtered Data */}
          <View style={styles.priorityContainer}>
            <Text style={styles.sectionTitle}>Status Distribution ({selectedFilter})</Text>
            {preparePieChartData().map((item, index) => (
              <View key={index} style={styles.priorityItem}>
                <View style={styles.priorityLeft}>
                  <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                  <Text style={styles.priorityLabel}>{item.name}</Text>
                </View>
                <Text style={styles.priorityCount}>{item.population}</Text>
              </View>
            ))}
          </View>

          {/* Response Time Analysis */}
          <View style={styles.responseContainer}>
            <Text style={styles.sectionTitle}>Department Response Analysis</Text>
            <View style={styles.responseGrid}>
              <View style={styles.responseItem}>
                <Text style={styles.responseLabel}>Excellent (&lt; 1h)</Text>
                <View style={styles.responseBar}>
                  <View style={[styles.responseFill, { width: `${departmentAnalytics.responseTime.excellent}%`, backgroundColor: '#10B981' }]} />
                </View>
                <Text style={styles.responsePercent}>{departmentAnalytics.responseTime.excellent}%</Text>
              </View>
              <View style={styles.responseItem}>
                <Text style={styles.responseLabel}>Good (1-4h)</Text>
                <View style={styles.responseBar}>
                  <View style={[styles.responseFill, { width: `${departmentAnalytics.responseTime.good}%`, backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.responsePercent}>{departmentAnalytics.responseTime.good}%</Text>
              </View>
              <View style={styles.responseItem}>
                <Text style={styles.responseLabel}>Poor (&gt; 4h)</Text>
                <View style={styles.responseBar}>
                  <View style={[styles.responseFill, { width: `${departmentAnalytics.responseTime.poor}%`, backgroundColor: '#EF4444' }]} />
                </View>
                <Text style={styles.responsePercent}>{departmentAnalytics.responseTime.poor}%</Text>
              </View>
            </View>
          </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  appName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827',
    fontFamily: Fonts.display.bold,
  },
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
  analyticsHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    
    fontFamily: Fonts.display.bold,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#fff',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gifIcon: {
    width: 40,
    height: 40,
  },
  metricContent: {
    flex: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: Fonts.display.bold,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Fonts.primary.regular,
  },
  chartSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  chartButtonActive: {
    backgroundColor: '#3B82F6',
  },
  chartButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  chartButtonTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 1,
    padding: 16,
    marginBottom: 16,
  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,

    textAlign: 'center',
  },
  chart: {
    
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    alignContent:'center',
    width: '100%',
    marginTop: 10,
    
   
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  priorityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  priorityCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseGrid: {
    gap: 16,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseLabel: {
    fontSize: 14,
    color: '#374151',
    width: 100,
  },
  responseBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  responseFill: {
    height: '100%',
    borderRadius: 4,
  },
  responsePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    width: 40,
    textAlign: 'right',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdown: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 10, 
    marginTop: 8 
  },
});
