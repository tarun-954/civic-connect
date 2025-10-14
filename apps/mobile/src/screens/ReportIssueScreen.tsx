import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
// Use require to avoid TypeScript type resolution issues if module isn't installed yet
const ImagePicker: any = require('expo-image-picker');

export default function ReportIssueScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [issueDescription, setIssueDescription] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string }[]>([]);

  const MAX_ATTACHMENTS = 5;

  const handleOpenCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (attachments.length >= MAX_ATTACHMENTS) {
          Alert.alert('Limit reached', `You can only add up to ${MAX_ATTACHMENTS} photos.`);
          return;
        }
        setAttachments(prev => [...prev, { uri: result.assets[0].uri }].slice(0, MAX_ATTACHMENTS));
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Unable to open camera.');
    }
  };

  const handlePickFromDevice = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Storage permission is required to pick photos.');
        return;
      }
      const remaining = Math.max(0, MAX_ATTACHMENTS - attachments.length);
      if (remaining === 0) {
        Alert.alert('Limit reached', `You can only add up to ${MAX_ATTACHMENTS} photos.`);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled && result.assets) {
        const picked = result.assets.map((a: any) => ({ uri: a.uri }));
        setAttachments(prev => [...prev, ...picked].slice(0, MAX_ATTACHMENTS));
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Unable to open gallery.');
    }
  };

  const handleRemoveAttachment = (uri: string) => {
    setAttachments(prev => prev.filter(a => a.uri !== uri));
  };

  const subcategories = {
    'Road': [
      'Pothole',
      'Cracks / uneven surface',
      'Speed breaker damaged / missing',
      'Road flooded / waterlogging',
      'Illegal parking',
      'Construction debris',
      'Blocked / broken footpath'
    ],
    'Electricity': [
      'Power outage',
      'Street light not working',
      'Electrical pole damaged',
      'Loose wires / cables',
      'Transformer issues',
      'Meter problems'
    ],
    'Sewage': [
      'Blocked drain',
      'Sewage overflow',
      'Manhole cover missing',
      'Bad smell / odor',
      'Pipe leakage',
      'Waste water stagnation'
    ],
    'Cleanliness': [
      'Garbage not collected',
      'Public area dirty',
      'Littering',
      'Graffiti / vandalism',
      'Public toilet dirty',
      'Dead animals'
    ],
    'Dustbin Full': [
      'Dustbin overflowing',
      'Dustbin damaged',
      'Dustbin missing',
      'Improper waste segregation',
      'Scattered garbage around dustbin'
    ],
    'Water': [
      'No water supply',
      'Low water pressure',
      'Contaminated water',
      'Pipe burst / leakage',
      'Water meter issues',
      'Illegal water connection'
    ],
    'Streetlight': [
      'Street light not working',
      'Street light pole damaged',
      'Insufficient lighting',
      'Light flickering',
      'Wiring issues'
    ]
  };

  const categories = [
    { 
      name: 'Road', 
      icon: 'tool', 
      image: require('../images/icons8-construction-50.png'),
      selectedImage: require('../images/icons8-construction-50 (1).png')
    },
    { 
      name: 'Electricity', 
      icon: 'zap',
      image: require('../images/icons8-transmission-tower-24.png'),
      selectedImage: require('../images/icons8-transmission-tower-24 (1).png')
    },
    { 
      name: 'Sewage', 
      icon: 'droplet',
      image: require('../images/icons8-water-waste-96.png'),
      selectedImage: require('../images/icons8-water-waste-96 (1).png')
    },
    { 
      name: 'Cleanliness', 
      icon: 'trash-2',
      image: require('../images/icons8-cleaning-50.png'),
      selectedImage: require('../images/icons8-cleaning-50 (1).png')
    },
    { 
      name: 'Dustbin Full', 
      icon: 'trash',
      image: require('../images/icons8-garbage-truck-50.png'),
      selectedImage: require('../images/icons8-garbage-truck-50 (1).png')
    },
    { 
      name: 'Water', 
      icon: 'droplet',
      image: require('../images/icons8-water-49.png'),
      selectedImage: require('../images/icons8-water-drop-53.png')
    },
    { 
      name: 'Streetlight', 
      icon: 'sun',
      image: require('../images/icons8-street-light-64.png'),
      selectedImage: require('../images/icons8-street-light-64 (1).png')
    }
  ];

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
        <Text style={styles.headerTitle}>Report Issue</Text>
      </View>
      {/* Step Progress Pills */}
      <View style={styles.stepsBar}>
        <View style={styles.stepPillWrapper}>
          <View style={[styles.stepPill, styles.stepPillActive]}> 
            <Text style={[styles.stepText, styles.stepTextActive]}>1. General Information</Text>
          </View>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepPillWrapper}>
          <View style={styles.stepPill}> 
            <Text style={styles.stepText}>2. Place and Location</Text>
          </View>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepPillWrapper}>
          <View style={styles.stepPill}> 
            <Text style={styles.stepText}>3. Preview Report Information</Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Motivation section removed as requested */}
        
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>1. What is the category of the problem?</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryItem}
                onPress={() => {
                  setSelectedCategory(category.name);
                  // Auto-select first subcategory when category is selected
                  const firstSubcategory = subcategories[category.name as keyof typeof subcategories]?.[0] || '';
                  setSelectedSubcategory(firstSubcategory);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryIconContainer,
                  selectedCategory === category.name && styles.categoryIconSelected
                ]}>
                  {category.image ? (
                    <Image 
                      source={
                        selectedCategory === category.name && category.selectedImage 
                          ? category.selectedImage 
                          : category.image
                      } 
                      style={styles.categoryImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Feather 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.name ? '#ffffff' : '#6B7280'} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.name && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Subcategory Section */}
        <View style={styles.subcategorySection}>
          <Text style={styles.subcategoryTitle}>2. Specific Subcategory</Text>
          {selectedCategory ? (
            <View style={styles.subcategoryList}>
              {subcategories[selectedCategory as keyof typeof subcategories]?.map((subcategory, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.subcategoryOption,
                    selectedSubcategory === subcategory && styles.subcategoryOptionSelected
                  ]}
                  onPress={() => setSelectedSubcategory(subcategory)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.subcategoryText,
                    selectedSubcategory === subcategory && styles.subcategoryTextSelected
                  ]}>
                    {subcategory}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Please select a category first to see subcategories</Text>
            </View>
          )}
        </View>
        
        {/* Describe Issue Section */}
        <View style={styles.describeSection}>
          <Text style={styles.describeTitle}>3. Describe the issue</Text>
          
          {selectedCategory && selectedSubcategory ? (
            <>
              {/* Text/Voice Toggle */}
              <View style={styles.inputModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    styles.toggleButtonLeft,
                    inputMode === 'text' && styles.toggleButtonActive
                  ]}
                  onPress={() => setInputMode('text')}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={
                      inputMode === 'text' 
                        ? require('../images/icons8-pen-64 (1).png')
                        : require('../images/icons8-pen-64.png')
                    }
                    style={styles.toggleIcon}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.toggleButtonText,
                    inputMode === 'text' && styles.toggleButtonTextActive
                  ]}>
                    Text
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    styles.toggleButtonRight,
                    inputMode === 'voice' && styles.toggleButtonActive
                  ]}
                  onPress={() => setInputMode('voice')}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={
                      inputMode === 'voice' 
                        ? require('../images/icons8-microphone-50 (1).png')
                        : require('../images/icons8-microphone-50.png')
                    }
                    style={styles.toggleIcon}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.toggleButtonText,
                    inputMode === 'voice' && styles.toggleButtonTextActive
                  ]}>
                    Voice
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Text Input Area */}
              {inputMode === 'text' && (
                <View style={styles.textInputContainer}>
                  {/* Formatting Toolbar */}
                  <View style={styles.formattingToolbar}>
                    <View style={styles.toolbarLeft}>
                      <TouchableOpacity style={styles.toolbarButton}>
                        <Text style={styles.toolbarButtonText}>H₁</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton}>
                        <Text style={styles.toolbarButtonText}>H₂</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton}>
                        <Text style={styles.toolbarButtonText}>Sans Serif ↓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarButton}>
                        <Text style={styles.toolbarButtonText}>Normal ↓</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.toolbarRight}>
                      <TouchableOpacity style={styles.toolbarIconButton}>
                        <Text style={styles.toolbarIcon}>B</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarIconButton}>
                        <Text style={styles.toolbarIcon}>I</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarIconButton}>
                        <Text style={styles.toolbarIcon}>U</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.toolbarIconButton}>
                        <Feather name="more-horizontal" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Text Input */}
                  <TextInput
                    style={styles.textInput}
                    placeholder="Please describe the issue in detail..."
                    placeholderTextColor="#9CA3AF"
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                    multiline={true}
                    textAlignVertical="top"
                  />
                </View>
              )}
              
              {/* Voice Input Area */}
              {inputMode === 'voice' && (
                <View style={styles.voiceInputContainer}>
                  <TouchableOpacity style={styles.voiceButton}>
                    <Feather name="mic" size={32} color="#4F46E5" />
                    <Text style={styles.voiceButtonText}>Tap to record</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                {!selectedCategory 
                  ? "Please select a category and subcategory to describe the issue"
                  : "Please select a subcategory to describe the issue"
                }
              </Text>
            </View>
          )}
        </View>

        {/* Upload Photos/Documents */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>4. Upload Photos/Documents</Text>
          <Text style={styles.uploadSub}>Please share up to {MAX_ATTACHMENTS} pictures</Text>

          <View style={styles.uploadCard}>
            <View style={styles.uploadIllustration}>
              <Feather name="file-plus" size={40} color="#9CA3AF" />
              <Text style={styles.uploadHint}>Add photos of the issue</Text>
            </View>

            <View style={styles.uploadButtonsRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={handleOpenCamera} activeOpacity={0.8}>
                <Feather name="camera" size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>Open Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnSecondary]} onPress={handlePickFromDevice} activeOpacity={0.8}>
                <Feather name="upload" size={18} color="#3B82F6" />
                <Text style={styles.uploadBtnTextSecondary}>Upload from Device</Text>
              </TouchableOpacity>
            </View>

            {attachments.length > 0 && (
              <View style={styles.previewGrid}>
                {attachments.map((item, idx) => (
                  <View key={idx} style={styles.previewItem}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeBadge} onPress={() => handleRemoveAttachment(item.uri)}>
                      <Feather name="x" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.counterText}>{attachments.length}/{MAX_ATTACHMENTS} selected</Text>
          </View>
        </View>
        
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  setInputMode('text');
                  setIssueDescription('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={() => {
                  const reportData = {
                    category: selectedCategory,
                    subcategory: selectedSubcategory,
                    description: issueDescription,
                    attachments: attachments,
                    inputMode: inputMode,
                  };
                  navigation.navigate('ReportLocation', { reportData });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 8,
    marginBottom: 4
  },
  stepPillWrapper: {
    flexShrink: 1,
    zIndex: 1
  },
  stepPill: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2
  },
  stepPillActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    elevation: 4
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600'
  },
  stepTextActive: {
    color: '#ffffff'
  },
  stepConnector: {
    flex: 1,
    height: 4,
    marginHorizontal: 10,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    zIndex: 0
  },
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
    fontWeight: '600',
    color: '#111827'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 30
  },
  
  categorySection: {
    
    padding: 15,
    // borderRadius: 16,
    backgroundColor: '#FEFEFE',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'left'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly'
  },
  categoryItem: {
    width: '33%',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryIconContainer: {
    width: 95,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  categoryIconSelected: {
    backgroundColor: '#3B82F6'
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center'
  },
  categoryTextSelected: {
    color: '#3B82F6',
    fontWeight: '600'
  },
  categoryImage: {
    width: 30,
    height: 30
  },
  subcategorySection: {
    // marginHorizontal: 20,
    padding: 20,
    // borderRadius: 16,
    backgroundColor: '#FEFEFE',
    // marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6
  },
  subcategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center'
  },
  subcategoryList: {
    flexDirection: 'column'
  },
  subcategoryOption: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 5
  },
  subcategoryOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  subcategoryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center'
  },
  subcategoryTextSelected: {
    color: '#ffffff',
    fontWeight: '600'
  },
  bottomSection: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 14
  },
  describeSection: {
    padding: 10,
    // borderRadius: 16,
    backgroundColor: '#FEFEFE',
    marginBottom: 30,
    marginTop:20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6
  },
  describeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center'
  },
  uploadSection: {
    padding: 15,
    backgroundColor: '#FEFEFE',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center'
  },
  uploadSub: {
    marginTop: 6,
    marginBottom: 14,
    textAlign: 'center',
    color: '#6B7280'
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF'
  },
  uploadIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16
  },
  uploadHint: {
    marginTop: 8,
    color: '#6B7280'
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700'
  },
  uploadBtnSecondary: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#3B82F6'
  },
  uploadBtnTextSecondary: {
    color: '#3B82F6',
    fontWeight: '700'
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
  },
  previewItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280'
  },
  inputModeToggle: {
    flexDirection: 'row',
    marginBottom: 14,
    alignSelf: 'center'
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderRightWidth: 0
  },
  toggleButtonRight: {
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    borderLeftWidth: 0
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280'
  },
  toggleButtonTextActive: {
    color: '#ffffff'
  },
  textInputContainer: {
    borderWidth: 2,
    marginTop: 10,
    borderColor: '#111111',
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  formattingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    backgroundColor: '#F9FAFB'
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  toolbarButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8
  },
  toolbarButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
  },
  toolbarIconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 4
  },
  toolbarIcon: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 'bold'
  },
  textInput: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    lineHeight: 24
  },
  voiceInputContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  voiceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  voiceButtonText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500'
  },
  placeholderContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  toggleIcon: {
    width: 28,
    height: 28
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280'
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});
