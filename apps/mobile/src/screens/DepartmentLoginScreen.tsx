import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DepartmentService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DepartmentLoginScreen({ navigation }: any) {
  const [code, setCode] = useState('PUBLIC_WORKS');
  const [password, setPassword] = useState('pw_demo_123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!code.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both department code and password');
      return;
    }

    setLoading(true);
    try {
      const result = await DepartmentService.login(code.trim(), password);
      
      // Store department token
      await AsyncStorage.setItem('deptToken', result.data.token);
      await AsyncStorage.setItem('userRole', 'department');
      await AsyncStorage.setItem('departmentInfo', JSON.stringify(result.data.department));
      
      Alert.alert('Success', `Welcome ${result.data.department.name}!`, [
        { text: 'OK', onPress: () => navigation.replace('DepartmentTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Department Login</Text>
          <Text style={styles.subtitle}>Access your department portal</Text>
          
          <View style={styles.form}>
            <Text style={styles.label}>Department Code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="e.g., PUBLIC_WORKS"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              autoCapitalize="none"
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              try {
                navigation.navigate('Login');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.switchText}>Switch to Citizen Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              try {
                navigation.navigate('DepartmentSignUp');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.switchText}>Create Department (Admin)</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    padding: 12,
  },
  switchText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
});
