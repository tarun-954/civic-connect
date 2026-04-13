import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyProfile, NotificationApiService } from '../services/api';

function LanguageSelector() {
  return (
    <TouchableOpacity style={styles.langButton} activeOpacity={0.85}>
      <Text style={styles.langFlag}>US</Text>
      <Text style={styles.langText}>ENG</Text>
      <Text style={styles.langChevron}>v</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, login, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const [profile, unreadRes] = await Promise.all([
          fetchMyProfile(),
          NotificationApiService.getUnreadNotificationCount().catch(() => null)
        ]);

        if (profile) {
          login({
            name: profile.name,
            email: profile.email || user?.email,
            phone: profile.phone,
            avatar: profile.avatar,
            userId: profile.userId
          });
        }

        if (unreadRes?.status === 'success') {
          setUnreadCount(unreadRes?.data?.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error loading settings overview:', error);
      }
    };
    loadHeaderData();
  }, [login, user?.email]);

  const displayName = user?.name || 'Citizen';
  const displayEmail = user?.email || 'No email found';
  const initial = useMemo(() => {
    if (displayName.trim()) return displayName.trim().charAt(0).toUpperCase();
    return 'U';
  }, [displayName]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
        }
      }
    ]);
  };

  const rows = [
    {
      key: 'profile',
      icon: 'user',
      label: 'Profile',
      value: 'Edit your name and phone',
      onPress: () => navigation.navigate('ProfileSettings')
    },
    {
      key: 'notificationSettings',
      icon: 'sliders',
      label: 'Notification settings',
      value: 'Control push and update alerts',
      onPress: () => navigation.navigate('NotificationSettings')
    },
    {
      key: 'notifications',
      icon: 'bell',
      label: 'Notifications',
      value: unreadCount > 0 ? `${unreadCount} unread` : 'No unread',
      onPress: () => navigation.navigate('Notifications')
    },
    {
      key: 'about',
      icon: 'info',
      label: 'About',
      value: 'Civic Connect Mobile',
      onPress: () => Alert.alert('About', 'Civic Connect helps citizens report and track civic issues.')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/logoimage.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>Settings</Text>
        </View>
        <LanguageSelector />
      </View>

      <View style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{initial}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map((row, index) => (
            <TouchableOpacity
              key={row.key}
              style={[styles.settingItem, index === rows.length - 1 && styles.lastItem]}
              onPress={row.onPress}
              activeOpacity={0.8}
            >
              <Feather name={row.icon as any} size={20} color="#6B7280" />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingText}>{row.label}</Text>
                <Text style={styles.settingSubText}>{row.value}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 28, height: 28, borderRadius: 6, marginRight: 8 },
  appName: { fontSize: 16, fontWeight: '700', color: '#111827' },
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
  langFlag: { fontSize: 16, marginRight: 6 },
  langText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  langChevron: { marginLeft: 6, color: '#6B7280', fontSize: 12 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#159D7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  userDetails: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  lastItem: { borderBottomWidth: 0 },
  settingTextWrap: { flex: 1, marginLeft: 12 },
  settingText: { fontSize: 16, color: '#111827' },
  settingSubText: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  logoutButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2'
  },
  logoutText: { marginLeft: 8, fontSize: 15, color: '#DC2626', fontWeight: '600' }
});
