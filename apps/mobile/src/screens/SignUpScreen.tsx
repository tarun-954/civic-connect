import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiService, OtpService, saveUserProfile } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const onSubmit = async () => {
    try {
      // Basic client-side validation to reduce backend errors
      if (!name || !email || !phone || !password) {
        Alert.alert('Missing info', 'Please fill in all fields.');
        return;
      }
      const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
      if (!emailRegex.test(email)) {
        Alert.alert('Invalid email', 'Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      // Step 1: Request OTP for signup via email
      const res = await OtpService.requestOtp({ target: email.trim(), channel: 'email', purpose: 'signup' });
      setOtpVisible(true);
      setResendIn(30);
      const timer = setInterval(() => {
        setResendIn((s) => {
          if (s <= 1) { clearInterval(timer as any); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err: any) {
      Alert.alert('Signup failed', err?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    try {
      if (!otpCode || otpCode.trim().length !== 6) {
        Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
        return;
      }
      setLoading(true);
      const res = await OtpService.verifyOtp({ target: email.trim(), purpose: 'signup', code: otpCode.trim() });
      const token = res?.data?.token;
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      await ApiService.signup({ name, email, phone, password });
      const userProfile = { name, email, phone };
      await saveUserProfile(userProfile);
      login(userProfile);
      setOtpVisible(false);
      setOtpCode('');
      Alert.alert('Success', 'Account created successfully!');
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.animationWrapper}>
          <LottieView
            source={{ uri: 'https://lottie.host/085df401-1133-473b-8a67-66227d4b6fa4/07SDJ6Qsfd.lottie' }}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Civic Connect to report and track issues in your city.</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Coming soon', 'Google sign-in will be enabled shortly.')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={styles.linkEmphasis}>Login now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={otpVisible} transparent animationType="fade" onRequestClose={() => setOtpVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <Text style={styles.modalSub}>Enter the 6-digit code sent to your email (Dev OTP visible during testing)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="123456"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={setOtpCode}
              maxLength={6}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => { setOtpVisible(false); setOtpCode(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalVerify]} onPress={onVerifyOtp}>
                <Text style={styles.modalVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              <TouchableOpacity disabled={resendIn > 0} onPress={onSubmit}>
                <Text style={{ color: resendIn > 0 ? '#9CA3AF' : '#159D7E', fontWeight: '600' }}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24
  },
  header: {
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 16,
    color: '#0A2E68'
  },
  animationWrapper: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center'
  },
  animation: {
    width: 220,
    height: 180
  },
  subtitle: {
    marginTop: -8,
    marginBottom: 8,
    color: '#6B7280'
  },
  form: {
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16
  },
  button: {
    backgroundColor: '#0B5CAB',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#0A2E68',
    fontSize: 16,
    fontWeight: '600'
  },
  dividerRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6B7280'
  },
  linkRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  linkText: {
    color: '#6B7280'
  },
  linkEmphasis: {
    color: '#159D7E',
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCard: {
    width: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827'
  },
  modalSub: {
    marginTop: 6,
    color: '#6B7280',
    marginBottom: 12
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8
  },
  modalCancel: {
    backgroundColor: '#F3F4F6'
  },
  modalVerify: {
    backgroundColor: '#159D7E'
  },
  modalCancelText: {
    color: '#111827',
    fontWeight: '600'
  },
  modalVerifyText: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});


