import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FullScreenReportViewerProps {
  visible: boolean;
  reports: any[];
  initialIndex: number;
  onClose: () => void;
  onReportsUpdate: () => void;
}

export default function FullScreenReportViewer({
  visible,
  reports,
  initialIndex,
  onClose,
  onReportsUpdate,
}: FullScreenReportViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Update selected report when initialIndex changes
  useEffect(() => {
    if (reports[initialIndex]) {
      setSelectedReport(reports[initialIndex]);
      // Scroll to initial index
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, [initialIndex, reports]);

  const formatDate = (dateInput: string | Date) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async (reportId: string) => {
    try {
      await ApiService.likeReport(reportId);
      onReportsUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to like report');
    }
  };

  const handleDislike = async (reportId: string) => {
    try {
      await ApiService.dislikeReport(reportId);
      onReportsUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to dislike report');
    }
  };

  const handleAddComment = async (reportId: string) => {
    if (!newComment.trim()) return;
    
    try {
      setAddingComment(true);
      await ApiService.addComment(reportId, newComment.trim());
      setNewComment('');
      onReportsUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleImageScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentImageIndex(pageNum);
  };

  const renderReportItem = ({ item: report, index }: { item: any; index: number }) => {
    return (
      <View style={styles.reportItem}>
        {/* Report Header */}
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>
              {report.issue?.category} • {report.issue?.subcategory}
            </Text>
            <Text style={styles.reportTime}>{formatDate(report.submittedAt)}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Feather name="more-horizontal" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Images */}
        {report.issue?.photos && report.issue.photos.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScroll}
              style={styles.imageScrollView}
            >
              {report.issue.photos.map((photo: any, photoIndex: number) => (
                <Image
                  key={photoIndex}
                  source={{ uri: photo.uri }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            
            {/* Image indicators */}
            {report.issue.photos.length > 1 && (
              <View style={styles.imageIndicators}>
                {report.issue.photos.map((_: any, photoIndex: number) => (
                  <View
                    key={photoIndex}
                    style={[
                      styles.indicator,
                      photoIndex === currentImageIndex && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={() => handleLike(report.reportId)} style={styles.actionButton}>
              <Feather 
                name="heart" 
                size={24} 
                color={report.likes?.length > 0 ? "#FF3040" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDislike(report.reportId)} style={styles.actionButton}>
              <Feather 
                name="thumbs-down" 
                size={24} 
                color={report.dislikes?.length > 0 ? "#FF3040" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setSelectedReport(report);
                setShowComments(true);
              }} 
              style={styles.actionButton}
            >
              <Feather name="message-circle" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="bookmark" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Likes count */}
        <View style={styles.likesContainer}>
          <Text style={styles.likesText}>
            {report.likes?.length || 0} likes, {report.dislikes?.length || 0} dislikes
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            <Text style={styles.username}>Your Report</Text> {report.issue?.description}
          </Text>
        </View>

        {/* Comments preview */}
        {report.comments && report.comments.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSelectedReport(report);
              setShowComments(true);
            }}
            style={styles.commentsPreview}
          >
            <Text style={styles.viewAllComments}>
              View all {report.comments.length} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Report details */}
        <View style={styles.reportDetails}>
          <Text style={styles.detailsTitle}>Report Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{report.status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Report ID:</Text>
            <Text style={styles.detailValue}>{report.reportId}</Text>
          </View>
          {report.trackingCode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tracking Code:</Text>
              <Text style={styles.detailValue}>{report.trackingCode}</Text>
            </View>
          )}
          {report.location?.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{report.location.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!visible || reports.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Reports</Text>
            <View style={{ flex: 1 }} />
          </View>
        </SafeAreaView>

        {/* Instagram-style Feed */}
        <FlatList
          ref={flatListRef}
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.reportId}
          showsVerticalScrollIndicator={false}
          pagingEnabled={false}
          snapToInterval={screenHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          onScrollToIndexFailed={(info) => {
            // Handle scroll to index failure
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            }, 100);
          }}
        />

        {/* Comments Modal */}
        {showComments && selectedReport && (
          <View style={styles.commentsModal}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentsList}>
              {selectedReport.comments?.map((comment: any, index: number) => (
                <View key={index} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>
                    {comment.byName || (comment.byEmail || '').split('@')[0]}
                  </Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
              {(!selectedReport.comments || selectedReport.comments.length === 0) && (
                <Text style={styles.noComments}>No comments yet</Text>
              )}
            </ScrollView>
            
            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.postButton, !newComment.trim() && styles.postButtonDisabled]}
                onPress={() => handleAddComment(selectedReport.reportId)}
                disabled={addingComment || !newComment.trim()}
              >
                <Text style={styles.postButtonText}>
                  {addingComment ? '...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  reportItem: {
    width: screenWidth,
    minHeight: screenHeight,
    backgroundColor: '#FFFFFF',
    paddingTop: 60, // Account for header
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reportTime: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  imageScrollView: {
    height: screenWidth,
  },
  reportImage: {
    width: screenWidth,
    height: screenWidth,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  username: {
    fontWeight: '600',
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  viewAllComments: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  reportDetails: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E8E',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  commentsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  noComments: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
