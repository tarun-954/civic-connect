import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/logoimage.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>Analytics</Text>
        </View>
        <LanguageSelector />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Issues Overview</Text>
            <View style={styles.pieChartContainer}>
              <View style={styles.pieChart}>
                <View style={[styles.pieSlice, styles.slice1]} />
                <View style={[styles.pieSlice, styles.slice2]} />
                <View style={[styles.pieSlice, styles.slice3]} />
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Resolved Issues</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
                  <Text style={styles.legendText}>Active Issues</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
                  <Text style={styles.legendText}>Pending Review</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>DISPLAY MORE DETAILS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="trending-up" size={24} color="#10B981" />
              <Text style={styles.statNumber}>1,370</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
              <Text style={styles.statChange}>+15.2% this month</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="clock" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>2.4 days</Text>
              <Text style={styles.statLabel}>Avg Response Time</Text>
              <Text style={styles.statChange}>-0.8 days improved</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Feather name="users" size={24} color="#6366F1" />
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Satisfaction Rate</Text>
              <Text style={styles.statChange}>+3.2% this month</Text>
            </View>
            <View style={styles.statCard}>
              <Feather name="map-pin" size={24} color="#EC4899" />
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Active Areas</Text>
              <Text style={styles.statChange}>+5 new areas</Text>
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
    backgroundColor: '#F9FAFB'
  },
  scrollContainer: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingBottom: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  langFlag: {
    fontSize: 16,
    marginRight: 6
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  langChevron: {
    marginLeft: 6,
    color: '#6B7280',
    fontSize: 12
  },
  content: {
    padding: 16
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 20,
    position: 'relative',
    overflow: 'hidden'
  },
  pieSlice: {
    position: 'absolute',
    width: 120,
    height: 120
  },
  slice1: {
    backgroundColor: '#EF4444',
    borderRadius: 60,
    transform: [{ rotate: '0deg' }]
  },
  slice2: {
    backgroundColor: '#374151',
    width: 60,
    height: 120,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    left: 0,
    top: 0
  },
  slice3: {
    backgroundColor: '#9CA3AF',
    width: 60,
    height: 60,
    borderRadius: 0,
    borderBottomLeftRadius: 60,
    top: 60,
    left: 0
  },
  legend: {
    flex: 1
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    fontSize: 14,
    color: '#374151'
  },
  detailsButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    width: '100%'
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4
  },
  statChange: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500'
  }
});
