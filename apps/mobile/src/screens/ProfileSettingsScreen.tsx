import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyProfile, updateProfile } from '../services/api';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchMyProfile();
        setName(profile?.name || user?.name || '');
        setPhone(profile?.phone || user?.phone || '');
      } catch (error) {
        console.error('Error loading profile settings:', error);
        setName(user?.name || '');
        setPhone(user?.phone || '');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.name, user?.phone]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert('Invalid name', 'Please enter at least 2 characters for your name.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: trimmedName,
        phone: trimmedPhone || undefined
      });

      if (updated) {
        login({
          name: updated.name,
          email: updated.email || user?.email,
          phone: updated.phone,
          avatar: updated.avatar,
          userId: updated.userId
        });
      }

      Alert.alert('Saved', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Could not update profile.');
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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#159D7E" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter your name"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveDisabled]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save changes</Text>}
          </TouchableOpacity>
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
  content: { padding: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, color: '#4B5563', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827'
  },
  saveButton: {
    marginTop: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#159D7E',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveDisabled: { opacity: 0.7 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});
