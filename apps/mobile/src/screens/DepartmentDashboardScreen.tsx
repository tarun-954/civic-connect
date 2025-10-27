import React, { useEffect, useState, useRef } from 'react';
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
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Feather } from '@expo/vector-icons';
import { DepartmentService, NotificationApiService } from '../services/api';

const screenWidth = Dimensions.get('window').width;

const { width } = Dimensions.get('window');
const AUTO_SCROLL_MS = 6000;

const departmentSlides = [
  {
    key: 'dept-1',
    title: 'Manage Issues',
    subtitle: 'Review, prioritize, and resolve citizen reports efficiently.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/5a6de6b9-3526-421c-87f3-08202c8faf7e/HyEYsflBLW.lottie',
    buttonText: 'View Issues'
  },
  {
    key: 'dept-2',
    title: 'Track Progress',
    subtitle: 'Monitor resolution status and maintain accountability.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/14ad6f7a-835b-42f8-89f8-89ba082dfd4a/dfsNl2rY23.lottie',

    buttonText: 'Analytics'
  },
  {
    key: 'dept-3',
    title: 'Serve Citizens',
    subtitle: 'Build trust through transparent and timely responses.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/25082eba-2fbf-4082-9497-b25335420e7d/xFIVMPAcRH.lottie',

    buttonText: 'View Map'
  }
];

const departmentFeatures = [
  { icon: 'list', title: 'Issue Management', sub: 'Review and manage all reported issues in your department.' },
  { icon: 'bar-chart-2', title: 'Analytics & Reports', sub: 'Track performance metrics and generate detailed reports.' },
  { icon: 'map', title: 'Geographic View', sub: 'Visualize issues on map for better resource allocation.' },
  { icon: 'search', title: 'Track Reports', sub: 'Search and track specific reports by tracking code or ID.' },
  { icon: 'cpu', title: 'AI Analysis', sub: 'Leverage machine learning for issue prioritization.' },
  { icon: 'users', title: 'Team Coordination', sub: 'Coordinate with team members for efficient resolution.' }
];

