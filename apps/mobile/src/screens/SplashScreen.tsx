import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Temporarily disable auto-navigation to test manual navigation
  // useEffect(() => {
  //   checkAuthStatus();
  // }, []);

  const checkAuthStatus = async () => {
    try {
      // Add a longer delay to ensure navigation is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const authToken = await AsyncStorage.getItem('authToken');
      const deptToken = await AsyncStorage.getItem('deptToken');
      const userRole = await AsyncStorage.getItem('userRole');

      if (authToken && userRole === 'citizen') {
        navigation.replace('CitizenTabs');
      } else if (deptToken && userRole === 'department') {
        navigation.replace('DepartmentTabs');
      } else {
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsCheckingAuth(false);
    }
  };

  // if (isCheckingAuth) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.center}>
  //         <Image source={require('../images/logoimage.png')} style={styles.splashLogo} resizeMode="contain" />
  //         <Text style={styles.splashText}>Civic Connect</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../images/logoimage.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appName}>Civic Connect</Text>
        </View>
        <LanguageSelector />
      </View>

      <View style={styles.illustrationWrapper}>
        <Image
          source={require('../images/logoimage.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.title}>to Civic Connect</Text>
        <Text style={styles.subtitle}>
         Your voice matters. Report issues in your neighborhood, track progress, and help build a cleaner, safer city.
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, Platform.OS === 'web' && { cursor: 'pointer' } as any]} 
            activeOpacity={0.9} 
            onPress={() => {
              try {
                navigation.navigate('Login');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>Citizen Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, Platform.OS === 'web' && { cursor: 'pointer' } as any]} 
            activeOpacity={0.9}
            onPress={() => {
              try {
                navigation.navigate('DepartmentLogin');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>Department Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tertiaryButton, Platform.OS === 'web' && { cursor: 'pointer' } as any]} 
            activeOpacity={0.9}
            onPress={() => {
              try {
                navigation.navigate('SignUp');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.tertiaryButtonText}>Sign Up as Citizen</Text>
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
    paddingTop: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: '#111827',
    fontFamily: 'MerriweatherVariable'
  },
  langChevron: {
    marginLeft: 6,
    color: '#6B7280',
    fontSize: 12
  },
  illustrationWrapper: {
    paddingHorizontal: 24,
    paddingTop: 80,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  illustrationImage: {
    width: 210,
    height: 210,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 26
  },
  title: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '800',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    color: '#1F2937',
    textAlign: 'left',
    fontFamily: 'Inter'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    
    color: '#4B5563',
    textAlign: 'center'
  },
  buttonsContainer: {
    marginTop: 'auto',
    paddingBottom: 24
  },
  primaryButton: {
    backgroundColor: '#159D7E',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EB',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  googleIcon: {
    marginLeft: 8,
    width: 20,
    height: 20
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  tertiaryButton: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  tertiaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter'
  }
});
