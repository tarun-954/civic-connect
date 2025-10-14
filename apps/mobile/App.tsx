// apps/mobile/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SplashScreen from './src/screens/SplashScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import DepartmentLoginScreen from './src/screens/DepartmentLoginScreen';
import DepartmentSignUpScreen from './src/screens/DepartmentSignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapViewScreen from './src/screens/MapViewScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DepartmentDashboardScreen from './src/screens/DepartmentDashboardScreen';
import DepartmentIssuesScreen from './src/screens/DepartmentIssuesScreen';
import DepartmentAnalyticsScreen from './src/screens/DepartmentAnalyticsScreen';
import DepartmentNotificationsScreen from './src/screens/DepartmentNotificationsScreen';
import DepartmentMapScreen from './src/screens/DepartmentMapScreen';
import ReportIssueScreen from './src/screens/ReportIssueScreen';
import ReportLocationScreen from './src/screens/ReportLocationScreen';
import TrackReportScreen from './src/screens/TrackReportScreen';
import DepartmentsScreen from './src/screens/DepartmentsScreen';
import ReportPreviewScreen from './src/screens/ReportPreviewScreen';
import { useFonts } from 'expo-font';
import { Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'MapView') {
            iconName = 'map';
          } else if (route.name === 'Analytics') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#159D7E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MapView" component={MapViewScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

function DepartmentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Issues') iconName = 'list';
          else if (route.name === 'Analytics') iconName = 'bar-chart-2';
          else if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'Notifications') iconName = 'bell';
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#159D7E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
      })}
    >
      <Tab.Screen name="Dashboard" component={DepartmentDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Issues" component={DepartmentIssuesScreen} options={{ tabBarLabel: 'Issues' }} />
      <Tab.Screen name="Analytics" component={DepartmentAnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="Map" component={DepartmentMapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="Notifications" component={DepartmentNotificationsScreen} options={{ tabBarLabel: 'Notifications' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="DepartmentLogin" component={DepartmentLoginScreen} />
      <Stack.Screen name="DepartmentSignUp" component={DepartmentSignUpScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#159D7E" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
            <Stack.Screen name="ReportLocation" component={ReportLocationScreen} />
            <Stack.Screen name="TrackReport" component={TrackReportScreen} />
            <Stack.Screen name="Departments" component={DepartmentsScreen} />
            <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="AuthStack" component={AuthStack} />
            {/* Expose Department tabs even when not in citizen Auth */}
            <Stack.Screen name="DepartmentTabs" component={DepartmentTabs} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    'Inter': require('./src/assets/fonts/inter.ttf'),
  });

  if (!loaded && !error) {
    return null;
  }

  // Set default font with fallback
  const RNText: any = Text;
  RNText.defaultProps = {
    ...(RNText.defaultProps || {}),
    style: [RNText.defaultProps?.style, { 
      fontFamily: loaded ? 'Inter' : 'System' // Fallback to system font
    }]
  };

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}