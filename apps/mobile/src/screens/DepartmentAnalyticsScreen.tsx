import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { DepartmentService } from '../services/api';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function DepartmentAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 90d
  const [selectedChart, setSelectedChart] = useState('line'); // line, bar, pie

  const loadAnalytics = async () => {
    try {
      const result = await DepartmentService.getAnalytics();
      setAnalytics(result.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // Mock data for demonstration - replace with real API data
  const mockAnalytics = {
    totalIssues: 1247,
    resolvedIssues: 892,
    inProgressIssues: 234,
    pendingIssues: 121,
    resolutionRate: 71.5,
    avgResolutionTime: 3.2, // days
    categoryBreakdown: [
      { name: 'Road Issues', count: 456, color: '#3B82F6' },
      { name: 'Water Problems', count: 234, color: '#10B981' },
      { name: 'Electricity', count: 189, color: '#F59E0B' },
      { name: 'Sewage', count: 156, color: '#EF4444' },
      { name: 'Cleanliness', count: 212, color: '#8B5CF6' },
    ],
    monthlyTrend: [
      { month: 'Jan', submitted: 45, resolved: 38 },
      { month: 'Feb', submitted: 52, resolved: 41 },
      { month: 'Mar', submitted: 48, resolved: 44 },
      { month: 'Apr', submitted: 61, resolved: 55 },
      { month: 'May', submitted: 58, resolved: 52 },
      { month: 'Jun', submitted: 67, resolved: 61 },
    ],
    weeklyData: [
      { day: 'Mon', count: 23 },
      { day: 'Tue', count: 31 },
      { day: 'Wed', count: 28 },
      { day: 'Thu', count: 35 },
      { day: 'Fri', count: 42 },
      { day: 'Sat', count: 18 },
      { day: 'Sun', count: 12 },
    ],
    priorityBreakdown: [
      { name: 'High', count: 89, color: '#EF4444' },
      { name: 'Medium', count: 456, color: '#F59E0B' },
      { name: 'Low', count: 702, color: '#10B981' },
    ],
    responseTime: {
      avg: 2.4, // hours
      excellent: 78, // %
      good: 18, // %
      poor: 4, // %
    }
  };

  const prepareLineChartData = () => {
    const data = mockAnalytics.monthlyTrend;
    return {
      labels: data.map(item => item.month),
      datasets: [
        {
          data: data.map(item => item.submitted),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: data.map(item => item.resolved),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const prepareBarChartData = () => {
    const data = mockAnalytics.weeklyData;
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
    return mockAnalytics.categoryBreakdown.map(item => ({
      name: item.name,
      population: item.count,
      color: item.color,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Department Analytics</Text>
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

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Feather name="file-text" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.metricNumber}>{mockAnalytics.totalIssues}</Text>
            <Text style={styles.metricLabel}>Total Issues</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Feather name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.metricNumber}>{mockAnalytics.resolutionRate}%</Text>
            <Text style={styles.metricLabel}>Resolution Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Feather name="clock" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.metricNumber}>{mockAnalytics.avgResolutionTime}d</Text>
            <Text style={styles.metricLabel}>Avg Resolution</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Feather name="trending-up" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.metricNumber}>{mockAnalytics.responseTime.avg}h</Text>
            <Text style={styles.metricLabel}>Response Time</Text>
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

        {/* Charts */}
        <View style={styles.chartContainer}>
          {selectedChart === 'line' && (
            <>
              <Text style={styles.chartTitle}>Monthly Trend</Text>
              <LineChart
                data={prepareLineChartData()}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </>
          )}

          {selectedChart === 'bar' && (
            <>
              <Text style={styles.chartTitle}>Weekly Distribution</Text>
              <BarChart
                data={prepareBarChartData()}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </>
          )}

          {selectedChart === 'pie' && (
            <>
              <Text style={styles.chartTitle}>Issues by Category</Text>
              <PieChart
                data={preparePieChartData()}
                width={screenWidth - 32}
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

        {/* Status Breakdown */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Status Breakdown</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statusLabel}>Pending</Text>
              <Text style={styles.statusCount}>{mockAnalytics.pendingIssues}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statusLabel}>In Progress</Text>
              <Text style={styles.statusCount}>{mockAnalytics.inProgressIssues}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusLabel}>Resolved</Text>
              <Text style={styles.statusCount}>{mockAnalytics.resolvedIssues}</Text>
            </View>
          </View>
        </View>

        {/* Priority Breakdown */}
        <View style={styles.priorityContainer}>
          <Text style={styles.sectionTitle}>Priority Distribution</Text>
          {mockAnalytics.priorityBreakdown.map((item, index) => (
            <View key={index} style={styles.priorityItem}>
              <View style={styles.priorityLeft}>
                <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                <Text style={styles.priorityLabel}>{item.name} Priority</Text>
              </View>
              <Text style={styles.priorityCount}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Response Time Analysis */}
        <View style={styles.responseContainer}>
          <Text style={styles.sectionTitle}>Response Time Analysis</Text>
          <View style={styles.responseGrid}>
            <View style={styles.responseItem}>
              <Text style={styles.responseLabel}>Excellent (&lt; 1h)</Text>
              <View style={styles.responseBar}>
                <View style={[styles.responseFill, { width: `${mockAnalytics.responseTime.excellent}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.responsePercent}>{mockAnalytics.responseTime.excellent}%</Text>
            </View>
            <View style={styles.responseItem}>
              <Text style={styles.responseLabel}>Good (1-4h)</Text>
              <View style={styles.responseBar}>
                <View style={[styles.responseFill, { width: `${mockAnalytics.responseTime.good}%`, backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.responsePercent}>{mockAnalytics.responseTime.good}%</Text>
            </View>
            <View style={styles.responseItem}>
              <Text style={styles.responseLabel}>Poor (&gt; 4h)</Text>
              <View style={styles.responseBar}>
                <View style={[styles.responseFill, { width: `${mockAnalytics.responseTime.poor}%`, backgroundColor: '#EF4444' }]} />
              </View>
              <Text style={styles.responsePercent}>{mockAnalytics.responseTime.poor}%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
    borderRadius: 12,
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
  },
  statusContainer: {
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
});
