import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function MLAnalysisScreen({ navigation }: any) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [departmentInfo, setDepartmentInfo] = useState<any>(null);

  // Load department info
  React.useEffect(() => {
    loadDepartmentInfo();
  }, []);

  const loadDepartmentInfo = async () => {
    try {
      const deptStr = await AsyncStorage.getItem('departmentInfo');
      if (deptStr) {
        setDepartmentInfo(JSON.parse(deptStr));
      }
    } catch (error) {
      console.error('Error loading department info:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera roll access to analyze images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAnalysisResults(null); // Reset previous results
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAnalysisResults(null); // Reset previous results
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await ApiService.analyzeImage(selectedImage);
      
      if (result?.data?.analysis) {
        setAnalysisResults(result.data.analysis);
      } else {
        throw new Error('Invalid analysis response');
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Failed', error.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return '#EF4444'; // Red
      case 'high':
        return '#F59E0B'; // Orange
      case 'medium':
        return '#3B82F6'; // Blue
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ML Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Feather name="info" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Analyze images for pothole detection using ML. Upload images to get automatic priority classification.
          </Text>
        </View>

        {/* Department Info */}
        {departmentInfo && (
          <View style={styles.deptCard}>
            <Text style={styles.deptLabel}>Department</Text>
            <Text style={styles.deptName}>{departmentInfo.name}</Text>
          </View>
        )}

        {/* Image Selector */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Select Image</Text>
          
          <View style={styles.imageButtons}>
            <TouchableOpacity 
              style={[styles.imageButton, styles.cameraButton]} 
              onPress={takePhoto}
            >
              <Feather name="camera" size={24} color="#fff" />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageButton, styles.galleryButton]} 
              onPress={pickImage}
            >
              <Feather name="image" size={24} color="#fff" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => {
                  setSelectedImage(null);
                  setAnalysisResults(null);
                }}
              >
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Analyze Button */}
        {selectedImage && !analyzing && (
          <TouchableOpacity 
            style={styles.analyzeButton} 
            onPress={analyzeImage}
            disabled={analyzing}
          >
            <Feather name="search" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Analyze Image</Text>
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {analyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Analyzing image with ML...</Text>
          </View>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>

            {/* Detection Status */}
            <View style={[styles.resultCard, analysisResults.detected ? styles.detectedCard : styles.notDetectedCard]}>
              <Feather 
                name={analysisResults.detected ? 'check-circle' : 'x-circle'} 
                size={32} 
                color={analysisResults.detected ? '#10B981' : '#EF4444'} 
              />
              <Text style={styles.detectionStatus}>
                {analysisResults.detected ? 'Pothole Detected' : 'No Pothole Detected'}
              </Text>
            </View>

            {/* Confidence Score */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Confidence</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(analysisResults.confidence * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.metricValue}>{(analysisResults.confidence * 100).toFixed(1)}%</Text>
            </View>

            {/* Priority */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Priority</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(analysisResults.priority) }]}>
                <Text style={styles.priorityText}>{analysisResults.priority}</Text>
              </View>
            </View>

            {/* Severity */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Severity</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(analysisResults.severity) }]}>
                <Text style={styles.severityText}>{analysisResults.severity}</Text>
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Detections</Text>
                <Text style={styles.infoItemValue}>{analysisResults.num_detections}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoItemLabel}>Total Area</Text>
                <Text style={styles.infoItemValue}>{analysisResults.total_area} px²</Text>
              </View>
            </View>

            {/* Recommendation */}
            <View style={styles.recommendationCard}>
              <Feather name="info" size={20} color="#3B82F6" />
              <Text style={styles.recommendationText}>{analysisResults.recommendation}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  deptCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  deptLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  imageSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
  },
  galleryButton: {
    backgroundColor: '#10B981',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detectedCard: {
    backgroundColor: '#ECFDF5',
  },
  notDetectedCard: {
    backgroundColor: '#FEF2F2',
  },
  detectionStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginLeft: 12,
  },
  metricCard: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});


