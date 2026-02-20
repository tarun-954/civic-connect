import React, { useCallback, useEffect, useState, useMemo, memo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, CommonActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { NotificationApiService, DepartmentService } from '../services/api';
import { navigationRef } from '../navigation/navigationRef';

type NotificationType =
  | 'new_report'
  | 'report_update'
  | 'report_resolved'
  | 'general'
  | 'issue_assigned'
  | 'issue_updated'
  | 'urgent_issue'
  | 'system'
  | 'resolution_pending'
  | 'resolution_approved'
  | 'resolution_rejected';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  reportId?: string;
  trackingId?: string;
  department?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  photos?: Array<{ uri: string; filename?: string; uploadedAt?: string }>;
  qualityCheck?: {
    status?: 'pass' | 'fail' | 'unknown';
    confidence?: number;
    summary?: string;
  };
  metadata?: Record<string, any>;
  read: boolean; // Department notifications use 'read' instead of 'isRead'
  isRead?: boolean; // Citizen notifications use 'isRead'
  createdAt: string;
}

const NotificationsScreen = ({ navigation: navProp }: any) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDepartmentUser, setIsDepartmentUser] = useState<boolean | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (isDepartmentUser) {
        response = await DepartmentService.getNotifications();
      } else {
        response = await NotificationApiService.getUserNotifications();
      }

      if (response.status === 'success') {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isDepartmentUser]);

  useEffect(() => {
    checkUserType();
  }, []);

  useEffect(() => {
    if (isDepartmentUser !== null) {
      loadNotifications();
    }
  }, [isDepartmentUser, loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      if (isDepartmentUser !== null) {
        loadNotifications();
      }
      return () => {};
    }, [isDepartmentUser, loadNotifications])
  );

  const checkUserType = async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      setIsDepartmentUser(userRole === 'department');
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      if (isDepartmentUser) {
        await DepartmentService.markNotificationAsRead(notificationId);
      } else {
        await NotificationApiService.markNotificationAsRead(notificationId);
      }
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { 
            ...notif, 
            isRead: true, 
            read: true 
          } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    const isRead = notification.isRead || notification.read;
    if (!isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type and user type
    // Get root navigator - go up multiple levels if needed to reach root Stack
    let rootNavigation = navigation;
    try {
      // Try to get parent navigator (might be Tab Navigator)
      const parent = navigation.getParent?.();
      if (parent) {
        // Try to get parent's parent (should be root Stack)
        const grandParent = parent.getParent?.();
        rootNavigation = grandParent || parent || navigation;
      }
    } catch (e) {
      rootNavigation = navigation;
    }
    
    // Also get the root navigator using a different method
    const getRootNavigator = () => {
      let nav = navigation;
      // Go up to 3 levels to find root stack
      for (let i = 0; i < 3; i++) {
        const parent = nav.getParent?.();
        if (parent) {
          nav = parent;
        } else {
          break;
        }
      }
      return nav;
    };
    const rootNav = getRootNavigator();

    if (isDepartmentUser) {
      // For department users, navigate to department issues screen
      if (notification.type === 'new_report' && notification.reportId) {
        (rootNavigation as any).navigate('DepartmentTabs', { 
          screen: 'Issues',
          params: { highlightReportId: notification.reportId }
        });
      }
    } else {
      // For citizen users, navigate to track report
      if (notification.type === 'new_report' && notification.reportId) {
        (rootNavigation as any).navigate('TrackReport', { 
          prefilledTrackingId: notification.trackingId 
        });
      } else if (notification.type === 'report_update' && notification.trackingId) {
        (rootNavigation as any).navigate('TrackReport', { 
          prefilledTrackingId: notification.trackingId 
        });
      } else if (notification.type === 'report_resolved' && notification.trackingId) {
        (rootNavigation as any).navigate('TrackReport', { 
          prefilledTrackingId: notification.trackingId 
        });
      } else if (
        (notification.type === 'resolution_pending' || notification.type === 'resolution_approved') &&
        notification.reportId
      ) {
        const params = {
          reportId: notification.reportId,
          trackingId: notification.trackingId,
          photos: notification.photos || [],
          qualityCheck: notification.qualityCheck ?? undefined,
          canRespond: notification.type === 'resolution_pending'
        };

        // Navigate to ResolutionReview screen
        // SOLUTION: Since NotificationsScreen is in root Stack Navigator (same as ResolutionReview),
        // we can navigate directly. However, if accessed from tabs, we need to ensure we're using
        // the root navigator. Use navigationRef which is always the root NavigationContainer.
        
        // Wait for navigationRef to be ready, then navigate
        const attemptNavigation = () => {
          if (!navigationRef.isReady()) {
            return false;
          }
          
          try {
            // Method 1: Use navigationRef.navigate() - direct root navigator access
            (navigationRef as any).navigate('ResolutionReview', params);
            return true;
          } catch (error1) {
            console.error('Method 1 (navigationRef.navigate) failed:', error1);
            
            try {
              // Method 2: Use CommonActions with navigationRef
              navigationRef.dispatch(
                CommonActions.navigate({
                  name: 'ResolutionReview',
                  params: params
                })
              );
              return true;
            } catch (error2) {
              console.error('Method 2 (CommonActions) failed:', error2);
              return false;
            }
          }
        };

        // Try navigation immediately
        if (attemptNavigation()) {
          return; // Success!
        }

        // If not ready, wait and retry
        const maxWait = 2000;
        const startTime = Date.now();
        const retryInterval = setInterval(() => {
          if (attemptNavigation()) {
            clearInterval(retryInterval);
            return;
          }
          
          if (Date.now() - startTime > maxWait) {
            clearInterval(retryInterval);
            // Final fallback: navigate to TrackReport instead
            Alert.alert(
              'Navigation Issue',
              'Opening Track Report screen instead. You can access the resolution review from there.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    try {
                      (rootNavigation as any).navigate('TrackReport', {
                        prefilledTrackingId: notification.trackingId || undefined
                      });
                    } catch (e) {
                      console.error('Fallback navigation failed:', e);
                    }
                  }
                }
              ]
            );
          }
        }, 100);
      }
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'new_report':
        return { name: 'plus-circle', color: '#10B981' };
      case 'report_update':
        return { name: 'edit', color: '#F59E0B' };
      case 'report_resolved':
        return { name: 'check-circle', color: '#059669' };
      case 'resolution_pending':
        return { name: 'upload-cloud', color: '#3B82F6' };
      case 'resolution_approved':
        return { name: 'thumbs-up', color: '#10B981' };
      case 'resolution_rejected':
        return { name: 'x-circle', color: '#EF4444' };
      default:
        return { name: 'bell', color: priority === 'high' || priority === 'urgent' ? '#EF4444' : '#6B7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Memoized notification item component for better performance
  const NotificationItem = memo(({ item, onPress }: { item: Notification; onPress: (item: Notification) => void }) => {
    const priorityValue = item.priority || 'medium';
    const icon = useMemo(() => getNotificationIcon(item.type, priorityValue), [item.type, priorityValue]);
    const priorityColor = useMemo(() => getPriorityColor(priorityValue), [priorityValue]);
    const formattedDate = useMemo(() => formatDate(item.createdAt), [item.createdAt]);
    const isUnread = useMemo(() => !(item.isRead || item.read), [item.isRead, item.read]);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.unreadNotification
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <Feather name={icon.name as any} size={20} color={icon.color} />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={[
                styles.notificationTitle,
                isUnread && styles.unreadText
              ]}>
                {item.title}
              </Text>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            {item.qualityCheck?.summary && (
              <Text style={styles.notificationMetaText} numberOfLines={1}>
                AI review: {item.qualityCheck.summary}
              </Text>
            )}
            {item.photos && item.photos.length > 0 && (
              <Text style={styles.notificationMetaText}>
                {item.photos.length} proof image{item.photos.length > 1 ? 's' : ''}
              </Text>
            )}
            
            <View style={styles.footerRow}>
              <Text style={styles.timestamp}>
                {formattedDate}
              </Text>
              {item.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {isUnread && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  });

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    return <NotificationItem item={item} onPress={handleNotificationPress} />;
  }, [handleNotificationPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="bell-off" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        You'll see updates about your reports here
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !(n.isRead || n.read)).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              navigation.goBack();
            } catch (e) {
              // Fallback if goBack fails
              if (navigationRef.isReady() && navigationRef.current) {
                navigationRef.goBack();
              }
            }
          }}
        >
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        contentContainerStyle={[
          styles.listContainer,
          notifications.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#159D7E']}
            tintColor="#159D7E"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 100, // Approximate item height
          offset: 100 * index,
          index,
        })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#159D7E',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMetaText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#159D7E',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;