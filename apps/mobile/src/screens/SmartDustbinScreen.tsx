import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

type DustbinApi = typeof ApiService & {
  getDustbinStatus: (deviceId?: string) => Promise<any>;
  getAllDustbins: (deviceIds?: string[]) => Promise<any>;
  getDustbinPin: (pin: string, deviceId?: string) => Promise<any>;
};

const DustbinApiService = ApiService as DustbinApi;

interface DustbinData {
  fillPercentage: number;
  distance: number;
  status: number;
  lastUpdate: number;
  location: string;
  statusLevel: 'empty' | 'medium' | 'warning' | 'full' | 'error';
  statusMessage: string;
  needsAttention: boolean;
  isFull: boolean;
  isWarning: boolean;
  timestamp: string;
}

export default function SmartDustbinScreen({ navigation }: any) {
  const [dustbinData, setDustbinData] = useState<DustbinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const pulseAnim = new Animated.Value(1);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDustbinStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for full/warning status
  useEffect(() => {
    if (dustbinData?.needsAttention) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [dustbinData?.needsAttention]);

  const fetchDustbinStatus = async () => {
    try {
      setError(null);
      const data = await DustbinApiService.getDustbinStatus();
      setDustbinData(data);
      
      // Update last update time
      const updateTime = new Date(data.lastUpdate || Date.now());
      setLastUpdateTime(updateTime.toLocaleTimeString());
      
      setLoading(false);
      setRefreshing(false);
    } catch (err: any) {
      console.error('Error fetching dustbin status:', err);
      setError(err.message || 'Failed to fetch dustbin status');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDustbinStatus();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDustbinStatus();
  };

  const getStatusColor = () => {
    if (!dustbinData) return '#666';
    switch (dustbinData.statusLevel) {
      case 'full':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      case 'medium':
        return '#3498db';
      case 'empty':
        return '#2ecc71';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = () => {
    if (!dustbinData) return 'trash-2';
    switch (dustbinData.statusLevel) {
      case 'full':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'medium':
        return 'info';
      case 'empty':
        return 'check-circle';
      default:
        return 'trash-2';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance >= 100) return `${(distance / 100).toFixed(1)}m`;
    return `${distance.toFixed(1)}cm`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Dustbin</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading dustbin status...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Dustbin</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDustbinStatus}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Dustbin</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <Animated.View
          style={[
            styles.statusCard,
            { borderColor: getStatusColor() },
            dustbinData?.needsAttention && { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.statusHeader}>
            <Feather name={getStatusIcon()} size={32} color={getStatusColor()} />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLevel, { color: getStatusColor() }]}>
                {dustbinData?.statusLevel.toUpperCase() || 'UNKNOWN'}
              </Text>
              <Text style={styles.statusMessage}>
                {dustbinData?.statusMessage || 'No data available'}
              </Text>
            </View>
          </View>

          {dustbinData?.needsAttention && (
            <View style={[styles.alertBanner, { backgroundColor: getStatusColor() }]}>
              <Feather name="bell" size={16} color="#fff" />
              <Text style={styles.alertText}>Action Required</Text>
            </View>
          )}
        </Animated.View>

        {/* Fill Percentage Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fill Level</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${dustbinData?.fillPercentage || 0}%`,
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>
              {dustbinData?.fillPercentage.toFixed(1) || 0}%
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {dustbinData?.location || 'Unknown Location'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Feather name="maximize-2" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Distance to Top</Text>
                <Text style={styles.detailValue}>
                  {dustbinData ? formatDistance(dustbinData.distance) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Feather name="clock" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Last Update</Text>
                <Text style={styles.detailValue}>{lastUpdateTime || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Indicators</Text>
          
          <View style={styles.indicatorRow}>
            <View style={[styles.indicator, dustbinData?.isFull && styles.indicatorActive]}>
              <Feather
                name="x-circle"
                size={24}
                color={dustbinData?.isFull ? '#e74c3c' : '#ccc'}
              />
              <Text style={[styles.indicatorText, dustbinData?.isFull && styles.indicatorTextActive]}>
                Full
              </Text>
            </View>

            <View style={[styles.indicator, dustbinData?.isWarning && styles.indicatorActive]}>
              <Feather
                name="alert-triangle"
                size={24}
                color={dustbinData?.isWarning ? '#f39c12' : '#ccc'}
              />
              <Text style={[styles.indicatorText, dustbinData?.isWarning && styles.indicatorTextActive]}>
                Warning
              </Text>
            </View>

            <View
              style={[
                styles.indicator,
                !dustbinData?.needsAttention && styles.indicatorActive,
              ]}
            >
              <Feather
                name="check-circle"
                size={24}
                color={!dustbinData?.needsAttention ? '#2ecc71' : '#ccc'}
              />
              <Text
                style={[
                  styles.indicatorText,
                  !dustbinData?.needsAttention && styles.indicatorTextActive,
                ]}
              >
                Normal
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusLevel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  detailRow: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  indicator: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  indicatorActive: {
    backgroundColor: '#f0f0f0',
  },
  indicatorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  indicatorTextActive: {
    color: '#333',
    fontWeight: '600',
  },
});

