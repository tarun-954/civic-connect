// apps/mobile/App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DepartmentLoginScreen from './screens/DepartmentLoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import MapViewScreen from './screens/MapViewScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReportIssueScreen from './screens/ReportIssueScreen';
import ReportLocationScreen from './screens/ReportLocationScreen';
import TrackReportScreen from './screens/TrackReportScreen';
import DepartmentsScreen from './screens/DepartmentsScreen';
import DepartmentDashboardScreen from './screens/DepartmentDashboardScreen';
import DepartmentIssuesScreen from './screens/DepartmentIssuesScreen';
import DepartmentAnalyticsScreen from './screens/DepartmentAnalyticsScreen';
import DepartmentNotificationsScreen from './screens/DepartmentNotificationsScreen';
import DepartmentMapScreen from './screens/DepartmentMapScreen';
import { useFonts } from 'expo-font';
import { Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CitizenTabs() {
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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Issues') {
            iconName = 'list';
          } else if (route.name === 'Analytics') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Map') {
            iconName = 'map';
          } else if (route.name === 'Notifications') {
            iconName = 'bell';
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
      <Tab.Screen name="Dashboard" component={DepartmentDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Issues" component={DepartmentIssuesScreen} options={{ tabBarLabel: 'Issues' }} />
      <Tab.Screen name="Analytics" component={DepartmentAnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="Map" component={DepartmentMapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="Notifications" component={DepartmentNotificationsScreen} options={{ tabBarLabel: 'Notifications' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    'Inter': require('./src/assets/fonts/inter.ttf'),
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!loaded && !error) {
    return null;
  }

  if (isLoading) {
    return <SplashScreen />;
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
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="DepartmentLoginScreen" component={DepartmentLoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="CitizenTabs" component={CitizenTabs} />
        <Stack.Screen name="DepartmentTabs" component={DepartmentTabs} />
        <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
        <Stack.Screen name="ReportLocation" component={ReportLocationScreen} />
        <Stack.Screen name="TrackReport" component={TrackReportScreen} />
        <Stack.Screen name="Departments" component={DepartmentsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}