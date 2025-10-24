import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LanguageSelector() {
  return (
    <TouchableOpacity style={styles.langButton} activeOpacity={0.8}>
      <Text style={styles.langFlag}>🇺🇸</Text>
      <Text style={styles.langText}>ENG</Text>
      <Text style={styles.langChevron}>▾</Text>
    </TouchableOpacity>
  );
}

export default function DepartmentSettingsScreen() {
  const navigation = useNavigation<any>();
  const [departmentInfo, setDepartmentInfo] = useState({
    name: 'Sanitation Department',
    code: 'SAN-DEPT-001',
    email: 'admin@sanitation.gov',
    phone: '+1 (555) 123-4567',
    address: '123 Municipal Building, City Center'
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access the department portal.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear department token
            await AsyncStorage.removeItem('deptToken');
            await AsyncStorage.removeItem('deptInfo');
            
            // Navigate back to department login
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'AuthStack',
                  params: { screen: 'DepartmentLogin' }
                }
              ]
            });
          },
        },
      ]
    );
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Department profile management coming soon!');
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Notification settings coming soon!');
  };

  const handleTeamPress = () => {
    Alert.alert('Team Management', 'Team management features coming soon!');
  };

  const handleWorkflowPress = () => {
    Alert.alert('Workflow Settings', 'Workflow configuration coming soon!');
  };

  const handleReportsPress = () => {
    Alert.alert('Report Settings', 'Report management settings coming soon!');
  };

  const handleHelpPress = () => {
    Alert.alert('Help & Support', 'Department support features coming soon!');
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About Department Portal',
      'Civic Connect Department Portal v1.0\n\nManage citizen reports and track resolution progress efficiently.\n\n© 2024 Civic Connect'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/Government_of_India_logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>Department Settings</Text>
        </View>
        <LanguageSelector />
      </View>

      <View style={styles.content}>
        {/* Department Info Section */}
        <View style={styles.deptSection}>
          <View style={styles.deptInfo}>
            <View style={styles.deptAvatar}>
              <Feather name="building" size={24} color="#fff" />
            </View>
            <View style={styles.deptDetails}>
              <Text style={styles.deptName}>{departmentInfo.name}</Text>
              <Text style={styles.deptCode}>Code: {departmentInfo.code}</Text>
              <Text style={styles.deptEmail}>{departmentInfo.email}</Text>
            </View>
          </View>
        </View>

        {/* Settings Items */}
        <TouchableOpacity style={styles.settingItem} onPress={handleProfilePress}>
          <Feather name="building" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Department Profile</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleNotificationsPress}>
          <Feather name="bell" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Notifications</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleTeamPress}>
          <Feather name="users" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Team Management</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleWorkflowPress}>
          <Feather name="settings" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Workflow Settings</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleReportsPress}>
          <Feather name="file-text" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Report Settings</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleHelpPress}>
          <Feather name="help-circle" size={20} color="#6B7280" />
          <Text style={styles.settingText}>Help & Support</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleAboutPress}>
          <Feather name="info" size={20} color="#6B7280" />
          <Text style={styles.settingText}>About</Text>
          <Feather name="chevron-right" size={20} color="#6B7280" />
        </TouchableOpacity>

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
  deptSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  deptInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deptAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#159D7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  deptDetails: {
    flex: 1
  },
  deptName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  deptCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2
  },
  deptEmail: {
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
