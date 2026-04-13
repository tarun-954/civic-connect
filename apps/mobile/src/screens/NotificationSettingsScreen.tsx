import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  fetchNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences
} from '../services/api';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    pushEnabled: true,
    reportUpdates: true,
    announcements: true
  });

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const response = await fetchNotificationPreferences();
        if (response) setPrefs(response);
      } catch (error: any) {
        if (error?.message?.includes('Route not found')) {
          Alert.alert(
            'Backend update needed',
            'Notification preference routes are not available yet on backend.'
          );
        } else {
          console.error('Error loading notification settings:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, []);

  const onToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences({ [key]: value });
      if (updated) setPrefs(updated);
    } catch (error: any) {
      setPrefs(previous);
      Alert.alert('Update failed', error?.message || 'Could not save notification preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification settings</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#159D7E" />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.item}>
            <View>
              <Text style={styles.title}>Push notifications</Text>
              <Text style={styles.subtitle}>Receive push alerts on your device</Text>
            </View>
            <Switch
              value={prefs.pushEnabled}
              onValueChange={(value) => onToggle('pushEnabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={prefs.pushEnabled ? '#159D7E' : '#F3F4F6'}
            />
          </View>

          <View style={styles.item}>
            <View>
              <Text style={styles.title}>Report updates</Text>
              <Text style={styles.subtitle}>Get status changes on your reports</Text>
            </View>
            <Switch
              value={prefs.reportUpdates}
              onValueChange={(value) => onToggle('reportUpdates', value)}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={prefs.reportUpdates ? '#159D7E' : '#F3F4F6'}
            />
          </View>

          <View style={[styles.item, styles.lastItem]}>
            <View>
              <Text style={styles.title}>Announcements</Text>
              <Text style={styles.subtitle}>Important platform updates</Text>
            </View>
            <Switch
              value={prefs.announcements}
              onValueChange={(value) => onToggle('announcements', value)}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={prefs.announcements ? '#159D7E' : '#F3F4F6'}
            />
          </View>

          {saving ? <Text style={styles.savingText}>Saving...</Text> : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  content: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden'
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  lastItem: { borderBottomWidth: 0 },
  title: { fontSize: 16, color: '#111827', fontWeight: '600' },
  subtitle: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  savingText: { padding: 12, fontSize: 12, color: '#6B7280' }
});
