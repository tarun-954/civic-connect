import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, TextInput, ScrollView } from 'react-native';
// Try to import Lottie, fallback to null if not available
let LottieView: any = null;
try {
  LottieView = require('lottie-react-native').default;
} catch (error) {
  console.warn('Lottie not available, using fallback');
}
import { Feather } from '@expo/vector-icons';
// Removed unused imports - now using auth context
import { useAuth } from '../contexts/AuthContext';

function LanguageSelector() {
  return (
    <TouchableOpacity style={styles.langButton} activeOpacity={0.8}>
      <Text style={styles.langFlag}>🇺🇸</Text>
      <Text style={styles.langText}>ENG</Text>
      <Text style={styles.langChevron}>▾</Text>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');
const AUTO_SCROLL_MS = 6000;

const slides = [
  {
    key: 'civic-1',
    title: 'Report Issues',
    subtitle: 'Snap, describe, and submit problems you see around you.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/926dad55-7ea6-486d-8ce3-ff6f03130f28/c4UVNjF7kN.lottie',
    buttonText: 'Track Report'
  },
  {
    key: 'civic-2',
    title: 'Track Progress',
    subtitle: 'Stay updated as your reports move toward resolution.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/1d00ee73-1bbb-4525-a7ae-1e5c6dc425eb/gSllQGmkIO.lottie',
    buttonText: 'View Report'
  },
  {
    key: 'civic-3',
    title: 'Improve Your City',
    subtitle: 'Collaborate with your community for a cleaner, safer city.',
    image: require('../images/logoimage.png'),
    lottie: 'https://lottie.host/ca95d0c9-3c19-469e-a195-2463d402805d/vnqKEPwOPB.lottie',
    buttonText: 'View Map'
  }
];

const whyItems = [
  { icon: 'edit-3', title: 'Easy Reporting', sub: 'Report issues in seconds with photos, location, and descriptions.' },
  { icon: 'activity', title: 'Real-Time Tracking', sub: 'Stay updated on the progress of your reported issues' },
  { icon: 'users', title: 'Community Impact', sub: 'Your reports contribute to cleaner, safer, and smarter neighborhoods.' },
  { icon: 'check-circle', title: 'Transparency & Trust', sub: 'Track resolution history and build accountability with authorities.' },
  { icon: 'tool', title: 'Helpful Tools', sub: 'Guides, tips, and notifications along the way.' },
  { icon: 'clock', title: 'Timely Updates', sub: 'Receive alerts when status changes.' }
];


export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [dateText, setDateText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

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
      const next = (index + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(id);
  }, [index]);

  // Get display name from auth context
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Citizen');


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={require('../images/logoimage.png')} style={styles.avatar} />
          <View style={styles.profileTextCol}>
            <Text style={styles.headerDate}>{dateText} • {timeText}</Text>
            <Text style={styles.headerName}>{displayName || 'Citizen'}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => setIsSearching(true)}>
            <Feather name="search" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
            <Feather name="bell" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      {isSearching && (
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
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
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: width - 32 }]}>            
              <View style={styles.slideLeft}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
                <TouchableOpacity style={styles.exploreButton} activeOpacity={0.9}>
                  <Text style={styles.exploreButtonText}>{item.buttonText}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.slideRight}>
                {item.lottie && LottieView ? (
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
          <Text style={styles.whyTitle}>Why Choose Us</Text>
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
          {whyItems.map((item, i) => (
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
          <Text style={styles.servicesTitle}>Our Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('ReportIssue')} activeOpacity={0.9}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                <Image source={require('../images/icons8-document (1).gif')} style={{ width: 28, height: 28 }} />
              </View>
              <Text style={styles.serviceLabel}>Report issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('TrackReport')} activeOpacity={0.9}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                <Image source={require('../images/icons8-list.gif')} style={{ width: 28, height: 28 }} />
              </View>
              <Text style={styles.serviceLabel}>Track report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('MapView')} activeOpacity={0.9}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                <Image source={require('../images/icons8-location.gif')} style={{ width: 28, height: 28 }} />
              </View>
              <Text style={styles.serviceLabel}>View map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.serviceItem} onPress={() => navigation.navigate('Departments')} activeOpacity={0.9}>
              <View style={[styles.serviceIcon, { backgroundColor: '#FFFFFF' }]}>
                <Image source={require('../images/icons8-building.gif')} style={{ width: 28, height: 28 }} />
              </View>
              <Text style={styles.serviceLabel}>Check departments</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.impactTitle}>Community Impact</Text>
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
          <Text style={styles.detailsButtonText}>DISPLAY MORE DETAILS</Text>
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
  langButton: {
    display: 'none',
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
    width: (width - 16 * 2 - 12 * 3) / 4,
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
    fontSize: 16,
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
