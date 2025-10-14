import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { DepartmentService } from '../services/api';
// import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function DepartmentAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const prepareChartData = () => {
    if (!analytics?.byDay) return null;
    
    const entries = Object.entries(analytics.byDay);
    if (entries.length === 0) return null;
    
    const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b));
    const labels = sortedEntries.map(([day]) => {
      const date = new Date(day);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const submitted = sortedEntries.map(([, data]: any) => data.submitted || 0);
    const inProgress = sortedEntries.map(([, data]: any) => data.in_progress || 0);
    const resolved = sortedEntries.map(([, data]: any) => data.resolved || 0);
    const closed = sortedEntries.map(([, data]: any) => data.closed || 0);
    
    return {
      labels: labels.slice(-14), // Last 14 days
      datasets: [
        {
          data: submitted.slice(-14),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Blue
          strokeWidth: 2,
        },
        {
          data: inProgress.slice(-14),
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Orange
          strokeWidth: 2,
        },
        {
          data: resolved.slice(-14),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green
          strokeWidth: 2,
        },
        {
          data: closed.slice(-14),
          color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const calculateStats = () => {
    if (!analytics?.byDay) return null;
    
    const entries = Object.values(analytics.byDay) as any[];
    const totalSubmitted = entries.reduce((sum, day) => sum + (day.submitted || 0), 0);
    const totalInProgress = entries.reduce((sum, day) => sum + (day.in_progress || 0), 0);
    const totalResolved = entries.reduce((sum, day) => sum + (day.resolved || 0), 0);
    const totalClosed = entries.reduce((sum, day) => sum + (day.closed || 0), 0);
    
    const totalIssues = totalSubmitted + totalInProgress + totalResolved + totalClosed;
    const resolutionRate = totalIssues > 0 ? ((totalResolved + totalClosed) / totalIssues * 100).toFixed(1) : 0;
    
    return {
      totalSubmitted,
      totalInProgress,
      totalResolved,
      totalClosed,
      totalIssues,
      resolutionRate,
    };
  };

  const stats = calculateStats();

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
        <Text style={styles.title}>Analytics</Text>
        
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalIssues}</Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.resolutionRate}%</Text>
              <Text style={styles.statLabel}>Resolution Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalInProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalResolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        )}
        
        {chartData ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Issues Over Time (Last 14 Days)</Text>
            <View style={styles.simpleChart}>
              <Text style={styles.chartPlaceholder}>📊 Chart visualization would appear here</Text>
              <Text style={styles.chartSubtext}>
                {chartData.labels.length} data points available
              </Text>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2563eb' }]} />
                <Text style={styles.legendText}>Submitted</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>In Progress</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Resolved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#6b7280' }]} />
                <Text style={styles.legendText}>Closed</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>No analytics data available</Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
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
  simpleChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginVertical: 8,
  },
  chartPlaceholder: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  noData: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
