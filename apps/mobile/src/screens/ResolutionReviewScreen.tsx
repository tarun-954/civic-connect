import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiService } from '../services/api';
import { Fonts } from '../utils/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProofImage = {
  uri: string;
  filename?: string;
  uploadedAt?: string;
};

type QualityCheck = {
  status?: 'pass' | 'fail' | 'unknown';
  confidence?: number;
  summary?: string;
  details?: any[];
};

type RouteParams = {
  reportId?: string;
  trackingId?: string;
  photos?: ProofImage[];
  qualityCheck?: QualityCheck | null;
  canRespond?: boolean;
};

const ResolutionReviewScreen = ({ navigation, route }: any) => {
  const { reportId, trackingId, photos = [], qualityCheck, canRespond = false } =
    (route?.params as RouteParams) || {};
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [complaintModalVisible, setComplaintModalVisible] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      if (!reportId && !trackingId) {
        setLoading(false);
        return;
      }

      try {
        const response = reportId
          ? await ApiService.getReportById(reportId)
          : trackingId
            ? await ApiService.getReportByTrackingCode(trackingId)
            : null;

        const fetchedReport =
          response?.data?.report ||
          response?.data?.reports?.[0] ||
          response?.data ||
          null;

        if (isMounted) {
          setReport(fetchedReport);
          setError(null);
        }
      } catch (fetchError: any) {
        console.error('Error loading report details:', fetchError);
        if (isMounted) {
          setError(fetchError?.message || 'Failed to load report details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [reportId, trackingId]);

  const proofImages: ProofImage[] = useMemo(() => {
    if (photos && photos.length > 0) {
      return photos;
    }
    const resolutionPhotos = report?.resolution?.resolutionPhotos || [];
    return Array.isArray(resolutionPhotos) ? resolutionPhotos : [];
  }, [photos, report]);

  const aiReview: QualityCheck | null = useMemo(() => {
    if (qualityCheck) {
      return qualityCheck;
    }
    return report?.resolution?.qualityCheck || null;
  }, [qualityCheck, report]);

  const citizenCanRespond =
    canRespond && 
    (report?.status === 'resolved' || !report) &&
    (report?.resolution?.pendingApproval === true || report?.resolution?.approvalStatus === 'pending' || !report);

  const handleApprove = async () => {
    if (!reportId) {
      Alert.alert('Error', 'Report ID is missing.');
      return;
    }

    Alert.alert(
      'Approve Resolution',
      'Are you satisfied with the work done? This will mark the issue as resolved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setSubmitting(true);
              await ApiService.approveResolution(reportId);
              Alert.alert('Thank You!', 'Your approval has been recorded. The issue is now marked as resolved.', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back properly
                    try {
                      if (navigation.canGoBack()) {
                        navigation.goBack();
                      } else {
                        // If can't go back, navigate to TrackReport or Home
                        navigation.navigate('TrackReport');
                      }
                    } catch (navError) {
                      console.error('Navigation error after approval:', navError);
                    }
                  },
                },
              ]);
            } catch (approveError: any) {
              console.error('Error approving resolution:', approveError);
              Alert.alert('Error', approveError?.message || 'Failed to approve the resolution.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const submitRejection = async () => {
    if (!reportId) {
      return;
    }
    const trimmedReason = reworkReason.trim();
    if (trimmedReason.length === 0) {
      Alert.alert('Add details', 'Please describe what still needs attention.');
      return;
    }

    try {
      setSubmitting(true);
      await ApiService.rejectResolution(reportId, trimmedReason);
      setReasonModalVisible(false);
      setReworkReason('');
      Alert.alert(
        'Feedback Sent',
        'The department has been notified to continue working on this issue. They will review your feedback and take necessary action.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back properly
              try {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('TrackReport');
                }
              } catch (navError) {
                console.error('Navigation error after rejection:', navError);
              }
            },
          },
        ]
      );
    } catch (rejectError: any) {
      console.error('Error rejecting resolution:', rejectError);
      Alert.alert('Error', rejectError?.message || 'Failed to request rework.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitComplaint = async () => {
    if (!reportId) {
      return;
    }
    const trimmedComplaint = complaintText.trim();
    if (trimmedComplaint.length === 0) {
      Alert.alert('Add details', 'Please describe your complaint.');
      return;
    }

    try {
      setSubmitting(true);
      // Use rejectResolution API for complaints as well, or create a separate endpoint
      await ApiService.rejectResolution(reportId, `COMPLAINT: ${trimmedComplaint}`);
      setComplaintModalVisible(false);
      setComplaintText('');
      Alert.alert(
        'Complaint Submitted',
        'Your complaint has been recorded and sent to the department. They will review it and take appropriate action.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back properly
              try {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('TrackReport');
                }
              } catch (navError) {
                console.error('Navigation error after complaint:', navError);
              }
            },
          },
        ]
      );
    } catch (complaintError: any) {
      console.error('Error submitting complaint:', complaintError);
      Alert.alert('Error', complaintError?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = useMemo(() => {
    const status = report?.status;
    switch (status) {
      case 'resolved':
        return { label: 'Awaiting Your Approval', color: '#3B82F6', icon: 'clock' };
      case 'closed':
        return { label: 'Closed & Approved', color: '#10B981', icon: 'check-circle' };
      case 'in_progress':
        return { label: 'In Progress', color: '#F59E0B', icon: 'activity' };
      default:
        return status
          ? { label: status.replace('_', ' ').toUpperCase(), color: '#6B7280', icon: 'info' }
          : null;
    }
  }, [report?.status]);

  const confidencePercent =
    typeof aiReview?.confidence === 'number'
      ? Math.round(aiReview.confidence * 100)
      : null;

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (selectedImageIndex === null) return;
    if (direction === 'next' && selectedImageIndex < proofImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    } else if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading resolution details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Resolution</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        {statusBadge && (
          <View style={[styles.statusBanner, { backgroundColor: `${statusBadge.color}15` }]}>
            <Feather name={statusBadge.icon as any} size={20} color={statusBadge.color} />
            <Text style={[styles.statusBannerText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        )}

        {/* Report Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Report Information</Text>
          </View>
          
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tracking ID</Text>
              <Text style={styles.detailValue}>{trackingId || report?.trackingCode || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Report ID</Text>
              <Text style={styles.detailValue}>{reportId || report?.reportId || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{report?.issue?.category || 'Not specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subcategory</Text>
              <Text style={styles.detailValue}>{report?.issue?.subcategory || 'Not specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>
                {report?.assignment?.department || 'Not assigned'}
              </Text>
            </View>
            {report?.assignment?.assignedPerson && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned To</Text>
                <Text style={styles.detailValue}>{report.assignment.assignedPerson}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted</Text>
              <Text style={styles.detailValue}>{formatDate(report?.submittedAt || '')}</Text>
            </View>
            {report?.resolution?.resolvedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Resolved On</Text>
                <Text style={styles.detailValue}>{formatDate(report.resolution.resolvedAt)}</Text>
              </View>
            )}
            {report?.location?.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{report.location.address}</Text>
              </View>
            )}
          </View>

          {report?.issue?.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Original Issue Description</Text>
              <Text style={styles.descriptionText}>{report.issue.description}</Text>
            </View>
          )}
        </View>

        {/* Department Resolution Summary */}
        {report?.resolution?.description && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Department Resolution Summary</Text>
            </View>
            <Text style={styles.resolutionDescription}>{report.resolution.description}</Text>
            {report?.resolution?.resolvedBy && (
              <View style={styles.resolvedBySection}>
                <Feather name="user" size={14} color="#6B7280" />
                <Text style={styles.resolvedByText}>Resolved by: {report.resolution.resolvedBy}</Text>
              </View>
            )}
          </View>
        )}

        {/* Proof Images Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="image" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Proof Images ({proofImages.length})</Text>
          </View>
          {proofImages.length === 0 ? (
            <View style={styles.emptyProof}>
              <Feather name="image" size={32} color="#9CA3AF" />
              <Text style={styles.emptyProofText}>No proof images were provided.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
            >
              {proofImages.map((photo, index) => (
                <TouchableOpacity
                  key={`${photo.uri}-${index}`}
                  onPress={() => openImageViewer(index)}
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={{ uri: photo.uri }}
                    style={styles.proofImage}
                    imageStyle={styles.proofImageStyle}
                  >
                    <View style={styles.imageOverlay}>
                      <Feather name="zoom-in" size={16} color="#FFFFFF" />
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* AI Assessment Card */}
        {aiReview && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="cpu" size={20} color="#8B5CF6" />
              <Text style={styles.cardTitle}>AI Quality Assessment</Text>
            </View>
            <View
              style={[
                styles.aiSummary,
                aiReview?.status === 'pass'
                  ? styles.aiPass
                  : aiReview?.status === 'fail'
                    ? styles.aiFail
                    : styles.aiUnknown,
              ]}
            >
              <View style={styles.aiIconWrapper}>
                <Feather
                  name={
                    aiReview?.status === 'fail'
                      ? 'alert-triangle'
                      : aiReview?.status === 'pass'
                        ? 'check-circle'
                        : 'help-circle'
                  }
                  size={24}
                  color={
                    aiReview?.status === 'fail'
                      ? '#B91C1C'
                      : aiReview?.status === 'pass'
                        ? '#047857'
                        : '#4B5563'
                  }
                />
              </View>
              <View style={styles.aiContent}>
                <Text style={styles.aiSummaryTitle}>
                  {aiReview?.summary || 'Automated review not available.'}
                </Text>
                {confidencePercent !== null && (
                  <View style={styles.confidenceBar}>
                    <View style={styles.confidenceBarBg}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          {
                            width: `${confidencePercent}%`,
                            backgroundColor:
                              aiReview?.status === 'pass'
                                ? '#10B981'
                                : aiReview?.status === 'fail'
                                  ? '#EF4444'
                                  : '#6B7280',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceText}>Confidence: {confidencePercent}%</Text>
                  </View>
                )}
                {aiReview?.details && aiReview.details.length > 0 && (
                  <View style={styles.aiDetails}>
                    {aiReview.details.map((detail: any, idx: number) => (
                      <View key={idx} style={styles.aiDetailItem}>
                        <Feather
                          name={detail.detected ? 'alert-circle' : 'check-circle'}
                          size={14}
                          color={detail.detected ? '#EF4444' : '#10B981'}
                        />
                        <Text style={styles.aiDetailText}>
                          {detail.recommendation || detail.summary || 'Analysis available'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={[styles.card, styles.errorCard]}>
            <Feather name="alert-circle" size={20} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                setReport(null);
                // Reload data
                const fetchReport = async () => {
                  try {
                    const response = reportId
                      ? await ApiService.getReportById(reportId)
                      : trackingId
                        ? await ApiService.getReportByTrackingCode(trackingId)
                        : null;
                    const fetchedReport =
                      response?.data?.report ||
                      response?.data?.reports?.[0] ||
                      response?.data ||
                      null;
                    setReport(fetchedReport);
                  } catch (e: any) {
                    setError(e?.message || 'Failed to load report details');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchReport();
              }}
            >
              <Feather name="refresh-cw" size={14} color="#1F2937" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {citizenCanRespond ? (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Approve Resolution</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.reworkButton]}
              onPress={() => setReasonModalVisible(true)}
              disabled={submitting}
            >
              <Feather name="refresh-cw" size={20} color="#F59E0B" />
              <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>Request Rework</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.complaintButton]}
              onPress={() => setComplaintModalVisible(true)}
              disabled={submitting}
            >
              <Feather name="alert-triangle" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Raise Complaint</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.infoCard]}>
            <Feather name="info" size={20} color="#3B82F6" />
            <Text style={styles.infoCardText}>
              {report?.status === 'closed'
                ? 'This resolution has already been approved and closed.'
                : report?.status === 'in_progress'
                  ? 'This report is currently being worked on.'
                  : 'No actions are required at this time.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={closeImageViewer}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImageIndex !== null && proofImages[selectedImageIndex] && (
            <>
              <Image
                source={{ uri: proofImages[selectedImageIndex].uri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <View style={styles.imageViewerControls}>
                {selectedImageIndex > 0 && (
                  <TouchableOpacity
                    style={styles.imageNavButton}
                    onPress={() => navigateImage('prev')}
                  >
                    <Feather name="chevron-left" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <Text style={styles.imageCounter}>
                  {selectedImageIndex + 1} / {proofImages.length}
                </Text>
                {selectedImageIndex < proofImages.length - 1 && (
                  <TouchableOpacity
                    style={styles.imageNavButton}
                    onPress={() => navigateImage('next')}
                  >
                    <Feather name="chevron-right" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Request Rework Modal */}
      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) setReasonModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Rework</Text>
              <TouchableOpacity
                onPress={() => !submitting && setReasonModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Please describe what still needs attention or improvement.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Example: The pothole is still half-filled near the curb. The edges are not properly sealed."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              value={reworkReason}
              onChangeText={setReworkReason}
            />
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                (submitting || reworkReason.trim().length === 0) && styles.modalSubmitDisabled,
              ]}
              onPress={submitRejection}
              disabled={submitting || reworkReason.trim().length === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.modalSubmitText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Raise Complaint Modal */}
      <Modal
        visible={complaintModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) setComplaintModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Complaint</Text>
              <TouchableOpacity
                onPress={() => !submitting && setComplaintModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              If you have concerns about the quality of work, service, or any other issues, please describe them below.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Example: The work quality is poor. The materials used seem substandard. The issue was not properly addressed."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              value={complaintText}
              onChangeText={setComplaintText}
            />
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                styles.complaintSubmitButton,
                (submitting || complaintText.trim().length === 0) && styles.modalSubmitDisabled,
              ]}
              onPress={submitComplaint}
              disabled={submitting || complaintText.trim().length === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="alert-triangle" size={18} color="#FFFFFF" />
                  <Text style={styles.modalSubmitText}>Submit Complaint</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Fonts.primary.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: Fonts.primary.bold,
  },
  detailSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  descriptionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  resolutionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  resolvedBySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resolvedByText: {
    fontSize: 12,
    color: '#6B7280',
  },
  imageScrollView: {
    marginTop: 12,
  },
  imageScrollContent: {
    paddingRight: 16,
  },
  proofImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  proofImageStyle: {
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 6,
  },
  emptyProof: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    gap: 8,
  },
  emptyProofText: {
    fontSize: 13,
    color: '#6B7280',
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiContent: {
    flex: 1,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  confidenceBar: {
    marginTop: 8,
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  aiDetails: {
    marginTop: 12,
    gap: 8,
  },
  aiDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDetailText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  aiPass: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  aiFail: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  aiUnknown: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#B91C1C',
  },
  retryButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  reworkButton: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  complaintButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  imageViewerControls: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  imageNavButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 12,
  },
  imageCounter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    gap: 8,
  },
  complaintSubmitButton: {
    backgroundColor: '#EF4444',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ResolutionReviewScreen;
