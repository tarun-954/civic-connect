import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
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

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setShowLogoutModal(false);
            // Ensure we return to the auth flow
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'AuthStack',
                  params: { screen: 'Splash' }
                }
              ]
            });
          },
        },
      ]
    );
  };

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
        {/* User Info Section */}
        {user && (
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.settingItem}>
          <Feather name="user" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Profile</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </View>
        
        <View style={styles.settingItem}>
          <Feather name="bell" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Notifications</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </View>
        
        <View style={styles.settingItem}>
          <Feather name="shield" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Privacy</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </View>
        
        <View style={styles.settingItem}>
          <Feather name="help-circle" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Help & Support</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </View>
        
        <View style={styles.settingItem}>
          <Feather name="info" size={20} color="#6B7280" />
          <Text style={styles.settingText}>About</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
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
    flex: 1,
    paddingTop: 5,
    paddingHorizontal: 16
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827'
  },
  userSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
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
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280'
  },
  logoutSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500'
  }
});
