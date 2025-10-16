import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OtpService, saveUserProfile, fetchMyProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [target, setTarget] = useState(''); // phone or email
  const [channel, setChannel] = useState<'email'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!target.trim()) {
      Alert.alert('Missing', `Please enter your ${channel}.`);
      return;
    }
    try {
      setLoading(true);
      // Open the popup immediately for a smooth UX
      setOtpSent(true);
      setOtpVisible(true);
      
      setResendIn(30);
      
      const res = await OtpService.requestOtp({ target: target.trim(), channel: 'email', purpose: 'login' });
      
      const timer = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) { clearInterval(timer as any); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to request OTP');
      // Close popup if there's an error
      setOtpVisible(false);
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code.trim()) {
      Alert.alert('Missing', 'Please enter the OTP code.');
      return;
    }
    try {
      setLoading(true);
      const res = await OtpService.verifyOtp({ target: target.trim(), purpose: 'login', code: code.trim() });
      const token = res?.data?.token;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userRole', 'citizen');
        
        // Fetch user profile and login
        const userProfile = await fetchMyProfile();
        if (userProfile) {
          login(userProfile);
        } else {
          // Fallback: create basic profile from email
          const basicProfile = { email: target.trim() };
          await saveUserProfile(basicProfile);
          login(basicProfile);
        }
        
        setOtpVisible(false);
        setCode('');
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login with OTP</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggle, styles.toggleActive]}>
          <Text style={[styles.toggleText, styles.toggleTextActive]}>Email</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={'Enter email address'}
        keyboardType={'email-address'}
        autoCapitalize={'none'}
        value={target}
        onChangeText={setTarget}
      />


      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={requestOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
      </TouchableOpacity>
      
      {/* OTP overlay is opened automatically when sending OTP */}
      <View style={styles.linkRow}>
        <Text style={styles.linkText}>New here? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}>
          <Text style={styles.linkEmphasis}>Create account</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => {
          try {
            navigation.navigate('DepartmentLogin');
          } catch (error) {
            console.error('Navigation error:', error);
          }
        }}
      >
        <Text style={styles.switchText}>Switch to Department Login</Text>
      </TouchableOpacity>
      {otpVisible && (
        <View style={styles.overlayBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalSub}>Enter the 6-digit code sent to {target}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="123456"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancel]} 
                onPress={() => { 
                  setOtpVisible(false); 
                  setCode(''); 
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalVerify, loading && { opacity: 0.7 }]} 
                onPress={verifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalVerifyText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.resendContainer}>
              <TouchableOpacity 
                disabled={resendIn > 0 || loading} 
                onPress={async () => {
                  try {
                    setLoading(true);
                    await OtpService.requestOtp({ target: target.trim(), channel: 'email', purpose: 'login' });
                    setResendIn(30);
                    const timer = setInterval(() => {
                      setResendIn((s) => {
                        if (s <= 1) { clearInterval(timer as any); return 0; }
                        return s - 1;
                      });
                    }, 1000);
                    Alert.alert('Success', 'OTP resent successfully!');
                  } catch (e: any) {
                    Alert.alert('Error', e?.message || 'Failed to resend OTP');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={[styles.resendText, (resendIn > 0 || loading) && { color: '#9CA3AF' }]}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F6FB' },
  title: { fontSize: 22, fontWeight: '800', color: '#0A2E68', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 12, marginBottom: 12 },
  toggle: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  toggleActive: { backgroundColor: '#fff' },
  toggleText: { color: '#6B7280', fontWeight: '600' },
  toggleTextActive: { color: '#111827' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#FAFBFF' },
  button: { backgroundColor: '#0B5CAB', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
  ,
  linkRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { color: '#6B7280' },
  linkEmphasis: { color: '#0B5CAB', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  overlayBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSub: { marginTop: 6, color: '#6B7280', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginLeft: 8 },
  modalCancel: { backgroundColor: '#F3F4F6' },
  modalVerify: { backgroundColor: '#159D7E' },
  modalCancelText: { color: '#111827', fontWeight: '600' },
  modalVerifyText: { color: '#FFFFFF', fontWeight: '700' },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  switchText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  resendContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  resendText: {
    color: '#159D7E',
    fontWeight: '600',
    fontSize: 14,
  },
});


