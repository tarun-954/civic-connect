import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function DepartmentsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#159D7E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Departments</Text>
      </View>
      
      <View style={styles.center}>
        <Text style={styles.title}>Departments</Text>
        <Text style={styles.subtitle}>Browse departments and contacts.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 16,
    backgroundColor: '#ffffff'
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#4B5563' }
});