export default function DepartmentDashboardScreen({ navigation }: any) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateText, setDateText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<FlatList>(null);

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

  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      const day = now.toLocaleDateString(undefined, { weekday: 'short' });
      const month = now.toLocaleDateString(undefined, { month: 'short' });
      const dayNum = now.getDate();
      const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setDateText(`${day}, ${month} ${dayNum}`);
      setTimeText(time);
    };
    updateNow();
    const timer = setInterval(updateNow, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % departmentSlides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(id);
  }, [index]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await DepartmentService.getUnreadNotificationCount();
        if (response.status === 'success') {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Fetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
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
      labels: labels.slice(-7), // Last 7 days
      datasets: [
        {
          data: submitted.slice(-7),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Blue
          strokeWidth: 2,
        },
        {
          data: inProgress.slice(-7),
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Orange
          strokeWidth: 2,
        },
        {
          data: resolved.slice(-7),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green
          strokeWidth: 2,
        },
        {
          data: closed.slice(-7),
          color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={require('../images/logoimage.png')} style={styles.avatar} />
          <View style={styles.profileTextCol}>
            <Text style={styles.headerDate}>{dateText} • {timeText}</Text>
            <Text style={styles.headerName}>Department Portal</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => setIsSearching(true)}>
            <Feather name="search" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.bellContainer}>
              <Feather name="bell" size={22} color="#111827" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isSearching && (
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search issues, reports..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => setIsSearching(false)}
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setQuery(''); }}>
              <Text style={styles.searchCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.carouselContainer}>
          <FlatList
            ref={listRef}
            data={departmentSlides}
            keyExtractor={(item) => item.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width: width - 32 }]}>            
                <View style={styles.slideLeft}>
                  <Text style={styles.slideTitle}>{item.title}</Text>
                  <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
                  <TouchableOpacity 
                    style={styles.exploreButton} 
                    activeOpacity={0.9}
                    onPress={() => {
                      if (item.buttonText === 'View Issues') navigation.navigate('Issues');
                      else if (item.buttonText === 'Analytics') navigation.navigate('Analytics');
                      else if (item.buttonText === 'View Map') navigation.navigate('Map');
                    }}
                  >
                    <Text style={styles.exploreButtonText}>{item.buttonText}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.slideRight}>
                  {item.lottie ? (
                    <LottieView
                      source={{ uri: item.lottie }}
                      autoPlay
                      loop
                      style={styles.lottie}
                    />
                  ) : (
                    <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
                  )}
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.whyContainer}>
          <View style={styles.whyHeaderRow}>
            <Text style={styles.whyTitle}>Department Features</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See All</Text>
                <Feather name="chevron-right" size={18} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.whyScroll}
          >
            {departmentFeatures.map((item, i) => (
              <View key={i} style={styles.whyCard}>
                <Feather name={item.icon as any} size={24} color="#92400E" />
                <Text style={styles.whyHeading}>{item.title}</Text>
                <Text style={styles.whySub}>{item.sub}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.servicesContainer}>
          <View style={styles.servicesCard}>
            <Text style={styles.servicesTitle}>Department Services</Text>
            
            {/* First Row */}
            <View style={styles.servicesGrid}>
              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('Issues')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Image source={require('../images/icons8-list.gif')} style={{ width: 28, height: 28 }} />
                </View>
                <Text style={styles.serviceLabel}>Manage Issues</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('Analytics')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Image source={require('../images/icons8-rhombus-loader.gif')} style={{ width: 28, height: 28 }} />
                </View>
                <Text style={styles.serviceLabel}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('Map')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Image source={require('../images/icons8-location.gif')} style={{ width: 28, height: 28 }} />
                </View>
                <Text style={styles.serviceLabel}>Map View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('DepartmentTrackReport')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Image source={require('../images/icons8-document.gif')} style={{ width: 28, height: 28 }} />
                </View>
                <Text style={styles.serviceLabel}>Track Report</Text>
              </TouchableOpacity>
            </View>

            {/* Second Row */}
            <View style={styles.servicesGrid}>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('ML Analysis', 'AI-powered pothole analysis and OCR priority detection coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Image source={require('../images/robotic-arm.gif')} style={{ width: 28, height: 28 }} />
                </View>
                <Text style={styles.serviceLabel}>ML Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Reports', 'Generate and export detailed reports coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="file-text" size={28} color="#06B6D4" />
                </View>
                <Text style={styles.serviceLabel}>Generate Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Team Management', 'Team coordination and assignment features coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="users" size={28} color="#EC4899" />
                </View>
                <Text style={styles.serviceLabel}>Team Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Priority Queue', 'Smart priority-based issue queuing coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="zap" size={28} color="#F59E0B" />
                </View>
                <Text style={styles.serviceLabel}>Priority Queue</Text>
              </TouchableOpacity>
            </View>

            {/* Third Row */}
            <View style={styles.servicesGrid}>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Resource Allocation', 'Smart resource allocation and planning coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="target" size={28} color="#10B981" />
                </View>
                <Text style={styles.serviceLabel}>Resource Planning</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Citizen Feedback', 'View and respond to citizen feedback coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="message-circle" size={28} color="#3B82F6" />
                </View>
                <Text style={styles.serviceLabel}>Citizen Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Performance Metrics', 'Detailed performance tracking and KPIs coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="trending-up" size={28} color="#EF4444" />
                </View>
                <Text style={styles.serviceLabel}>Performance KPIs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem} onPress={() => Alert.alert('Emergency Response', 'Emergency issue detection and rapid response coming soon!')} activeOpacity={0.9}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                  <Feather name="alert-triangle" size={28} color="#DC2626" />
                </View>
                <Text style={styles.serviceLabel}>Emergency Response</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.impactTitle}>Department Performance</Text>
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
          <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.detailsButtonText}>VIEW DETAILED ANALYTICS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  scrollContainer: {
    flex: 1
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  profileTextCol: {
    justifyContent: 'center'
  },
  headerDate: {
    fontSize: 12,
    color: '#6B7280'
  },
  headerName: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: '#111827'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    marginLeft: 14
  },
  bellContainer: {
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600'
  },
  searchBar: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827'
  },
  searchCancel: {
    marginLeft: 8,
    color: '#2563EB',
    fontWeight: '600'
  },
  carouselContainer: {
    height: 210,
    marginTop: 16,
    paddingHorizontal: 16
  },
  slide: {
    flexDirection: 'row',
    backgroundColor: '#212121',
    borderRadius: 16,
    height: '100%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'flex-start',
    overflow: 'hidden'
  },
  slideLeft: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  slideRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },
  slideSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff'
  },
  slideImage: {
    width: '90%',
    height: 160
  },
  lottie: {
    width: '100%',
    height: 160
  },
  exploreButton: {
    marginTop: 16,
    backgroundColor: '#159D7E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'flex-start'
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  whyContainer: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  whyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  whyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827'
  },
  seeAllRow: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { color: '#6B7280', fontWeight: '600' },
  whyScroll: {
    paddingTop: 5,
    paddingBottom: 4
  },
  whyCard: {
    width: width * 0.7,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    padding: 14
  },
  whyHeading: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  whySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280'
  },
  servicesContainer: {
    marginTop: 20,
    paddingHorizontal: 16
  },
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  serviceItem: {
    width: (width - 16* 4 - 12 * 1) / 4,
    alignItems: 'center'
  },
  serviceIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    marginTop:8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  serviceLabel: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center'
  },
  statsContainer: {
    marginTop: 20,
    paddingHorizontal: 50,
    paddingBottom: 20,
    alignItems: 'center'
  },
  impactTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center'
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
    marginTop: 20
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
});
