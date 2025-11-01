import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DepartmentService } from '../services/api';

export default function DepartmentLoginScreen({ navigation }: any) {
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [loginType, setLoginType] = useState("supervisor"); // "supervisor" or "worker"

  const departments = [
    { name: "Road Department", code: "ROAD_DEPT" },
    { name: "Electricity Department", code: "ELECTRICITY_DEPT" }, 
    { name: "Sewage Department", code: "SEWAGE_DEPT" },
    { name: "Cleanliness Department", code: "CLEANLINESS_DEPT" },
    { name: "Waste Management", code: "WASTE_MGMT" },
    { name: "Water Department", code: "WATER_DEPT" },
    { name: "Streetlight Department", code: "STREETLIGHT_DEPT" }
  ];

  const handleLogin = async () => {
    if (!department || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    
    try {
      const selectedDept = departments.find(d => d.name === department);
      if (!selectedDept) {
        Alert.alert("Error", "Invalid department selected");
        return;
      }

      // Authenticate against backend and store real JWT token
      const res = await DepartmentService.login(selectedDept.code, password);
      const token = res?.data?.token;
      if (!token) {
        throw new Error('Invalid response from server');
      }

      await AsyncStorage.setItem('deptToken', String(token));
      await AsyncStorage.setItem('userRole', 'department');
      await AsyncStorage.setItem('departmentInfo', JSON.stringify({
        name: selectedDept.name,
        code: selectedDept.code,
        email,
        loginType
      }));

      navigation.replace('DepartmentTabs', {
        department: selectedDept.name,
        departmentCode: selectedDept.code
      });
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Please try again");
    }
  };

  const renderOption = (item: { name: string; code: string }, onSelect: any) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        onSelect(item.name);
      }}
    >
      <Text style={styles.optionText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../images/logoimage.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Department Login Portal</Text>
          <Text style={styles.subtitle}>Enter your credentials to continue</Text>
        </View>

        <View style={styles.card}>
          {/* Login Type Selection */}
          <Text style={styles.label}>Login As</Text>
          <View style={styles.loginTypeContainer}>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'supervisor' && styles.loginTypeButtonActive]}
              onPress={() => setLoginType('supervisor')}
            >
              <Text style={[styles.loginTypeText, loginType === 'supervisor' && styles.loginTypeTextActive]}>
                Supervisor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginTypeButton, loginType === 'worker' && styles.loginTypeButtonActive]}
              onPress={() => setLoginType('worker')}
            >
              <Text style={[styles.loginTypeText, loginType === 'worker' && styles.loginTypeTextActive]}>
                Worker
              </Text>
            </TouchableOpacity>
          </View>

          {/* Department Dropdown */}
          <Text style={styles.label}>Select Department</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDeptModal(true)}
          >
            <Text style={styles.dropdownText}>
              {department || "Select Department"}
            </Text>
          </TouchableOpacity>

          {/* Email */}
          <Text style={styles.label}>Email / Username</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your official email"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />

          {/* Login Button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Back to User Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Department Modal */}
      <Modal visible={showDeptModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeptModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <FlatList
                data={departments}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) =>
                  renderOption(item, (selected: string) => {
                    setDepartment(selected);
                    setShowDeptModal(false);
                  })
                }
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dropdown: {
    height: 45,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dropdownText: {
    color: "#111827",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#2563EB",
    textAlign: "center",
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
  },
  loginTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  loginTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginTypeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  loginTypeTextActive: {
    color: '#111827',
  },
});
