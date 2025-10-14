import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ReportCardProps {
  report: any;
  onPress: () => void;
}

export default function ReportCard({ report, onPress }: ReportCardProps) {
  const hasPhotos = report.issue?.photos && report.issue.photos.length > 0;
  const isCarousel = hasPhotos && report.issue.photos.length > 1;
  const isVideo = false; // We can add video support later

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {hasPhotos ? (
          <Image 
            source={{ uri: report.issue.photos[0].uri }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="image" size={24} color="#9CA3AF" />
          </View>
        )}
        
        {/* Carousel indicator */}
        {isCarousel && (
          <View style={styles.carouselIndicator}>
            <Feather name="layers" size={12} color="#FFFFFF" />
          </View>
        )}
        
        {/* Video indicator */}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Feather name="play" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
});
