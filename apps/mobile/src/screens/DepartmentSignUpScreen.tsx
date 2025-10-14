import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { DepartmentService } from '../services/api';

export default function DepartmentSignUpScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !code.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await DepartmentService.signup({ name: name.trim(), code: code.trim(), email: email.trim(), password });
      Alert.alert('Created', 'Department created successfully', [
        { text: 'OK', onPress: () => navigation.navigate('DepartmentLogin') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Department</Text>
        <Text style={styles.subtitle}>Admin-only. Use unique code per department.</Text>

        <Text style={styles.label}>Department Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Public Works" />

        <Text style={styles.label}>Department Code</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="PUBLIC_WORKS" autoCapitalize="characters" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="dept@example.com" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Department'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('DepartmentLogin')}>
          <Text style={styles.linkText}>Back to Department Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, backgroundColor: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#111827', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#2563eb', fontSize: 16, fontWeight: '500' }
});


