import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OtpService, saveUserProfile, fetchMyProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Fonts, TextStyles } from '../utils/fonts';

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
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../images/logoimage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your email to receive OTP</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={target}
            onChangeText={setTarget}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={requestOtp} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={() => Alert.alert('Coming soon', 'Google sign-in will be enabled shortly.')}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
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
      </View>
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 80,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: Fonts.display.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Fonts.primary.regular,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: Fonts.secondary.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FAFBFF',
    fontFamily: Fonts.primary.regular,
  },
  button: {
    backgroundColor: '#0B5CAB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#0B5CAB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.primary.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: Fonts.primary.regular,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.primary.bold,
  },
  footer: {
    paddingBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: Fonts.primary.regular,
  },
  linkEmphasis: {
    color: '#0B5CAB',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Fonts.primary.bold,
  },
  switchButton: {
    alignItems: 'center',
    padding: 12,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.primary.regular,
  },
  // Modal styles
  overlayBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Fonts.display.bold,
  },
  modalSub: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Fonts.primary.regular,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: Fonts.primary.bold,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalVerify: {
    backgroundColor: '#0B5CAB',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Fonts.primary.bold,
  },
  modalVerifyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: Fonts.primary.bold,
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#0B5CAB',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Fonts.primary.bold,
  },
});


